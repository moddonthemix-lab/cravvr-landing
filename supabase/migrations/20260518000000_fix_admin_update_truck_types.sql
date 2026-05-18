-- Fix admin_update_truck type mismatches.
--
-- Two bugs caused "CASE types text and jsonb cannot be matched" on every call:
--   1. hours column is text, but CASE branch used p_patch->'hours' (jsonb) instead of ->>
--   2. estimated_prep_time column is text, but value was cast to ::int
-- Because PL/pgSQL parses statements at execution, the function created fine
-- but failed at planning time on every UPDATE.

CREATE OR REPLACE FUNCTION public.admin_update_truck(p_id uuid, p_patch jsonb, p_reason text DEFAULT NULL::text)
 RETURNS food_trucks
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
    NULL;
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
    hours = CASE WHEN p_patch ? 'hours' THEN p_patch->>'hours' ELSE hours END,
    phone = CASE WHEN p_patch ? 'phone' THEN p_patch->>'phone' ELSE phone END,
    website = CASE WHEN p_patch ? 'website' THEN p_patch->>'website' ELSE website END,
    instagram = CASE WHEN p_patch ? 'instagram' THEN p_patch->>'instagram' ELSE instagram END,
    image_url = CASE WHEN p_patch ? 'image_url' THEN p_patch->>'image_url' ELSE image_url END,
    features = CASE WHEN p_patch ? 'features' THEN ARRAY(SELECT jsonb_array_elements_text(p_patch->'features')) ELSE features END,
    is_open = CASE WHEN p_patch ? 'is_open' THEN (p_patch->>'is_open')::boolean ELSE is_open END,
    accepting_orders = CASE WHEN p_patch ? 'accepting_orders' THEN (p_patch->>'accepting_orders')::boolean ELSE accepting_orders END,
    max_queue_size = CASE WHEN p_patch ? 'max_queue_size' THEN (p_patch->>'max_queue_size')::int ELSE max_queue_size END,
    auto_pause_enabled = CASE WHEN p_patch ? 'auto_pause_enabled' THEN (p_patch->>'auto_pause_enabled')::boolean ELSE auto_pause_enabled END,
    estimated_prep_time = CASE WHEN p_patch ? 'estimated_prep_time' THEN p_patch->>'estimated_prep_time' ELSE estimated_prep_time END,
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
$function$;
