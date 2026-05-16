import { track, getVisitorId } from './analytics';
import { readUTMs } from '../lib/utm';
import { identify as clarityIdentify } from '../lib/clarity';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
const ENDPOINT = `${SUPABASE_URL}/functions/v1/truck-lead`;

const LAST_UTM_KEY = 'cravvr_last_utm';

function getStoredUtms() {
  try {
    const raw = sessionStorage.getItem(LAST_UTM_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/**
 * Submit a truck operator lead. Posts to the truck-lead edge function which
 * (1) inserts into truck_leads, (2) notifies Slack, (3) fires Klaviyo event.
 * Returns { ok, id?, error? }.
 *
 * Also fires `truck_lead_submit` through our analytics layer, which mirrors
 * to Meta Pixel (`Lead`), GA4 (`generate_lead`), and TikTok.
 */
export async function submitTruckLead(input) {
  const liveUtms = readUTMs();
  const stored = getStoredUtms();
  const utm = stored?.utm || {};
  const clickId = stored?.click_id || liveUtms.fbclid || liveUtms.gclid || liveUtms.ttclid || null;
  const clickPlatform = stored?.click_platform
    || (liveUtms.fbclid ? 'meta' : liveUtms.gclid ? 'google' : liveUtms.ttclid ? 'tiktok' : null);

  const payload = {
    name: input.name,
    truck_name: input.truckName || null,
    phone: input.phone,
    email: input.email || null,
    cuisine: input.cuisine || null,
    city: input.city,
    best_time: input.bestTime || null,
    notes: input.notes || null,

    utm_source: liveUtms.utm_source || utm.source || null,
    utm_medium: liveUtms.utm_medium || utm.medium || null,
    utm_campaign: liveUtms.utm_campaign || utm.campaign || null,
    utm_content: liveUtms.utm_content || utm.content || null,
    utm_term: liveUtms.utm_term || utm.term || null,
    click_id: clickId,
    click_platform: clickPlatform,
    referrer: typeof document !== 'undefined' ? document.referrer : null,
    landing_url: typeof window !== 'undefined' ? window.location.href : null,
    visitor_id: getVisitorId(),
  };

  let resJson = null;
  try {
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'apikey': SUPABASE_ANON_KEY,
      },
      body: JSON.stringify(payload),
    });
    resJson = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { ok: false, error: resJson.error || `http_${res.status}` };
    }
  } catch (err) {
    return { ok: false, error: 'network_error', detail: String(err) };
  }

  // Mirror to pixels / GA4 via existing analytics layer
  try {
    track('truck_lead_submit', {
      city: input.city,
      cuisine: input.cuisine,
      truck_name: input.truckName,
      lead_id: resJson?.id,
    });
    // Explicit Meta Lead event for CAPI/standard event matching
    if (typeof window !== 'undefined' && window.fbq) {
      window.fbq('track', 'Lead', { content_category: 'truck_operator', city: input.city });
    }
    if (resJson?.id) {
      clarityIdentify(`lead:${resJson.id}`, undefined, undefined, input.truckName || input.name);
    }
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'generate_lead', {
        currency: 'USD',
        value: 50,
        city: input.city,
      });
    }
  } catch (err) {
    console.warn('lead pixel mirror failed', err);
  }

  return { ok: true, id: resJson?.id };
}
