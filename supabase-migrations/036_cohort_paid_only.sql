-- Cohort LTV should only count paid orders.
--
-- The original refresh_cohort_performance (023_cohorts.sql) reads from orders
-- with no payment_status filter, so test/unpaid/failed orders show up as
-- LTV — e.g. a $71.42 "direct" customer with no actual revenue collected.
--
-- This migration:
--   1. Restricts the "first order" (acquisition) lookup to paid orders only.
--      An unpaid checkout no longer counts as customer acquisition.
--   2. Restricts the d7/d30/d90 revenue windows to paid orders only.
--   3. Recomputes cohort_performance immediately so the dashboard reflects
--      reality without waiting for the 03:00 UTC nightly job.
--
-- Allowed payment_status values (from 016_order_state_machine.sql):
--   'unpaid' | 'pending' | 'paid' | 'refunded' | 'failed'
-- We count 'paid' only. Refunds intentionally don't subtract — LTV is gross
-- revenue, refund handling is a separate analysis.

CREATE OR REPLACE FUNCTION refresh_cohort_performance()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
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
    WHERE o.payment_status = 'paid'
    ORDER BY o.customer_id, o.created_at ASC
  ),
  customer_revenue AS (
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
    LEFT JOIN orders o
      ON o.customer_id = fo.customer_id
     AND o.payment_status = 'paid'
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

COMMENT ON FUNCTION refresh_cohort_performance IS
  'Full recompute of cohort_performance. Counts paid orders only (payment_status = ''paid''). Refactor to incremental if it gets slow.';

-- Recompute right now so the dashboard updates without waiting for the
-- nightly cron at 03:00 UTC.
SELECT refresh_cohort_performance();
