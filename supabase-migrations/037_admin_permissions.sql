-- 037_admin_permissions.sql
-- Granular admin permissions, layered on top of is_admin().
--
-- Policy: every admin RPC still requires is_admin(). On top of that we now
-- check has_admin_permission('<permission-name>'). To keep existing admins
-- working out of the box (they're all superadmins today), the helper returns
-- TRUE when:
--   1) the admin's permissions JSONB contains "*", OR
--   2) it contains the specific permission, OR
--   3) the row in `admins` is missing or has empty/NULL permissions.
--
-- New admins (added via UI later) should be created with an explicit
-- permissions array; missing-row fallback is just a backstop so this
-- migration doesn't lock anyone out today.
--
-- Permission vocabulary:
--   truck.write           edit profile/hours/photos/settings
--   truck.create          create new trucks
--   truck.delete          soft-delete / restore
--   truck.suspend         suspend / lift suspension
--   truck.transfer_owner  reassign owner
--   truck.flags           toggle featured / verified
--   menu.write            CRUD menu items
--   review.hide           hide / restore reviews
--   order.force_cancel    force-cancel orders
--   owner.write           edit owners.business_*
--   *                     superadmin
--
-- Safe to re-run.

-- ─────────────────────────────────────────────────────────────────────────────
-- Helper
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION has_admin_permission(p_perm TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_perms JSONB;
BEGIN
  IF NOT is_admin() THEN
    RETURN false;
  END IF;
  SELECT permissions INTO v_perms FROM admins WHERE id = auth.uid();
  -- No admins row, or empty permissions JSONB → treat as superadmin (backstop).
  IF v_perms IS NULL OR v_perms = '{}'::jsonb OR v_perms = '[]'::jsonb THEN
    RETURN true;
  END IF;
  -- Accept either a JSON array of strings, or an object with array under "permissions".
  IF jsonb_typeof(v_perms) = 'array' THEN
    RETURN v_perms ? '*' OR v_perms ? p_perm;
  END IF;
  IF jsonb_typeof(v_perms) = 'object' THEN
    -- Common shapes: {"permissions": ["truck.write", ...]} or flat keys.
    IF v_perms ? 'permissions' AND jsonb_typeof(v_perms->'permissions') = 'array' THEN
      RETURN (v_perms->'permissions') ? '*' OR (v_perms->'permissions') ? p_perm;
    END IF;
    -- Flat object: permission name → boolean true
    RETURN COALESCE((v_perms ? '*'), false)
        OR COALESCE((v_perms->>p_perm)::boolean, false);
  END IF;
  RETURN false;
END;
$$;

GRANT EXECUTE ON FUNCTION has_admin_permission(TEXT) TO authenticated;

-- ─────────────────────────────────────────────────────────────────────────────
-- Re-create admin RPCs with permission gates layered on top of is_admin().
-- Body otherwise identical to 029/032/033.
-- ─────────────────────────────────────────────────────────────────────────────

-- admin_update_truck → truck.write (or truck.flags if patch only flips flags,
-- but for simplicity we require truck.write for any update)
CREATE OR REPLACE FUNCTION admin_update_truck(
  p_id UUID, p_patch JSONB, p_reason TEXT DEFAULT NULL
)
RETURNS food_trucks
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_before food_trucks;
  v_after food_trucks;
  v_key TEXT;
  v_only_flags BOOLEAN := true;
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

  -- Determine if patch is just flag toggles → cheaper permission needed.
  FOR v_key IN SELECT jsonb_object_keys(p_patch) LOOP
    IF NOT (v_key = ANY(v_allowed)) THEN
      RAISE EXCEPTION 'field % is not allowed via admin_update_truck', v_key
        USING ERRCODE = '22023';
    END IF;
    IF v_key NOT IN ('featured','verified','is_open','accepting_orders') THEN
      v_only_flags := false;
    END IF;
  END LOOP;

  IF v_only_flags AND has_admin_permission('truck.flags') THEN
    NULL; -- ok
  ELSIF NOT has_admin_permission('truck.write') THEN
    RAISE EXCEPTION 'permission truck.write required' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO v_before FROM food_trucks WHERE id = p_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'truck % not found', p_id USING ERRCODE = 'P0002';
  END IF;

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

-- admin_soft_delete_truck → truck.delete
CREATE OR REPLACE FUNCTION admin_soft_delete_truck(p_id UUID, p_reason TEXT DEFAULT NULL)
RETURNS food_trucks
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE v_before food_trucks; v_after food_trucks;
BEGIN
  IF NOT has_admin_permission('truck.delete') THEN
    RAISE EXCEPTION 'permission truck.delete required' USING ERRCODE = '42501';
  END IF;
  SELECT * INTO v_before FROM food_trucks WHERE id = p_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'truck % not found', p_id USING ERRCODE = 'P0002'; END IF;
  UPDATE food_trucks SET deleted_at = NOW(), updated_at = NOW() WHERE id = p_id RETURNING * INTO v_after;
  INSERT INTO admin_audit_log (admin_id, entity_type, entity_id, action, before, after, reason)
  VALUES (auth.uid(), 'food_truck', p_id, 'soft_delete', to_jsonb(v_before), to_jsonb(v_after), p_reason);
  PERFORM _admin_notify(v_after.owner_id, 'system_alert', 'Your truck was removed',
    COALESCE('Reason: ' || p_reason, 'An administrator removed ' || v_after.name || '.'),
    jsonb_build_object('action','soft_delete','truck_id', v_after.id, 'truck_name', v_after.name, 'reason', p_reason));
  RETURN v_after;
END; $$;

-- admin_restore_truck → truck.delete (same permission as delete: lifecycle)
CREATE OR REPLACE FUNCTION admin_restore_truck(p_id UUID, p_reason TEXT DEFAULT NULL)
RETURNS food_trucks
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE v_before food_trucks; v_after food_trucks;
BEGIN
  IF NOT (has_admin_permission('truck.delete') OR has_admin_permission('truck.suspend')) THEN
    RAISE EXCEPTION 'permission truck.delete or truck.suspend required' USING ERRCODE = '42501';
  END IF;
  SELECT * INTO v_before FROM food_trucks WHERE id = p_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'truck % not found', p_id USING ERRCODE = 'P0002'; END IF;
  UPDATE food_trucks SET deleted_at = NULL, suspended_at = NULL, suspension_reason = NULL, updated_at = NOW()
   WHERE id = p_id RETURNING * INTO v_after;
  INSERT INTO admin_audit_log (admin_id, entity_type, entity_id, action, before, after, reason)
  VALUES (auth.uid(), 'food_truck', p_id, 'restore', to_jsonb(v_before), to_jsonb(v_after), p_reason);
  PERFORM _admin_notify(v_after.owner_id, 'system_alert', 'Your truck was restored',
    v_after.name || ' is visible to customers again.',
    jsonb_build_object('action','restore','truck_id', v_after.id, 'truck_name', v_after.name));
  RETURN v_after;
END; $$;

-- admin_suspend_truck → truck.suspend
CREATE OR REPLACE FUNCTION admin_suspend_truck(p_id UUID, p_reason TEXT DEFAULT NULL)
RETURNS food_trucks
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE v_before food_trucks; v_after food_trucks;
BEGIN
  IF NOT has_admin_permission('truck.suspend') THEN
    RAISE EXCEPTION 'permission truck.suspend required' USING ERRCODE = '42501';
  END IF;
  SELECT * INTO v_before FROM food_trucks WHERE id = p_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'truck % not found', p_id USING ERRCODE = 'P0002'; END IF;
  UPDATE food_trucks SET suspended_at = NOW(), suspension_reason = p_reason, updated_at = NOW()
   WHERE id = p_id RETURNING * INTO v_after;
  INSERT INTO admin_audit_log (admin_id, entity_type, entity_id, action, before, after, reason)
  VALUES (auth.uid(), 'food_truck', p_id, 'suspend', to_jsonb(v_before), to_jsonb(v_after), p_reason);
  PERFORM _admin_notify(v_after.owner_id, 'system_alert', 'Your truck was suspended',
    COALESCE(p_reason, 'An administrator suspended ' || v_after.name || '.'),
    jsonb_build_object('action','suspend','truck_id', v_after.id, 'truck_name', v_after.name, 'reason', p_reason));
  RETURN v_after;
END; $$;

-- admin_transfer_truck_owner → truck.transfer_owner
CREATE OR REPLACE FUNCTION admin_transfer_truck_owner(p_id UUID, p_new_owner_id UUID, p_reason TEXT DEFAULT NULL)
RETURNS food_trucks
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE v_before food_trucks; v_after food_trucks;
BEGIN
  IF NOT has_admin_permission('truck.transfer_owner') THEN
    RAISE EXCEPTION 'permission truck.transfer_owner required' USING ERRCODE = '42501';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM owners WHERE id = p_new_owner_id) THEN
    RAISE EXCEPTION 'new owner % not found in owners table', p_new_owner_id USING ERRCODE = 'P0002';
  END IF;
  SELECT * INTO v_before FROM food_trucks WHERE id = p_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'truck % not found', p_id USING ERRCODE = 'P0002'; END IF;
  UPDATE food_trucks SET owner_id = p_new_owner_id, updated_at = NOW()
   WHERE id = p_id RETURNING * INTO v_after;
  INSERT INTO admin_audit_log (admin_id, entity_type, entity_id, action, before, after, reason)
  VALUES (auth.uid(), 'food_truck', p_id, 'transfer_owner', to_jsonb(v_before), to_jsonb(v_after), p_reason);
  PERFORM _admin_notify(v_before.owner_id, 'system_alert', 'Truck ownership transferred',
    'Your ownership of ' || v_after.name || ' was transferred.',
    jsonb_build_object('action','transfer_owner','truck_id', v_after.id, 'truck_name', v_after.name, 'reason', p_reason));
  PERFORM _admin_notify(v_after.owner_id, 'system_alert', 'You received a truck',
    v_after.name || ' was assigned to your account.',
    jsonb_build_object('action','received_truck','truck_id', v_after.id, 'truck_name', v_after.name, 'reason', p_reason));
  RETURN v_after;
