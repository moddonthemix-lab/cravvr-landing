-- 028_admin_audit_log.sql
-- Append-only audit log for every admin write. All admin RPCs (migration 029)
-- insert into this table inside the same transaction as the change. Read-only
-- to admins; write-only via SECURITY DEFINER RPCs.
-- Safe to re-run.

CREATE TABLE IF NOT EXISTS admin_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES auth.users(id),
  entity_type TEXT NOT NULL,        -- 'food_truck' | 'menu_item' | 'review' | 'order' | ...
  entity_id UUID NOT NULL,
  action TEXT NOT NULL,             -- 'update' | 'soft_delete' | 'restore' | 'transfer_owner' | 'set_flag' | 'force_cancel_order' | 'hide_review' | ...
  before JSONB,
  after JSONB,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_audit_entity
  ON admin_audit_log (entity_type, entity_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_admin_audit_admin
  ON admin_audit_log (admin_id, created_at DESC);

ALTER TABLE admin_audit_log ENABLE ROW LEVEL SECURITY;

-- Admins can read everything; nobody can INSERT/UPDATE/DELETE directly.
-- Inserts happen exclusively through SECURITY DEFINER RPCs in 029.
DROP POLICY IF EXISTS "admin_audit_log_admin_select" ON admin_audit_log;
CREATE POLICY "admin_audit_log_admin_select"
  ON admin_audit_log
  FOR SELECT
  USING (is_admin());
