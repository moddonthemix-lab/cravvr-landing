/**
 * Thin wrapper around @microsoft/clarity so calls are safe before the SDK
 * loads and silent when VITE_CLARITY_PROJECT_ID is not set.
 *
 * Tags show up as filter facets in Clarity's dashboard ("show me sessions
 * where city=portland") — use them liberally for any dimension you'd want
 * to slice replays by. Events are flagged moments inside a session
 * (form submitted, button clicked) for funnel analysis.
 */

let clarityPromise = null;

function getClarity() {
  if (!import.meta.env.VITE_CLARITY_PROJECT_ID) return Promise.resolve(null);
  if (!clarityPromise) {
    clarityPromise = import('@microsoft/clarity').then((m) => m.default).catch(() => null);
  }
  return clarityPromise;
}

export async function setTag(key, value) {
  if (value == null || value === '') return;
  const c = await getClarity();
  c?.setTag(String(key), String(value));
}

export async function setTags(map) {
  const c = await getClarity();
  if (!c) return;
  for (const [k, v] of Object.entries(map || {})) {
    if (v == null || v === '') continue;
    c.setTag(String(k), String(v));
  }
}

export async function event(name) {
  const c = await getClarity();
  c?.event(name);
}

export async function identify(customId, customSessionId, customPageId, friendlyName) {
  const c = await getClarity();
  c?.identify(customId, customSessionId, customPageId, friendlyName);
}

export async function consent(granted = true) {
  const c = await getClarity();
  c?.consent(granted);
}

export async function upgrade(reason) {
  const c = await getClarity();
  c?.upgrade(reason);
}
