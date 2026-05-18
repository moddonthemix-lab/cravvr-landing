// supabase/functions/admin-delete-user/index.ts
//
// Admin deletes a user "for real": removes them from Clerk (source of truth),
// which then fires `user.deleted` to the clerk-webhook function, which
// cascades the Supabase profile/customer/owner/admin row deletes.
//
// Why this exists: the previous admin UI did `supabase.from('profiles').delete()`,
// which only removed the row in our DB. The Clerk user persisted, so on next
// sign-in the clerk-webhook upserted the profile back. To users it looked
// like "delete didn't work".
//
// Required secrets:
//   CLERK_SECRET_KEY           — Clerk Backend API key (sk_live_… or sk_test_…)
//   SUPABASE_URL               — auto-injected
//   SUPABASE_SERVICE_ROLE_KEY  — auto-injected
//
// CORS + Clerk-JWT verification are inlined (not from _shared/) so the file
// can be deployed via the Supabase Dashboard, which doesn't bundle siblings.

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { jwtVerify, createRemoteJWKSet } from 'https://esm.sh/jose@5.9.6';

const CLERK_SECRET_KEY = Deno.env.get('CLERK_SECRET_KEY')!;
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const CLERK_FRONTEND_API =
  Deno.env.get('CLERK_FRONTEND_API') || 'https://clerk.cravvr.com';

const JWKS = createRemoteJWKSet(
  new URL(`${CLERK_FRONTEND_API}/.well-known/jwks.json`),
);

const DEFAULT_ALLOWED = [
  'https://cravvr.com',
  'https://www.cravvr.com',
  'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
];

function pickOrigin(req: Request): string {
  const env = Deno.env.get('ALLOWED_ORIGINS') || '';
  const allowed = env
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  const list = allowed.length ? allowed : DEFAULT_ALLOWED;
  const origin = req.headers.get('origin') || '';
  if (origin && (list.includes(origin) || isVercelPreview(origin))) {
    return origin;
  }
  return list[0];
}

function isVercelPreview(origin: string): boolean {
  try {
    const u = new URL(origin);
    return u.protocol === 'https:' && u.hostname.endsWith('.vercel.app');
  } catch {
    return false;
  }
}

function corsHeaders(req: Request): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': pickOrigin(req),
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    Vary: 'Origin',
  };
}

async function requireClerkUser(req: Request): Promise<string> {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) throw new Error('Unauthorized: missing Authorization header');
  const token = authHeader.replace(/^Bearer\s+/i, '').trim();
  if (!token) throw new Error('Unauthorized: empty bearer token');
  try {
    const { payload } = await jwtVerify(token, JWKS);
    if (!payload.sub || typeof payload.sub !== 'string') {
      throw new Error('Unauthorized: JWT has no sub claim');
    }
    return payload.sub;
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    throw new Error(`Unauthorized: ${msg}`);
  }
}

serve(async (req) => {
  const cors = corsHeaders(req);
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });

  try {
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'POST required' }), {
        status: 405,
        headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }

    const callerId = await requireClerkUser(req);
    const { user_id: targetId } = await req.json();
    if (!targetId || typeof targetId !== 'string') {
      throw new Error('user_id (string) required');
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { data: caller, error: callerError } = await supabase
      .from('profiles')
      .select('id, role')
      .eq('id', callerId)
      .single();
    if (callerError || !caller) throw new Error('caller profile not found');
    if (caller.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'admin role required' }), {
        status: 403,
        headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }

    if (targetId === callerId) {
      throw new Error('cannot delete yourself');
    }

    const clerkRes = await fetch(`https://api.clerk.com/v1/users/${targetId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${CLERK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    if (!clerkRes.ok && clerkRes.status !== 404) {
      const body = await clerkRes.text();
      throw new Error(`Clerk delete failed (${clerkRes.status}): ${body}`);
    }

    // Belt-and-suspenders: also delete the profile row directly in case the
    // clerk-webhook is slow or misconfigured. ON DELETE CASCADE handles the
    // child tables (customers/owners/admins).
    await supabase.from('profiles').delete().eq('id', targetId);

    return new Response(JSON.stringify({ ok: true, deleted: targetId }), {
      status: 200,
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    const isAuth = msg.startsWith('Unauthorized');
    return new Response(JSON.stringify({ error: msg }), {
      status: isAuth ? 401 : 400,
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  }
});
