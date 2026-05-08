-- 038_square_processor.sql
-- Add multi-processor support to food_trucks and payments.
--
-- Cravvr's billing model:
--   * Cravvr → Stripe Subscription  (truck owners pay Cravvr a membership)
--   * Customer → Truck             (uses whichever POS the truck owner has connected)
--
-- Supported truck-side processors:
--   * 'stripe' (existing)            — Stripe Connect destination charges
--   * 'square' (this migration)      — Square OAuth, payments flow direct to merchant
--   * 'clover' (later)               — same model as Square
--   * 'pickup' (no online payment)   — falls back to "pay at pickup"
--
-- Idempotent.

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. food_trucks: which processor + Square credentials
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE food_trucks
  ADD COLUMN IF NOT EXISTS payment_processor TEXT
  DEFAULT 'pickup'
  CHECK (payment_processor IN ('pickup', 'stripe', 'square', 'clover'));

-- Backfill: trucks with Stripe already onboarded → 'stripe'; everyone else → 'pickup'
UPDATE food_trucks
SET payment_processor = 'stripe'
WHERE stripe_charges_enabled = true
  AND stripe_account_id IS NOT NULL
  AND payment_processor = 'pickup';

-- Square OAuth-issued credentials. access_token is the merchant's token used to
-- charge on their behalf; refresh_token rotates it. Treat both as secrets.
ALTER TABLE food_trucks
  ADD COLUMN IF NOT EXISTS square_merchant_id TEXT,
  ADD COLUMN IF NOT EXISTS square_location_id TEXT,
  ADD COLUMN IF NOT EXISTS square_access_token TEXT,
  ADD COLUMN IF NOT EXISTS square_refresh_token TEXT,
  ADD COLUMN IF NOT EXISTS square_token_expires_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS square_charges_enabled BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS square_environment TEXT
    DEFAULT 'sandbox'
    CHECK (square_environment IN ('sandbox', 'production'));

-- Convenience: a single boolean the frontend can read regardless of processor.
-- Generated column so it stays in sync without app-side bookkeeping.
ALTER TABLE food_trucks
  DROP COLUMN IF EXISTS online_payment_enabled;
ALTER TABLE food_trucks
  ADD COLUMN online_payment_enabled BOOLEAN
  GENERATED ALWAYS AS (
    (payment_processor = 'stripe'  AND COALESCE(stripe_charges_enabled, false))
    OR (payment_processor = 'square'  AND COALESCE(square_charges_enabled, false))
    -- Clover added later; default false for now
  ) STORED;

CREATE INDEX IF NOT EXISTS idx_food_trucks_processor ON food_trucks(payment_processor);

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. payments: tag rows with processor and Square IDs
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE payments
  ADD COLUMN IF NOT EXISTS processor TEXT
  DEFAULT 'stripe'
  CHECK (processor IN ('stripe', 'square', 'clover'));

ALTER TABLE payments
  ADD COLUMN IF NOT EXISTS square_payment_id TEXT,
  ADD COLUMN IF NOT EXISTS square_order_id TEXT,
  ADD COLUMN IF NOT EXISTS square_refund_id TEXT;

-- stripe_payment_intent_id existed already; make sure index is there
CREATE INDEX IF NOT EXISTS idx_payments_processor ON payments(processor);
CREATE INDEX IF NOT EXISTS idx_payments_square_payment_id
  ON payments(square_payment_id)
  WHERE square_payment_id IS NOT NULL;

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. orders: store payment_processor used for this order
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS payment_processor TEXT
  CHECK (payment_processor IS NULL OR payment_processor IN ('pickup', 'stripe', 'square', 'clover'));

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. RLS — owners must NOT read raw Square tokens through public APIs.
--    The columns are only readable via service_role (edge functions).
--    food_trucks_public_read policy already restricts non-owner reads, but to
--    be defensive we also revoke select on the token columns from anon/auth
--    roles using a column grant model.
-- ─────────────────────────────────────────────────────────────────────────────

REVOKE SELECT (square_access_token, square_refresh_token) ON food_trucks FROM anon, authenticated;

-- Owners and admins can still read their own truck's basic Square fields
-- (merchant_id, location_id, charges_enabled, environment) via the existing
-- food_trucks_owner_* / food_trucks_admin_all policies — those are not secrets.
