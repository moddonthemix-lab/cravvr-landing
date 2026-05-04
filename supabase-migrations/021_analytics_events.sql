-- Analytics analytics_events + visitors (Phase 1: Tracking + Identity)
-- Adds the foundation for full-funnel attribution: every visitor gets an
-- ID, every meaningful action becomes an analytics_events row, and visitor-to-user
-- stitching happens at signup/login.

-- ---------------------------------------------------------------------------
-- 1. visitors: anonymous identity that survives across sessions
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS visitors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- First-touch landing context (frozen at first visit)
  first_landing_url TEXT,
  first_landing_path TEXT,
  first_referrer TEXT,
  user_agent TEXT,

  -- First-touch acquisition (frozen — never overwritten)
  first_utm_source TEXT,
  first_utm_medium TEXT,
  first_utm_campaign TEXT,
  first_utm_content TEXT,
  first_utm_term TEXT,
  first_click_id TEXT,        -- fbclid | gclid | ttclid | etc.
  first_click_platform TEXT,  -- meta | google | tiktok | direct | organic | referral

  -- Last-touch acquisition (updated when a new UTM-tagged session arrives)
  last_utm_source TEXT,
  last_utm_medium TEXT,
  last_utm_campaign TEXT,
  last_utm_content TEXT,
  last_utm_term TEXT,
  last_click_id TEXT,
  last_click_platform TEXT,
  last_touch_at TIMESTAMPTZ,

  -- Stitched user (null until signup/login)
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS visitors_user_idx ON visitors(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS visitors_first_seen_idx ON visitors(first_seen_at DESC);

-- ---------------------------------------------------------------------------
-- 2. analytics_events: append-only log of every funnel touchpoint
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS analytics_events (
  id BIGSERIAL PRIMARY KEY,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  visitor_id UUID NOT NULL REFERENCES visitors(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id UUID NOT NULL,

  event_name TEXT NOT NULL,        -- page_view | view_truck | add_to_cart |
                                    -- begin_checkout | signup | login |
                                    -- purchase | etc.
  event_source TEXT NOT NULL DEFAULT 'web',  -- 'web' | 'server'

  -- Per-event UTMs (last-touch source for this event)
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_content TEXT,
  utm_term TEXT,
  click_id TEXT,

  -- Page context
  url TEXT,
  path TEXT,
  referrer TEXT,

  -- Free-form payload (item details, amounts, etc.)
  properties JSONB NOT NULL DEFAULT '{}'::jsonb,

  -- Server dedup key — same value used in Meta CAPI / GA4 / TikTok Events API
  -- so platforms dedupe browser-side and server-side hits of the same event.
  event_id TEXT UNIQUE
);

CREATE INDEX IF NOT EXISTS analytics_events_visitor_idx ON analytics_events(visitor_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS analytics_events_user_idx ON analytics_events(user_id, occurred_at DESC) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS analytics_events_name_time_idx ON analytics_events(event_name, occurred_at DESC);
CREATE INDEX IF NOT EXISTS analytics_events_session_idx ON analytics_events(session_id, occurred_at);

-- ---------------------------------------------------------------------------
-- 3. Acquisition columns on customers + orders (frozen attribution snapshots)
-- ---------------------------------------------------------------------------
ALTER TABLE customers
  ADD COLUMN IF NOT EXISTS acquisition_visitor_id UUID REFERENCES visitors(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS customers_acquisition_visitor_idx
  ON customers(acquisition_visitor_id)
  WHERE acquisition_visitor_id IS NOT NULL;

-- Orders carry a frozen snapshot so historical attribution doesn't shift
-- if the visitor row is later updated.
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS acquisition_visitor_id UUID,
  ADD COLUMN IF NOT EXISTS acquisition_first_utm_source TEXT,
  ADD COLUMN IF NOT EXISTS acquisition_first_utm_medium TEXT,
  ADD COLUMN IF NOT EXISTS acquisition_first_utm_campaign TEXT,
  ADD COLUMN IF NOT EXISTS acquisition_last_utm_source TEXT,
  ADD COLUMN IF NOT EXISTS acquisition_last_utm_medium TEXT,
  ADD COLUMN IF NOT EXISTS acquisition_last_utm_campaign TEXT;

-- ---------------------------------------------------------------------------
-- 4. RLS — analytics_events/visitors are written by edge functions (service role).
--    Reads are admin-only; users don't need direct access.
-- ---------------------------------------------------------------------------
ALTER TABLE visitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;

-- Admins can read everything.
CREATE POLICY "Admins read visitors"
  ON visitors FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  ));

CREATE POLICY "Admins read analytics_events"
  ON analytics_events FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  ));

-- Edge functions use the service role and bypass RLS, so no INSERT policies needed.

COMMENT ON TABLE visitors IS 'Anonymous and stitched visitor identities for full-funnel attribution.';
COMMENT ON TABLE analytics_events IS 'Append-only event log: page_view, add_to_cart, purchase, etc. Source of truth for cohort and attribution analysis.';
COMMENT ON COLUMN analytics_events.event_id IS 'Cross-channel dedup key — same value sent to Meta CAPI / GA4 / TikTok Events API as the corresponding browser event.';
