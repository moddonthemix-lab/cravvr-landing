import React, { useState } from 'react';
import { Icons } from '../common/Icons';
import { useToast } from '../../contexts/ToastContext';
import { useCravvrSubscription } from '../../hooks/useCravvrSubscription';
import './CravvrPlusBilling.css';

const formatCents = (cents) => `$${(cents / 100).toFixed(cents % 100 === 0 ? 0 : 2)}`;
const formatDate = (iso) => iso ? new Date(iso).toLocaleDateString(undefined, {
  year: 'numeric', month: 'short', day: 'numeric',
}) : null;

const CravvrPlusBilling = () => {
  const { showToast } = useToast();
  const { subscription, plan, isPlus, isActive, loading, openCheckout, openPortal } = useCravvrSubscription();
  const [busy, setBusy] = useState(false);

  if (loading) {
    return (
      <div className="cp-billing-card cp-loading">
        <div className="cp-spinner" /> <span>Loading subscription…</span>
      </div>
    );
  }

  const handleUpgrade = async () => {
    setBusy(true);
    try { await openCheckout('plus'); }
    catch (e) { showToast(e.message || 'Could not start checkout', 'error'); setBusy(false); }
  };

  const handleManage = async () => {
    setBusy(true);
    try { await openPortal(); }
    catch (e) { showToast(e.message || 'Could not open portal', 'error'); setBusy(false); }
  };

  const onFree = !isPlus;
  const trialing = subscription?.status === 'trialing';
  const pastDue = subscription?.status === 'past_due';
  const cancelAt = subscription?.cancel_at_period_end;

  return (
    <div className="cp-billing-card">
      <div className="cp-billing-header">
        <div>
          <h3>Cravvr Go</h3>
          <p className="cp-billing-sub">
            {onFree
              ? 'Unlock online card payments via Stripe, Square, and Clover.'
              : 'Online card payments are unlocked across your trucks.'}
          </p>
        </div>
        <div className={`cp-plan-badge ${isPlus ? 'is-plus' : 'is-free'}`}>
          {plan?.name || (isPlus ? 'Cravvr Go' : 'Free')}
          {trialing && <span className="cp-trial-tag">Trial</span>}
          {pastDue && <span className="cp-past-due-tag">Past due</span>}
        </div>
      </div>

      <ul className="cp-feature-list">
        <li className={isPlus ? 'on' : 'off'}>
          {isPlus ? Icons.check : Icons.x} Online checkout (Stripe / Square / Clover)
        </li>
        <li className={isPlus ? 'on' : 'off'}>
          {isPlus ? Icons.check : Icons.x} Owner analytics dashboard
        </li>
        <li className="on">{Icons.check} Pay-at-Pickup orders</li>
        <li className="on">{Icons.check} Order tracking + customer notifications</li>
      </ul>

      {onFree && (
        <div className="cp-billing-actions">
          <button className="cp-btn-primary" disabled={busy} onClick={handleUpgrade}>
            {busy ? 'Loading…' : 'Start 14-day free trial — $29/mo after'}
          </button>
          <p className="cp-billing-fineprint">Cancel anytime in the billing portal. Cravvr never takes a cut of your truck's sales.</p>
        </div>
      )}

      {isPlus && (
        <div className="cp-billing-meta">
          {trialing && subscription?.trial_end && (
            <p>Trial ends <strong>{formatDate(subscription.trial_end)}</strong>. You won't be charged until then.</p>
          )}
          {!trialing && subscription?.current_period_end && (
            <p>
              {cancelAt ? 'Cancels' : 'Renews'} on <strong>{formatDate(subscription.current_period_end)}</strong>
              {plan?.price_cents > 0 && ` · ${formatCents(plan.price_cents)}/${plan.interval || 'month'}`}
            </p>
          )}
          {pastDue && <p className="cp-warn">Latest invoice failed. Update your card in the billing portal.</p>}
          <div className="cp-billing-actions">
            <button className="cp-btn-secondary" disabled={busy} onClick={handleManage}>
              {busy ? 'Loading…' : 'Manage subscription'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CravvrPlusBilling;
