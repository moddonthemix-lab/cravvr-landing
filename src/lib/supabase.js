import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase env vars. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env.local (see .env.example).'
  );
}

// Hand the supabase client a function that returns the current Clerk session
// token. Supabase's Third-Party Auth integration accepts the Clerk JWT as-is.
// window.Clerk is populated by <ClerkProvider> at app boot; until then this
// returns null and supabase falls back to the anon key (fine for public reads).
async function clerkAccessToken() {
  if (typeof window === 'undefined') return null;
  try {
    return (await window.Clerk?.session?.getToken()) ?? null;
  } catch {
    return null;
  }
}

/**
 * Returns the bearer token to use when calling Supabase Edge Functions —
 * Clerk's session JWT if signed in, anon key as fallback for unauthenticated
 * callers. Use this anywhere you'd have previously called
 * `(await supabase.auth.getSession()).data.session.access_token`.
 *
 * Note: `supabase.auth.getSession()` throws once `accessToken` is configured
 * on the client (Supabase JS guard), so callers must use this helper.
 */
export async function getSupabaseBearer() {
  const token = await clerkAccessToken();
  return token ?? supabaseAnonKey;
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  accessToken: clerkAccessToken,
});

export default supabase;
