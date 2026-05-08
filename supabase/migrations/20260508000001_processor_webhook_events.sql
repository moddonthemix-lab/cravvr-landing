-- 039_processor_webhook_events.sql
-- Webhook event ledger for replay/dedup protection.
--
-- Both Stripe and Square can re-deliver webhook events on retry. Without a
-- dedup key, certain handlers (notably Square's refund.updated) can apply
-- the same `refund_amount` twice, double-counting refunds. This table is the
-- single source of truth for "have we already processed this webhook event?"
--
-- Edge function flow:
--   1. Verify signature (existing).
--   2. Parse event, extract event_id and created_at timestamp.
--   3. Reject if timestamp older than 5 minutes (replay protection).
--   4. INSERT INTO processor_webhook_events (processor, event_id, ...);
--      if ON CONFLICT, it's a duplicate — return 200 OK without re-processing.
--   5. Otherwise process the event normally.
--
-- Idempotent.

CREATE TABLE IF NOT EXISTS processor_webhook_events (
  processor   TEXT NOT NULL CHECK (processor IN ('stripe', 'square', 'clover')),
  event_id    TEXT NOT NULL,
  event_type  TEXT,
  event_created_at TIMESTAMPTZ,
  received_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (processor, event_id)
);

CREATE INDEX IF NOT EXISTS idx_processor_webhook_events_received_at
  ON processor_webhook_events(received_at DESC);

ALTER TABLE processor_webhook_events ENABLE ROW LEVEL SECURITY;

-- Service role (edge functions) writes. Authenticated users have no access.
DROP POLICY IF EXISTS processor_webhook_events_admin_read ON processor_webhook_events;
CREATE POLICY processor_webhook_events_admin_read
  ON processor_webhook_events
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );
