-- 033_admin_create_truck_and_owner_rpcs.sql
-- Adds two SECURITY DEFINER RPCs that admins use through the admin panel:
--  1) admin_create_truck — provision a new truck for an existing owner
--  2) admin_update_owner — edit owner business profile (business_name, tax_id,
--     business_address, phone, notification_preferences)
-- Both audited via admin_audit_log.
-- Safe to re-run.

-- ─────────────────────────────────────────────────────────────────────────────
-- admin_create_truck
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION admin_create_truck(
  p_owner_id UUID,
  p_patch JSONB,
  p_reason TEXT DEFAULT NULL
)
RETURNS food_trucks
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_after food_trucks;
  v_name TEXT;
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'not authorized' USING ERRCODE = '42501';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM owners WHERE id = p_owner_id) THEN
    RAISE EXCEPTION 'owner % not found in owners table', p_owner_id USING ERRCODE = 'P0002';
  END IF;

  v_name := COALESCE(p_patch->>'name', 'New Truck');

  INSERT INTO food_trucks (
    owner_id, name, slug, description, cuisine, location, coordinates,
    price_range, hours, phone, website, instagram, image_url,
    is_open, accepting_orders, max_queue_size, auto_pause_enabled,
    estimated_prep_time, featured, verified, created_at, updated_at
  ) VALUES (
    p_owner_id,
    v_name,
    NULLIF(p_patch->>'slug', ''),
    p_patch->>'description',
    COALESCE(p_patch->>'cuisine', 'Other'),
    p_patch->>'location',
    COALESCE(p_patch->'coordinates', NULL),
    COALESCE(p_patch->>'price_range', '$'),
    COALESCE(p_patch->'hours', '{}'::jsonb),
    p_patch->>'phone',
    p_patch->>'website',
    p_patch->>'instagram',
    p_patch->>'image_url',
    COALESCE((p_patch->>'is_open')::boolean, false),
    COALESCE((p_patch->>'accepting_orders')::boolean, true),
    COALESCE((p_patch->>'max_queue_size')::int, 10),
    COALESCE((p_patch->>'auto_pause_enabled')::boolean, false),
    COALESCE(p_patch->>'estimated_prep_time', '15-25 min'),
    COALESCE((p_patch->>'featured')::boolean, false),
    COALESCE((p_patch->>'verified')::boolean, false),
    NOW(),
    NOW()
  )
  RETURNING * INTO v_after;

  INSERT INTO admin_audit_log (admin_id, entity_type, entity_id, action, before, after, reason)
  VALUES (auth.uid(), 'food_truck', v_after.id, 'create', NULL, to_jsonb(v_after), p_reason);

  PERFORM _admin_notify(
    p_owner_id,
    'system_alert',
    'A new truck was added to your account',
    'Administrator created ' || v_after.name || ' on your account.',
    jsonb_build_object('action', 'admin_create_truck', 'truck_id', v_after.id, 'truck_name', v_after.name, 'reason', p_reason)
  );

  RETURN v_after;
END;
$$;

REVOKE ALL ON FUNCTION admin_create_truck(UUID, JSONB, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION admin_create_truck(UUID, JSONB, TEXT) TO authenticated;

-- ─────────────────────────────────────────────────────────────────────────────
-- admin_update_owner — edit owner business profile
-- Patch keys allowlisted to business fields only; never role, subscription,
-- or events_created_this_month.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION admin_update_owner(
  p_id UUID,
  p_patch JSONB,
  p_reason TEXT DEFAULT NULL
)
RETURNS owners
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_before owners;
  v_after owners;
  v_key TEXT;
  v_allowed TEXT[] := ARRAY[
    'business_name','tax_id','business_address','phone','notification_preferences'
  ];
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'not authorized' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO v_before FROM owners WHERE id = p_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'owner % not found', p_id USING ERRCODE = 'P0002';
  END IF;

  FOR v_key IN SELECT jsonb_object_keys(p_patch) LOOP
    IF NOT (v_key = ANY(v_allowed)) THEN
      RAISE EXCEPTION 'field % is not allowed via admin_update_owner', v_key
        USING ERRCODE = '22023';
    END IF;
  END LOOP;

  UPDATE owners
  SET
    business_name = CASE WHEN p_patch ? 'business_name' THEN p_patch->>'business_name' ELSE business_name END,
    tax_id = CASE WHEN p_patch ? 'tax_id' THEN p_patch->>'tax_id' ELSE tax_id END,
    business_address = CASE WHEN p_patch ? 'business_address' THEN p_patch->>'business_address' ELSE business_address END,
    phone = CASE WHEN p_patch ? 'phone' THEN p_patch->>'phone' ELSE phone END,
    notification_preferences = CASE WHEN p_patch ? 'notification_preferences' THEN p_patch->'notification_preferences' ELSE notification_preferences END
  WHERE id = p_id
  RETURNING * INTO v_after;

  INSERT INTO admin_audit_log (admin_id, entity_type, entity_id, action, before, after, reason)
  VALUES (auth.uid(), 'owner', p_id, 'update', to_jsonb(v_before), to_jsonb(v_after), p_reason);

  RETURN v_after;
END;
$$;

REVOKE ALL ON FUNCTION admin_update_owner(UUID, JSONB, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION admin_update_owner(UUID, JSONB, TEXT) TO authenticated;
