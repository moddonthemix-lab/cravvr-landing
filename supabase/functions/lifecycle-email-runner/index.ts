// supabase/functions/lifecycle-email-runner/index.ts
// Edge Function: behavioral lifecycle email runner.
//
// Called by pg_cron with { flow: 'abandoned_cart' | 'first_reorder' | 'win_back' }.
// For each flow:
//   1. Run the SQL that identifies who should receive the email RIGHT NOW.
//   2. Skip anyone who has email_marketing_opt_out = true.
//   3. Skip anyone who already has a marketing_email_send row for this
//      (customer, flow, trigger_key) — UNIQUE index makes this idempotent.
//   4. Dispatch the email via the existing resend-email function.
//   5. Record the send in marketing_email_send.
//
// Templates are react-email components rendered by the resend-email function.
// To change the look of an email, edit the matching .tsx in
// supabase/functions/_shared/emails/ and redeploy resend-email.

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const siteUrl = Deno.env.get('SITE_URL') || 'https://cravvr.com';

// Flow → react-email template name (registered in resend-email function).
const TEMPLATES = {
  abandoned_cart: 'abandoned-cart',
  first_reorder: 'first-reorder-nudge',
  win_back: 'win-back',
} as const;

type Flow = keyof typeof TEMPLATES;

interface Candidate {
  customer_id: string;
  email: string;
  name: string | null;
  unsubscribe_token: string | null;
  trigger_key: string;
  template_data: Record<string, unknown>;
}

async function findAbandonedCartCandidates(supabase: any): Promise<Candidate[]> {
  // add_to_cart in the last 24h, no order_created or purchase since the
  // most recent add_to_cart, and we haven't already emailed for this trigger.
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  // Pull each user's most-recent add_to_cart in the window.
  const { data: events, error } = await supabase
    .from('analytics_events')
    .select('event_id, user_id, occurred_at, properties')
    .eq('event_name', 'add_to_cart')
    .gte('occurred_at', since)
    .not('user_id', 'is', null);
  if (error) throw error;

  // Latest cart-add per user.
  const latestByUser = new Map<string, any>();
  for (const e of (events ?? [])) {
    const cur = latestByUser.get(e.user_id);
    if (!cur || new Date(e.occurred_at) > new Date(cur.occurred_at)) {
      latestByUser.set(e.user_id, e);
    }
  }
  if (latestByUser.size === 0) return [];

  const userIds = Array.from(latestByUser.keys());

  // For each user, did they have a conversion event after the cart-add?
  const { data: convs } = await supabase
    .from('analytics_events')
    .select('user_id, occurred_at, event_name')
    .in('user_id', userIds)
    .in('event_name', ['order_created', 'purchase'])
    .gte('occurred_at', since);

  const lastConvByUser = new Map<string, string>();
  for (const c of (convs ?? [])) {
    if (!lastConvByUser.has(c.user_id) || new Date(c.occurred_at) > new Date(lastConvByUser.get(c.user_id)!)) {
      lastConvByUser.set(c.user_id, c.occurred_at);
    }
  }

  const stranded = userIds.filter((uid) => {
    const cartAt = latestByUser.get(uid).occurred_at;
    const convAt = lastConvByUser.get(uid);
    return !convAt || new Date(convAt) < new Date(cartAt);
  });
  if (stranded.length === 0) return [];

  // Hydrate customer + auth.users for email.
  const { data: customers } = await supabase
    .from('customers')
    .select('id, unsubscribe_token, email_marketing_opt_out')
    .in('id', stranded);
  const customerById = new Map((customers ?? []).map((c: any) => [c.id, c]));

  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, email, name')
    .in('id', stranded);
  const profileById = new Map((profiles ?? []).map((p: any) => [p.id, p]));

  const candidates: Candidate[] = [];
  for (const uid of stranded) {
    const customer = customerById.get(uid);
    const profile = profileById.get(uid);
    if (!customer || customer.email_marketing_opt_out) continue;
    if (!profile?.email) continue;
    const event = latestByUser.get(uid);
    candidates.push({
      customer_id: uid,
      email: profile.email,
      name: profile.name ?? null,
      unsubscribe_token: customer.unsubscribe_token,
      trigger_key: event.event_id, // dedup ON the cart-add event
      template_data: {
        name: profile.name || 'there',
        item_name: event.properties?.item_name,
        truck_name: event.properties?.truck_name,
        truck_id: event.properties?.truck_id,
        return_link: event.properties?.truck_id
          ? `${siteUrl}/truck/${event.properties.truck_id}`
          : siteUrl,
      },
    });
  }
  return candidates;
}

