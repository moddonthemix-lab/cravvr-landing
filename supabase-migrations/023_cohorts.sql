-- Phase 3: CAC / LTV cohort performance
--
-- Daily-refreshed table that answers: "for customers we acquired in week X
-- via channel Y, what was our CAC, and what's their LTV at d7/d14/d30/d90?"
--
-- The refresh function does a full recompute. At Cravvr's scale (thousands
-- of orders, not millions) this is fine and dramatically simpler than
-- incremental maintenance. Iterate when it gets slow.

-- ---------------------------------------------------------------------------
-- cohort_performance — the table the growth dashboard reads from.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS cohort_performance (
  cohort_week DATE NOT NULL,
  source TEXT NOT NULL,
  medium TEXT NOT NULL DEFAULT '',     -- '' so PK doesn't break on NULLs
  campaign TEXT NOT NULL DEFAULT '',
  new_customers INT NOT NULL DEFAULT 0,
  spend_cents BIGINT NOT NULL DEFAULT 0,
  revenue_d7_cents BIGINT NOT NULL DEFAULT 0,
  revenue_d14_cents BIGINT NOT NULL DEFAULT 0,
  revenue_d30_cents BIGINT NOT NULL DEFAULT 0,
  revenue_d90_cents BIGINT NOT NULL DEFAULT 0,
  refreshed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (cohort_week, source, medium, campaign)
);

-- Computed columns — kept as views/derived in queries rather than generated
-- columns because Postgres generated columns can't reference other generated
-- columns and we want the dashboard to read CAC, LTV, and ratios uniformly.
CREATE OR REPLACE VIEW cohort_performance_v AS
SELECT
  cp.*,
  CASE WHEN cp.new_customers > 0
       THEN cp.spend_cents / cp.new_customers
       ELSE 0 END AS cac_cents,
  CASE WHEN cp.new_customers > 0
       THEN cp.revenue_d7_cents / cp.new_customers
       ELSE 0 END AS ltv_d7_cents,
  CASE WHEN cp.new_customers > 0
       THEN cp.revenue_d14_cents / cp.new_customers
       ELSE 0 END AS ltv_d14_cents,
  CASE WHEN cp.new_customers > 0
       THEN cp.revenue_d30_cents / cp.new_customers
       ELSE 0 END AS ltv_d30_cents,
  CASE WHEN cp.new_customers > 0
       THEN cp.revenue_d90_cents / cp.new_customers
       ELSE 0 END AS ltv_d90_cents,
  CASE WHEN cp.spend_cents > 0
       THEN cp.revenue_d30_cents::numeric / cp.spend_cents
       ELSE NULL END AS ltv_cac_d30,
  CASE WHEN cp.spend_cents > 0
       THEN cp.revenue_d90_cents::numeric / cp.spend_cents
       ELSE NULL END AS ltv_cac_d90
FROM cohort_performance cp;

