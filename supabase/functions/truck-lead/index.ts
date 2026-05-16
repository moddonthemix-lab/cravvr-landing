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

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const SLACK_WEBHOOK = Deno.env.get('SLACK_LEADS_WEBHOOK_URL') || '';
const KLAVIYO_KEY = Deno.env.get('KLAVIYO_API_KEY') || '';
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
  if (!body.name || !body.phone || !body.city) {
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

  // Fire side effects in parallel — don't await success/failure for the response.
  Promise.allSettled([
    postSlack(inserted),
    pushKlaviyo(inserted),
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
  if (!KLAVIYO_KEY) return;
  const cityLabel = CITY_LABELS[lead.city] || lead.city;

  // 1. Upsert profile
  const profileRes = await fetch('https://a.klaviyo.com/api/profiles/', {
    method: 'POST',
    headers: klaviyoHeaders(),
    body: JSON.stringify({
      data: {
        type: 'profile',
        attributes: {
          email: lead.email || undefined,
          phone_number: normalizePhone(lead.phone),
          first_name: lead.name?.split(' ')[0],
          last_name: lead.name?.split(' ').slice(1).join(' ') || undefined,
          properties: {
            lead_type: 'truck_operator',
            truck_name: lead.truck_name,
            cuisine: lead.cuisine,
            city: cityLabel,
            utm_source: lead.utm_source,
            utm_campaign: lead.utm_campaign,
          },
        },
      },
    }),
  });

  let profileId: string | null = null;
  if (profileRes.ok || profileRes.status === 409) {
    const profileJson = await profileRes.json().catch(() => null);
    profileId = profileJson?.data?.id || null;
    // 409 conflict returns the existing profile id in the errors array
    if (!profileId && profileJson?.errors?.[0]?.meta?.duplicate_profile_id) {
      profileId = profileJson.errors[0].meta.duplicate_profile_id;
    }
  } else {
    console.error('Klaviyo profile upsert failed', profileRes.status, await profileRes.text());
  }

  // 2. Fire `Submitted Truck Application` event (triggers nurture flow)
  await fetch('https://a.klaviyo.com/api/events/', {
    method: 'POST',
    headers: klaviyoHeaders(),
    body: JSON.stringify({
      data: {
        type: 'event',
        attributes: {
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
          metric: { data: { type: 'metric', attributes: { name: 'Submitted Truck Application' } } },
          profile: {
            data: {
              type: 'profile',
              attributes: {
                email: lead.email || undefined,
                phone_number: normalizePhone(lead.phone),
              },
            },
          },
        },
      },
    }),
  });

  // 3. Subscribe to list (optional)
  if (KLAVIYO_LIST_ID && profileId) {
    await fetch(`https://a.klaviyo.com/api/lists/${KLAVIYO_LIST_ID}/relationships/profiles/`, {
      method: 'POST',
      headers: klaviyoHeaders(),
      body: JSON.stringify({ data: [{ type: 'profile', id: profileId }] }),
    });
  }
}

function klaviyoHeaders() {
  return {
    'Authorization': `Klaviyo-API-Key ${KLAVIYO_KEY}`,
    'Content-Type': 'application/json',
    'revision': '2024-10-15',
  };
}

function normalizePhone(p: string): string | undefined {
  if (!p) return undefined;
  const digits = p.replace(/\D/g, '');
  if (!digits) return undefined;
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`;
  return `+${digits}`;
}