async function findFirstReorderCandidates(supabase: any): Promise<Candidate[]> {
  // First (and only) order was placed exactly ~3 days ago.
  // We pick a 24h window so the cron at 16:00 UTC catches each user once.
  const windowStart = new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString();
  const windowEnd = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();

  const { data: orders, error } = await supabase
    .from('orders')
    .select('id, customer_id, created_at, truck_id')
    .gte('created_at', windowStart)
    .lt('created_at', windowEnd);
  if (error) throw error;
  if (!orders?.length) return [];

  // Filter to customers whose ONLY order is this one.
  const customerIds = orders.map((o: any) => o.customer_id);
  const { data: counts } = await supabase
    .from('orders')
    .select('customer_id', { count: 'exact', head: false })
    .in('customer_id', customerIds);

  const orderCount = new Map<string, number>();
  for (const r of (counts ?? [])) {
    orderCount.set(r.customer_id, (orderCount.get(r.customer_id) || 0) + 1);
  }
  const onlyOnce = orders.filter((o: any) => orderCount.get(o.customer_id) === 1);
  if (!onlyOnce.length) return [];

  const ids = onlyOnce.map((o: any) => o.customer_id);
  const { data: customers } = await supabase
    .from('customers')
    .select('id, unsubscribe_token, email_marketing_opt_out')
    .in('id', ids);
  const customerById = new Map((customers ?? []).map((c: any) => [c.id, c]));

  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, email, name')
    .in('id', ids);
  const profileById = new Map((profiles ?? []).map((p: any) => [p.id, p]));

  return onlyOnce.flatMap((order: any) => {
    const customer = customerById.get(order.customer_id);
    const profile = profileById.get(order.customer_id);
    if (!customer || customer.email_marketing_opt_out || !profile?.email) return [];
    return [{
      customer_id: order.customer_id,
      email: profile.email,
      name: profile.name ?? null,
      unsubscribe_token: customer.unsubscribe_token,
      trigger_key: order.id,
      template_data: {
        name: profile.name || 'there',
        return_link: siteUrl,
      },
    }];
  });
}

async function findWinBackCandidates(supabase: any): Promise<Candidate[]> {
  // Last order was 30+ days ago, customer has 2+ lifetime orders, and they
  // haven't been win-backed for THIS lapse already (trigger_key = year-week
  // of last order, so each lapse only triggers once per week-of-last-order).
  const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  // Aggregate per customer: last order date + total orders.
  const { data: orders, error } = await supabase
    .from('orders')
    .select('customer_id, created_at')
    .order('created_at', { ascending: false });
  if (error) throw error;
  if (!orders?.length) return [];

  const stats = new Map<string, { last: string; count: number }>();
  for (const o of orders) {
    const cur = stats.get(o.customer_id);
    if (!cur) {
      stats.set(o.customer_id, { last: o.created_at, count: 1 });
    } else {
      cur.count += 1;
    }
  }

  const lapsed = Array.from(stats.entries())
    .filter(([_, s]) => s.count >= 2 && new Date(s.last) < new Date(cutoff))
    .map(([customer_id, s]) => ({ customer_id, last: s.last, count: s.count }));

  if (!lapsed.length) return [];

  const ids = lapsed.map((l) => l.customer_id);
  const { data: customers } = await supabase
    .from('customers')
    .select('id, unsubscribe_token, email_marketing_opt_out')
    .in('id', ids);
  const customerById = new Map((customers ?? []).map((c: any) => [c.id, c]));

  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, email, name')
    .in('id', ids);
  const profileById = new Map((profiles ?? []).map((p: any) => [p.id, p]));

  const yearWeek = (iso: string) => {
    const d = new Date(iso);
    // ISO year-week, good enough for "lapse from this week"
    const onejan = new Date(d.getFullYear(), 0, 1);
    const week = Math.ceil(((d.getTime() - onejan.getTime()) / 86400000 + onejan.getDay() + 1) / 7);
    return `${d.getFullYear()}-W${week}`;
  };

  return lapsed.flatMap((l) => {
    const customer = customerById.get(l.customer_id);
    const profile = profileById.get(l.customer_id);
    if (!customer || customer.email_marketing_opt_out || !profile?.email) return [];
    return [{
      customer_id: l.customer_id,
      email: profile.email,
      name: profile.name ?? null,
      unsubscribe_token: customer.unsubscribe_token,
      trigger_key: yearWeek(l.last),
      template_data: {
        name: profile.name || 'there',
        last_order_at: l.last,
        return_link: siteUrl,
      },
    }];
  });
}

