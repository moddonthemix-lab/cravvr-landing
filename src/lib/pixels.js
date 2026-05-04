/**
 * Browser-side pixel loaders. Each function is a no-op unless the
 * corresponding env var is set, so this safely runs in dev without
 * polluting any real analytics property.
 *
 * Pixels are loaded as inline scripts at runtime rather than baked
 * into index.html so they respect Vite env vars and can be cleanly
 * disabled per-environment.
 */

let loaded = false;

export function loadPixels() {
  if (loaded || typeof window === 'undefined') return;
  loaded = true;

  loadMetaPixel(import.meta.env.VITE_META_PIXEL_ID);
  loadGA4(import.meta.env.VITE_GA4_MEASUREMENT_ID);
  loadTikTokPixel(import.meta.env.VITE_TIKTOK_PIXEL_ID);
}

function loadMetaPixel(pixelId) {
  if (!pixelId) return;
  /* eslint-disable */
  !function (f, b, e, v, n, t, s) {
    if (f.fbq) return; n = f.fbq = function () {
      n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
    };
    if (!f._fbq) f._fbq = n; n.push = n; n.loaded = !0; n.version = '2.0';
    n.queue = []; t = b.createElement(e); t.async = !0;
    t.src = v; s = b.getElementsByTagName(e)[0]; s.parentNode.insertBefore(t, s);
  }(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');
  window.fbq('init', pixelId);
  // PageView fires automatically — analytics.js's mirrorToPixels handles
  // subsequent route-change page_views as fbq('track', 'PageView') via
  // the page_view event.
  /* eslint-enable */
}

function loadGA4(measurementId) {
  if (!measurementId) return;
  const s = document.createElement('script');
  s.async = true;
  s.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
  document.head.appendChild(s);

  window.dataLayer = window.dataLayer || [];
  window.gtag = function () { window.dataLayer.push(arguments); };
  window.gtag('js', new Date());
  // send_page_view: false — we'll fire page_view ourselves through analytics.js
  // so we control the event_id and dedup with the server.
  window.gtag('config', measurementId, { send_page_view: false });
}

function loadTikTokPixel(pixelId) {
  if (!pixelId) return;
  /* eslint-disable */
  !function (w, d, t) {
    w.TiktokAnalyticsObject = t; var ttq = w[t] = w[t] || [];
    ttq.methods = ['page', 'track', 'identify', 'instances', 'debug', 'on', 'off', 'once', 'ready', 'alias', 'group', 'enableCookie', 'disableCookie'];
    ttq.setAndDefer = function (t, e) { t[e] = function () { t.push([e].concat(Array.prototype.slice.call(arguments, 0))); }; };
    for (var i = 0; i < ttq.methods.length; i++) ttq.setAndDefer(ttq, ttq.methods[i]);
    ttq.instance = function (t) {
      for (var e = ttq._i[t] || [], n = 0; n < ttq.methods.length; n++) ttq.setAndDefer(e, ttq.methods[n]); return e;
    };
    ttq.load = function (e, n) {
      var i = 'https://analytics.tiktok.com/i18n/pixel/events.js';
      ttq._i = ttq._i || {}; ttq._i[e] = []; ttq._i[e]._u = i;
      ttq._t = ttq._t || {}; ttq._t[e] = +new Date(); ttq._o = ttq._o || {}; ttq._o[e] = n || {};
      var o = document.createElement('script'); o.type = 'text/javascript'; o.async = !0;
      o.src = i + '?sdkid=' + e + '&lib=' + t;
      var a = document.getElementsByTagName('script')[0]; a.parentNode.insertBefore(o, a);
    };
    ttq.load(pixelId);
  }(window, document, 'ttq');
  /* eslint-enable */
}
