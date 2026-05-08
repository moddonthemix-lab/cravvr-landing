// Cross-origin headers, environment-driven.
//
// Set `ALLOWED_ORIGINS` (comma-separated) on the Supabase Edge Functions env
// to override the default. Defaults include the production app, common dev
// origins, and Vercel preview deploys.
//
//   supabase secrets set ALLOWED_ORIGINS="https://cravvr.com,https://www.cravvr.com,https://app.cravvr.com"
//
// If the request Origin matches the allowlist (exact match, or `*.vercel.app`
// preview pattern), we echo it. If it doesn't, we fall back to the first
// allowed origin — that produces a CORS error in the browser, which is what
// we want for unknown callers.

const DEFAULT_ALLOWED = [
  'https://cravvr.com',
  'https://www.cravvr.com',
  'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
];

function getAllowedOrigins(): string[] {
  const env = (typeof Deno !== 'undefined' && Deno.env.get('ALLOWED_ORIGINS')) || '';
  const list = env
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  return list.length ? list : DEFAULT_ALLOWED;
}

function isVercelPreview(origin: string): boolean {
  // https://<deploy>-<project>.vercel.app — common Vercel preview pattern.
  try {
    const u = new URL(origin);
    return u.protocol === 'https:' && u.hostname.endsWith('.vercel.app');
  } catch {
    return false;
  }
}

function pickOrigin(req: Request): string {
  const allowed = getAllowedOrigins();
  const origin = req.headers.get('origin') || '';
  if (origin && (allowed.includes(origin) || isVercelPreview(origin))) {
    return origin;
  }
  // Unknown origin: return the first allowed origin so the browser sees a
  // proper mismatch and blocks the request.
  return allowed[0];
}

export function corsHeaders(req: Request): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': pickOrigin(req),
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Vary': 'Origin',
  };
}
