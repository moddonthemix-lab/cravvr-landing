-- 034_trash_purge_cron.sql
-- Hard-deletes trucks that have been soft-deleted for 30+ days. Scheduled
-- daily via pg_cron. Logs to admin_audit_log with admin_id = the system
-- (NULL not allowed → use the project's first admin if any, else skip).
--
-- pg_cron is available in Supabase (extensions.pg_cron). Safe to re-run.

CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;

CREATE OR REPLACE FUNCTION purge_soft_deleted_trucks()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INTEGER := 0;
  v_truck food_trucks%ROWTYPE;
  v_admin_id UUID;
BEGIN
  -- Pick any admin to attribute the system action; if none, attribution is NULL
  SELECT id INTO v_admin_id FROM profiles WHERE role = 'admin' LIMIT 1;

  FOR v_truck IN
    SELECT * FROM food_trucks
    WHERE deleted_at IS NOT NULL
      AND deleted_at < NOW() - INTERVAL '30 days'
  LOOP
    INSERT INTO admin_audit_log (admin_id, entity_type, entity_id, action, before, after, reason)
    VALUES (v_admin_id, 'food_truck', v_truck.id, 'auto_purge',
            to_jsonb(v_truck), NULL,
            'auto-purge: soft-deleted > 30 days');

    DELETE FROM food_trucks WHERE id = v_truck.id;
    v_count := v_count + 1;
  END LOOP;

  RETURN v_count;
END;
$$;

REVOKE ALL ON FUNCTION purge_soft_deleted_trucks() FROM PUBLIC;

-- Unschedule any prior version, then schedule fresh
DO $$
BEGIN
  PERFORM cron.unschedule('purge-soft-deleted-trucks');
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;

SELECT cron.schedule(
  'purge-soft-deleted-trucks',
  '0 4 * * *',  -- daily at 04:00 UTC
  $$ SELECT public.purge_soft_deleted_trucks(); $$
);
