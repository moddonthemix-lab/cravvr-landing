-- ============================================
-- Migration: Create truck_ratings_summary view
-- ============================================
-- This view provides aggregated rating data for food trucks

CREATE OR REPLACE VIEW truck_ratings_summary AS
SELECT
  truck_id,
  COUNT(*) as review_count,
  ROUND(AVG(rating)::numeric, 1) as average_rating
FROM reviews
WHERE NOT is_hidden
GROUP BY truck_id;

-- Grant access to the view
GRANT SELECT ON truck_ratings_summary TO anon, authenticated;
