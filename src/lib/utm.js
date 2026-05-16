/**
 * UTM helpers — read inbound UTMs from the URL and build outbound URLs
 * with consistent UTM params. Pair with src/services/analytics.js which
 * handles first-touch persistence and visitor stitching.
 */

export const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'];
export const CLICK_ID_KEYS = ['fbclid', 'gclid', 'ttclid'];

export function readUTMs(search = typeof window !== 'undefined' ? window.location.search : '') {
  const params = new URLSearchParams(search);
  const out = {};
  for (const k of UTM_KEYS) {
    const v = params.get(k);
    if (v) out[k] = v;
  }
  for (const k of CLICK_ID_KEYS) {
    const v = params.get(k);
    if (v) out[k] = v;
  }
  return out;
}

export function buildUrl(base, params = {}) {
  const url = new URL(base, typeof window !== 'undefined' ? window.location.origin : 'https://cravvr.com');
  for (const [k, v] of Object.entries(params)) {
    if (v == null || v === '') continue;
    url.searchParams.set(k, v);
  }
  return url.toString();
}

/**
 * Compose a tracked URL for an outbound link.
 *
 *   trackedUrl('/for-trucks/portland', {
 *     source: 'meta',
 *     medium: 'paid_social',
 *     campaign: 'm1-truck-onboard',
 *     content: 'creative_a1',
 *     term: 'lookalike_owners',
 *   })
 */
export function trackedUrl(path, { source, medium, campaign, content, term } = {}) {
  return buildUrl(path, {
    utm_source: source,
    utm_medium: medium,
    utm_campaign: campaign,
    utm_content: content,
    utm_term: term,
  });
}
