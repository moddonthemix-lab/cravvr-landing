// supabase/functions/_shared/capi.ts
//
// Server-side Conversions API dispatcher. Fans a single conversion event out
// to Meta CAPI, Google Measurement Protocol (GA4), and TikTok Events API with
// hashed advanced-matching identifiers and a shared `event_id` so each platform
// deduplicates against its browser-pixel hit.
//
// All calls are fire-and-forget — callers (webhooks / lead intake) must stay
// fast, so failures are logged but never thrown.
//
// Env (set via `supabase secrets set ...`); each integration no-ops if missing:
//   META_CAPI_PIXEL_ID, META_CAPI_ACCESS_TOKEN
//   GOOGLE_MEASUREMENT_PROTOCOL_API_SECRET, VITE_GA4_MEASUREMENT_ID (or GA4_MEASUREMENT_ID)
//   TIKTOK_EVENTS_API_TOKEN, TIKTOK_PIXEL_CODE

const META_PIXEL_ID = Deno.env.get('META_CAPI_PIXEL_ID');
const META_TOKEN = Deno.env.get('META_CAPI_ACCESS_TOKEN');
const GA4_ID = Deno.env.get('VITE_GA4_MEASUREMENT_ID') || Deno.env.get('GA4_MEASUREMENT_ID');
const GA4_API_SECRET = Deno.env.get('GOOGLE_MEASUREMENT_PROTOCOL_API_SECRET');
const TIKTOK_TOKEN = Deno.env.get('TIKTOK_EVENTS_API_TOKEN');
const TIKTOK_PIXEL_CODE = Deno.env.get('TIKTOK_PIXEL_CODE');

// Canonical (Meta) event name -> platform-specific event names.
const GA4_EVENT_MAP: Record<string, string> = { Lead: 'generate_lead', Purchase: 'purchase' };
const TIKTOK_EVENT_MAP: Record<string, string> = { Lead: 'SubmitForm', Purchase: 'CompletePayment' };

/** SHA-256 hex of a normalized (trim + lowercase) value — for PII matching. */
export async function sha256(input: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(input.trim().toLowerCase()));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

/** Digits-only phone with country code, no '+', as the ad platforms expect before hashing. */
function phoneDigits(p?: string | null): string | undefined {
  if (!p) return undefined;
  const digits = p.replace(/\D/g, '');
  if (!digits) return undefined;
  if (digits.length === 10) return `1${digits}`;
  return digits;
}

export interface ServerConversion {
  /** Canonical Meta event name, e.g. 'Lead' | 'Purchase'. */
  eventName: string;
  /** Shared dedup id — MUST equal the browser pixel's eventID for this hit. */
  eventId: string;
  value?: number;            // major units (dollars)
  currency?: string;
  email?: string | null;
  phone?: string | null;
  /** Click id from the ad platform (fbclid / ttclid). */
  clickId?: string | null;
  clickPlatform?: string | null;   // 'meta' | 'tiktok' | 'google'
  eventSourceUrl?: string | null;
  eventTimeMs?: number;            // defaults to now
  ga4ClientId?: string | null;
  customData?: Record<string, unknown>;
  /**
   * Which platforms to dispatch to (default: all). Turn GA4 off for events
   * that GA4 can't dedupe against the browser hit (e.g. Lead) to avoid
   * double-counting with the gtag generate_lead.
   */
  platforms?: { meta?: boolean; ga4?: boolean; tiktok?: boolean };
}

