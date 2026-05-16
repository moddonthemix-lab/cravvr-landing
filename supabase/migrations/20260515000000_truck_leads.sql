-- Truck operator lead capture from /for-trucks/* landing pages.
-- Anon role can INSERT (public form). Reads/updates are admin-only.

CREATE TABLE IF NOT EXISTS truck_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Lead fields
  name text NOT NULL,
  truck_name text,
  phone text NOT NULL,
  email text,
  cuisine text,
  city text NOT NULL,             -- 'portland' | 'st-pete' | 'tampa' | other
  best_time text,                 -- "weekday-mornings" etc.
  notes text,

  -- Attribution
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_content text,
  utm_term text,
  click_id text,                  -- fbclid / gclid / ttclid
  click_platform text,            -- 'meta' | 'google' | 'tiktok'
  referrer text,
  landing_url text,
  visitor_id uuid,                -- stitches to analytics_events.visitor_id

  -- Funnel state — owner workflow
  status text NOT NULL DEFAULT 'new'
    CHECK (status IN ('new', 'contacted', 'qualified', 'onboarded', 'rejected', 'duplicate')),
  contacted_at timestamptz,
  onboarded_at timestamptz,
  truck_id uuid REFERENCES food_trucks(id) ON DELETE SET NULL,
  internal_notes text,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS truck_leads_city_status_idx ON truck_leads (city, status, created_at DESC);
CREATE INDEX IF NOT EXISTS truck_leads_created_at_idx ON truck_leads (created_at DESC);

-- updated_at trigger (reuse existing helper if present)
CREATE OR REPLACE FUNCTION truck_leads_set_updated_at() RETURNS trigger AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS truck_leads_updated_at ON truck_leads;
CREATE TRIGGER truck_leads_updated_at BEFORE UPDATE ON truck_leads
  FOR EACH ROW EXECUTE FUNCTION truck_leads_set_updated_at();

ALTER TABLE truck_leads ENABLE ROW LEVEL SECURITY;

-- Public form submission. Server-side validation lives in the truck-lead
-- edge function; this policy just allows the insert path.
DROP POLICY IF EXISTS "Anyone can submit a truck lead" ON truck_leads;
CREATE POLICY "Anyone can submit a truck lead" ON truck_leads
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Admins read truck_leads" ON truck_leads;
CREATE POLICY "Admins read truck_leads" ON truck_leads
  FOR SELECT USING (is_admin());

DROP POLICY IF EXISTS "Admins write truck_leads" ON truck_leads;
CREATE POLICY "Admins write truck_leads" ON truck_leads
  FOR UPDATE USING (is_admin()) WITH CHECK (is_admin());
