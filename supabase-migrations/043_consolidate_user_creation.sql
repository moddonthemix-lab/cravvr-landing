-- 043_consolidate_user_creation.sql
-- Single source of truth for new-user provisioning.
--
-- Background — the user-creation path was rewritten across migrations
-- 002 → 003 → 011 → 019 → 020. Net result of "last writer wins":
--   * `handle_new_user` (auth.users INSERT) — installed by 019. Creates
--     profile + customers (if role='customer') + owners (if role='owner').
--     **Does NOT create admins row** for role='admin' (003 had it; 011 and
--     019 dropped that branch).
--   * `handle_new_profile` (profiles INSERT) — installed by 020. Creates
--     customers (always) and owners (if role='owner'). Fires *after* the
--     auth-side trigger, so for a customer signup the customers row gets
--     INSERT-attempted twice (mitigated by ON CONFLICT but wasteful).
--
-- Concrete bugs this fixes:
--   1. Admin signups don't get an `admins` row, breaking has_admin_permission.
--   2. Owner signups attempt double inserts (clean noise; harmless).
--
-- This migration:
--   1. Drops both prior triggers and both functions.
--   2. Backfills any user currently missing their role-specific row.
--   3. Installs a single `handle_new_user` on auth.users covering all four
--      roles (customer, owner, admin) consistently. Every user gets a
--      customers row (a 020-era invariant — favorites/rewards rely on it).
--      Admins also get an admins row with the explicit '["*"]' permission
--      that 040_admin_fail_closed expects.
--
-- After this migration the only signup-side trigger is
-- `on_auth_user_created` on auth.users.
--
-- Idempotent.

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. Drop prior triggers + functions.
-- ─────────────────────────────────────────────────────────────────────────────

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS trigger_handle_new_profile ON profiles;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_profile() CASCADE;

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. Backfill missing rows for users created during the broken state.
-- ─────────────────────────────────────────────────────────────────────────────

-- Every profile gets a customers row (matches 020's invariant).
INSERT INTO customers (id)
SELECT p.id FROM profiles p
WHERE NOT EXISTS (SELECT 1 FROM customers c WHERE c.id = p.id)
ON CONFLICT (id) DO NOTHING;

-- Owner profiles need an owners row.
INSERT INTO owners (id)
SELECT p.id FROM profiles p
WHERE p.role = 'owner'
  AND NOT EXISTS (SELECT 1 FROM owners o WHERE o.id = p.id)
ON CONFLICT (id) DO NOTHING;

-- Admin profiles need an admins row with explicit superadmin permission.
-- 040_admin_fail_closed already handles this, but repeat for safety in case
-- a 043-only deploy precedes 040 in some environment.
INSERT INTO admins (id, permissions)
SELECT p.id, '["*"]'::jsonb FROM profiles p
WHERE p.role = 'admin'
  AND NOT EXISTS (SELECT 1 FROM admins a WHERE a.id = p.id)
ON CONFLICT (id) DO NOTHING;

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. Single canonical signup trigger.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role TEXT := COALESCE(NEW.raw_user_meta_data->>'role', 'customer');
  v_name TEXT := COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1));
BEGIN
  IF v_role NOT IN ('customer', 'owner', 'admin') THEN
    v_role := 'customer';
  END IF;

  -- profile (one row per user)
  INSERT INTO profiles (id, email, name, role, created_at, updated_at)
  VALUES (NEW.id, NEW.email, v_name, v_role, NOW(), NOW())
  ON CONFLICT (id) DO NOTHING;

  -- customers (every user gets one — favorites/rewards depend on it)
  INSERT INTO customers (id, created_at)
  VALUES (NEW.id, NOW())
  ON CONFLICT (id) DO NOTHING;

  -- role-specific rows
  IF v_role = 'owner' THEN
    INSERT INTO owners (id, created_at)
    VALUES (NEW.id, NOW())
    ON CONFLICT (id) DO NOTHING;
  ELSIF v_role = 'admin' THEN
    INSERT INTO admins (id, permissions, created_at)
    VALUES (NEW.id, '["*"]'::jsonb, NOW())
    ON CONFLICT (id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
