-- 032_admin_rpc_notifications.sql
-- Extends the admin RPCs from 029 to insert into the notifications table for
-- the affected owner (or review author) so they're informed about destructive
-- admin actions in real time. Uses the existing notifications table from
-- supabase/migrations/20260201_create_notifications.sql.
-- Safe to re-run.

-- Helper: insert a notification row, swallowing missing-table errors so this
-- migration is safe in environments where notifications haven't been created.
CREATE OR REPLACE FUNCTION _admin_notify(
  p_user_id UUID,
  p_type TEXT,
  p_title TEXT,
  p_message TEXT,
  p_data JSONB DEFAULT '{}'::jsonb
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_user_id IS NULL THEN RETURN; END IF;
  BEGIN
    INSERT INTO notifications (user_id, type, title, message, data)
    VALUES (p_user_id, p_type, p_title, p_message, COALESCE(p_data, '{}'::jsonb));
  EXCEPTION WHEN undefined_table THEN
    NULL;
  END;
END;
$$;
REVOKE ALL ON FUNCTION _admin_notify(UUID, TEXT, TEXT, TEXT, JSONB) FROM PUBLIC;

-- ─────────────────────────────────────────────────────────────────────────────
-- admin_soft_delete_truck — notify owner
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION admin_soft_delete_truck(
  p_id UUID,
  p_reason TEXT DEFAULT NULL
)
RETURNS food_trucks
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_before food_trucks;
  v_after food_trucks;
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'not authorized' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO v_before FROM food_trucks WHERE id = p_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'truck % not found', p_id USING ERRCODE = 'P0002'; END IF;

  UPDATE food_trucks
  SET deleted_at = NOW(), updated_at = NOW()
  WHERE id = p_id
  RETURNING * INTO v_after;

  INSERT INTO admin_audit_log (admin_id, entity_type, entity_id, action, before, after, reason)
  VALUES (auth.uid(), 'food_truck', p_id, 'soft_delete', to_jsonb(v_before), to_jsonb(v_after), p_reason);

  PERFORM _admin_notify(
    v_after.owner_id,
    'system_alert',
    'Your truck was removed',
    COALESCE('Reason: ' || p_reason, 'An administrator removed ' || v_after.name || '. Contact support to restore.'),
    jsonb_build_object('action', 'soft_delete', 'truck_id', v_after.id, 'truck_name', v_after.name, 'reason', p_reason)
  );

  RETURN v_after;
END;
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- admin_suspend_truck — notify owner
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION admin_suspend_truck(
  p_id UUID,
  p_reason TEXT DEFAULT NULL
)
RETURNS food_trucks
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_before food_trucks;
  v_after food_trucks;
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'not authorized' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO v_before FROM food_trucks WHERE id = p_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'truck % not found', p_id USING ERRCODE = 'P0002'; END IF;

  UPDATE food_trucks
  SET suspended_at = NOW(), suspension_reason = p_reason, updated_at = NOW()
  WHERE id = p_id
  RETURNING * INTO v_after;

  INSERT INTO admin_audit_log (admin_id, entity_type, entity_id, action, before, after, reason)
  VALUES (auth.uid(), 'food_truck', p_id, 'suspend', to_jsonb(v_before), to_jsonb(v_after), p_reason);

  PERFORM _admin_notify(
    v_after.owner_id,
    'system_alert',
    'Your truck was suspended',
    COALESCE(p_reason, 'An administrator suspended ' || v_after.name || '. The truck is hidden from public listings.'),
    jsonb_build_object('action', 'suspend', 'truck_id', v_after.id, 'truck_name', v_after.name, 'reason', p_reason)
  );

  RETURN v_after;
END;
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- admin_restore_truck — notify owner
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION admin_restore_truck(
  p_id UUID,
  p_reason TEXT DEFAULT NULL
)
RETURNS food_trucks
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_before food_trucks;
  v_after food_trucks;
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'not authorized' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO v_before FROM food_trucks WHERE id = p_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'truck % not found', p_id USING ERRCODE = 'P0002'; END IF;

  UPDATE food_trucks
  SET deleted_at = NULL, suspended_at = NULL, suspension_reason = NULL, updated_at = NOW()
  WHERE id = p_id
  RETURNING * INTO v_after;

  INSERT INTO admin_audit_log (admin_id, entity_type, entity_id, action, before, after, reason)
  VALUES (auth.uid(), 'food_truck', p_id, 'restore', to_jsonb(v_before), to_jsonb(v_after), p_reason);

  PERFORM _admin_notify(
    v_after.owner_id,
    'system_alert',
    'Your truck was restored',
    v_after.name || ' is visible to customers again.',
    jsonb_build_object('action', 'restore', 'truck_id', v_after.id, 'truck_name', v_after.name)
  );

  RETURN v_after;
END;
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- admin_transfer_truck_owner — notify both old and new owner
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION admin_transfer_truck_owner(
  p_id UUID,
  p_new_owner_id UUID,
  p_reason TEXT DEFAULT NULL
)
RETURNS food_trucks
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_before food_trucks;
  v_after food_trucks;
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'not authorized' USING ERRCODE = '42501';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM owners WHERE id = p_new_owner_id) THEN
    RAISE EXCEPTION 'new owner % not found in owners table', p_new_owner_id USING ERRCODE = 'P0002';
  END IF;

  SELECT * INTO v_before FROM food_trucks WHERE id = p_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'truck % not found', p_id USING ERRCODE = 'P0002'; END IF;

  UPDATE food_trucks
  SET owner_id = p_new_owner_id, updated_at = NOW()
  WHERE id = p_id
  RETURNING * INTO v_after;

  INSERT INTO admin_audit_log (admin_id, entity_type, entity_id, action, before, after, reason)
  VALUES (auth.uid(), 'food_truck', p_id, 'transfer_owner', to_jsonb(v_before), to_jsonb(v_after), p_reason);

  -- Old owner
  PERFORM _admin_notify(
    v_before.owner_id,
    'system_alert',
    'Truck ownership transferred',
    'Your ownership of ' || v_after.name || ' was transferred to another account by an administrator.',
    jsonb_build_object('action', 'transfer_owner', 'truck_id', v_after.id, 'truck_name', v_after.name, 'reason', p_reason)
  );
  -- New owner
  PERFORM _admin_notify(
    v_after.owner_id,
    'system_alert',
    'You received a truck',
    v_after.name || ' was assigned to your account by an administrator.',
    jsonb_build_object('action', 'received_truck', 'truck_id', v_after.id, 'truck_name', v_after.name, 'reason', p_reason)
  );

  RETURN v_after;
