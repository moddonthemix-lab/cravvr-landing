// supabase/functions/stripe-webhook/index.ts
// Edge Function: Handle Stripe webhook events

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Stripe from 'https://esm.sh/stripe@13.0.0?target=deno';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, { apiVersion: '2023-10-16' });
// We have two Stripe webhook endpoints pointing at this function:
//   1. Platform webhook       — payment_intent.*, charge.refunded
//   2. Connect webhook        — account.updated (events about connected accounts)
// Each has its own signing secret. We try both.
const platformSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET') || '';
const connectSecret = Deno.env.get('STRIPE_CONNECT_WEBHOOK_SECRET') || '';
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

async function constructEventWithEitherSecret(body: string, signature: string) {
  const secrets = [platformSecret, connectSecret].filter(Boolean);
  let lastErr: unknown;
  for (const secret of secrets) {
    try {
      return await stripe.webhooks.constructEventAsync(body, signature, secret);
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr || new Error('No webhook secret configured');
}

serve(async (req) => {
  const signature = req.headers.get('stripe-signature');
  if (!signature) {
    return new Response('No signature', { status: 400 });
  }

  try {
    const body = await req.text();
    const event = await constructEventWithEitherSecret(body, signature);
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

          // Fire server-side conversion (CAPI dispatch + acquisition stamping).
          // Fire-and-forget — webhook must ack quickly to Stripe.
          fetch(`${supabaseUrl}/functions/v1/analytics-server-event`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${supabaseServiceKey}`,
            },
            body: JSON.stringify({
              event_name: 'purchase',
              order_id: pi.metadata.order_id,
              amount_cents: pi.amount,
              currency: pi.currency?.toUpperCase() || 'USD',
              event_id: `purchase:${pi.metadata.order_id}`,
            }),
          }).catch((e) => console.warn('analytics-server-event dispatch failed:', e));
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

      // Cravvr Plus subscription lifecycle. Stripe sends these for any change
      // to the subscription state — trial start, activation, payment fail,
      // cancel, plan change. We mirror the relevant fields onto our
      // cravvr_subscriptions row so has_active_plus() reads correct state.
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const sub: any = event.data.object;
        const customerId: string = sub.customer;
        const priceId: string | undefined = sub.items?.data?.[0]?.price?.id;

        // Resolve plan_code from the price id we have on file
        let planCode: string | null = null;
        if (priceId) {
          const { data: plan } = await supabase
            .from('cravvr_plans')
            .select('code')
            .eq('stripe_price_id', priceId)
            .maybeSingle();
          planCode = plan?.code ?? null;
        }
        // 'deleted' means the subscription is no longer active — flip back to free
        const effectivePlanCode = event.type === 'customer.subscription.deleted'
          ? 'free'
          : (planCode || 'plus');

        const update: Record<string, unknown> = {
          plan_code: effectivePlanCode,
          status: event.type === 'customer.subscription.deleted' ? 'canceled' : sub.status,
          stripe_subscription_id: sub.id,
          current_period_start: sub.current_period_start ? new Date(sub.current_period_start * 1000).toISOString() : null,
          current_period_end: sub.current_period_end ? new Date(sub.current_period_end * 1000).toISOString() : null,
          cancel_at_period_end: !!sub.cancel_at_period_end,
          trial_end: sub.trial_end ? new Date(sub.trial_end * 1000).toISOString() : null,
          canceled_at: sub.canceled_at ? new Date(sub.canceled_at * 1000).toISOString() : null,
        };

        await supabase
          .from('cravvr_subscriptions')
          .update(update)
          .eq('stripe_customer_id', customerId);
        break;
      }

      // Failed renewal payment. Stripe will retry per dunning settings; we
      // just reflect the state. Customers are notified by Stripe directly.
      case 'invoice.payment_failed': {
        const invoice: any = event.data.object;
        const customerId: string = invoice.customer;
        if (customerId) {
          await supabase
            .from('cravvr_subscriptions')
            .update({ status: 'past_due' })
            .eq('stripe_customer_id', customerId);
        }
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
