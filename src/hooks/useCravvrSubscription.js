import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../components/auth/AuthContext';

/**
 * Owner-side hook for the current user's Cravvr Plus subscription.
 * Returns { subscription, plan, isPlus, loading, refresh, openCheckout, openPortal }.
 *
 * - `isPlus` is the entitlement gate: true when status ∈ {active, trialing}
 *   AND plan.features.online_checkout = true.
 * - `openCheckout()` redirects the browser to Stripe Checkout for upgrade.
 * - `openPortal()` redirects the browser to the Stripe Customer Portal.
 */
export function useCravvrSubscription() {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState(null);
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    if (!user) { setSubscription(null); setPlan(null); setLoading(false); return; }
    setLoading(true);
    try {
      const { data: sub } = await supabase
        .from('cravvr_subscriptions')
        .select('*')
        .eq('owner_id', user.id)
        .maybeSingle();
      setSubscription(sub || null);

      if (sub) {
        const { data: p } = await supabase
          .from('cravvr_plans')
          .select('*')
          .eq('code', sub.plan_code)
          .maybeSingle();
        setPlan(p || null);
      } else {
        setPlan(null);
      }
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const callFn = async (name, body = {}) => {
    const { data: { session } } = await supabase.auth.getSession();
    const r = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/${name}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify(body),
      },
    );
    if (!r.ok) {
      const err = await r.json().catch(() => ({}));
      throw new Error(err.error || 'Request failed');
    }
    return r.json();
  };

  const openCheckout = async (planCode = 'plus') => {
    const { url } = await callFn('cravvr-checkout-session', { plan_code: planCode });
    if (url) window.location.href = url;
  };

  const openPortal = async () => {
    const { url } = await callFn('cravvr-customer-portal', {});
    if (url) window.location.href = url;
  };

  const isActive = subscription?.status === 'active' || subscription?.status === 'trialing';
  const isPlus = isActive && !!plan?.features?.online_checkout;

  return {
    subscription,
    plan,
    isPlus,
    isActive,
    loading,
    error,
    refresh: load,
    openCheckout,
    openPortal,
  };
}
