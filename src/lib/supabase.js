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

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  accessToken: clerkAccessToken,
});

export default supabase;
