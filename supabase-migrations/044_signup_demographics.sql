-- 044_signup_demographics.sql
-- Add basic demographic fields collected at signup for both customers and
-- owners, plus an owner-only "preferred POS" capture.
--
-- All fields are NULLable — the consolidated user-creation trigger from 043
-- inserts a profile row with just (id, role, email, name); these new columns
-- get populated either at signup-time (frontend writes them) or later via
-- profile edit. Idempotent.

-- ─────────────────────────────────────────────────────────────────────────────
-- profiles: shared demographics
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS age INTEGER,
  ADD COLUMN IF NOT EXISTS gender TEXT,
  ADD COLUMN IF NOT EXISTS city TEXT,
  ADD COLUMN IF NOT EXISTS state TEXT;

ALTER TABLE profiles
  DROP CONSTRAINT IF EXISTS profiles_age_check;
ALTER TABLE profiles
  ADD CONSTRAINT profiles_age_check
  CHECK (age IS NULL OR (age >= 13 AND age <= 120));

ALTER TABLE profiles
  DROP CONSTRAINT IF EXISTS profiles_gender_check;
ALTER TABLE profiles
  ADD CONSTRAINT profiles_gender_check
  CHECK (gender IS NULL OR gender IN (
    'female', 'male', 'non-binary', 'prefer-not-to-say', 'other'
  ));

-- US state abbreviation (no full names) — keeps city/state queryable.
ALTER TABLE profiles
  DROP CONSTRAINT IF EXISTS profiles_state_check;
ALTER TABLE profiles
  ADD CONSTRAINT profiles_state_check
  CHECK (state IS NULL OR length(state) = 2);

-- ─────────────────────────────────────────────────────────────────────────────
-- profiles: owner-only "preferred POS" intent (NOT the same as a truck's
-- payment_processor — this is just what the owner *said* at signup, captured
-- before they have any trucks).
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS preferred_processor TEXT;

ALTER TABLE profiles
  DROP CONSTRAINT IF EXISTS profiles_preferred_processor_check;
ALTER TABLE profiles
  ADD CONSTRAINT profiles_preferred_processor_check
  CHECK (preferred_processor IS NULL OR preferred_processor IN (
    'stripe', 'square', 'clover', 'other', 'none'
  ));

-- ─────────────────────────────────────────────────────────────────────────────
-- RLS: rely on existing profiles policies (users read/update their own row).
-- No additional grants needed — these are just new columns on an
-- already-policied table.
-- ─────────────────────────────────────────────────────────────────────────────
