// supabase/functions/truck-lead/index.ts
//
// Receives a truck-operator lead from /for-trucks/* landing pages and:
//   1. Inserts into `truck_leads` (Supabase, service-role bypass of RLS)
//   2. Posts to Slack #new-leads webhook (founder text-back ASAP)
//   3. Sends event + profile to Klaviyo (drops into the operator nurture flow)
//
// Failures in any side-effect are logged but do not fail the request — the
// lead row is the source of truth, the others are nice-to-have.
//
// Required env (set via `supabase secrets set ...`):
//   SUPABASE_URL                  (auto)
//   SUPABASE_SERVICE_ROLE_KEY     (auto)
//   SLACK_LEADS_WEBHOOK_URL=https://hooks.slack.com/services/...
//   KLAVIYO_API_KEY=pk_...
//   KLAVIYO_LEADS_LIST_ID=ABCDEF   (optional — if set, profile is subscribed)

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';
import { corsHeaders } from '../_shared/cors.ts';
import { upsertProfile, subscribeToList, fireEvent } from '../_shared/klaviyo.ts';
import { sendMetaCapiEvent, clientIpFromHeaders } from '../_shared/meta-capi.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const SLACK_WEBHOOK = Deno.env.get('SLACK_LEADS_WEBHOOK_URL') || '';
const KLAVIYO_LIST_ID = Deno.env.get('KLAVIYO_LEADS_LIST_ID') || '';

const CITY_LABELS: Record<string, string> = {
  portland: 'Portland, OR',
  'st-pete': 'St. Petersburg, FL',
  tampa: 'Tampa, FL',
};

interface LeadPayload {
  name: string;
  truck_name?: string;
  phone: string;
  email?: string;
  cuisine?: string;
  city: string;
  best_time?: string;
  notes?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
  click_id?: string;
  click_platform?: string;
  referrer?: string;
  landing_url?: string;
  visitor_id?: string;
  // Meta CAPI match signals (the browser fires Lead with the same event_id).
  event_id?: string;
  fbc?: string;
  fbp?: string;
  event_source_url?: string;
  user_agent?: string;
}

serve(async (req) => {
  const cors = corsHeaders(req);
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405, headers: cors });
  }

  let body: LeadPayload;
  try {
    body = await req.json();
  } catch {
    return json({ error: 'invalid_json' }, 400, cors);
  }

  // Minimal validation — the landing page already enforces UI rules.
  if (!body.name || !body.phone || !body.city || !body.email) {
    return json({ error: 'missing_required_fields' }, 400, cors);
  }
  if (!CITY_LABELS[body.city]) {
    return json({ error: 'unknown_city' }, 400, cors);
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: inserted, error: insertError } = await supabase
    .from('truck_leads')
    .insert([{
      name: body.name.trim(),
      truck_name: body.truck_name?.trim() || null,
      phone: body.phone.trim(),
      email: body.email?.trim().toLowerCase() || null,
      cuisine: body.cuisine || null,
      city: body.city,
      best_time: body.best_time || null,
      notes: body.notes?.trim() || null,
      utm_source: body.utm_source || null,
      utm_medium: body.utm_medium || null,
      utm_campaign: body.utm_campaign || null,
      utm_content: body.utm_content || null,
      utm_term: body.utm_term || null,
      click_id: body.click_id || null,
      click_platform: body.click_platform || null,
      referrer: body.referrer || null,
      landing_url: body.landing_url || null,
      visitor_id: body.visitor_id || null,
    }])
    .select()
    .single();

  if (insertError) {
    console.error('truck_leads insert failed', insertError);
    return json({ error: 'insert_failed', detail: insertError.message }, 500, cors);
  }

  // Server-side signals for Meta CAPI (authoritative — from the request).
  const clientIp = clientIpFromHeaders(req);
  const userAgent = req.headers.get('user-agent') || body.user_agent || null;
  const [firstName, ...rest] = (inserted.name || '').split(' ');
  if (!body.event_id) {
    console.warn('truck-lead: no event_id from client — CAPI Lead will not dedupe with the browser Pixel');
  }

  // Fire side effects in parallel — don't await success/failure for the response.
  Promise.allSettled([
    postSlack(inserted),
    pushKlaviyo(inserted),
    sendMetaCapiEvent({
      eventName: 'Lead',
      // Reuse the browser's event_id so Meta dedupes the Pixel + CAPI pair.
      eventId: body.event_id ?? crypto.randomUUID(),
      eventSourceUrl: body.event_source_url ?? inserted.landing_url ?? null,
      userData: {
        email: inserted.email,
        phone: inserted.phone,
        firstName,
        lastName: rest.join(' ') || null,
        city: CITY_LABELS[inserted.city] ?? inserted.city,
        fbclid: inserted.click_platform === 'meta' ? inserted.click_id : null,
        fbcCookie: body.fbc ?? null,
        fbpCookie: body.fbp ?? null,
        clientIp,
        userAgent,
        externalId: inserted.visitor_id ?? null,
      },
      customData: { content_category: 'truck_operator', value: 50, currency: 'USD' },
    }),
  ]).then((results) => {
    results.forEach((r, i) => {
      if (r.status === 'rejected') {
        console.error(`side effect ${i} failed`, r.reason);
      }
    });
  });

  return json({ ok: true, id: inserted.id }, 200, cors);
});

