-- 042_cravvr_plus.sql
-- Cravvr Plus: SaaS subscription billing for truck owners.
--
-- Cravvr is the merchant. Owners pay Cravvr via Stripe Subscriptions.
-- An active Cravvr Plus subscription unlocks online customer checkout
-- (Stripe Connect, Square, Clover-soon). Free tier = Pay-at-Pickup only.
--
-- This migration is idempotent.

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. cravvr_plans — reference table for the tiers we offer
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS cravvr_plans (
  code TEXT PRIMARY KEY,                  -- 'free', 'plus'
  name TEXT NOT NULL,
  price_cents INTEGER NOT NULL DEFAULT 0,
  interval TEXT NOT NULL DEFAULT 'month' CHECK (interval IN ('month', 'year')),
  stripe_price_id TEXT,                   -- set later by admin once Stripe Product created
  features JSONB NOT NULL DEFAULT '{}',
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE cravvr_plans ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "cravvr_plans_public_read" ON cravvr_plans;
CREATE POLICY "cravvr_plans_public_read" ON cravvr_plans FOR SELECT USING (is_active);

-- Seed the two starter tiers. stripe_price_id is filled in later by admin.
INSERT INTO cravvr_plans (code, name, price_cents, interval, features, display_order)
VALUES
  ('free', 'Free',         0,    'month',
    jsonb_build_object(
      'online_checkout', false,
      'analytics',       false,
      'max_trucks',       1,
      'tagline',          'Pay-at-Pickup only — no card processing'
    ),
    0),
  ('plus', 'Cravvr Plus',  2900, 'month',
    jsonb_build_object(
      'online_checkout', true,
      'analytics',       true,
      'max_trucks',       null,
      'tagline',          'Accept card payments via Stripe / Square / Clover'
    ),
    1)
ON CONFLICT (code) DO UPDATE SET
  name          = EXCLUDED.name,
  price_cents   = EXCLUDED.price_cents,
  interval      = EXCLUDED.interval,
  features      = EXCLUDED.features,
  display_order = EXCLUDED.display_order,
  updated_at    = NOW();

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. cravvr_subscriptions — one row per owner profile
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS cravvr_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  plan_code TEXT NOT NULL REFERENCES cravvr_plans(code),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN (
    'trialing', 'active', 'past_due', 'unpaid', 'canceled', 'incomplete', 'incomplete_expired', 'paused'
  )),
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT false,
  trial_end TIMESTAMPTZ,
  canceled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (owner_id)
);

CREATE INDEX IF NOT EXISTS idx_cravvr_subs_owner ON cravvr_subscriptions(owner_id);
CREATE INDEX IF NOT EXISTS idx_cravvr_subs_stripe_customer ON cravvr_subscriptions(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_cravvr_subs_stripe_subscription ON cravvr_subscriptions(stripe_subscription_id);

ALTER TABLE cravvr_subscriptions ENABLE ROW LEVEL SECURITY;

-- Owners read their own subscription
DROP POLICY IF EXISTS "cravvr_subs_owner_read" ON cravvr_subscriptions;
CREATE POLICY "cravvr_subs_owner_read" ON cravvr_subscriptions
  FOR SELECT USING (auth.uid() = owner_id);

-- Admins read all
DROP POLICY IF EXISTS "cravvr_subs_admin_read" ON cravvr_subscriptions;
CREATE POLICY "cravvr_subs_admin_read" ON cravvr_subscriptions
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Writes go through edge functions (service_role bypasses RLS) — no
-- policy needed for INSERT/UPDATE.

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. Helper: does this owner have an entitlement to online checkout?
--    Truthy when subscription is active OR trialing on a plan that has
--    features.online_checkout = true. Used by edge functions to gate
--    payment processor onboarding.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION has_active_plus(p_owner_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
AS $$
  SELECT COALESCE(
    (
      SELECT (p.features->>'online_checkout')::boolean
      FROM cravvr_subscriptions s
      JOIN cravvr_plans p ON p.code = s.plan_code
      WHERE s.owner_id = p_owner_id
        AND s.status IN ('active', 'trialing')
    ),
    false
  );
$$;

GRANT EXECUTE ON FUNCTION has_active_plus(UUID) TO anon, authenticated;

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. updated_at trigger
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION cravvr_set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END $$;

DROP TRIGGER IF EXISTS trg_cravvr_subs_updated_at ON cravvr_subscriptions;
CREATE TRIGGER trg_cravvr_subs_updated_at BEFORE UPDATE ON cravvr_subscriptions
  FOR EACH ROW EXECUTE FUNCTION cravvr_set_updated_at();

DROP TRIGGER IF EXISTS trg_cravvr_plans_updated_at ON cravvr_plans;
CREATE TRIGGER trg_cravvr_plans_updated_at BEFORE UPDATE ON cravvr_plans
  FOR EACH ROW EXECUTE FUNCTION cravvr_set_updated_at();

-- ─────────────────────────────────────────────────────────────────────────────
-- 5. Backfill: every existing owner gets a Free row so the dashboard always
--    has a subscription to render. Plus upgrades happen via Stripe Checkout.
-- ─────────────────────────────────────────────────────────────────────────────

INSERT INTO cravvr_subscriptions (owner_id, plan_code, status)
SELECT p.id, 'free', 'active'
FROM profiles p
WHERE p.role IN ('owner', 'admin')
  AND NOT EXISTS (
    SELECT 1 FROM cravvr_subscriptions s WHERE s.owner_id = p.id
  );
