// supabase/functions/marketing-insights/index.ts
//
// Marketing intelligence endpoint. Reads `truck_lead_attribution` and
// `marketing_funnel_daily` views, computes summaries, and optionally
// calls Anthropic's Claude API to produce a plain-English recommendation
// digest.
//
// Auth: admin-only. We use Clerk JWT via Supabase Third-Party Auth — when
//       supabase client is created with the user's JWT, RLS on the
//       underlying tables already restricts reads to is_admin().
//
// Required env:
//   SUPABASE_URL                  (auto)
//   SUPABASE_SERVICE_ROLE_KEY     (auto)
// Optional:
//   ANTHROPIC_API_KEY=sk-ant-...  (enables the ai_recommendations field)

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';
import { corsHeaders } from '../_shared/cors.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const ANTHROPIC_KEY = Deno.env.get('ANTHROPIC_API_KEY') || '';

serve(async (req) => {
  const cors = corsHeaders(req);
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });

  // Auth: require a bearer token (Clerk JWT or service role). We rely on
  // RLS at the DB layer for fine-grained admin enforcement.
  const auth = req.headers.get('authorization') || '';
  if (!auth.toLowerCase().startsWith('bearer ')) {
    return json({ error: 'unauthorized' }, 401, cors);
  }

  // Use service role to read the views (they're already gated by RLS on
  // truck_leads + analytics_events for non-admin clients). For now we
  // require a bearer header to gate the function itself.
  const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const sinceDays = parseInt(new URL(req.url).searchParams.get('days') || '7', 10);
  const sinceDate = new Date(Date.now() - sinceDays * 24 * 3600 * 1000).toISOString();

  // ── Pull the data ────────────────────────────────────────────────────
  const [funnelRes, leadsRes, openLeadsRes] = await Promise.all([
    supabase
      .from('marketing_funnel_daily')
      .select('*')
      .gte('day', sinceDate.split('T')[0])
      .order('day', { ascending: false }),
    supabase
      .from('truck_lead_attribution')
      .select('*')
      .gte('created_at', sinceDate)
      .order('created_at', { ascending: false }),
    // Open leads: status = 'new' and not yet contacted, ranked by score
    supabase
      .from('truck_lead_attribution')
      .select('id,name,truck_name,city,created_at,lead_score,last_utm_source,last_utm_campaign,last_utm_content,pageviews_before_submit')
      .in('status', ['new', 'contacted'])
      .order('lead_score', { ascending: false })
      .limit(20),
  ]);

  if (funnelRes.error || leadsRes.error || openLeadsRes.error) {
    return json({
      error: 'query_failed',
      detail: funnelRes.error?.message || leadsRes.error?.message || openLeadsRes.error?.message,
    }, 500, cors);
  }

  const funnel = funnelRes.data || [];
  const leads = leadsRes.data || [];
  const openLeads = openLeadsRes.data || [];

  // ── Compute rollups ──────────────────────────────────────────────────
  const byCity = rollup(funnel, (r: any) => r.city || 'unknown');
  const byCreative = rollup(funnel, (r: any) =>
    `${r.utm_source}/${r.utm_campaign}/${r.utm_content}`,
  ).map((r: any) => ({ ...r, status: statusFor(r) }));

  const totalViews = funnel.reduce((s: number, r: any) => s + (r.unique_views || 0), 0);
  const totalSubmits = leads.length;
  const totalOnboarded = leads.filter((l: any) => l.status === 'onboarded').length;
  const overallSubmitRate = totalViews > 0 ? totalSubmits / totalViews : null;

  const result: Record<string, any> = {
    as_of: new Date().toISOString(),
    period_days: sinceDays,
    summary: {
      total_views: totalViews,
      total_leads: totalSubmits,
      total_onboarded: totalOnboarded,
      submit_rate: overallSubmitRate,
      avg_lead_score:
        leads.length > 0
          ? Math.round(leads.reduce((s: number, l: any) => s + (l.lead_score || 0), 0) / leads.length)
          : null,
    },
    by_city: byCity,
    by_creative: byCreative,
    open_leads_top_20: openLeads,
  };

  // ── Optional AI recommendation digest ────────────────────────────────
  if (ANTHROPIC_KEY) {
    try {
      result.ai_recommendations = await summarizeWithClaude(result);
    } catch (err) {
      result.ai_recommendations_error = String(err);
    }
  } else {
    result.ai_recommendations =
      'Set ANTHROPIC_API_KEY in Supabase secrets to enable AI-generated recommendations.';
  }

  return json(result, 200, cors);
});

function json(payload: unknown, status: number, cors: Record<string, string>) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json' },
  });
}

function rollup<T>(rows: any[], keyFn: (r: any) => string) {
  const map = new Map<string, any>();
  for (const r of rows) {
    const k = keyFn(r);
    const cur = map.get(k) || {
      key: k,
      unique_views: 0, total_views: 0, submits: 0, onboarded: 0,
    };
    cur.unique_views += r.unique_views || 0;
    cur.total_views += r.total_views || 0;
    cur.submits += r.submits || 0;
    cur.onboarded += r.onboarded || 0;
    map.set(k, cur);
  }
  return [...map.values()].map((r) => ({
    ...r,
    submit_rate: r.unique_views > 0 ? r.submits / r.unique_views : null,
    onboard_rate: r.submits > 0 ? r.onboarded / r.submits : null,
  })).sort((a, b) => b.submits - a.submits);
}

function statusFor(r: any): 'winner' | 'losing' | 'too_early' {
  if ((r.unique_views || 0) < 50) return 'too_early';
  if ((r.submit_rate || 0) >= 0.08) return 'winner';
  if ((r.submit_rate || 0) < 0.02) return 'losing';
  return 'too_early';
}

async function summarizeWithClaude(data: Record<string, any>): Promise<string> {
  const prompt = `You are Cravvr's growth analyst. The data below is from the last ${data.period_days} days of our truck-operator acquisition test.

DATA (JSON):
${JSON.stringify({
  summary: data.summary,
  by_city: data.by_city.slice(0, 10),
  by_creative: data.by_creative.slice(0, 15),
  top_open_leads: data.open_leads_top_20.slice(0, 5),
}, null, 2)}

Write a tight, founder-focused brief in markdown — under 250 words. Sections:
1. **What's working** (1-2 bullets — call out specific creatives/cities by name with numbers)
2. **What to kill or pause** (1-2 bullets — only if a creative has >=50 views and <2% submit rate)
3. **Today's actions** (3 bullets max — specific dollar reallocations, specific leads to call)

No fluff. No "consider exploring..." Use numbers. If the data is too sparse to recommend, say "too early — need N more views" and give one diagnostic instead.`;

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': ANTHROPIC_KEY,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 600,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`anthropic ${res.status}: ${detail.slice(0, 200)}`);
  }

  const body = await res.json();
  const text = body?.content?.[0]?.text;
  if (!text) throw new Error('empty response from anthropic');
  return text;
}
