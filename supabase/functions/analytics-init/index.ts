// supabase/functions/analytics-init/index.ts
// Edge Function: Initialize a visitor identity.
//
// Called once per browser (or whenever localStorage is missing the visitor id).
// Creates a visitors row and freezes first-touch acquisition context.
// Idempotent: if a visitor_id is supplied and exists, just bumps last_seen_at
// and (if new UTMs are present) updates the last-touch fields.

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

interface InitPayload {
  visitor_id?: string | null;
  url?: string;
  path?: string;
  referrer?: string;
  user_agent?: string;
  utm?: {
    source?: string;
    medium?: string;
    campaign?: string;
    content?: string;
    term?: string;
  };
  click_id?: string | null;
  click_platform?: string | null;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const payload: InitPayload = await req.json();
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const now = new Date().toISOString();

    // Existing visitor — refresh last-seen and (if present) last-touch UTMs.
    if (payload.visitor_id) {
      const { data: existing } = await supabase
        .from('visitors')
        .select('id')
        .eq('id', payload.visitor_id)
        .maybeSingle();

      if (existing) {
        const update: Record<string, unknown> = { last_seen_at: now };
        if (payload.utm?.source) {
          update.last_utm_source = payload.utm.source;
          update.last_utm_medium = payload.utm.medium ?? null;
          update.last_utm_campaign = payload.utm.campaign ?? null;
          update.last_utm_content = payload.utm.content ?? null;
          update.last_utm_term = payload.utm.term ?? null;
          update.last_click_id = payload.click_id ?? null;
          update.last_click_platform = payload.click_platform ?? null;
          update.last_touch_at = now;
        }

        await supabase.from('visitors').update(update).eq('id', existing.id);

        return new Response(
          JSON.stringify({ visitor_id: existing.id, created: false }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // New visitor — freeze first-touch and last-touch (same value at birth).
    const { data: created, error } = await supabase
      .from('visitors')
      .insert({
        first_seen_at: now,
        last_seen_at: now,
        first_landing_url: payload.url ?? null,
        first_landing_path: payload.path ?? null,
        first_referrer: payload.referrer ?? null,
        user_agent: payload.user_agent ?? null,
        first_utm_source: payload.utm?.source ?? null,
        first_utm_medium: payload.utm?.medium ?? null,
        first_utm_campaign: payload.utm?.campaign ?? null,
        first_utm_content: payload.utm?.content ?? null,
        first_utm_term: payload.utm?.term ?? null,
        first_click_id: payload.click_id ?? null,
        first_click_platform: payload.click_platform ?? null,
        last_utm_source: payload.utm?.source ?? null,
        last_utm_medium: payload.utm?.medium ?? null,
        last_utm_campaign: payload.utm?.campaign ?? null,
        last_utm_content: payload.utm?.content ?? null,
        last_utm_term: payload.utm?.term ?? null,
        last_click_id: payload.click_id ?? null,
        last_click_platform: payload.click_platform ?? null,
        last_touch_at: payload.utm?.source ? now : null,
      })
      .select('id')
      .single();

    if (error) throw error;

    return new Response(
      JSON.stringify({ visitor_id: created.id, created: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('analytics-init error:', err);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
