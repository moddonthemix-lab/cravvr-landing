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
