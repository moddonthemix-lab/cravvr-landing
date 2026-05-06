-- 035_slug_history.sql
-- Tracks every slug change on food_trucks so old slug-based URLs can resolve
-- via redirect. Append-only table, populated by a BEFORE UPDATE trigger
-- whenever slug changes (including becoming NULL, or a fresh value being set
-- on a row that previously had no slug). RLS: public read (so the resolver
-- can be called by anon visitors), no public write — only the trigger writes.
-- Safe to re-run.

CREATE TABLE IF NOT EXISTS food_truck_slug_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  truck_id UUID NOT NULL REFERENCES food_trucks(id) ON DELETE CASCADE,
  old_slug TEXT NOT NULL,
  changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  changed_by UUID REFERENCES auth.users(id)
);

CREATE INDEX IF NOT EXISTS idx_truck_slug_history_old_slug
  ON food_truck_slug_history (old_slug);
CREATE INDEX IF NOT EXISTS idx_truck_slug_history_truck
  ON food_truck_slug_history (truck_id, changed_at DESC);

ALTER TABLE food_truck_slug_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "slug_history_public_read" ON food_truck_slug_history;
CREATE POLICY "slug_history_public_read"
  ON food_truck_slug_history
  FOR SELECT
  USING (true);

-- ─────────────────────────────────────────────────────────────────────────────
-- Trigger: capture slug changes
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION record_truck_slug_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.slug IS DISTINCT FROM OLD.slug AND OLD.slug IS NOT NULL THEN
    INSERT INTO food_truck_slug_history (truck_id, old_slug, changed_by)
    VALUES (OLD.id, OLD.slug, auth.uid());
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_record_truck_slug_change ON food_trucks;
CREATE TRIGGER trg_record_truck_slug_change
  BEFORE UPDATE OF slug ON food_trucks
  FOR EACH ROW
  EXECUTE FUNCTION record_truck_slug_change();

-- ─────────────────────────────────────────────────────────────────────────────
-- Resolver: given a slug, return the current truck row. Tries current slug
-- first, then falls back to history (most-recent rename wins).
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION resolve_truck_slug(p_slug TEXT)
RETURNS food_trucks
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_truck food_trucks;
BEGIN
  -- 1) current slug match (preferred)
  SELECT * INTO v_truck FROM food_trucks
   WHERE slug = p_slug
     AND deleted_at IS NULL
     AND suspended_at IS NULL
   LIMIT 1;
  IF FOUND THEN RETURN v_truck; END IF;

  -- 2) historical slug match — most recent rename wins
  SELECT t.* INTO v_truck
    FROM food_truck_slug_history h
    JOIN food_trucks t ON t.id = h.truck_id
   WHERE h.old_slug = p_slug
     AND t.deleted_at IS NULL
     AND t.suspended_at IS NULL
   ORDER BY h.changed_at DESC
   LIMIT 1;

  RETURN v_truck;  -- NULL if not found
END;
$$;

GRANT EXECUTE ON FUNCTION resolve_truck_slug(TEXT) TO anon, authenticated;
