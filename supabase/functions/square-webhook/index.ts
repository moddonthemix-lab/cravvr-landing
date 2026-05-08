// supabase/functions/square-webhook/index.ts
// Receives event notifications from Square (payment.updated, refund.updated, etc).
// Square signs the payload using HMAC-SHA256 of (notification URL + body) with
// the merchant's webhook signature key. We pin the URL via env so we don't
// have to parse forwarded headers.

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const SIG_KEY = Deno.env.get('SQUARE_WEBHOOK_SIGNATURE_KEY') || '';
const NOTIF_URL = Deno.env.get('SQUARE_WEBHOOK_URL') ||
  `${supabaseUrl}/functions/v1/square-webhook`;

async function verifySignature(rawBody: string, headerSig: string | null): Promise<boolean> {
  if (!SIG_KEY || !headerSig) return false;
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(SIG_KEY),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sig = await crypto.subtle.sign(
    'HMAC',
    key,
    new TextEncoder().encode(NOTIF_URL + rawBody),
  );
  // base64
  const b64 = btoa(String.fromCharCode(...new Uint8Array(sig)));
  return b64 === headerSig;
}

serve(async (req) => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });

  const rawBody = await req.text();
  const headerSig = req.headers.get('x-square-hmacsha256-signature');
  const verified = await verifySignature(rawBody, headerSig);
  if (!verified) {
    console.warn('Square webhook: signature verification failed');
    return new Response('Invalid signature', { status: 400 });
  }

  let event: any;
  try { event = JSON.parse(rawBody); } catch { return new Response('Bad JSON', { status: 400 }); }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // Replay protection: reject events whose `created_at` is too old. Square
  // events include an ISO `created_at`; if it's missing we skip the check
  // rather than fail closed (verified signature is still required).
  const REPLAY_WINDOW_MS = 5 * 60 * 1000;
  if (event.created_at) {
    const eventTime = Date.parse(event.created_at);
    if (Number.isFinite(eventTime) && Math.abs(Date.now() - eventTime) > REPLAY_WINDOW_MS) {
      console.warn('Square webhook: rejecting stale event', event.event_id, event.created_at);
      return new Response('Event too old', { status: 400 });
    }
  }

  // Dedup: try to claim this event_id in the ledger. ON CONFLICT means we've
  // already processed it (Square retransmits) — return 200 so it stops retrying.
  if (event.event_id) {
    const { error: dupError, data: claimed } = await supabase
      .from('processor_webhook_events')
      .insert({
        processor: 'square',
        event_id: event.event_id,
        event_type: event.type ?? null,
        event_created_at: event.created_at ?? null,
      })
      .select('event_id')
      .maybeSingle();
    if (dupError) {
      // 23505 unique_violation = already processed; anything else is a real error.
      // PostgREST surfaces unique_violation as code '23505' on the error object.
      const code = (dupError as any)?.code;
      if (code === '23505') {
        return new Response('ok', { status: 200 });
      }
      console.error('Square webhook: ledger insert failed', dupError);
      // Fall through and process anyway — better to risk a double-apply than
      // to drop a legitimate event. The replay protection above bounds this.
    } else if (!claimed) {
      // No row returned and no error — treat as duplicate to be safe.
      return new Response('ok', { status: 200 });
    }
  }

  try {
    switch (event.type) {
      case 'payment.updated': {
        const p = event.data?.object?.payment;
        if (!p?.id) break;
        const newStatus = p.status === 'COMPLETED' || p.status === 'APPROVED' ? 'succeeded'
          : p.status === 'PENDING' ? 'processing'
          : p.status === 'FAILED' || p.status === 'CANCELED' ? 'failed'
          : null;
        if (!newStatus) break;

        await supabase
          .from('payments')
          .update({ status: newStatus })
          .eq('square_payment_id', p.id);

        // Mirror onto orders.payment_status
        const orderPaymentStatus = newStatus === 'succeeded' ? 'paid'
          : newStatus === 'processing' ? 'pending'
          : 'failed';
        if (p.reference_id) {
          await supabase
            .from('orders')
            .update({ payment_status: orderPaymentStatus })
            .eq('id', p.reference_id);
        }
        break;
      }
      case 'refund.updated': {
        const r = event.data?.object?.refund;
        if (!r?.id || !r?.payment_id) break;
        const refunded = r.status === 'COMPLETED' || r.status === 'APPROVED';
        if (!refunded) break;

        const { data: pay } = await supabase
          .from('payments')
          .select('id, order_id, amount')
          .eq('square_payment_id', r.payment_id)
          .single();

        if (pay) {
          await supabase
            .from('payments')
            .update({
              status: 'refunded',
              refund_amount: r.amount_money?.amount || pay.amount,
              square_refund_id: r.id,
            })
            .eq('id', pay.id);
          if (pay.order_id) {
            await supabase
              .from('orders')
              .update({ payment_status: 'refunded' })
              .eq('id', pay.order_id);
          }
        }
        break;
      }
      default:
        // Ignore other event types for now
        break;
    }
  } catch (e) {
    console.error('Square webhook handler error:', e);
    // Return 200 to avoid Square retrying on transient DB issues; we have
    // logs to recover from.
  }

  return new Response('ok', { status: 200 });
});
