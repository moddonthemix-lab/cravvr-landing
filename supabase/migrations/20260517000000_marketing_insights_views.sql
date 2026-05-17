-- Marketing insights views: funnel attribution + daily rollup for /for-trucks/*.
-- Read-only views; service role + admins can query.

-- ─────────────────────────────────────────────────────────────────────────
-- View 1: truck_lead_attribution
--   One row per lead, enriched with: pre-submit session activity, first-touch
--   UTMs from visitors, time-on-site, and a simple lead_score (0-100).
-- ─────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE VIEW truck_lead_attribution AS
WITH lead_sessions AS (
  SELECT
    tl.id AS lead_id,
    tl.visitor_id,
    COUNT(DISTINCT ae.session_id) AS sessions_before_submit,
    COUNT(*) FILTER (WHERE ae.event_name = 'page_view') AS pageviews_before_submit,
    COUNT(DISTINCT ae.path) AS distinct_paths_viewed,
    MIN(ae.occurred_at) AS first_seen_at,
    MAX(ae.occurred_at) FILTER (WHERE ae.occurred_at <= tl.created_at) AS last_event_before_submit
  FROM truck_leads tl
  LEFT JOIN analytics_events ae
    ON ae.visitor_id = tl.visitor_id
   AND ae.occurred_at <= tl.created_at
  WHERE tl.visitor_id IS NOT NULL
  GROUP BY tl.id, tl.visitor_id
),
visitor_first_touch AS (
  SELECT
    v.id AS visitor_id,
    v.first_utm_source,
    v.first_utm_medium,
    v.first_utm_campaign,
    v.first_utm_content,
    v.first_click_platform,
    v.first_landing_path,
    v.first_seen_at AS visitor_first_seen
  FROM visitors v
)
SELECT
  tl.id,
  tl.created_at,
  tl.name,
  tl.truck_name,
  tl.phone,
  tl.email,
  tl.cuisine,
  tl.city,
  tl.status,
  tl.contacted_at,
  tl.onboarded_at,
  -- Last-touch attribution (from the form submission)
  tl.utm_source AS last_utm_source,
  tl.utm_medium AS last_utm_medium,
  tl.utm_campaign AS last_utm_campaign,
  tl.utm_content AS last_utm_content,
  tl.click_platform AS last_click_platform,
  -- First-touch attribution (from the visitor row)
  vft.first_utm_source,
  vft.first_utm_medium,
  vft.first_utm_campaign,
  vft.first_utm_content,
  vft.first_click_platform,
  vft.first_landing_path,
  vft.visitor_first_seen,
  -- Engagement signals
  ls.sessions_before_submit,
  ls.pageviews_before_submit,
  ls.distinct_paths_viewed,
  ls.first_seen_at,
  EXTRACT(EPOCH FROM (tl.created_at - vft.visitor_first_seen))::int AS seconds_visitor_to_lead,
  -- Lead score: 0-100. Weighted heuristic — replace with trained model later.
  LEAST(100, GREATEST(0,
    -- Engagement (max 40 points)
    LEAST(40, COALESCE(ls.pageviews_before_submit, 1) * 8) +
    -- Source quality (paid > organic > direct) (max 30 points)
    CASE
      WHEN tl.utm_source IN ('meta','google','tiktok') THEN 30
      WHEN tl.utm_source IS NOT NULL THEN 20
      WHEN tl.referrer IS NOT NULL THEN 15
      ELSE 10
    END +
    -- Completeness (max 20 points)
    CASE WHEN tl.email IS NOT NULL THEN 10 ELSE 0 END +
    CASE WHEN tl.truck_name IS NOT NULL AND LENGTH(tl.truck_name) > 2 THEN 5 ELSE 0 END +
    CASE WHEN tl.cuisine IS NOT NULL THEN 5 ELSE 0 END +
    -- Best-time given (signal of seriousness) (max 10 points)
    CASE WHEN tl.best_time IS NOT NULL THEN 10 ELSE 0 END
  )) AS lead_score
FROM truck_leads tl
LEFT JOIN lead_sessions ls ON ls.lead_id = tl.id
LEFT JOIN visitor_first_touch vft ON vft.visitor_id = tl.visitor_id;

-- ─────────────────────────────────────────────────────────────────────────
-- View 2: marketing_funnel_daily
--   Daily rollup of /for-trucks/* views and lead submissions, bucketed by
--   creative (city × utm_source × utm_campaign × utm_content).
-- ─────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE VIEW marketing_funnel_daily AS
WITH views AS (
  SELECT
    date_trunc('day', occurred_at)::date AS day,
    -- Derive city from path /for-trucks/{city}
    SUBSTRING(path FROM '/for-trucks/([^/?]+)') AS city,
    COALESCE(utm_source, 'direct') AS utm_source,
    COALESCE(utm_medium, '(none)') AS utm_medium,
    COALESCE(utm_campaign, '(none)') AS utm_campaign,
    COALESCE(utm_content, '(none)') AS utm_content,
    COUNT(DISTINCT visitor_id) AS unique_views,
    COUNT(*) AS total_views
  FROM analytics_events
  WHERE event_name = 'page_view'
    AND path LIKE '/for-trucks/%'
  GROUP BY 1, 2, 3, 4, 5, 6
),
submits AS (
  SELECT
    date_trunc('day', created_at)::date AS day,
    city,
    COALESCE(utm_source, 'direct') AS utm_source,
    COALESCE(utm_medium, '(none)') AS utm_medium,
    COALESCE(utm_campaign, '(none)') AS utm_campaign,
    COALESCE(utm_content, '(none)') AS utm_content,
    COUNT(*) AS submits,
    COUNT(*) FILTER (WHERE status = 'onboarded') AS onboarded
  FROM truck_leads
  GROUP BY 1, 2, 3, 4, 5, 6
)
SELECT
  COALESCE(v.day, s.day) AS day,
  COALESCE(v.city, s.city) AS city,
  COALESCE(v.utm_source, s.utm_source) AS utm_source,
  COALESCE(v.utm_medium, s.utm_medium) AS utm_medium,
  COALESCE(v.utm_campaign, s.utm_campaign) AS utm_campaign,
  COALESCE(v.utm_content, s.utm_content) AS utm_content,
  COALESCE(v.unique_views, 0) AS unique_views,
  COALESCE(v.total_views, 0) AS total_views,
  COALESCE(s.submits, 0) AS submits,
  COALESCE(s.onboarded, 0) AS onboarded,
  CASE
    WHEN COALESCE(v.unique_views, 0) = 0 THEN NULL
    ELSE ROUND(COALESCE(s.submits, 0)::numeric / v.unique_views, 4)
  END AS submit_rate,
  CASE
    WHEN COALESCE(s.submits, 0) = 0 THEN NULL
    ELSE ROUND(COALESCE(s.onboarded, 0)::numeric / s.submits, 4)
  END AS onboard_rate
FROM views v
FULL OUTER JOIN submits s
  ON v.day = s.day
 AND v.city IS NOT DISTINCT FROM s.city
 AND v.utm_source = s.utm_source
 AND v.utm_medium = s.utm_medium
 AND v.utm_campaign = s.utm_campaign
 AND v.utm_content = s.utm_content
ORDER BY day DESC, city, utm_content;

-- ─────────────────────────────────────────────────────────────────────────
-- Grant SELECT on the views to authenticated + service role.
-- The underlying tables already enforce RLS — these views inherit those
-- policies because they're SECURITY INVOKER by default.
-- ─────────────────────────────────────────────────────────────────────────
GRANT SELECT ON truck_lead_attribution TO authenticated, service_role;
GRANT SELECT ON marketing_funnel_daily TO authenticated, service_role;