END; $$;

-- admin_hide_review → review.hide
CREATE OR REPLACE FUNCTION admin_hide_review(p_id UUID, p_hide BOOLEAN, p_reason TEXT DEFAULT NULL)
RETURNS reviews
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE v_before reviews; v_after reviews; v_owner UUID; v_truck_name TEXT;
BEGIN
  IF NOT has_admin_permission('review.hide') THEN
    RAISE EXCEPTION 'permission review.hide required' USING ERRCODE = '42501';
  END IF;
  SELECT * INTO v_before FROM reviews WHERE id = p_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'review % not found', p_id USING ERRCODE = 'P0002'; END IF;
  UPDATE reviews
  SET hidden_at = CASE WHEN p_hide THEN NOW() ELSE NULL END,
      hidden_reason = CASE WHEN p_hide THEN p_reason ELSE NULL END,
      is_hidden = p_hide
   WHERE id = p_id RETURNING * INTO v_after;
  INSERT INTO admin_audit_log (admin_id, entity_type, entity_id, action, before, after, reason)
  VALUES (auth.uid(), 'review', p_id, CASE WHEN p_hide THEN 'hide_review' ELSE 'unhide_review' END,
          to_jsonb(v_before), to_jsonb(v_after), p_reason);
  SELECT owner_id, name INTO v_owner, v_truck_name FROM food_trucks WHERE id = v_after.truck_id;
  IF p_hide THEN
    PERFORM _admin_notify(v_owner, 'flagged_content', 'A review on your truck was hidden',
      'Admin moderated a review on ' || COALESCE(v_truck_name, 'your truck') || '.',
      jsonb_build_object('action','hide_review','review_id', p_id, 'truck_id', v_after.truck_id, 'reason', p_reason));
  END IF;
  RETURN v_after;
