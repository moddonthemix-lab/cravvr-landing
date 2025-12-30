// Supabase client configuration
const SUPABASE_URL = 'https://coqwihsmmigktgqdnmis.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_7VpR41Naa_w7yp8v_SK-_A_vELGCMML';

// Create Supabase client
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Export for use in other files
window.supabaseClient = supabase;
