// supabase/functions/stripe-connect-onboard/index.ts
// Edge Function: Create Stripe Connect account and return onboarding URL

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Stripe from 'https://esm.sh/stripe@13.0.0?target=deno';
import { corsHeaders } from '../_shared/cors.ts';
import { requireClerkUser } from '../_shared/clerk-auth.ts';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, { apiVersion: '2023-10-16' });
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders(req) });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify the user via Clerk JWT (platform verify_jwt is off for this fn —
    // Supabase's gate doesn't honor Third-Party Auth, so we verify ourselves).
    const userId = await requireClerkUser(req);

    const { truck_id, return_url, refresh_url } = await req.json();
    if (!truck_id) throw new Error('truck_id is required');

    // Verify ownership
    const { data: truck, error: truckError } = await supabase
      .from('food_trucks')
      .select('id, name, stripe_account_id')
      .eq('id', truck_id)
      .eq('owner_id', userId)
      .single();

    if (truckError || !truck) throw new Error('Truck not found or not owned by user');

    let accountId = truck.stripe_account_id;

    // Create Stripe Connect account if doesn't exist
    if (!accountId) {
      const account = await stripe.accounts.create({
        type: 'express',
        metadata: { truck_id, owner_id: userId },
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
      });
      accountId = account.id;

      // Save the account ID
      await supabase
        .from('food_trucks')
        .update({ stripe_account_id: accountId })
        .eq('id', truck_id);
    }

    // Create onboarding link
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: refresh_url || `${req.headers.get('origin')}/owner`,
      return_url: return_url || `${req.headers.get('origin')}/owner?stripe=complete`,
      type: 'account_onboarding',
    });

    return new Response(
      JSON.stringify({ url: accountLink.url, account_id: accountId }),
      { headers: { ...corsHeaders(req), 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders(req), 'Content-Type': 'application/json' } }
    );
  }
});
