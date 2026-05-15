-- Playbook state — checkable state for the 2026 master plan items.
--
-- The plan items themselves are version-controlled in the React component
-- (PlaybookPage.jsx) — what lives here is just the check/done state per
-- item, keyed by a stable string id chosen in code. Letting code own the
-- structure means plan revisions don't need migrations.
--
-- Uses Clerk-aware auth helpers (is_admin, requesting_user_id) since
-- profiles.id is TEXT (Clerk user IDs) as of 043_consolidate_user_creation.

CREATE TABLE IF NOT EXISTS playbook_state (
  item_key TEXT PRIMARY KEY,
  done BOOLEAN NOT NULL DEFAULT FALSE,
  done_at TIMESTAMPTZ,
  done_by_user_id TEXT REFERENCES profiles(id) ON DELETE SET NULL,
  notes TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS playbook_state_done_idx
  ON playbook_state(done) WHERE done = TRUE;

ALTER TABLE playbook_state ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins read playbook_state"
  ON playbook_state FOR SELECT
  TO authenticated
  USING (public.is_admin());

CREATE POLICY "Admins write playbook_state"
  ON playbook_state FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Auto-stamp done_at + done_by_user_id when an item is checked.
CREATE OR REPLACE FUNCTION stamp_playbook_state()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := NOW();
  IF NEW.done IS TRUE AND (OLD IS NULL OR OLD.done IS FALSE) THEN
    NEW.done_at := COALESCE(NEW.done_at, NOW());
    NEW.done_by_user_id := COALESCE(NEW.done_by_user_id, public.requesting_user_id());
  END IF;
  IF NEW.done IS FALSE THEN
    NEW.done_at := NULL;
    NEW.done_by_user_id := NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_stamp_playbook_state ON playbook_state;
CREATE TRIGGER trg_stamp_playbook_state
  BEFORE INSERT OR UPDATE ON playbook_state
  FOR EACH ROW
  EXECUTE FUNCTION stamp_playbook_state();

COMMENT ON TABLE playbook_state IS
  'Check state for the 2026 master plan items. Item structure is version-controlled in PlaybookPage.jsx; this table stores only done/notes/timestamps.';
