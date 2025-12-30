// Supabase client initialization for production
// This file is served directly from the public folder

(function() {
  // Wait for Supabase library to load
  if (typeof window.supabase === 'undefined') {
    console.error('Supabase library not loaded yet');
    return;
  }

  const SUPABASE_URL = 'https://coqwihsmmigktgqdnmis.supabase.co';
  const SUPABASE_ANON_KEY = 'sb_publishable_7VpR41Naa_w7yp8v_SK-_A_vELGCMML';

  // Create Supabase client
  const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  // Export for use in other files
  window.supabaseClient = supabaseClient;

  console.log('✅ Supabase client initialized');
})();
