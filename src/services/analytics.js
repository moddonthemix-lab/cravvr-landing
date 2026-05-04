/**
 * Analytics service — Phase 1 of the full-funnel attribution system.
 *
 * Responsibilities:
 *  - Initialize a persistent visitor_id (localStorage) and per-tab session_id.
 *  - Capture and freeze first-touch UTMs on a brand-new visitor.
 *  - Fire fire-and-forget events to the analytics-collect edge function,
 *    and (when loaded) mirror them to the Meta / GA4 / TikTok browser pixels.
 *  - Stitch visitor → auth user on signup/login via identify().
 */

import { supabase } from '../lib/supabase';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
const INIT_FN = `${SUPABASE_URL}/functions/v1/analytics-init`;
const COLLECT_FN = `${SUPABASE_URL}/functions/v1/analytics-collect`;

const VISITOR_KEY = 'cravvr_visitor_id';
const SESSION_KEY = 'cravvr_session_id';
const LAST_UTM_KEY = 'cravvr_last_utm';

// Module-level state, populated by initVisitor()
let visitorId = null;
let sessionId = null;
let currentUserId = null;

// ---- helpers ---------------------------------------------------------------

function uuid() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function readUTMsFromUrl() {
  if (typeof window === 'undefined') return null;
  const params = new URLSearchParams(window.location.search);
  const utm = {
    source: params.get('utm_source') || undefined,
    medium: params.get('utm_medium') || undefined,
    campaign: params.get('utm_campaign') || undefined,
    content: params.get('utm_content') || undefined,
    term: params.get('utm_term') || undefined,
  };
  const fbclid = params.get('fbclid');
  const gclid = params.get('gclid');
  const ttclid = params.get('ttclid');
  const click_id = fbclid || gclid || ttclid || null;
  let click_platform = null;
  if (fbclid) click_platform = 'meta';
  else if (gclid) click_platform = 'google';
  else if (ttclid) click_platform = 'tiktok';

  const hasAnyUtm = Object.values(utm).some(Boolean) || click_id;
  if (!hasAnyUtm) return null;

  return { utm, click_id, click_platform };
}

function persistLastUtm(payload) {
  try {
    sessionStorage.setItem(LAST_UTM_KEY, JSON.stringify(payload));
  } catch {
    /* sessionStorage may be unavailable */
  }
}

function readLastUtm() {
  try {
    const raw = sessionStorage.getItem(LAST_UTM_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function inferReferrerPlatform(referrer) {
  if (!referrer) return 'direct';
  try {
    const host = new URL(referrer).hostname;
    if (/facebook|instagram|fb\./.test(host)) return 'meta';
    if (/google\./.test(host)) return 'google';
    if (/tiktok/.test(host)) return 'tiktok';
    return 'referral';
  } catch {
    return 'referral';
  }
}

async function postJson(url, body) {
  return fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'apikey': SUPABASE_ANON_KEY,
    },
    body: JSON.stringify(body),
    keepalive: true, // survive page unload (begin_checkout → external redirect, etc.)
  });
}

// ---- pixel mirroring -------------------------------------------------------

const PIXEL_EVENT_MAP = {
  page_view: { fb: 'PageView', ga: 'page_view', tt: 'Pageview' },
  view_truck: { fb: 'ViewContent', ga: 'view_item', tt: 'ViewContent' },
  add_to_cart: { fb: 'AddToCart', ga: 'add_to_cart', tt: 'AddToCart' },
  begin_checkout: { fb: 'InitiateCheckout', ga: 'begin_checkout', tt: 'InitiateCheckout' },
  signup: { fb: 'CompleteRegistration', ga: 'sign_up', tt: 'CompleteRegistration' },
  purchase: { fb: 'Purchase', ga: 'purchase', tt: 'CompletePayment' },
};

function mirrorToPixels(eventName, properties, eventId) {
  const mapping = PIXEL_EVENT_MAP[eventName];
  if (!mapping || typeof window === 'undefined') return;

  // Meta Pixel
  if (typeof window.fbq === 'function') {
    try {
      window.fbq('track', mapping.fb, properties || {}, { eventID: eventId });
    } catch (e) { console.warn('fbq error', e); }
  }
  // GA4 (gtag)
  if (typeof window.gtag === 'function') {
    try {
      window.gtag('event', mapping.ga, { ...(properties || {}), event_id: eventId });
    } catch (e) { console.warn('gtag error', e); }
  }
  // TikTok Pixel
  if (typeof window.ttq?.track === 'function') {
    try {
      window.ttq.track(mapping.tt, { ...(properties || {}), event_id: eventId });
    } catch (e) { console.warn('ttq error', e); }
  }
}

// ---- public API ------------------------------------------------------------

export async function initVisitor() {
  if (typeof window === 'undefined') return null;

  // Session id is per-tab.
  sessionId = sessionStorage.getItem(SESSION_KEY);
  if (!sessionId) {
    sessionId = uuid();
    sessionStorage.setItem(SESSION_KEY, sessionId);
  }

  visitorId = localStorage.getItem(VISITOR_KEY);

  const utmFromUrl = readUTMsFromUrl();
  if (utmFromUrl) persistLastUtm(utmFromUrl);

  const referrer = document.referrer || null;
  const click_platform =
    utmFromUrl?.click_platform || (utmFromUrl?.utm?.source ? null : inferReferrerPlatform(referrer));

  try {
    const res = await postJson(INIT_FN, {
      visitor_id: visitorId,
      url: window.location.href,
      path: window.location.pathname,
      referrer,
      user_agent: navigator.userAgent,
      utm: utmFromUrl?.utm,
      click_id: utmFromUrl?.click_id ?? null,
      click_platform,
    });
    if (res.ok) {
      const data = await res.json();
      visitorId = data.visitor_id;
      localStorage.setItem(VISITOR_KEY, visitorId);
    }
  } catch (e) {
    console.warn('analytics initVisitor failed:', e);
  }

  return visitorId;
}

export function setCurrentUser(userId) {
  currentUserId = userId || null;
}

export async function identify(userId) {
  if (!userId || !visitorId) return;
  setCurrentUser(userId);
  try {
    await postJson(COLLECT_FN, {
      identify: { visitor_id: visitorId, user_id: userId },
    });
  } catch (e) {
    console.warn('analytics identify failed:', e);
  }
}

export function track(eventName, properties = {}) {
  if (typeof window === 'undefined' || !visitorId || !sessionId) return;

  const eventId = uuid();
  const lastUtm = readLastUtm();

  const event = {
    event_id: eventId,
    event_name: eventName,
    occurred_at: new Date().toISOString(),
    visitor_id: visitorId,
    user_id: currentUserId,
    session_id: sessionId,
    url: window.location.href,
    path: window.location.pathname,
    referrer: document.referrer || null,
    utm: lastUtm?.utm,
    click_id: lastUtm?.click_id ?? null,
    properties,
  };

  // Fire-and-forget — never block UI on analytics.
  postJson(COLLECT_FN, { event }).catch((e) =>
    console.warn(`analytics track(${eventName}) failed:`, e)
  );

  mirrorToPixels(eventName, properties, eventId);

  return eventId;
}

export function getVisitorId() { return visitorId; }
export function getSessionId() { return sessionId; }
