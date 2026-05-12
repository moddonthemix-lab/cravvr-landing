// Verify the incoming Authorization: Bearer <clerk-jwt> on edge functions
// that have `verify_jwt = false` in supabase/config.toml.
//
// Supabase's platform JWT gate only validates Supabase-issued tokens — it
// doesn't honor Third-Party Auth for edge functions. So functions called
// from a Clerk-authenticated browser have to (a) opt out of the gate by
// setting verify_jwt=false, and (b) verify the Clerk JWT themselves.
//
// We verify against Clerk's JWKS (public keys, no secret needed).
//
// Optional env var override: set CLERK_FRONTEND_API on the function if your
// Clerk instance lives somewhere other than https://clerk.cravvr.com.

import { jwtVerify, createRemoteJWKSet } from 'https://esm.sh/jose@5.9.6';

const CLERK_FRONTEND_API =
  Deno.env.get('CLERK_FRONTEND_API') || 'https://clerk.cravvr.com';

const JWKS = createRemoteJWKSet(
  new URL(`${CLERK_FRONTEND_API}/.well-known/jwks.json`)
);

/**
 * Returns the Clerk user ID (`sub` claim) for the authenticated request.
 * Throws if the token is missing, invalid, or expired.
 */
export async function requireClerkUser(req: Request): Promise<string> {
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
