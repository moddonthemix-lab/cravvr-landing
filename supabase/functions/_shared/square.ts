// Shared Square helpers for edge functions.

export type SquareEnvironment = 'sandbox' | 'production';

export function squareBaseUrl(env: SquareEnvironment): string {
  return env === 'production'
    ? 'https://connect.squareup.com'
    : 'https://connect.squareupsandbox.com';
}

export function getSquareEnv(): SquareEnvironment {
  const v = (Deno.env.get('SQUARE_ENVIRONMENT') || 'sandbox').toLowerCase();
  return v === 'production' ? 'production' : 'sandbox';
}

export function getSquareAppId(): string {
  const id = Deno.env.get('SQUARE_APPLICATION_ID');
  if (!id) throw new Error('SQUARE_APPLICATION_ID not configured');
  return id;
}

export function getSquareAppSecret(): string {
  const s = Deno.env.get('SQUARE_APPLICATION_SECRET');
  if (!s) throw new Error('SQUARE_APPLICATION_SECRET not configured');
  return s;
}

// HMAC-SHA256 signed state for OAuth round-trips. Encodes payload + signature
// in a single base64url string so Square can hand it back unchanged.
function getStateSecret(): string {
  const s = Deno.env.get('SQUARE_OAUTH_STATE_SECRET') || Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!s) throw new Error('SQUARE_OAUTH_STATE_SECRET (or service role key fallback) not configured');
  return s;
}

function b64urlEncode(bytes: Uint8Array): string {
  let s = btoa(String.fromCharCode(...bytes));
  return s.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function b64urlDecode(s: string): Uint8Array {
  const pad = s.length % 4 === 0 ? '' : '='.repeat(4 - (s.length % 4));
  const std = (s + pad).replace(/-/g, '+').replace(/_/g, '/');
  const bin = atob(std);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

async function hmac(key: string, data: string): Promise<Uint8Array> {
  const k = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(key),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sig = await crypto.subtle.sign('HMAC', k, new TextEncoder().encode(data));
  return new Uint8Array(sig);
}

export interface OAuthState {
  truck_id: string;
  user_id: string;
  exp: number; // unix seconds
}

export async function signOAuthState(payload: OAuthState): Promise<string> {
  const json = JSON.stringify(payload);
  const body = b64urlEncode(new TextEncoder().encode(json));
  const sig = await hmac(getStateSecret(), body);
  return `${body}.${b64urlEncode(sig)}`;
}

export async function verifyOAuthState(state: string): Promise<OAuthState> {
  const [body, sig] = state.split('.');
  if (!body || !sig) throw new Error('Malformed state');
  const expected = b64urlEncode(await hmac(getStateSecret(), body));
  if (expected !== sig) throw new Error('Invalid state signature');
  const payload = JSON.parse(new TextDecoder().decode(b64urlDecode(body))) as OAuthState;
  if (payload.exp < Math.floor(Date.now() / 1000)) throw new Error('State expired');
  return payload;
}

// Token exchange against Square's OAuth endpoint
export async function exchangeOAuthCode(code: string, env: SquareEnvironment, redirectUri: string): Promise<{
  access_token: string;
  refresh_token: string;
  expires_at: string; // ISO
  merchant_id: string;
}> {
  const resp = await fetch(`${squareBaseUrl(env)}/oauth2/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Square-Version': '2024-12-18',
    },
    body: JSON.stringify({
      client_id: getSquareAppId(),
      client_secret: getSquareAppSecret(),
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
    }),
  });
  if (!resp.ok) {
    const txt = await resp.text();
    throw new Error(`Square OAuth token exchange failed: ${resp.status} ${txt}`);
  }
  const data = await resp.json();
  return {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_at: data.expires_at,
    merchant_id: data.merchant_id,
  };
}

// One-shot Square Catalog fetch — used during OAuth callback to populate a
// truck's menu from their existing Square POS catalog. Returns every priced
// ITEM the merchant has, plus a lookup of IMAGE objects so we can resolve
// image_ids → URLs in a single paginated walk. Items without prices (gift
// cards, "custom amount") are filtered out by the caller.
export interface SquareCatalogItem {
  id: string;
  is_deleted?: boolean;
  item_data?: {
    name?: string;
    description?: string;
    image_ids?: string[];
    variations?: Array<{
      item_variation_data?: {
        price_money?: { amount?: number; currency?: string };
      };
    }>;
  };
}

export interface SquareCatalogImage {
  id: string;
  image_data?: { url?: string };
}

export async function fetchCatalogItems(
  accessToken: string,
  env: SquareEnvironment,
): Promise<{ items: SquareCatalogItem[]; imagesById: Record<string, SquareCatalogImage> }> {
  const items: SquareCatalogItem[] = [];
  const imagesById: Record<string, SquareCatalogImage> = {};

  let cursor: string | undefined;
  do {
    const url = new URL(`${squareBaseUrl(env)}/v2/catalog/list`);
    url.searchParams.set('types', 'ITEM,IMAGE');
    if (cursor) url.searchParams.set('cursor', cursor);

    const resp = await fetch(url.toString(), {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Square-Version': '2024-12-18',
      },
    });
    if (!resp.ok) {
      const txt = await resp.text();
      throw new Error(`Square Catalog list failed: ${resp.status} ${txt}`);
    }
    const data = await resp.json();
    for (const obj of data.objects || []) {
      if (obj.type === 'ITEM') items.push(obj);
      else if (obj.type === 'IMAGE') imagesById[obj.id] = obj;
    }
    cursor = data.cursor;
  } while (cursor);

  return { items, imagesById };
}

// Pick the merchant's default location to receive payments
export async function fetchPrimaryLocation(accessToken: string, env: SquareEnvironment): Promise<string | null> {
  const resp = await fetch(`${squareBaseUrl(env)}/v2/locations`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Square-Version': '2024-12-18',
    },
  });
  if (!resp.ok) return null;
  const data = await resp.json();
  const locations = data.locations || [];
  // Prefer 'ACTIVE' status, then any location
  const active = locations.find((l: any) => l.status === 'ACTIVE') || locations[0];
  return active?.id || null;
}
