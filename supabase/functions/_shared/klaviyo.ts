// supabase/functions/_shared/klaviyo.ts
//
// Shared helpers for pushing data to Klaviyo from edge functions.
// All calls are fire-and-forget — webhook handlers must ack quickly to
// the upstream provider (Clerk, Stripe, Square), so errors are logged
// but never thrown back to the caller.
//
// Required env (set via `supabase secrets set ...`):
//   KLAVIYO_API_KEY=pk_...
// Optional:
//   KLAVIYO_LEADS_LIST_ID=ABCDEF      (truck operator lead list)
//   KLAVIYO_EATERS_LIST_ID=XttfF8     (eaters welcome list — Flow C trigger)

const KEY = Deno.env.get('KLAVIYO_API_KEY') || '';
const EATERS_LIST_ID = Deno.env.get('KLAVIYO_EATERS_LIST_ID') || '';

const BASE = 'https://a.klaviyo.com/api';
const REVISION = '2024-10-15';

function headers(): Record<string, string> {
  return {
    'Authorization': `Klaviyo-API-Key ${KEY}`,
    'Content-Type': 'application/json',
    'accept': 'application/json',
    'revision': REVISION,
  };
}

function enabled(): boolean {
  if (!KEY) {
    console.warn('[klaviyo] KLAVIYO_API_KEY not set — skipping push');
    return false;
  }
  return true;
}

export function normalizePhone(p?: string | null): string | undefined {
  if (!p) return undefined;
  const digits = p.replace(/\D/g, '');
  if (!digits) return undefined;
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`;
  return `+${digits}`;
}

interface ProfileAttrs {
  email?: string;
  phone?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  external_id?: string;
  properties?: Record<string, unknown>;
}

/**
 * Upsert a Klaviyo profile. Returns the Klaviyo profile id, or null on
 * failure. Handles 409 (duplicate) by extracting the existing id.
 */
export async function upsertProfile(attrs: ProfileAttrs): Promise<string | null> {
  if (!enabled()) return null;

  const body = {
    data: {
      type: 'profile',
      attributes: {
        email: attrs.email,
        phone_number: normalizePhone(attrs.phone),
        first_name: attrs.first_name || undefined,
        last_name: attrs.last_name || undefined,
        external_id: attrs.external_id,
        properties: attrs.properties || undefined,
      },
    },
  };

  try {
    const res = await fetch(`${BASE}/profiles/`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify(body),
    });
    if (res.ok || res.status === 409) {
      const json = await res.json().catch(() => null);
      const id = json?.data?.id || json?.errors?.[0]?.meta?.duplicate_profile_id;
      return id || null;
    }
    console.error('[klaviyo] upsertProfile failed', res.status, await res.text().catch(() => ''));
    return null;
  } catch (err) {
    console.error('[klaviyo] upsertProfile error', err);
    return null;
  }
}

/** Subscribe a profile id to a list. */
export async function subscribeToList(profileId: string, listId: string): Promise<void> {
  if (!enabled()) return;
  if (!profileId || !listId) {
    console.warn(`[klaviyo] subscribeToList skipped — missing ${!profileId ? 'profileId' : 'listId'} (check KLAVIYO_*_LIST_ID secrets)`);
    return;
  }
  try {
    const res = await fetch(`${BASE}/lists/${listId}/relationships/profiles/`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({ data: [{ type: 'profile', id: profileId }] }),
    });
    if (!res.ok && res.status !== 202 && res.status !== 204) {
      console.error(`[klaviyo] subscribeToList(${listId}) failed`, res.status, await res.text().catch(() => ''));
    }
  } catch (err) {
    console.error('[klaviyo] subscribeToList error', err);
  }
}

interface FireEventOpts {
  metric: string;
  email?: string;
  phone?: string | null;
  external_id?: string;
  first_name?: string | null;
  properties?: Record<string, unknown>;
  /** Klaviyo dedup key — set to the order_id / lead_id to make replay safe */
  unique_id?: string;
  /** Optional revenue value for the event (used by Placed Order etc.) */
  value?: number;
}

/**
 * Fire a metric event to Klaviyo. Klaviyo will auto-create the profile
 * if needed. Use `unique_id` for dedup when retrying (e.g. webhook replay).
 */
export async function fireEvent(opts: FireEventOpts): Promise<void> {
  if (!enabled()) return;
  if (!opts.email && !opts.phone && !opts.external_id) {
    console.warn('[klaviyo] fireEvent skipped — no identifier');
    return;
  }

  const body = {
    data: {
      type: 'event',
      attributes: {
        unique_id: opts.unique_id || undefined,
        properties: opts.properties || {},
        value: opts.value,
        metric: {
          data: {
            type: 'metric',
            attributes: { name: opts.metric },
          },
        },
        profile: {
          data: {
            type: 'profile',
            attributes: {
              email: opts.email,
              phone_number: normalizePhone(opts.phone),
              external_id: opts.external_id,
              first_name: opts.first_name || undefined,
            },
          },
        },
      },
    },
  };

  try {
    const res = await fetch(`${BASE}/events/`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify(body),
    });
    if (!res.ok && res.status !== 202) {
      console.error(`[klaviyo] fireEvent(${opts.metric}) failed`, res.status, await res.text().catch(() => ''));
    }
  } catch (err) {
    console.error(`[klaviyo] fireEvent(${opts.metric}) error`, err);
  }
}

/**
 * Convenience: look up order + customer + truck from Supabase, then fire
 * `Placed Order` to Klaviyo and stamp `last_ordered_at` on the profile.
 * The `last_ordered_at` write powers Flow D (win-back segment recency).
 * Called by stripe-webhook and square-webhook on successful payment.
 */
// deno-lint-ignore no-explicit-any
export async function firePlacedOrder(supabase: any, orderId: string): Promise<void> {
  if (!enabled()) return;
  const { data: order } = await supabase
    .from('orders')
    .select('id, customer_id, truck_id, total, created_at')
    .eq('id', orderId)
    .maybeSingle();
  if (!order) return;

  const [{ data: profile }, { data: truck }] = await Promise.all([
    supabase.from('profiles').select('email, name').eq('id', order.customer_id).maybeSingle(),
    order.truck_id
      ? supabase.from('food_trucks').select('name, slug').eq('id', order.truck_id).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  if (!profile?.email) return;

  const totalDollars = typeof order.total === 'number' ? order.total : Number(order.total) || 0;
  const firstName = profile?.name?.split(' ')[0];

  await Promise.allSettled([
    fireEvent({
      metric: 'Placed Order',
      email: profile.email,
      external_id: order.customer_id,
      first_name: firstName,
      unique_id: `order:${order.id}`,
      value: totalDollars,
      properties: {
        order_id: order.id,
        truck_name: truck?.name,
        truck_slug: truck?.slug,
        total: totalDollars,
      },
    }),
    upsertProfile({
      email: profile.email,
      external_id: order.customer_id,
      first_name: firstName,
      properties: {
        last_ordered_at: order.created_at,
      },
    }),
  ]);
}

/**
 * Convenience: subscribe a new customer to the Eaters welcome list AND
 * upsert their profile in one call. Used by clerk-webhook on user.created.
 */
export async function subscribeNewEater(attrs: ProfileAttrs): Promise<void> {
  if (!enabled()) return;
  const id = await upsertProfile({
    ...attrs,
    properties: {
      ...(attrs.properties || {}),
      lead_type: 'eater',
      first_seen_at: new Date().toISOString(),
    },
  });
  if (id && EATERS_LIST_ID) {
    await subscribeToList(id, EATERS_LIST_ID);
  }
}
