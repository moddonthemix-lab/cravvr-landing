// supabase/functions/cravvr-customer-portal/index.ts
// Owner clicks "Manage subscription" → we return a Stripe Customer Portal URL
// pre-authenticated for that owner's Stripe customer.
// Owners use the portal to update payment methods, cancel, view invoices, etc.

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Stripe from 'https://esm.sh/stripe@13.0.0?target=deno';
import { corsHeaders } from '../_shared/cors.ts';
import { requireClerkUser } from '../_shared/clerk-auth.ts';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, { apiVersion: '2023-10-16' });
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const APP_URL = Deno.env.get('CRAVVR_APP_URL') || 'https://www.cravvr.com';

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders(req) });

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const userId = await requireClerkUser(req);

    const { data: sub } = await supabase
      .from('cravvr_subscriptions')
      .select('stripe_customer_id')
      .eq('owner_id', userId)
      .maybeSingle();
    if (!sub?.stripe_customer_id) {
      throw new Error('No Stripe customer record — start a subscription first');
    }

    const portal = await stripe.billingPortal.sessions.create({
      customer: sub.stripe_customer_id,
      return_url: `${APP_URL}/owner`,
    });

    return new Response(
      JSON.stringify({ url: portal.url }),
      { headers: { ...corsHeaders(req), 'Content-Type': 'application/json' } },
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 400, headers: { ...corsHeaders(req), 'Content-Type': 'application/json' } },
    );
  }
});
