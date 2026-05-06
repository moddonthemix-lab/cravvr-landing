-- 029_admin_truck_rpcs.sql
-- SECURITY DEFINER RPCs that gate every admin write to food_trucks and related
-- entities. Each function asserts is_admin(), captures before/after JSONB,
-- and inserts an admin_audit_log row in the same transaction.
-- Safe to re-run.

-- ─────────────────────────────────────────────────────────────────────────────
-- admin_update_truck(p_id, p_patch jsonb, p_reason text)
-- Patch keys are validated against an allowlist; unknown keys raise.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION admin_update_truck(
  p_id UUID,
  p_patch JSONB,
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
  v_key TEXT;
  v_allowed TEXT[] := ARRAY[
    'name','description','cuisine','location','coordinates','price_range',
    'hours','phone','website','instagram','image_url','features','is_open',
    'accepting_orders','max_queue_size','auto_pause_enabled','estimated_prep_time',
    'slug','featured','verified',
    'stripe_account_id','stripe_onboarding_complete','stripe_charges_enabled'
  ];
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'not authorized' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO v_before FROM food_trucks WHERE id = p_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'truck % not found', p_id USING ERRCODE = 'P0002';
  END IF;

  -- Reject any key not in the allowlist
  FOR v_key IN SELECT jsonb_object_keys(p_patch) LOOP
    IF NOT (v_key = ANY(v_allowed)) THEN
      RAISE EXCEPTION 'field % is not allowed via admin_update_truck', v_key
        USING ERRCODE = '22023';
    END IF;
  END LOOP;

  -- Apply patch via dynamic UPDATE built from the JSONB.
  -- We rely on jsonb_populate_record to coerce types from JSONB to row columns.
  UPDATE food_trucks
  SET
    name = COALESCE((p_patch->>'name'), name),
    description = CASE WHEN p_patch ? 'description' THEN p_patch->>'description' ELSE description END,
    cuisine = COALESCE((p_patch->>'cuisine'), cuisine),
    location = CASE WHEN p_patch ? 'location' THEN p_patch->>'location' ELSE location END,
    coordinates = CASE WHEN p_patch ? 'coordinates' THEN (p_patch->'coordinates') ELSE coordinates END,
    price_range = COALESCE((p_patch->>'price_range'), price_range),
    hours = CASE WHEN p_patch ? 'hours' THEN (p_patch->'hours') ELSE hours END,
    phone = CASE WHEN p_patch ? 'phone' THEN p_patch->>'phone' ELSE phone END,
    website = CASE WHEN p_patch ? 'website' THEN p_patch->>'website' ELSE website END,
    instagram = CASE WHEN p_patch ? 'instagram' THEN p_patch->>'instagram' ELSE instagram END,
    image_url = CASE WHEN p_patch ? 'image_url' THEN p_patch->>'image_url' ELSE image_url END,
    features = CASE WHEN p_patch ? 'features' THEN ARRAY(SELECT jsonb_array_elements_text(p_patch->'features')) ELSE features END,
    is_open = CASE WHEN p_patch ? 'is_open' THEN (p_patch->>'is_open')::boolean ELSE is_open END,
    accepting_orders = CASE WHEN p_patch ? 'accepting_orders' THEN (p_patch->>'accepting_orders')::boolean ELSE accepting_orders END,
    max_queue_size = CASE WHEN p_patch ? 'max_queue_size' THEN (p_patch->>'max_queue_size')::int ELSE max_queue_size END,
    auto_pause_enabled = CASE WHEN p_patch ? 'auto_pause_enabled' THEN (p_patch->>'auto_pause_enabled')::boolean ELSE auto_pause_enabled END,
    estimated_prep_time = CASE WHEN p_patch ? 'estimated_prep_time' THEN (p_patch->>'estimated_prep_time')::int ELSE estimated_prep_time END,
    slug = CASE WHEN p_patch ? 'slug' THEN p_patch->>'slug' ELSE slug END,
    featured = CASE WHEN p_patch ? 'featured' THEN (p_patch->>'featured')::boolean ELSE featured END,
    verified = CASE WHEN p_patch ? 'verified' THEN (p_patch->>'verified')::boolean ELSE verified END,
    stripe_account_id = CASE WHEN p_patch ? 'stripe_account_id' THEN p_patch->>'stripe_account_id' ELSE stripe_account_id END,
    stripe_onboarding_complete = CASE WHEN p_patch ? 'stripe_onboarding_complete' THEN (p_patch->>'stripe_onboarding_complete')::boolean ELSE stripe_onboarding_complete END,
    stripe_charges_enabled = CASE WHEN p_patch ? 'stripe_charges_enabled' THEN (p_patch->>'stripe_charges_enabled')::boolean ELSE stripe_charges_enabled END,
    updated_at = NOW()
  WHERE id = p_id
  RETURNING * INTO v_after;

  INSERT INTO admin_audit_log (admin_id, entity_type, entity_id, action, before, after, reason)
  VALUES (auth.uid(), 'food_truck', p_id, 'update', to_jsonb(v_before), to_jsonb(v_after), p_reason);

  RETURN v_after;
END;
$$;

REVOKE ALL ON FUNCTION admin_update_truck(UUID, JSONB, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION admin_update_truck(UUID, JSONB, TEXT) TO authenticated;

-- ─────────────────────────────────────────────────────────────────────────────
-- admin_soft_delete_truck — sets deleted_at; reversible via admin_restore_truck
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
  IF NOT FOUND THEN
    RAISE EXCEPTION 'truck % not found', p_id USING ERRCODE = 'P0002';
  END IF;

  UPDATE food_trucks
  SET deleted_at = NOW(), updated_at = NOW()
  WHERE id = p_id
  RETURNING * INTO v_after;

  INSERT INTO admin_audit_log (admin_id, entity_type, entity_id, action, before, after, reason)
  VALUES (auth.uid(), 'food_truck', p_id, 'soft_delete', to_jsonb(v_before), to_jsonb(v_after), p_reason);

  RETURN v_after;
END;
$$;

REVOKE ALL ON FUNCTION admin_soft_delete_truck(UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION admin_soft_delete_truck(UUID, TEXT) TO authenticated;

-- ─────────────────────────────────────────────────────────────────────────────
-- admin_restore_truck — clears deleted_at and suspended_at
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
  IF NOT FOUND THEN
    RAISE EXCEPTION 'truck % not found', p_id USING ERRCODE = 'P0002';
  END IF;

  UPDATE food_trucks
  SET deleted_at = NULL, suspended_at = NULL, suspension_reason = NULL, updated_at = NOW()
  WHERE id = p_id
  RETURNING * INTO v_after;

  INSERT INTO admin_audit_log (admin_id, entity_type, entity_id, action, before, after, reason)
  VALUES (auth.uid(), 'food_truck', p_id, 'restore', to_jsonb(v_before), to_jsonb(v_after), p_reason);

  RETURN v_after;
END;
$$;

REVOKE ALL ON FUNCTION admin_restore_truck(UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION admin_restore_truck(UUID, TEXT) TO authenticated;

-- ─────────────────────────────────────────────────────────────────────────────
-- admin_suspend_truck — sets suspended_at; hides from public
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
  IF NOT FOUND THEN
    RAISE EXCEPTION 'truck % not found', p_id USING ERRCODE = 'P0002';
  END IF;

  UPDATE food_trucks
  SET suspended_at = NOW(), suspension_reason = p_reason, updated_at = NOW()
  WHERE id = p_id
  RETURNING * INTO v_after;

  INSERT INTO admin_audit_log (admin_id, entity_type, entity_id, action, before, after, reason)
  VALUES (auth.uid(), 'food_truck', p_id, 'suspend', to_jsonb(v_before), to_jsonb(v_after), p_reason);

  RETURN v_after;
END;
$$;

REVOKE ALL ON FUNCTION admin_suspend_truck(UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION admin_suspend_truck(UUID, TEXT) TO authenticated;

-- ─────────────────────────────────────────────────────────────────────────────
-- admin_transfer_truck_owner — reassign owner_id
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

  -- Validate new owner exists and is an owner profile
  IF NOT EXISTS (SELECT 1 FROM owners WHERE id = p_new_owner_id) THEN
    RAISE EXCEPTION 'new owner % not found in owners table', p_new_owner_id
      USING ERRCODE = 'P0002';
  END IF;

  SELECT * INTO v_before FROM food_trucks WHERE id = p_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'truck % not found', p_id USING ERRCODE = 'P0002';
  END IF;

  UPDATE food_trucks
  SET owner_id = p_new_owner_id, updated_at = NOW()
  WHERE id = p_id
  RETURNING * INTO v_after;

  INSERT INTO admin_audit_log (admin_id, entity_type, entity_id, action, before, after, reason)
  VALUES (auth.uid(), 'food_truck', p_id, 'transfer_owner', to_jsonb(v_before), to_jsonb(v_after), p_reason);

  RETURN v_after;
END;
$$;

REVOKE ALL ON FUNCTION admin_transfer_truck_owner(UUID, UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION admin_transfer_truck_owner(UUID, UUID, TEXT) TO authenticated;

-- ─────────────────────────────────────────────────────────────────────────────
-- admin_hide_review — soft moderation of reviews
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
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'not authorized' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO v_before FROM reviews WHERE id = p_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'review % not found', p_id USING ERRCODE = 'P0002';
  END IF;

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

  RETURN v_after;
END;
$$;

REVOKE ALL ON FUNCTION admin_hide_review(UUID, BOOLEAN, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION admin_hide_review(UUID, BOOLEAN, TEXT) TO authenticated;

-- ─────────────────────────────────────────────────────────────────────────────
-- admin_force_cancel_order — cancels an order in any state, audited
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION admin_force_cancel_order(
  p_id UUID,
  p_reason TEXT
)
RETURNS orders
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_before orders;
  v_after orders;
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'not authorized' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO v_before FROM orders WHERE id = p_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'order % not found', p_id USING ERRCODE = 'P0002';
  END IF;

  UPDATE orders
  SET status = 'cancelled', rejected_reason = p_reason, updated_at = NOW()
  WHERE id = p_id
  RETURNING * INTO v_after;

  -- Best-effort transition row (optional table, may not exist in all envs)
  BEGIN
    INSERT INTO order_status_transitions (order_id, from_status, to_status, actor_id, note)
    VALUES (p_id, v_before.status, 'cancelled', auth.uid(), 'admin force-cancel: ' || COALESCE(p_reason, ''));
  EXCEPTION WHEN undefined_table THEN
    NULL;
  END;

  INSERT INTO admin_audit_log (admin_id, entity_type, entity_id, action, before, after, reason)
  VALUES (auth.uid(), 'order', p_id, 'force_cancel_order', to_jsonb(v_before), to_jsonb(v_after), p_reason);

  RETURN v_after;
END;
$$;

REVOKE ALL ON FUNCTION admin_force_cancel_order(UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION admin_force_cancel_order(UUID, TEXT) TO authenticated;