END; $$;

-- admin_force_cancel_order → order.force_cancel
CREATE OR REPLACE FUNCTION admin_force_cancel_order(p_id UUID, p_reason TEXT)
RETURNS orders
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE v_before orders; v_after orders;
BEGIN
  IF NOT has_admin_permission('order.force_cancel') THEN
    RAISE EXCEPTION 'permission order.force_cancel required' USING ERRCODE = '42501';
  END IF;
  SELECT * INTO v_before FROM orders WHERE id = p_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'order % not found', p_id USING ERRCODE = 'P0002'; END IF;
  UPDATE orders SET status = 'cancelled', rejected_reason = p_reason, updated_at = NOW()
   WHERE id = p_id RETURNING * INTO v_after;
  BEGIN
    INSERT INTO order_status_transitions (order_id, from_status, to_status, actor_id, note)
    VALUES (p_id, v_before.status, 'cancelled', auth.uid(), 'admin force-cancel: ' || COALESCE(p_reason, ''));
  EXCEPTION WHEN undefined_table THEN NULL; END;
  INSERT INTO admin_audit_log (admin_id, entity_type, entity_id, action, before, after, reason)
  VALUES (auth.uid(), 'order', p_id, 'force_cancel_order', to_jsonb(v_before), to_jsonb(v_after), p_reason);
  RETURN v_after;
