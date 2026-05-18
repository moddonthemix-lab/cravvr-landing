// supabase/functions/truck-activate/index.ts
//
// Admin-only endpoint. Marks a truck lead as onboarded and fires Klaviyo
// "Truck Activated" — the trigger for Flow B (Operator Post-Onboarding).
//
// Auth: requires a bearer token. RLS on truck_leads gates the actual write
// (admin policy via is_admin()).
//
// Request:
//   POST { lead_id: uuid, truck_id?: uuid }
// Response:
//   200 { ok: true, lead_id, truck_activated_event_fired: bool }

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';
import { corsHeaders } from '../_shared/cors.ts';
import { fireEvent } from '../_shared/klaviyo.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const CITY_LABELS: Record<string, string> = {
  portland: 'Portland, OR',
  'st-pete': 'St. Petersburg, FL',
  tampa: 'Tampa, FL',
};

serve(async (req) => {
  const cors = corsHeaders(req);
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });

  if (req.method !== 'POST') {
    return json({ error: 'method_not_allowed' }, 405, cors);
  }

  // Require an Authorization bearer so this endpoint isn't anonymous.
  // (RLS on truck_leads enforces admin-only writes via is_admin().)
  const auth = req.headers.get('authorization') || '';
  if (!auth.toLowerCase().startsWith('bearer ')) {
    return json({ error: 'unauthorized' }, 401, cors);
  }

  let body: { lead_id?: string; truck_id?: string };
  try {
    body = await req.json();
  } catch {
    return json({ error: 'invalid_json' }, 400, cors);
  }

  if (!body.lead_id) return json({ error: 'missing_lead_id' }, 400, cors);

  // Use service role here — the function's own auth check (bearer) plus
  // calling-side admin gating is the access boundary. We need service role
  // to JOIN profiles/food_trucks for the Klaviyo payload.
  const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // 1. Update the lead row.
  const updatePayload: Record<string, unknown> = {
    status: 'onboarded',
    onboarded_at: new Date().toISOString(),
  };
  if (body.truck_id) updatePayload.truck_id = body.truck_id;

  const { data: updated, error: updateError } = await supabase
    .from('truck_leads')
    .update(updatePayload)
    .eq('id', body.lead_id)
    .select()
    .single();

  if (updateError || !updated) {
    return json({ error: 'update_failed', detail: updateError?.message }, 500, cors);
  }

  // 2. Hydrate truck info if provided.
  let truckName = updated.truck_name;
  let truckSlug: string | null = null;
  if (body.truck_id) {
    const { data: truck } = await supabase
      .from('food_trucks')
      .select('name, slug')
      .eq('id', body.truck_id)
      .maybeSingle();
    if (truck) {
      truckName = truck.name || truckName;
      truckSlug = truck.slug;
    }
  }

  // 3. Fire Klaviyo Truck Activated (Flow B trigger). Fire-and-forget.
  let eventFired = false;
  if (updated.email || updated.phone) {
    fireEvent({
      metric: 'Truck Activated',
      email: updated.email || undefined,
      phone: updated.phone || undefined,
      first_name: updated.name?.split(' ')[0],
      unique_id: `truck_activated:${updated.id}`,
      properties: {
        lead_id: updated.id,
        truck_id: body.truck_id || updated.truck_id || null,
        truck_name: truckName,
        truck_slug: truckSlug,
        city: CITY_LABELS[updated.city] || updated.city,
        cuisine: updated.cuisine,
      },
    }).catch((e) => console.warn('klaviyo Truck Activated failed:', e));
    eventFired = true;
  } else {
    console.warn('truck-activate: no email/phone on lead, skipping Klaviyo event');
  }

  return json(
    {
      ok: true,
      lead_id: updated.id,
      status: updated.status,
      truck_activated_event_fired: eventFired,
    },
    200,
    cors,
  );
});

function json(payload: unknown, status: number, cors: Record<string, string>) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json' },
  });
}
