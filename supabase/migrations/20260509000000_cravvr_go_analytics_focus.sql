-- 20260509000000_cravvr_go_analytics_focus.sql
-- Repurpose Cravvr Go (the paid tier) around analytics rather than gating
-- payment processor connections. POS / Stripe / Square / Clover are now
-- free for every owner; Cravvr Go's value prop is owner analytics.
--
-- This migration is idempotent.

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. Reseed the plan catalog with the new positioning
-- ─────────────────────────────────────────────────────────────────────────────

INSERT INTO cravvr_plans (code, name, price_cents, interval, features, display_order)
VALUES
  ('free', 'Free', 0, 'month',
    jsonb_build_object(
      'analytics',       false,
      'online_checkout', true,
      'max_trucks',       1,
      'tagline',          'Connect your POS and start taking orders — free forever'
    ),
    0),
  ('plus', 'Cravvr Go', 2900, 'month',
    jsonb_build_object(
      'analytics',       true,
      'online_checkout', true,
      'max_trucks',       null,
      'tagline',          'Owner analytics — performance trends, demand insights, customer breakdowns'
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
-- 2. has_active_plus() now checks the analytics entitlement, not online_checkout
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION has_active_plus(p_owner_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
AS $$
  SELECT COALESCE(
    (
      SELECT (p.features->>'analytics')::boolean
      FROM cravvr_subscriptions s
      JOIN cravvr_plans p ON p.code = s.plan_code
      WHERE s.owner_id = p_owner_id
        AND s.status IN ('active', 'trialing')
    ),
    false
  );
$$;

GRANT EXECUTE ON FUNCTION has_active_plus(UUID) TO anon, authenticated;