END;
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- admin_hide_review — notify the owner of the reviewed truck
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION admin_hide_review(
  p_id UUID,
  p_hide BOOLEAN,
  p_reason TEXT DEFAULT NULL
)
RETURNS reviews
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_before reviews;
  v_after reviews;
  v_owner_id UUID;
  v_truck_name TEXT;
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'not authorized' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO v_before FROM reviews WHERE id = p_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'review % not found', p_id USING ERRCODE = 'P0002'; END IF;

  UPDATE reviews
  SET
    hidden_at = CASE WHEN p_hide THEN NOW() ELSE NULL END,
    hidden_reason = CASE WHEN p_hide THEN p_reason ELSE NULL END,
    is_hidden = p_hide
  WHERE id = p_id
  RETURNING * INTO v_after;

  INSERT INTO admin_audit_log (admin_id, entity_type, entity_id, action, before, after, reason)
  VALUES (auth.uid(), 'review', p_id,
          CASE WHEN p_hide THEN 'hide_review' ELSE 'unhide_review' END,
          to_jsonb(v_before), to_jsonb(v_after), p_reason);

  SELECT owner_id, name INTO v_owner_id, v_truck_name
    FROM food_trucks WHERE id = v_after.truck_id;

  IF p_hide THEN
    PERFORM _admin_notify(
      v_owner_id,
      'flagged_content',
      'A review on your truck was hidden',
      'Admin moderated a review on ' || COALESCE(v_truck_name, 'your truck') || '.',
      jsonb_build_object('action', 'hide_review', 'review_id', p_id, 'truck_id', v_after.truck_id, 'reason', p_reason)
    );
  END IF;

  RETURN v_after;
END;
$$;
