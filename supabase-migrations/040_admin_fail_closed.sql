-- 040_admin_fail_closed.sql
-- Flip the has_admin_permission() backstop from "fail-open superadmin" to
-- "fail-closed deny."
--
-- Background: 037_admin_permissions.sql shipped a deliberate backstop so
-- existing admins kept working without an `admins` row. That backstop —
-- "missing row or empty permissions JSONB → return TRUE" — is a fail-open
-- default. A misconfigured admin (added to profiles.role='admin' without an
-- accompanying admins row, or whose permissions blob got cleared) silently
-- gets superadmin access.
--
-- This migration:
--   1. Backfills every profile.role='admin' user with an `admins` row that
--      has the explicit '["*"]' superadmin permission. Prior behavior is
--      preserved for everyone who was already implicitly a superadmin.
--   2. Replaces has_admin_permission() so missing/empty permissions now
--      deny instead of grant. New admins MUST get an explicit permissions
--      blob, full stop.
--
-- Safe to re-run.

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. Backfill missing or empty admin rows.
-- ─────────────────────────────────────────────────────────────────────────────

INSERT INTO admins (id, permissions, created_at)
SELECT p.id, '["*"]'::jsonb, NOW()
FROM profiles p
WHERE p.role = 'admin'
  AND NOT EXISTS (SELECT 1 FROM admins a WHERE a.id = p.id);

UPDATE admins
SET permissions = '["*"]'::jsonb
WHERE permissions IS NULL
   OR permissions = '{}'::jsonb
   OR permissions = '[]'::jsonb;

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. Replace the helper to fail closed.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION has_admin_permission(p_perm TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_perms JSONB;
BEGIN
  IF NOT is_admin() THEN
    RETURN false;
  END IF;
  SELECT permissions INTO v_perms FROM admins WHERE id = auth.uid();
  -- Fail-closed: no admins row, or NULL/empty permissions → deny.
  -- The backfill above ensures legitimate admins already have '["*"]'.
  IF v_perms IS NULL OR v_perms = '{}'::jsonb OR v_perms = '[]'::jsonb THEN
    RETURN false;
  END IF;
  IF jsonb_typeof(v_perms) = 'array' THEN
    RETURN v_perms ? '*' OR v_perms ? p_perm;
  END IF;
  IF jsonb_typeof(v_perms) = 'object' THEN
    IF v_perms ? 'permissions' AND jsonb_typeof(v_perms->'permissions') = 'array' THEN
      RETURN (v_perms->'permissions') ? '*' OR (v_perms->'permissions') ? p_perm;
    END IF;
    RETURN COALESCE((v_perms ? '*'), false)
        OR COALESCE((v_perms->>p_perm)::boolean, false);
  END IF;
  RETURN false;
END;
$$;
