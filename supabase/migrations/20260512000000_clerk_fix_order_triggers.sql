-- 20260512000000_clerk_fix_order_triggers.sql
--
-- Post-Clerk-migration cleanup: trigger functions that declared user-id
-- locals as UUID need to be TEXT now.
--
-- Symptom: on every order INSERT, notify_owner_new_order fired and tried
-- to assign food_trucks.owner_id (now TEXT) into a `owner_id UUID` local,
-- failing with "invalid input syntax for type uuid: 'user_xxx...'" and
-- aborting the order.

CREATE OR REPLACE FUNCTION public.notify_owner_new_order()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  v_owner_id TEXT;
  truck_name TEXT;
BEGIN
  SELECT ft.owner_id, ft.name INTO v_owner_id, truck_name
  FROM food_trucks ft
  WHERE ft.id = NEW.truck_id;

  IF v_owner_id IS NOT NULL THEN
    INSERT INTO notifications (user_id, type, title, message, data)
    VALUES (
      v_owner_id,
      'new_order',
      'New Order!',
      'New order #' || COALESCE(NEW.order_number, LEFT(NEW.id::text, 8)) || ' - $' || NEW.total,
      jsonb_build_object('order_id', NEW.id, 'truck_id', NEW.truck_id, 'total', NEW.total)
    );
  END IF;

  RETURN NEW;
END;
$function$;

-- NOTE: the following functions still declare UUID params/locals for what
-- are now Clerk TEXT user IDs. They'll throw "invalid input syntax for
-- type uuid" when called from features that hit them:
--   claim_punch_card_reward(p_customer_id uuid, p_truck_id uuid)
--   admin_create_truck(p_owner_id uuid, ...)
--   admin_update_owner(p_id uuid, ...)
--   admin_transfer_truck_owner(p_id uuid, p_new_owner_id uuid, ...)
--   _admin_notify(p_user_id uuid, ...)
--   attribution_last_touch(p_user_id uuid, ...)
--   has_active_plus(p_owner_id uuid)
--   (and other admin_* functions that take p_id uuid for owner/customer rows)
-- They'll need similar TEXT updates when those features are exercised.