function json(payload: unknown, status: number, cors: Record<string, string>) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json' },
  });
}

async function postSlack(lead: any) {
  if (!SLACK_WEBHOOK) return;
  const cityLabel = CITY_LABELS[lead.city] || lead.city;
  const utm = [lead.utm_source, lead.utm_campaign, lead.utm_content]
    .filter(Boolean).join(' / ') || 'direct';

  const text = `🚚 *New truck lead — ${cityLabel}*`;
  const blocks = [
    { type: 'section', text: { type: 'mrkdwn', text } },
    {
      type: 'section',
      fields: [
        { type: 'mrkdwn', text: `*Name:*\n${lead.name}` },
        { type: 'mrkdwn', text: `*Truck:*\n${lead.truck_name || '—'}` },
        { type: 'mrkdwn', text: `*Phone:*\n<tel:${lead.phone}|${lead.phone}>` },
        { type: 'mrkdwn', text: `*Email:*\n${lead.email || '—'}` },
        { type: 'mrkdwn', text: `*Cuisine:*\n${lead.cuisine || '—'}` },
        { type: 'mrkdwn', text: `*Best time:*\n${lead.best_time || '—'}` },
      ],
    },
    {
      type: 'context',
      elements: [{ type: 'mrkdwn', text: `Source: ${utm} · ID: \`${lead.id}\`` }],
    },
    {
      type: 'context',
      elements: [{ type: 'mrkdwn', text: '⏱ *Reply within 5 minutes* — every minute past that drops conversion ~10%.' }],
    },
  ];

  await fetch(SLACK_WEBHOOK, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, blocks }),
  });
}

async function pushKlaviyo(lead: any) {
  const cityLabel = CITY_LABELS[lead.city] || lead.city;
  const firstName = lead.name?.split(' ')[0];
  const lastName = lead.name?.split(' ').slice(1).join(' ') || undefined;

  const profileId = await upsertProfile({
    email: lead.email || undefined,
    phone: lead.phone,
    first_name: firstName,
    last_name: lastName,
    properties: {
      lead_type: 'truck_operator',
      truck_name: lead.truck_name,
      cuisine: lead.cuisine,
      city: cityLabel,
      utm_source: lead.utm_source,
      utm_campaign: lead.utm_campaign,
    },
  });

  await fireEvent({
    metric: 'Submitted Truck Application',
    email: lead.email || undefined,
    phone: lead.phone,
    first_name: firstName,
    unique_id: `lead:${lead.id}`,
    properties: {
      truck_name: lead.truck_name,
      cuisine: lead.cuisine,
      city: cityLabel,
      best_time: lead.best_time,
      utm_source: lead.utm_source,
      utm_campaign: lead.utm_campaign,
      utm_content: lead.utm_content,
      lead_id: lead.id,
    },
  });

  if (KLAVIYO_LIST_ID && profileId) {
    await subscribeToList(profileId, KLAVIYO_LIST_ID);
  }
}
