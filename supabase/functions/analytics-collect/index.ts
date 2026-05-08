// supabase/functions/analytics-collect/index.ts
// Edge Function: Append events to the events table.
//
// Accepts a single event or a batch. Also handles the identify() call:
// when a `user_id` is provided alongside a visitor_id with no user_id,
// the visitor is stitched to the auth user, and acquisition_visitor_id is
// stamped onto the customers row (first stitch wins so we don't overwrite
// the original acquisition source if the same user logs in from a new
// device later).

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

interface IncomingEvent {
  event_id?: string;
  event_name: string;
  occurred_at?: string;
  visitor_id: string;
  user_id?: string | null;
  session_id: string;
  url?: string;
  path?: string;
  referrer?: string;
  utm?: {
    source?: string;
    medium?: string;
    campaign?: string;
    content?: string;
    term?: string;
  };
  click_id?: string | null;
  properties?: Record<string, unknown>;
}

interface CollectPayload {
  events?: IncomingEvent[];
  event?: IncomingEvent;
  // Identify-only call (no event)
  identify?: {
    visitor_id: string;
    user_id: string;
  };
}

async function stitchVisitorToUser(
  supabase: ReturnType<typeof createClient>,
  visitorId: string,
  userId: string
) {
  // 1. Attach user to visitor (idempotent — only sets if currently null,
  //    so we don't overwrite a prior stitching).
  await supabase
    .from('visitors')
    .update({ user_id: userId, last_seen_at: new Date().toISOString() })
    .eq('id', visitorId)
    .is('user_id', null);

  // 2. Stamp acquisition_visitor_id on the customer (first stitch wins).
  await supabase
    .from('customers')
    .update({ acquisition_visitor_id: visitorId })
    .eq('id', userId)
    .is('acquisition_visitor_id', null);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders(req) });
  }

  try {
    const payload: CollectPayload = await req.json();
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Identify-only call — stitch visitor to user, no event row.
    if (payload.identify && !payload.event && !payload.events) {
      await stitchVisitorToUser(
        supabase,
        payload.identify.visitor_id,
        payload.identify.user_id
      );
      return new Response(
        JSON.stringify({ ok: true, stitched: true }),
        { headers: { ...corsHeaders(req), 'Content-Type': 'application/json' } }
      );
    }

    const incoming: IncomingEvent[] =
      payload.events ?? (payload.event ? [payload.event] : []);

    if (incoming.length === 0) {
      throw new Error('No events provided');
    }

    // If any event has user_id but the visitor isn't stitched, stitch now.
    const stitchPair = incoming.find((e) => e.user_id && e.visitor_id);
    if (stitchPair?.user_id) {
      await stitchVisitorToUser(supabase, stitchPair.visitor_id, stitchPair.user_id);
    }

    // Bump last_seen_at on the visitor (best-effort — fire and forget).
    if (incoming[0]?.visitor_id) {
      supabase
        .from('visitors')
        .update({ last_seen_at: new Date().toISOString() })
        .eq('id', incoming[0].visitor_id)
        .then(() => {});
    }

    const rows = incoming.map((e) => ({
      occurred_at: e.occurred_at ?? new Date().toISOString(),
      visitor_id: e.visitor_id,
      user_id: e.user_id ?? null,
      session_id: e.session_id,
      event_name: e.event_name,
      event_source: 'web',
      utm_source: e.utm?.source ?? null,
      utm_medium: e.utm?.medium ?? null,
      utm_campaign: e.utm?.campaign ?? null,
      utm_content: e.utm?.content ?? null,
      utm_term: e.utm?.term ?? null,
      click_id: e.click_id ?? null,
      url: e.url ?? null,
      path: e.path ?? null,
      referrer: e.referrer ?? null,
      properties: e.properties ?? {},
      event_id: e.event_id ?? null,
    }));

    // Upsert on event_id so retries from the client are idempotent.
    // Rows without event_id just insert.
    const withId = rows.filter((r) => r.event_id);
    const withoutId = rows.filter((r) => !r.event_id);

    if (withId.length > 0) {
      const { error } = await supabase
        .from('analytics_events')
        .upsert(withId, { onConflict: 'event_id', ignoreDuplicates: true });
      if (error) throw error;
    }
    if (withoutId.length > 0) {
      const { error } = await supabase.from('analytics_events').insert(withoutId);
      if (error) throw error;
    }

    return new Response(
      JSON.stringify({ ok: true, count: rows.length }),
      { headers: { ...corsHeaders(req), 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('analytics-collect error:', err);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 400, headers: { ...corsHeaders(req), 'Content-Type': 'application/json' } }
    );
  }
});
