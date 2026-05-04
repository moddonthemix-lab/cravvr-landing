-- ⚠️ DEPRECATED — DO NOT RUN.
-- This script disables RLS on food_trucks and was only ever meant for early
-- local dev. Running it in any shared environment is a security regression.
--
-- If you need to re-enable RLS, run:
--   supabase-migrations/025_restore_rls_pre_alpha.sql

DO $$
BEGIN
  RAISE EXCEPTION 'disable-rls-for-testing.sql is deprecated. Run supabase-migrations/025_restore_rls_pre_alpha.sql instead.';
END $$;
