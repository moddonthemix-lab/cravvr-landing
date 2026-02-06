// supabase/functions/stripe-webhook/index.ts
// Edge Function: Handle Stripe webhook events

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Stripe from 'https://esm.sh/stripe@13.0.0?target=deno';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, { apiVersion: '2023-10-16' });
const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')!;
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

serve(async (req) => {
  const signature = req.headers.get('stripe-signature');
  if (!signature) {
    return new Response('No signature', { status: 400 });
  }

  try {
    const body = await req.text();
    const event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    switch (event.type) {
      case 'payment_intent.succeeded': {
        const pi = event.data.object;

        // Update payment record
        await supabase
          .from('payments')
          .update({ status: 'succeeded' })
          .eq('stripe_payment_intent_id', pi.id);

        // Update order payment status
        if (pi.metadata?.order_id) {
          await supabase
            .from('orders')
            .update({ payment_status: 'paid' })
            .eq('id', pi.metadata.order_id);
        }
        break;
      }

      case 'payment_intent.payment_failed': {
        const pi = event.data.object;

        await supabase
          .from('payments')
          .update({ status: 'failed' })
          .eq('stripe_payment_intent_id', pi.id);

        if (pi.metadata?.order_id) {
          await supabase
            .from('orders')
            .update({ payment_status: 'failed' })
            .eq('id', pi.metadata.order_id);
        }
        break;
      }

      case 'charge.refunded': {
        const charge = event.data.object;
        const piId = charge.payment_intent;

        await supabase
          .from('payments')
          .update({
            status: charge.amount_refunded === charge.amount ? 'refunded' : 'partially_refunded',
            refund_amount: charge.amount_refunded,
          })
          .eq('stripe_payment_intent_id', piId);

        // Get the payment to find the order
        const { data: payment } = await supabase
          .from('payments')
          .select('order_id')
          .eq('stripe_payment_intent_id', piId)
          .single();

        if (payment?.order_id) {
          await supabase
            .from('orders')
            .update({ payment_status: 'refunded' })
            .eq('id', payment.order_id);
        }
        break;
      }

      case 'account.updated': {
        const account = event.data.object;

        // Update truck's Stripe status
        await supabase
          .from('food_trucks')
          .update({
            stripe_onboarding_complete: account.details_submitted,
            stripe_charges_enabled: account.charges_enabled,
          })
          .eq('stripe_account_id', account.id);
        break;
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 400 });
  }
});
