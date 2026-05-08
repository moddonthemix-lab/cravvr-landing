// supabase/functions/stripe-create-payment-intent/index.ts
// Edge Function: Create a PaymentIntent with automatic platform fee

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Stripe from 'https://esm.sh/stripe@13.0.0?target=deno';
import { corsHeaders } from '../_shared/cors.ts';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, { apiVersion: '2023-10-16' });
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const PLATFORM_FEE_PERCENT = 5; // 5% platform fee

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders(req) });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const authHeader = req.headers.get('Authorization')!;
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );
    if (authError || !user) throw new Error('Unauthorized');

    const { order_id, truck_id, amount_cents } = await req.json();
    if (!order_id || !truck_id || !amount_cents) {
      throw new Error('order_id, truck_id, and amount_cents are required');
    }

    // Verify the caller is the customer who placed this order, and that the
    // order matches the truck and amount being charged. Without these checks
    // any authenticated user could create a payment intent against an
    // arbitrary order — funds would still settle to the right truck via
    // Connect, but the side effects (DB writes, status updates) would be
    // attacker-controlled.
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('customer_id, truck_id, total, payment_status')
      .eq('id', order_id)
      .single();
    if (orderError || !order) throw new Error('Order not found');
    if (order.customer_id !== user.id) throw new Error('Unauthorized: not your order');
    if (order.truck_id !== truck_id) throw new Error('truck_id does not match order');
    if (order.payment_status === 'paid' || order.payment_status === 'refunded') {
      throw new Error(`Order is already ${order.payment_status}`);
    }
    // Amount comes from the client; refuse if it doesn't match the server-side total.
    const expected_cents = Math.round(Number(order.total) * 100);
    if (expected_cents !== amount_cents) {
      throw new Error('amount_cents does not match order total');
    }

    // Get truck's Stripe account
    const { data: truck, error: truckError } = await supabase
      .from('food_trucks')
      .select('stripe_account_id, stripe_charges_enabled, name')
      .eq('id', truck_id)
      .single();

    if (truckError || !truck) throw new Error('Truck not found');
    if (!truck.stripe_account_id || !truck.stripe_charges_enabled) {
      throw new Error('This truck has not set up online payments yet');
    }

    const platformFee = Math.round(amount_cents * PLATFORM_FEE_PERCENT / 100);

    // Create PaymentIntent with Connect
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount_cents,
      currency: 'usd',
      application_fee_amount: platformFee,
      transfer_data: {
        destination: truck.stripe_account_id,
      },
      metadata: {
        order_id,
        truck_id,
        customer_id: user.id,
      },
    });

    // Record payment in database
    await supabase.from('payments').insert({
      order_id,
      truck_id,
      customer_id: user.id,
      stripe_payment_intent_id: paymentIntent.id,
      amount: amount_cents,
      platform_fee: platformFee,
      status: 'processing',
    });

    // Update order with payment intent ID
    await supabase
      .from('orders')
      .update({ payment_intent_id: paymentIntent.id, payment_status: 'pending' })
      .eq('id', order_id);

    return new Response(
      JSON.stringify({
        client_secret: paymentIntent.client_secret,
        payment_intent_id: paymentIntent.id,
      }),
      { headers: { ...corsHeaders(req), 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders(req), 'Content-Type': 'application/json' } }
    );
  }
});
