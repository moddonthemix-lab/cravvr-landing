// supabase/functions/analytics-server-event/index.ts
// Edge Function: Server-side conversion dispatcher.
//
// Called by the stripe-webhook on payment_intent.succeeded (and any other
// authoritative server-side conversion moment). Responsibilities:
//
//   1. Look up the visitor → first-touch and last-touch UTMs from the
//      customer's acquisition_visitor_id.
//   2. Stamp the orders row with frozen acquisition columns and the
//      payments.metadata JSONB with the same attribution snapshot.
//   3. Insert an events row (event_source='server', event_name='purchase')
//      using a deterministic event_id so we can dedupe with the browser hit.
//   4. Forward the conversion to Meta CAPI / Google Measurement Protocol /
//      TikTok Events API — same event_id ensures the platforms dedupe.
//
// Env vars (set in Supabase Edge Function secrets):
//   - META_CAPI_PIXEL_ID, META_CAPI_ACCESS_TOKEN
//   - GOOGLE_MEASUREMENT_PROTOCOL_API_SECRET, VITE_GA4_MEASUREMENT_ID
//   - TIKTOK_EVENTS_API_TOKEN, TIKTOK_PIXEL_CODE
// Each integration is a no-op when its env vars are missing.

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';
import { dispatchServerConversion } from '../_shared/capi.ts';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

interface ServerEventPayload {
  event_name: 'purchase' | string;
  order_id: string;
  amount_cents: number;
  currency?: string;
  // Optional: deterministic event_id; if omitted we derive from order_id.
  event_id?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders(req) });
  }

  try {
    const payload: ServerEventPayload = await req.json();
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 1. Resolve order → customer → visitor.
    const { data: order, error: orderErr } = await supabase
      .from('orders')
      .select('id, customer_id, total')
      .eq('id', payload.order_id)
      .single();
    if (orderErr || !order) throw new Error(`Order ${payload.order_id} not found`);

    const { data: customer } = await supabase
      .from('customers')
      .select('id, acquisition_visitor_id')
      .eq('id', order.customer_id)
      .maybeSingle();

    let visitor: any = null;
    if (customer?.acquisition_visitor_id) {
      const { data } = await supabase
        .from('visitors')
        .select('*')
        .eq('id', customer.acquisition_visitor_id)
        .maybeSingle();
      visitor = data;
    }

    const { data: authUser } = await supabase.auth.admin.getUserById(order.customer_id);
    const email = authUser?.user?.email ?? null;

    const eventId = payload.event_id || `purchase:${order.id}`;
    const currency = payload.currency ?? 'USD';
    const valueCents = payload.amount_cents;

    // 2. Stamp acquisition snapshot on the order (frozen).
    const acquisitionSnapshot = {
      acquisition_visitor_id: visitor?.id ?? null,
      acquisition_first_utm_source: visitor?.first_utm_source ?? null,
      acquisition_first_utm_medium: visitor?.first_utm_medium ?? null,
      acquisition_first_utm_campaign: visitor?.first_utm_campaign ?? null,
      acquisition_last_utm_source: visitor?.last_utm_source ?? null,
      acquisition_last_utm_medium: visitor?.last_utm_medium ?? null,
      acquisition_last_utm_campaign: visitor?.last_utm_campaign ?? null,
    };
    await supabase.from('orders').update(acquisitionSnapshot).eq('id', order.id);

    await supabase.from('payments').update({
      metadata: {
        attribution: {
          first_utm_source: visitor?.first_utm_source ?? null,
          first_utm_campaign: visitor?.first_utm_campaign ?? null,
          first_click_platform: visitor?.first_click_platform ?? null,
          last_utm_source: visitor?.last_utm_source ?? null,
          last_utm_campaign: visitor?.last_utm_campaign ?? null,
          visitor_id: visitor?.id ?? null,
          event_id: eventId,
        },
      },
    }).eq('order_id', order.id);

    // 3. Insert the server-side events row.
    if (visitor?.id) {
      await supabase.from('analytics_events').upsert({
        visitor_id: visitor.id,
        user_id: order.customer_id,
        session_id: visitor.id, // server events use visitor as session
        event_name: payload.event_name,
        event_source: 'server',
        utm_source: visitor.last_utm_source,
        utm_medium: visitor.last_utm_medium,
        utm_campaign: visitor.last_utm_campaign,
        properties: {
          order_id: order.id,
          amount_cents: valueCents,
          currency,
        },
        event_id: eventId,
      }, { onConflict: 'event_id', ignoreDuplicates: true });
    }

    // 4. Fan out to ad platforms (Meta CAPI / GA4 MP / TikTok Events API),
    //    deduped against the browser pixel via the shared event_id.
    await dispatchServerConversion({
      eventName: 'Purchase',
      eventId,
      value: valueCents / 100,
      currency,
      email,
      ga4ClientId: visitor?.id || order.customer_id,
    });

    return new Response(
      JSON.stringify({ ok: true, event_id: eventId }),
      { headers: { ...corsHeaders(req), 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('analytics-server-event error:', err);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 400, headers: { ...corsHeaders(req), 'Content-Type': 'application/json' } }
    );
  }
});
