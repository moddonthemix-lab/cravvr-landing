-- Phase 2: Attribution model
-- Two views answer "which channel produced this dollar?" — one strict
-- (paid orders only, the long-term truth) and one loose (any created order,
-- usable today before Stripe online payments are live).
--
-- Plus ad_spend: a thin table the admin uploads CSVs into until we automate
-- ingestion from Meta/Google/TikTok APIs.

-- ---------------------------------------------------------------------------
-- Helper: most recent UTM-tagged event for a given user before a given time.
-- Used by the views to compute last-touch attribution.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION attribution_last_touch(
  p_user_id UUID,
  p_before TIMESTAMPTZ
)
RETURNS TABLE (
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT
)
LANGUAGE sql
STABLE
AS $$
  SELECT e.utm_source, e.utm_medium, e.utm_campaign
  FROM analytics_events e
  WHERE e.user_id = p_user_id
    AND e.utm_source IS NOT NULL
    AND e.occurred_at <= p_before
  ORDER BY e.occurred_at DESC
  LIMIT 1
$$;

-- ---------------------------------------------------------------------------
-- attributed_orders — every order, joined to first-touch and last-touch.
-- Use this today (before Stripe is live).
-- ---------------------------------------------------------------------------
CREATE OR REPLACE VIEW attributed_orders AS
SELECT
  o.id              AS order_id,
  o.customer_id,
  o.truck_id,
  o.order_number,
  o.total           AS revenue,
  o.payment_status,
  o.created_at,
  o.completed_at,
  -- First-touch (snapshotted on the order at write time)
  o.acquisition_first_utm_source,
  o.acquisition_first_utm_medium,
  o.acquisition_first_utm_campaign,
  -- Last-touch (snapshotted on the order at write time)
  o.acquisition_last_utm_source,
  o.acquisition_last_utm_medium,
  o.acquisition_last_utm_campaign,
  -- Visitor-level first-touch (live — useful for orders pre-snapshot)
  v.first_utm_source AS visitor_first_utm_source,
  v.first_utm_medium AS visitor_first_utm_medium,
  v.first_utm_campaign AS visitor_first_utm_campaign,
  v.first_click_platform,
  -- Effective channel: prefer order snapshot, fall back to live visitor row,
  -- finally to 'direct'
  COALESCE(
    o.acquisition_first_utm_source,
    v.first_utm_source,
    'direct'
  ) AS effective_first_source,
  COALESCE(
    o.acquisition_last_utm_source,
    v.last_utm_source,
    o.acquisition_first_utm_source,
    v.first_utm_source,
    'direct'
  ) AS effective_last_source
FROM orders o
LEFT JOIN customers c ON c.id = o.customer_id
LEFT JOIN visitors v ON v.id = c.acquisition_visitor_id;

COMMENT ON VIEW attributed_orders IS
  'Every order with first/last-touch attribution. Use until Stripe online payments are live; then prefer attributed_purchases.';

-- ---------------------------------------------------------------------------
-- attributed_purchases — paid orders only. The long-term truth.
-- Returns 0 rows until Stripe online payments are wired up.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE VIEW attributed_purchases AS
SELECT
  ao.*,
  p.amount AS paid_cents,
  p.status AS payment_record_status,
  p.created_at AS paid_at
FROM attributed_orders ao
JOIN payments p ON p.order_id = ao.order_id AND p.status = 'succeeded';

COMMENT ON VIEW attributed_purchases IS
  'Paid orders joined to first/last-touch attribution. Source of truth for revenue attribution once Stripe online payments are live.';

-- ---------------------------------------------------------------------------
-- daily_channel_performance — per-day, per-channel rollup.
-- Built from attributed_orders so it works today; will reflect actual
-- paid revenue once payments table fills in.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE VIEW daily_channel_performance AS
SELECT
  date_trunc('day', ao.created_at)::date AS day,
  ao.effective_first_source AS source,
  ao.acquisition_first_utm_medium AS medium,
  ao.acquisition_first_utm_campaign AS campaign,
  COUNT(DISTINCT ao.customer_id) FILTER (
    WHERE NOT EXISTS (
      SELECT 1 FROM orders o2
      WHERE o2.customer_id = ao.customer_id
        AND o2.created_at < ao.created_at
    )
  ) AS new_customers,
  COUNT(*) AS orders,
  SUM(ao.revenue) AS revenue,
  SUM(ao.revenue) FILTER (WHERE ao.payment_status = 'paid') AS paid_revenue
FROM attributed_orders ao
GROUP BY 1, 2, 3, 4;

COMMENT ON VIEW daily_channel_performance IS
  'Per-day per-channel rollup of orders, new customers, and revenue. Use as the input to daily ad-spend joins.';

-- ---------------------------------------------------------------------------
-- ad_spend — uploaded manually as CSVs until API automation lands.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ad_spend (
  id BIGSERIAL PRIMARY KEY,
  day DATE NOT NULL,
  source TEXT NOT NULL,        -- meta | google | tiktok | etc.
  medium TEXT,                 -- cpc | paid_social | etc.
  campaign TEXT,
  spend_cents BIGINT NOT NULL CHECK (spend_cents >= 0),
  impressions BIGINT,
  clicks BIGINT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (day, source, medium, campaign)
);

CREATE INDEX IF NOT EXISTS ad_spend_day_idx ON ad_spend(day DESC);
CREATE INDEX IF NOT EXISTS ad_spend_source_idx ON ad_spend(source);

ALTER TABLE ad_spend ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins read ad_spend"
  ON ad_spend FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  ));

CREATE POLICY "Admins write ad_spend"
  ON ad_spend FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  ));

COMMENT ON TABLE ad_spend IS 'Per-day per-channel ad spend. Manually uploaded via CSV until we automate Meta/Google/TikTok API ingestion.';
