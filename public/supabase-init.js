// Supabase client initialization for production
// This file is served directly from the public folder

(function() {
  // Wait for Supabase library to load
  if (typeof window.supabase === 'undefined') {
    console.error('Supabase library not loaded yet');
    return;
  }

  const SUPABASE_URL = 'https://coqwihsmmigktqqdnmis.supabase.co';
  const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNvcXdpaHNtbWlna3RxcWRubWlzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcwNTg1NTMsImV4cCI6MjA4MjYzNDU1M30.ybwwLZguj58PGzCuM-gCdMoUjGHLh2zmkZihy6_zEx8';

  // Create Supabase client
  const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  // Export for use in other files
  window.supabaseClient = supabaseClient;

  console.log('✅ Supabase client initialized');
})();
