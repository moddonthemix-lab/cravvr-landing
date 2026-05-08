import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../contexts/ToastContext';
import { Icons } from '../common/Icons';
import StripeOnboarding from './StripeOnboarding';
import SquareOnboarding from './SquareOnboarding';
import { useCravvrSubscription } from '../../hooks/useCravvrSubscription';
import './PaymentProcessorSetup.css';

const CHOICES = [
  {
    value: 'stripe',
    name: 'Stripe',
    sub: 'Best for new businesses — guided onboarding',
    iconText: 'S',
    brandClass: 'brand-stripe',
  },
  {
    value: 'square',
    name: 'Square',
    sub: 'Use your existing Square account & POS',
    iconText: 'sq',
    brandClass: 'brand-square',
  },
  {
    value: 'clover',
    name: 'Clover',
    sub: 'Coming soon',
    iconText: 'cl',
    brandClass: 'brand-clover',
    disabled: true,
  },
  {
    value: 'pickup',
    name: 'Pay at Pickup',
    sub: 'No online checkout — collect in person',
    iconText: '$',
    brandClass: 'brand-pickup',
  },
];

const PaymentProcessorSetup = ({ truck, onUpdate }) => {
  const { showToast } = useToast();
  const { isPlus, loading: subLoading, openCheckout } = useCravvrSubscription();
  const [updating, setUpdating] = useState(false);
  const processor = truck.payment_processor || 'pickup';
  // Online-checkout processors require an active Cravvr Plus subscription.
  const requiresPlus = (code) => code === 'stripe' || code === 'square' || code === 'clover';

  const setProcessor = async (next) => {
    if (next === processor || updating) return;
    if (requiresPlus(next) && !isPlus) {
      const ok = window.confirm(
        'Online card payments require Cravvr Plus ($29/mo). Start a 14-day free trial now?',
      );
      if (!ok) return;
      try { await openCheckout('plus'); } catch (e) { showToast(e.message || 'Could not start checkout', 'error'); }
      return;
    }
    setUpdating(true);
    try {
      const { error } = await supabase
        .from('food_trucks')
        .update({ payment_processor: next })
        .eq('id', truck.id);
      if (error) throw error;
      const label = CHOICES.find((c) => c.value === next)?.name || next;
      showToast(`Customer payments set to ${label}`, 'success');
      onUpdate?.({ payment_processor: next });
    } catch (err) {
      showToast(err.message || 'Could not update processor', 'error');
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="processor-setup">
      <div className="processor-setup-header">
        <h3>Customer Payments</h3>
        <p>
          Pick how customers pay you. Funds always go directly to you — Cravvr only charges your Cravvr Plus subscription.
        </p>
      </div>

      <div className="processor-grid">
        {CHOICES.map((choice) => {
          const selected = processor === choice.value;
          const needsPlus = requiresPlus(choice.value) && !isPlus && !subLoading;
          const disabled = choice.disabled || updating;
          return (
            <button
              key={choice.value}
              type="button"
              className={[
                'processor-tile',
                selected ? 'is-selected' : '',
                choice.disabled ? 'is-soon' : '',
                needsPlus ? 'is-locked' : '',
              ].filter(Boolean).join(' ')}
              disabled={disabled}
              onClick={() => !choice.disabled && setProcessor(choice.value)}
              aria-pressed={selected}
            >
              <span className={`processor-tile-icon ${choice.brandClass}`}>
                {choice.iconText}
              </span>
              <span className="processor-tile-body">
                <span className="processor-tile-name">
                  {choice.name}
                  {choice.disabled && <span className="processor-tile-soon-tag">Soon</span>}
                  {needsPlus && <span className="processor-tile-plus-tag">Plus</span>}
                </span>
                <span className="processor-tile-sub">{choice.sub}</span>
              </span>
              {selected && (
                <span className="processor-tile-check" aria-hidden="true">
                  {Icons.check}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="processor-detail">
        {processor === 'stripe' && <StripeOnboarding truck={truck} onUpdate={onUpdate} />}
        {processor === 'square' && <SquareOnboarding truck={truck} onUpdate={onUpdate} />}
        {processor === 'clover' && (
          <p className="processor-empty-state">Clover support is on the roadmap. Pick Stripe or Square for now.</p>
        )}
        {processor === 'pickup' && (
          <p className="processor-empty-state">Customers will see “Pay at Pickup” only — no online checkout for this truck.</p>
        )}
      </div>
    </div>
  );
};

export default PaymentProcessorSetup;
