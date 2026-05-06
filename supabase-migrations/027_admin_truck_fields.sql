-- 027_admin_truck_fields.sql
-- Adds admin-controlled lifecycle fields to food_trucks (verified, suspended_at,
-- suspension_reason, deleted_at) and a hidden_at column to reviews so admins
-- can hide review content without deleting it.
-- Safe to re-run.

-- ─────────────────────────────────────────────────────────────────────────────
-- food_trucks: admin-controlled fields
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE food_trucks
  ADD COLUMN IF NOT EXISTS featured BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS verified BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS suspended_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS suspension_reason TEXT,
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- Index used by public reads (after migration 030)
CREATE INDEX IF NOT EXISTS idx_food_trucks_active
  ON food_trucks (id)
  WHERE deleted_at IS NULL AND suspended_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_food_trucks_featured
  ON food_trucks (featured)
  WHERE featured = true AND deleted_at IS NULL;

-- ─────────────────────────────────────────────────────────────────────────────
-- reviews: hidden_at flag (admin moderation)
-- ─────────────────────────────────────────────────────────────────────────────
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'reviews') THEN
    EXECUTE 'ALTER TABLE reviews ADD COLUMN IF NOT EXISTS hidden_at TIMESTAMPTZ';
    EXECUTE 'ALTER TABLE reviews ADD COLUMN IF NOT EXISTS hidden_reason TEXT';
  END IF;
END $$;
