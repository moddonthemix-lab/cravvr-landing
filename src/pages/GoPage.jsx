import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Icons } from '../components/common/Icons';
import { getSupabaseBearer } from '../lib/supabase';
import { useAuth } from '../components/auth/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

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
      openAuth?.('login');
      return;
    }
    if (!isOwner) {
      setError('Cravvr Go is for truck owners. Sign in with an owner account to start your trial.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const bearer = await getSupabaseBearer();
      const r = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/cravvr-checkout-session`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${bearer}`,
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
    <div className="relative min-h-screen bg-gradient-to-b from-rose-50 via-background to-background flex items-center justify-center px-4 py-10">
      <button
        type="button"
        onClick={() => navigate(-1)}
        aria-label="Close"
        className="absolute top-5 right-5 flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-md ring-1 ring-black/5 text-foreground transition-colors hover:bg-muted"
      >
        <span className="h-5 w-5">{Icons.x}</span>
      </button>

      <Card className="w-full max-w-xl shadow-xl">
        <CardContent className="p-8 sm:p-10 space-y-6">
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-primary">
            <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
            Cravvr Go
          </span>

          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Accept card payments at every truck.
          </h1>

          <p className="text-base text-muted-foreground leading-relaxed">
            One subscription. Stripe, Square, or Clover at the truck level — funds settle
            straight to you. Cravvr never takes a cut of your sales.
          </p>

          <div className="flex items-end justify-between gap-4 rounded-xl border border-border bg-muted/30 px-5 py-4">
            <div>
              <div className="flex items-baseline gap-1">
                <span className="text-xl font-bold text-muted-foreground">$</span>
                <span className="text-5xl font-bold tracking-tight">
                  {plan ? (plan.price_cents / 100).toFixed(plan.price_cents % 100 === 0 ? 0 : 2) : '9.99'}
                </span>
                <span className="text-sm text-muted-foreground">/mo</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">14-day free trial · cancel anytime</p>
            </div>
          </div>

          <ul className="space-y-2.5 text-sm">
            {[
              <><strong>Online checkout</strong> via Stripe, Square, or Clover (coming soon)</>,
              <><strong>Direct payouts</strong> — money goes from customer to your account, not ours</>,
              <><strong>Owner analytics</strong> — orders, revenue, top items, conversion</>,
              <><strong>Order tracking + customer notifications</strong> built in</>,
              <><strong>Pay-at-Pickup</strong> still works for cash-only customers</>,
            ].map((li, i) => (
              <li key={i} className="flex items-start gap-2.5">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-positive/10 text-positive mt-0.5">
                  <span className="h-3 w-3">{Icons.check}</span>
                </span>
                <span>{li}</span>
              </li>
            ))}
          </ul>

          {error && (
            <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              <span className="h-4 w-4 shrink-0 mt-0.5">{Icons.alertCircle}</span>
              {error}
            </div>
          )}

          <div className="flex flex-col gap-2">
            {!user ? (
              <>
                <Button size="lg" onClick={() => openAuth?.('signup')} className="gap-2">
                  Create owner account → Start trial
                  <span className="h-4 w-4">{Icons.arrowRight}</span>
                </Button>
                <Button variant="ghost" onClick={() => openAuth?.('login')}>
                  Already have an account? Sign in
                </Button>
              </>
            ) : isOwner ? (
              <>
                <Button size="lg" onClick={startTrial} disabled={busy} className="gap-2">
                  {busy ? 'Loading…' : `Start 14-day free trial${priceLabel ? ` · ${priceLabel} after` : ''}`}
                  {!busy && <span className="h-4 w-4">{Icons.arrowRight}</span>}
                </Button>
                <Button asChild variant="ghost">
                  <Link to="/owner">Go to dashboard</Link>
                </Button>
              </>
            ) : (
              <>
                <p className="text-sm text-muted-foreground text-center">
                  Cravvr Go is for truck owners. Create an owner account to start your trial.
                </p>
                <Button size="lg" onClick={() => openAuth?.('signup')} className="gap-2">
                  Create owner account → Start trial
                  <span className="h-4 w-4">{Icons.arrowRight}</span>
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default GoPage;