async function dispatchMeta(c: ServerConversion): Promise<void> {
  if (!META_PIXEL_ID || !META_TOKEN) return;
  try {
    const userData: Record<string, unknown> = {};
    if (c.email) userData.em = [await sha256(c.email)];
    const ph = phoneDigits(c.phone);
    if (ph) userData.ph = [await sha256(ph)];
    if (c.clickPlatform === 'meta' && c.clickId) {
      userData.fbc = `fb.1.${c.eventTimeMs ?? Date.now()}.${c.clickId}`;
    }

    const customData: Record<string, unknown> = { ...(c.customData || {}) };
    if (typeof c.value === 'number') {
      customData.value = c.value;
      customData.currency = c.currency || 'USD';
    }

    const res = await fetch(
      `https://graph.facebook.com/v18.0/${META_PIXEL_ID}/events?access_token=${META_TOKEN}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data: [{
            event_name: c.eventName,
            event_time: Math.floor((c.eventTimeMs ?? Date.now()) / 1000),
            event_id: c.eventId,
            action_source: 'website',
            event_source_url: c.eventSourceUrl || undefined,
            user_data: userData,
            custom_data: customData,
          }],
        }),
      },
    );
    if (!res.ok) console.warn('[capi] Meta non-2xx:', res.status, await res.text().catch(() => ''));
  } catch (e) { console.warn('[capi] Meta error:', e); }
}

async function dispatchGA4(c: ServerConversion): Promise<void> {
  if (!GA4_ID || !GA4_API_SECRET || !c.ga4ClientId) return;
  try {
    const params: Record<string, unknown> = { transaction_id: c.eventId };
    if (typeof c.value === 'number') {
      params.value = c.value;
      params.currency = c.currency || 'USD';
    }
    const res = await fetch(
      `https://www.google-analytics.com/mp/collect?measurement_id=${GA4_ID}&api_secret=${GA4_API_SECRET}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: c.ga4ClientId,
          events: [{ name: GA4_EVENT_MAP[c.eventName] || c.eventName, params }],
        }),
      },
    );
    if (!res.ok) console.warn('[capi] GA4 non-2xx:', res.status, await res.text().catch(() => ''));
  } catch (e) { console.warn('[capi] GA4 error:', e); }
}

async function dispatchTikTok(c: ServerConversion): Promise<void> {
  if (!TIKTOK_TOKEN || !TIKTOK_PIXEL_CODE) return;
  try {
    const user: Record<string, unknown> = {};
    if (c.email) user.email = await sha256(c.email);
    const ph = phoneDigits(c.phone);
    if (ph) user.phone = await sha256(ph);
    if (c.clickPlatform === 'tiktok' && c.clickId) user.ttclid = c.clickId;

    const properties: Record<string, unknown> = { ...(c.customData || {}) };
    if (typeof c.value === 'number') {
      properties.value = c.value;
      properties.currency = c.currency || 'USD';
    }

    const data: Record<string, unknown> = {
      event: TIKTOK_EVENT_MAP[c.eventName] || c.eventName,
      event_time: Math.floor((c.eventTimeMs ?? Date.now()) / 1000),
      event_id: c.eventId,
      user,
      properties,
    };
    if (c.eventSourceUrl) data.page = { url: c.eventSourceUrl };

    const res = await fetch('https://business-api.tiktok.com/open_api/v1.3/event/track/', {
      method: 'POST',
      headers: { 'Access-Token': TIKTOK_TOKEN, 'Content-Type': 'application/json' },
      body: JSON.stringify({ event_source: 'web', event_source_id: TIKTOK_PIXEL_CODE, data: [data] }),
    });
    if (!res.ok) console.warn('[capi] TikTok non-2xx:', res.status, await res.text().catch(() => ''));
  } catch (e) { console.warn('[capi] TikTok error:', e); }
}

/** Fan a conversion out to all enabled ad platforms. Fire-and-forget. */
export async function dispatchServerConversion(c: ServerConversion): Promise<void> {
  const p = c.platforms || {};
  await Promise.allSettled([
    p.meta !== false ? dispatchMeta(c) : Promise.resolve(),
    p.ga4 !== false ? dispatchGA4(c) : Promise.resolve(),
    p.tiktok !== false ? dispatchTikTok(c) : Promise.resolve(),
  ]);
}
