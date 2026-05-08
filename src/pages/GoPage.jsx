import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Icons } from '../components/common/Icons';
import { supabase } from '../lib/supabase';
import { useAuth } from '../components/auth/AuthContext';
import './GoPage.css';

/**
 * /go — single-screen "feature info modal" for the Cravvr Go plan.
 *
 * Two states:
 *   - Visitor (not signed in or not an owner) → see the pitch + "Sign in to start trial".
 *   - Signed-in owner → see the pitch + a real "Start 14-day free trial" CTA that
 *     POSTs to cravvr-checkout-session and redirects to Stripe Checkout.
 */
const GoPage = () => {
  const navigate = useNavigate();
  const { user, profile, openAuth } = useAuth();
  const isOwner = profile?.role === 'owner' || profile?.role === 'admin';

  const [plan, setPlan] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from('cravvr_plans')
        .select('*')
        .eq('code', 'plus')
        .maybeSingle();
      if (!cancelled) setPlan(data || null);
    })();
    return () => { cancelled = true; };
  }, []);

  const priceLabel = plan
    ? `$${(plan.price_cents / 100).toFixed(plan.price_cents % 100 === 0 ? 0 : 2)}/${plan.interval || 'mo'}`
    : '';

  const startTrial = async () => {
    if (!user) {
      openAuth?.('signin');
      return;
    }
    if (!isOwner) {
      setError('Cravvr Go is for truck owners. Sign in with an owner account or contact us about Enterprise.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const r = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/cravvr-checkout-session`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token}`,
          },
          body: JSON.stringify({ plan_code: 'plus' }),
        },
      );
      const json = await r.json();
      if (!r.ok || !json.url) throw new Error(json.error || 'Could not start checkout');
      window.location.href = json.url;
    } catch (e) {
      setError(e.message || 'Could not start checkout');
      setBusy(false);
    }
  };

  return (
    <div className="go-page">
      <button
        type="button"
        className="go-close"
        onClick={() => navigate(-1)}
        aria-label="Close"
      >
        {Icons.x}
      </button>

      <div className="go-modal">
        <div className="go-eyebrow">
          <span className="go-eyebrow-dot" />
          Cravvr Go
        </div>

        <h1>Accept card payments at every truck.</h1>

        <p className="go-lede">
          One subscription. Stripe, Square, or Clover at the truck level — funds settle
          straight to you. Cravvr never takes a cut of your sales.
        </p>

        <div className="go-price-row">
          <div className="go-price-amount">
            <span className="go-currency">$</span>
            <span className="go-value">{plan ? (plan.price_cents / 100).toFixed(plan.price_cents % 100 === 0 ? 0 : 2) : '9.99'}</span>
            <span className="go-period">/mo</span>
          </div>
          <div className="go-price-trial">14-day free trial · cancel anytime</div>
        </div>

        <ul className="go-features">
          <li>{Icons.check} <span><strong>Online checkout</strong> via Stripe, Square, or Clover (coming soon)</span></li>
          <li>{Icons.check} <span><strong>Direct payouts</strong> — money goes from customer to your account, not ours</span></li>
          <li>{Icons.check} <span><strong>Owner analytics</strong> — orders, revenue, top items, conversion</span></li>
          <li>{Icons.check} <span><strong>Order tracking + customer notifications</strong> built in</span></li>
          <li>{Icons.check} <span><strong>Pay-at-Pickup</strong> still works for cash-only customers</span></li>
        </ul>

        {error && (
          <div className="go-error">
            <span className="go-error-icon">{Icons.alertCircle}</span>
            {error}
          </div>
        )}

        <div className="go-actions">
          {!user ? (
            <>
              <button className="go-btn-primary" onClick={() => openAuth?.('signup')}>
                Create owner account → Start trial
                <span className="go-btn-icon">{Icons.arrowRight}</span>
              </button>
              <button className="go-btn-ghost" onClick={() => openAuth?.('signin')}>
                Already have an account? Sign in
              </button>
            </>
          ) : isOwner ? (
            <>
              <button className="go-btn-primary" onClick={startTrial} disabled={busy}>
                {busy ? 'Loading…' : `Start 14-day free trial${priceLabel ? ` · ${priceLabel} after` : ''}`}
                {!busy && <span className="go-btn-icon">{Icons.arrowRight}</span>}
              </button>
              <Link to="/owner" className="go-btn-ghost">Go to dashboard</Link>
            </>
          ) : (
            <>
              <p className="go-not-owner">Cravvr Go is for truck owners. Running a fleet?</p>
              <Link to="/enterprise" className="go-btn-primary">
                See Cravvr Enterprise
                <span className="go-btn-icon">{Icons.arrowRight}</span>
              </Link>
            </>
          )}
        </div>

        <p className="go-fineprint">
          Have a fleet of 5+ trucks? <Link to="/enterprise">See Cravvr Enterprise →</Link>
        </p>
      </div>
    </div>
  );
};

export default GoPage;
