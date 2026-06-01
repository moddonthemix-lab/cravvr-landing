// supabase/functions/_shared/meta-capi.ts
//
// Canonical Meta Conversions API (CAPI) helper. One place that knows how to
// hash user data and POST a server-side conversion to the Graph API, so every
// edge function (truck-lead, analytics-server-event, clerk-webhook) dedupes
// the same way against the browser Pixel.
//
// Dedup contract: the caller passes an `eventId` that MATCHES the `eventID`
// the browser Pixel sent for the same conversion. Meta collapses the pair.
//
// Required env (set via `supabase secrets set ...`):
//   META_CAPI_PIXEL_ID       — same numeric id as VITE_META_PIXEL_ID
//   META_CAPI_ACCESS_TOKEN   — system-user token from Events Manager
// Optional:
//   META_CAPI_TEST_EVENT_CODE — route to Events Manager → Test Events
//
// No-op (returns ok) when the pixel id or token is missing, matching the
// repo convention that analytics integrations are inert without their env.

const GRAPH_VERSION = 'v19.0';

const PIXEL_ID = Deno.env.get('META_CAPI_PIXEL_ID');
const ACCESS_TOKEN = Deno.env.get('META_CAPI_ACCESS_TOKEN');
const ENV_TEST_CODE = Deno.env.get('META_CAPI_TEST_EVENT_CODE') || undefined;

// ---- normalization + hashing ----------------------------------------------

/** SHA-256 hex of a string. Returns undefined for empty input. */
export async function hashSha256(input?: string | null): Promise<string | undefined> {
  if (!input) return undefined;
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(input));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

/** Email: trim + lowercase before hashing. */
export function normalizeEmail(email?: string | null): string | undefined {
  if (!email) return undefined;
  const e = email.trim().toLowerCase();
  return e || undefined;
}

/**
 * Phone for Meta: digits only with country code, NO leading `+`
 * (e.g. `15551234567`). Note this differs from Klaviyo's `+1...` format, so we
 * deliberately don't reuse normalizePhone() verbatim.
 */
export function normalizePhoneForMeta(phone?: string | null): string | undefined {
  if (!phone) return undefined;
  let digits = phone.replace(/\D/g, '');
  if (!digits) return undefined;
  if (digits.length === 10) digits = `1${digits}`; // assume US/CA if bare 10-digit
  return digits;
}

/**
 * fbc: prefer the raw `_fbc` cookie. Otherwise derive from fbclid as
 * `fb.1.{ms}.{fbclid}` per Meta's spec.
 */
export function deriveFbc(
  fbclid?: string | null,
  rawFbcCookie?: string | null,
  ts: number = Date.now()
): string | undefined {
  if (rawFbcCookie) return rawFbcCookie;
  if (fbclid) return `fb.1.${ts}.${fbclid}`;
  return undefined;
}

// ---- user_data block -------------------------------------------------------

export interface MetaUserDataInput {
  email?: string | null;
  phone?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  city?: string | null;
  fbclid?: string | null;
  fbcCookie?: string | null; // raw _fbc cookie if present
  fbpCookie?: string | null; // raw _fbp cookie if present
  clientIp?: string | null;
  userAgent?: string | null;
  externalId?: string | null; // e.g. visitor_id — hashed
}

/** Build Meta's `user_data` object. Hashed fields are arrays of hex strings. */
export async function buildUserData(input: MetaUserDataInput): Promise<Record<string, unknown>> {
  const ud: Record<string, unknown> = {};

  const em = await hashSha256(normalizeEmail(input.email));
  if (em) ud.em = [em];

  const ph = await hashSha256(normalizePhoneForMeta(input.phone));
  if (ph) ud.ph = [ph];

  const fn = await hashSha256(input.firstName?.trim().toLowerCase());
  if (fn) ud.fn = [fn];

  const ln = await hashSha256(input.lastName?.trim().toLowerCase());
  if (ln) ud.ln = [ln];

  const ct = await hashSha256(input.city?.trim().toLowerCase().replace(/[^a-z]/g, ''));
  if (ct) ud.ct = [ct];

  const ext = await hashSha256(input.externalId);
  if (ext) ud.external_id = [ext];

  const fbc = deriveFbc(input.fbclid, input.fbcCookie);
  if (fbc) ud.fbc = fbc; // never hashed
  if (input.fbpCookie) ud.fbp = input.fbpCookie; // never hashed

  if (input.clientIp) ud.client_ip_address = input.clientIp;
  if (input.userAgent) ud.client_user_agent = input.userAgent;

  return ud;
}

// ---- send ------------------------------------------------------------------

export interface MetaCapiEvent {
  eventName: string;        // 'Lead' | 'Purchase' | 'CompleteRegistration' ...
  eventId: string;          // MUST match the browser Pixel eventID for dedup
  eventTime?: number;       // unix seconds; defaults to now
  eventSourceUrl?: string | null;
  actionSource?: string;    // defaults 'website'
  userData: MetaUserDataInput;
  customData?: Record<string, unknown>;
  testEventCode?: string | null;
}

export interface MetaCapiResult {
  ok: boolean;
  status: number;
  body?: string;
}

/** POST a single server event to the Graph API. Never throws. */
export async function sendMetaCapiEvent(ev: MetaCapiEvent): Promise<MetaCapiResult> {
  if (!PIXEL_ID || !ACCESS_TOKEN) {
    // Inert without env — same convention as the other analytics integrations.
    return { ok: true, status: 0 };
  }

  try {
    const userData = await buildUserData(ev.userData);
    const body: Record<string, unknown> = {
      data: [{
        event_name: ev.eventName,
        event_time: ev.eventTime ?? Math.floor(Date.now() / 1000),
        event_id: ev.eventId,
        action_source: ev.actionSource ?? 'website',
        ...(ev.eventSourceUrl ? { event_source_url: ev.eventSourceUrl } : {}),
        user_data: userData,
        ...(ev.customData ? { custom_data: ev.customData } : {}),
      }],
    };

    const testCode = ev.testEventCode ?? ENV_TEST_CODE;
    if (testCode) body.test_event_code = testCode;

    const res = await fetch(
      `https://graph.facebook.com/${GRAPH_VERSION}/${PIXEL_ID}/events?access_token=${ACCESS_TOKEN}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }
    );

    if (!res.ok) {
      const text = await res.text();
      console.warn('Meta CAPI non-2xx:', text);
      return { ok: false, status: res.status, body: text };
    }
    return { ok: true, status: res.status };
  } catch (e) {
    console.warn('Meta CAPI error:', e);
    return { ok: false, status: 0, body: String(e) };
  }
}

/** Pull the client IP from proxy headers (Supabase edge populates these). */
export function clientIpFromHeaders(req: Request): string | null {
  const xff = req.headers.get('x-forwarded-for');
  if (xff) return xff.split(',')[0].trim();
  return req.headers.get('x-real-ip');
}