async function sendOne(
  supabase: any,
  flow: Flow,
  template: string,
  candidate: Candidate
): Promise<{ ok: boolean; reason?: string }> {
  // Idempotency check: ledger row exists?
  const { data: existing } = await supabase
    .from('marketing_email_send')
    .select('id')
    .eq('customer_id', candidate.customer_id)
    .eq('flow', flow)
    .eq('trigger_key', candidate.trigger_key)
    .maybeSingle();
  if (existing) return { ok: false, reason: 'already_sent' };

  const unsubscribe_link = candidate.unsubscribe_token
    ? `${siteUrl}/unsubscribe?token=${encodeURIComponent(candidate.unsubscribe_token)}`
    : `${siteUrl}/unsubscribe`;

  try {
    const res = await fetch(`${supabaseUrl}/functions/v1/resend-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseServiceKey}`,
      },
      body: JSON.stringify({
        to: candidate.email,
        template,
        data: {
          ...candidate.template_data,
          unsubscribe_link,
        },
      }),
    });
    if (!res.ok) {
      const errText = await res.text();
      await supabase.from('marketing_email_send').insert({
        customer_id: candidate.customer_id,
        flow,
        trigger_key: candidate.trigger_key,
        template_id: template,
        status: 'failed',
        error_message: errText.slice(0, 500),
      });
      return { ok: false, reason: 'send_failed' };
    }

    await supabase.from('marketing_email_send').insert({
      customer_id: candidate.customer_id,
      flow,
      trigger_key: candidate.trigger_key,
      template_id: template,
      status: 'sent',
    });
    return { ok: true };
  } catch (e) {
    await supabase.from('marketing_email_send').insert({
      customer_id: candidate.customer_id,
      flow,
      trigger_key: candidate.trigger_key,
      template_id: template,
      status: 'failed',
      error_message: String(e).slice(0, 500),
    });
    return { ok: false, reason: 'exception' };
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders(req) });
  }

  try {
    const { flow } = await req.json() as { flow: Flow };
    if (!['abandoned_cart', 'first_reorder', 'win_back'].includes(flow)) {
      throw new Error(`Unknown flow: ${flow}`);
    }
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const finder =
      flow === 'abandoned_cart' ? findAbandonedCartCandidates :
      flow === 'first_reorder' ? findFirstReorderCandidates :
      findWinBackCandidates;

    const candidates = await finder(supabase);
    const template = TEMPLATES[flow];

    const results = { sent: 0, skipped: 0, failed: 0 };
    for (const c of candidates) {
      const r = await sendOne(supabase, flow, template, c);
      if (r.ok) results.sent += 1;
      else if (r.reason === 'send_failed' || r.reason === 'exception') results.failed += 1;
      else results.skipped += 1;
    }

    return new Response(
      JSON.stringify({ flow, candidates: candidates.length, ...results }),
      { headers: { ...corsHeaders(req), 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('lifecycle-email-runner error:', err);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 400, headers: { ...corsHeaders(req), 'Content-Type': 'application/json' } }
    );
  }
});