END; $$;

-- admin_create_truck → truck.create
CREATE OR REPLACE FUNCTION admin_create_truck(p_owner_id UUID, p_patch JSONB, p_reason TEXT DEFAULT NULL)
RETURNS food_trucks
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE v_after food_trucks; v_name TEXT;
BEGIN
  IF NOT has_admin_permission('truck.create') THEN
    RAISE EXCEPTION 'permission truck.create required' USING ERRCODE = '42501';
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
    p_owner_id, v_name, NULLIF(p_patch->>'slug',''),
    p_patch->>'description', COALESCE(p_patch->>'cuisine','Other'),
    p_patch->>'location', COALESCE(p_patch->'coordinates', NULL),
    COALESCE(p_patch->>'price_range','$'), COALESCE(p_patch->'hours','{}'::jsonb),
    p_patch->>'phone', p_patch->>'website', p_patch->>'instagram', p_patch->>'image_url',
    COALESCE((p_patch->>'is_open')::boolean,false), COALESCE((p_patch->>'accepting_orders')::boolean,true),
    COALESCE((p_patch->>'max_queue_size')::int,10), COALESCE((p_patch->>'auto_pause_enabled')::boolean,false),
    COALESCE(p_patch->>'estimated_prep_time','15-25 min'),
    COALESCE((p_patch->>'featured')::boolean,false), COALESCE((p_patch->>'verified')::boolean,false),
    NOW(), NOW()
  ) RETURNING * INTO v_after;
  INSERT INTO admin_audit_log (admin_id, entity_type, entity_id, action, before, after, reason)
  VALUES (auth.uid(), 'food_truck', v_after.id, 'create', NULL, to_jsonb(v_after), p_reason);
  PERFORM _admin_notify(p_owner_id, 'system_alert', 'A new truck was added to your account',
    'Administrator created ' || v_after.name || ' on your account.',
    jsonb_build_object('action','admin_create_truck','truck_id', v_after.id, 'truck_name', v_after.name));
  RETURN v_after;
END; $$;

-- admin_update_owner → owner.write
CREATE OR REPLACE FUNCTION admin_update_owner(p_id UUID, p_patch JSONB, p_reason TEXT DEFAULT NULL)
RETURNS owners
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE v_before owners; v_after owners; v_key TEXT;
  v_allowed TEXT[] := ARRAY['business_name','tax_id','business_address','phone','notification_preferences'];
BEGIN
  IF NOT has_admin_permission('owner.write') THEN
    RAISE EXCEPTION 'permission owner.write required' USING ERRCODE = '42501';
  END IF;
  SELECT * INTO v_before FROM owners WHERE id = p_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'owner % not found', p_id USING ERRCODE = 'P0002'; END IF;
  FOR v_key IN SELECT jsonb_object_keys(p_patch) LOOP
    IF NOT (v_key = ANY(v_allowed)) THEN
      RAISE EXCEPTION 'field % is not allowed via admin_update_owner', v_key USING ERRCODE = '22023';
    END IF;
  END LOOP;
  UPDATE owners
  SET business_name = CASE WHEN p_patch ? 'business_name' THEN p_patch->>'business_name' ELSE business_name END,
      tax_id = CASE WHEN p_patch ? 'tax_id' THEN p_patch->>'tax_id' ELSE tax_id END,
      business_address = CASE WHEN p_patch ? 'business_address' THEN p_patch->>'business_address' ELSE business_address END,
      phone = CASE WHEN p_patch ? 'phone' THEN p_patch->>'phone' ELSE phone END,
      notification_preferences = CASE WHEN p_patch ? 'notification_preferences' THEN p_patch->'notification_preferences' ELSE notification_preferences END
  WHERE id = p_id RETURNING * INTO v_after;
  INSERT INTO admin_audit_log (admin_id, entity_type, entity_id, action, before, after, reason)
  VALUES (auth.uid(), 'owner', p_id, 'update', to_jsonb(v_before), to_jsonb(v_after), p_reason);
  RETURN v_after;
END; $$;
