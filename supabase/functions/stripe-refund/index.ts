// supabase/functions/stripe-refund/index.ts
// Edge Function: Process refund for rejected/cancelled orders

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

    const userId = await requireClerkUser(req);

    const { order_id, reason } = await req.json();
    if (!order_id) throw new Error('order_id is required');

    // Get the payment for this order
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .select('*')
      .eq('order_id', order_id)
      .eq('status', 'succeeded')
      .single();

    if (paymentError || !payment) {
      throw new Error('No successful payment found for this order');
    }

    // Verify the user is the owner of the truck
    const { data: truck } = await supabase
      .from('food_trucks')
      .select('owner_id')
      .eq('id', payment.truck_id)
      .single();

    if (truck?.owner_id !== userId) {
      throw new Error('Unauthorized: not the truck owner');
    }

    // Process refund via Stripe
    const refund = await stripe.refunds.create({
      payment_intent: payment.stripe_payment_intent_id,
      reason: 'requested_by_customer',
      metadata: { order_id, refund_reason: reason || 'Order rejected' },
    });

    // Update payment record
    await supabase
      .from('payments')
      .update({
        status: 'refunded',
        refund_amount: payment.amount,
        refund_reason: reason || 'Order rejected',
      })
      .eq('id', payment.id);

    return new Response(
      JSON.stringify({ refund_id: refund.id, status: 'refunded' }),
      { headers: { ...corsHeaders(req), 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders(req), 'Content-Type': 'application/json' } }
    );
  }
});
