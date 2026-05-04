-- Phase 4: Behavioral lifecycle email
--
-- Adds:
--   - email_marketing_opt_out flag on customers
--   - unsubscribe_token (HMAC-able, opaque) per customer
--   - marketing_email_send table — dedup ledger so a customer never gets the
--     same lifecycle flow twice for the same trigger event
--   - pg_cron schedules for the three lifecycle flows, all calling the
--     lifecycle-email-runner edge function

-- ---------------------------------------------------------------------------
-- 1. Marketing opt-out + unsubscribe token on customers.
-- ---------------------------------------------------------------------------
ALTER TABLE customers
  ADD COLUMN IF NOT EXISTS email_marketing_opt_out BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS unsubscribe_token TEXT UNIQUE;

-- Backfill tokens for existing customers.
UPDATE customers
SET unsubscribe_token = encode(gen_random_bytes(24), 'base64')
WHERE unsubscribe_token IS NULL;

-- Auto-assign for new customers.
CREATE OR REPLACE FUNCTION assign_unsubscribe_token()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.unsubscribe_token IS NULL THEN
    NEW.unsubscribe_token := encode(gen_random_bytes(24), 'base64');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_assign_unsubscribe_token ON customers;
CREATE TRIGGER trg_assign_unsubscribe_token
  BEFORE INSERT ON customers
  FOR EACH ROW
  EXECUTE FUNCTION assign_unsubscribe_token();

-- ---------------------------------------------------------------------------
-- 2. Dedup ledger — one row per (customer, flow, trigger).
--    "trigger_key" is flow-specific:
--      abandoned_cart    → "<add_to_cart event_id>"
--      first_reorder     → "<order_id of the first purchase>"
--      win_back          → "<year-week of last purchase>"
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS marketing_email_send (
  id BIGSERIAL PRIMARY KEY,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  flow TEXT NOT NULL,            -- abandoned_cart | first_reorder | win_back
  trigger_key TEXT NOT NULL,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  template_id TEXT,
  status TEXT NOT NULL DEFAULT 'sent',  -- sent | failed | suppressed
  error_message TEXT,
  metadata JSONB,
  UNIQUE (customer_id, flow, trigger_key)
);

CREATE INDEX IF NOT EXISTS marketing_email_send_customer_idx
  ON marketing_email_send(customer_id, flow);
CREATE INDEX IF NOT EXISTS marketing_email_send_sent_at_idx
  ON marketing_email_send(sent_at DESC);

ALTER TABLE marketing_email_send ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins read marketing_email_send"
  ON marketing_email_send FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  ));

-- ---------------------------------------------------------------------------
-- 3. pg_cron schedules.
--    Each calls the lifecycle-email-runner edge function via the pg_net
--    extension (Supabase ships with pg_net enabled).
--
--    The edge function URL and service role key are read from app settings
--    if available; otherwise the migration leaves placeholders and prints a
--    NOTICE. To finalize, run (replacing the values with your project's):
--
--      ALTER DATABASE postgres SET app.supabase_url = 'https://YOUR.supabase.co';
--      ALTER DATABASE postgres SET app.supabase_service_role_key = 'YOUR_KEY';
--
--    Then re-run this migration (it's idempotent).
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION trigger_lifecycle_flow(p_flow TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_url TEXT;
  v_key TEXT;
BEGIN
  v_url := current_setting('app.supabase_url', true);
  v_key := current_setting('app.supabase_service_role_key', true);

  IF v_url IS NULL OR v_key IS NULL THEN
    RAISE NOTICE 'app.supabase_url / app.supabase_service_role_key not configured — lifecycle flow % skipped.', p_flow;
    RETURN;
  END IF;

  PERFORM net.http_post(
    url := v_url || '/functions/v1/lifecycle-email-runner',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || v_key
    ),
    body := jsonb_build_object('flow', p_flow)
  );
END;
$$;

GRANT EXECUTE ON FUNCTION trigger_lifecycle_flow TO service_role;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    -- Idempotent: clear any prior versions of these schedules.
    PERFORM cron.unschedule(jobid)
    FROM cron.job
    WHERE jobname IN ('lifecycle-abandoned-cart', 'lifecycle-first-reorder', 'lifecycle-win-back');

    -- Hourly: abandoned cart sweep.
    PERFORM cron.schedule(
      'lifecycle-abandoned-cart',
      '0 * * * *',
      $cron$ SELECT trigger_lifecycle_flow('abandoned_cart'); $cron$
    );

    -- Daily 16:00 UTC (~lunchtime US): first-reorder nudge.
    PERFORM cron.schedule(
      'lifecycle-first-reorder',
      '0 16 * * *',
      $cron$ SELECT trigger_lifecycle_flow('first_reorder'); $cron$
    );

    -- Mondays 17:00 UTC: win-back.
    PERFORM cron.schedule(
      'lifecycle-win-back',
      '0 17 * * 1',
      $cron$ SELECT trigger_lifecycle_flow('win_back'); $cron$
    );
  ELSE
    RAISE NOTICE 'pg_cron not enabled — lifecycle schedules skipped. Run CREATE EXTENSION pg_cron; and re-run this migration.';
  END IF;
END $$;

COMMENT ON TABLE marketing_email_send IS 'Dedup ledger for behavioral lifecycle emails. UNIQUE (customer_id, flow, trigger_key) prevents the same email firing twice for the same trigger.';
COMMENT ON FUNCTION trigger_lifecycle_flow IS 'Called by pg_cron to invoke the lifecycle-email-runner edge function for a given flow.';
