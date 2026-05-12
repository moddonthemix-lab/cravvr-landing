// supabase/functions/cravvr-checkout-session/index.ts
// Owner clicks "Upgrade to Cravvr Plus" → frontend POSTs here →
// we create (or reuse) a Stripe Customer for the owner, create a Stripe
// Checkout Session in `subscription` mode, return the session URL.
//
// Cravvr is the merchant; the price is for the Cravvr Plus product, NOT
// connected to any truck's Stripe Connect account.

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Stripe from 'https://esm.sh/stripe@13.0.0?target=deno';
import { corsHeaders } from '../_shared/cors.ts';
import { requireClerkUser } from '../_shared/clerk-auth.ts';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, { apiVersion: '2023-10-16' });
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const APP_URL = Deno.env.get('CRAVVR_APP_URL') || 'https://www.cravvr.com';
const TRIAL_DAYS = Number(Deno.env.get('CRAVVR_PLUS_TRIAL_DAYS') || '14');

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders(req) });

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const userId = await requireClerkUser(req);

    const { plan_code = 'plus' } = await req.json().catch(() => ({}));

    // Look up plan + price id
    const { data: plan, error: planError } = await supabase
      .from('cravvr_plans')
      .select('code, name, stripe_price_id')
      .eq('code', plan_code)
      .eq('is_active', true)
      .single();
    if (planError || !plan) throw new Error('Plan not found');
    if (!plan.stripe_price_id) {
      throw new Error('This plan is not yet wired up — admin must set stripe_price_id');
    }

    // Get profile (for email) and existing subscription (for stripe_customer_id)
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, email, name')
      .eq('id', userId)
      .single();
    const { data: existing } = await supabase
      .from('cravvr_subscriptions')
      .select('stripe_customer_id, plan_code, status')
      .eq('owner_id', userId)
      .maybeSingle();

    if (existing?.plan_code === plan_code &&
        (existing.status === 'active' || existing.status === 'trialing')) {
      throw new Error('Already subscribed to this plan');
    }

    // Reuse or create Stripe customer
    let customerId = existing?.stripe_customer_id;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: profile?.email ?? undefined,
        name: profile?.name || undefined,
        metadata: { cravvr_owner_id: userId },
      });
      customerId = customer.id;
      // Persist the customer id immediately so we don't double-create
      await supabase
        .from('cravvr_subscriptions')
        .upsert(
          { owner_id: userId, plan_code: existing?.plan_code || 'free', status: existing?.status || 'active', stripe_customer_id: customerId },
          { onConflict: 'owner_id' },
        );
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: customerId,
      line_items: [{ price: plan.stripe_price_id, quantity: 1 }],
      subscription_data: TRIAL_DAYS > 0 ? { trial_period_days: TRIAL_DAYS } : undefined,
      success_url: `${APP_URL}/owner?cravvr_plus=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${APP_URL}/owner?cravvr_plus=cancelled`,
      allow_promotion_codes: true,
      metadata: { cravvr_owner_id: userId, plan_code },
    });

    return new Response(
      JSON.stringify({ url: session.url, session_id: session.id }),
      { headers: { ...corsHeaders(req), 'Content-Type': 'application/json' } },
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 400, headers: { ...corsHeaders(req), 'Content-Type': 'application/json' } },
    );
  }
});
