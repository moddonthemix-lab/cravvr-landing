// Supabase client initialization for production
// This file is served directly from the public folder

(function() {
  const SUPABASE_URL = 'https://coqwihsmmigktqqdnmis.supabase.co';
  const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNvcXdpaHNtbWlna3RxcWRubWlzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcwNTg1NTMsImV4cCI6MjA4MjYzNDU1M30.ybwwLZguj58PGzCuM-gCdMoUjGHLh2zmkZihy6_zEx8';

  function initializeSupabase() {
    // Check if Supabase library is loaded
    if (typeof window.supabase === 'undefined') {
      console.warn('⏳ Waiting for Supabase library to load...');
      // Retry after a short delay
      setTimeout(initializeSupabase, 100);
      return;
    }

    try {
      // Create Supabase client
      const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

      // Export for use in other files
      window.supabaseClient = supabaseClient;

      console.log('✅ Supabase client initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize Supabase client:', error);
    }
  }

  // Start initialization
  initializeSupabase();
})();