-- ---------------------------------------------------------------------------
-- refresh_cohort_performance — full recompute.
-- Identifies new customers as the first order per customer, groups them by
-- (week-of-first-order, attributed channel), then sums all subsequent orders
-- from those customers within d7/d14/d30/d90 windows.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION refresh_cohort_performance()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Step 1: each customer's first order (acquisition moment).
  -- Step 2: roll forward each customer's revenue at d7/d14/d30/d90.
  -- Step 3: group by (cohort_week, source, medium, campaign) and join spend.

  TRUNCATE cohort_performance;

  WITH first_order AS (
    SELECT DISTINCT ON (o.customer_id)
      o.customer_id,
      o.created_at AS acquired_at,
      date_trunc('week', o.created_at)::date AS cohort_week,
      COALESCE(o.acquisition_first_utm_source, 'direct') AS source,
      COALESCE(o.acquisition_first_utm_medium, '') AS medium,
      COALESCE(o.acquisition_first_utm_campaign, '') AS campaign
    FROM orders o
    ORDER BY o.customer_id, o.created_at ASC
  ),
  customer_revenue AS (
    -- Total revenue per customer at each window, in cents.
    -- Uses orders.total (dollars) — convert to cents.
    SELECT
      fo.customer_id,
      fo.cohort_week,
      fo.source,
      fo.medium,
      fo.campaign,
      COALESCE(SUM(
        CASE WHEN o.created_at <= fo.acquired_at + INTERVAL '7 days'
             THEN (o.total * 100)::bigint ELSE 0 END
      ), 0) AS rev_d7,
      COALESCE(SUM(
        CASE WHEN o.created_at <= fo.acquired_at + INTERVAL '14 days'
             THEN (o.total * 100)::bigint ELSE 0 END
      ), 0) AS rev_d14,
      COALESCE(SUM(
        CASE WHEN o.created_at <= fo.acquired_at + INTERVAL '30 days'
             THEN (o.total * 100)::bigint ELSE 0 END
      ), 0) AS rev_d30,
      COALESCE(SUM(
        CASE WHEN o.created_at <= fo.acquired_at + INTERVAL '90 days'
             THEN (o.total * 100)::bigint ELSE 0 END
      ), 0) AS rev_d90
    FROM first_order fo
    LEFT JOIN orders o ON o.customer_id = fo.customer_id
    GROUP BY fo.customer_id, fo.cohort_week, fo.source, fo.medium, fo.campaign
  ),
  cohort_revenue AS (
    SELECT
      cohort_week, source, medium, campaign,
      COUNT(*) AS new_customers,
      SUM(rev_d7) AS revenue_d7_cents,
      SUM(rev_d14) AS revenue_d14_cents,
      SUM(rev_d30) AS revenue_d30_cents,
      SUM(rev_d90) AS revenue_d90_cents
    FROM customer_revenue
    GROUP BY cohort_week, source, medium, campaign
  ),
  cohort_spend AS (
    SELECT
      date_trunc('week', day)::date AS cohort_week,
      COALESCE(source, 'direct') AS source,
      COALESCE(medium, '') AS medium,
      COALESCE(campaign, '') AS campaign,
      SUM(spend_cents) AS spend_cents
    FROM ad_spend
    GROUP BY 1, 2, 3, 4
  )
  INSERT INTO cohort_performance (
    cohort_week, source, medium, campaign,
    new_customers, spend_cents,
    revenue_d7_cents, revenue_d14_cents, revenue_d30_cents, revenue_d90_cents,
    refreshed_at
  )
  SELECT
    cr.cohort_week, cr.source, cr.medium, cr.campaign,
    cr.new_customers,
    COALESCE(cs.spend_cents, 0),
    cr.revenue_d7_cents, cr.revenue_d14_cents, cr.revenue_d30_cents, cr.revenue_d90_cents,
    NOW()
  FROM cohort_revenue cr
  LEFT JOIN cohort_spend cs USING (cohort_week, source, medium, campaign);
END;
$$;

GRANT EXECUTE ON FUNCTION refresh_cohort_performance TO service_role;

-- RLS — admins read.
ALTER TABLE cohort_performance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins read cohorts"
  ON cohort_performance FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  ));

-- ---------------------------------------------------------------------------
-- pg_cron: daily refresh at 03:00 UTC.
-- Wrapped in DO block + extension check so the migration is safe to run on
-- environments where pg_cron isn't enabled (Supabase enables it by default).
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    -- Unschedule any prior version of this job so the migration is idempotent.
    PERFORM cron.unschedule(jobid)
    FROM cron.job
    WHERE jobname = 'refresh-cohorts-daily';

    PERFORM cron.schedule(
      'refresh-cohorts-daily',
      '0 3 * * *',
      $cron$ SELECT refresh_cohort_performance(); $cron$
    );
  ELSE
    RAISE NOTICE 'pg_cron extension not enabled — refresh_cohort_performance() exists but no schedule was created. Run: CREATE EXTENSION pg_cron; then re-run this migration, or call the function manually / from an external scheduler.';
  END IF;
END $$;

COMMENT ON TABLE cohort_performance IS 'Daily-refreshed cohort table. PK = (cohort_week, source, medium, campaign). Read via cohort_performance_v for derived CAC/LTV columns.';
COMMENT ON FUNCTION refresh_cohort_performance IS 'Full recompute of cohort_performance. Cheap at Cravvr scale; refactor to incremental if it gets slow.';
