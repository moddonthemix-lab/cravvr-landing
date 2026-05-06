-- 031_fix_unsubscribe_token_search_path.sql
-- Fixes signup failure ("Database error saving new user").
--
-- assign_unsubscribe_token() (from migration 024) called unqualified
-- gen_random_bytes(), but pgcrypto is installed in the `extensions` schema.
-- Without a search_path that includes `extensions`, the function failed,
-- which cascaded up the trigger chain:
--   auth.users INSERT
--     → handle_new_user() → INSERT profiles
--       → handle_new_profile() → INSERT customers
--         → assign_unsubscribe_token() BEFORE INSERT → ERROR 42883
-- and surfaced to the client as a 500 from /auth/v1/signup.
--
-- Fix: qualify the call as extensions.gen_random_bytes() and pin search_path.
-- Safe to re-run.

CREATE OR REPLACE FUNCTION public.assign_unsubscribe_token()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, extensions
AS $$
BEGIN
  IF NEW.unsubscribe_token IS NULL THEN
    NEW.unsubscribe_token := encode(extensions.gen_random_bytes(24), 'base64');
  END IF;
  RETURN NEW;
END;
$$;
