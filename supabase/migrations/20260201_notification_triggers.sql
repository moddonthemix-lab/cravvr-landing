-- =====================================================
-- Database Triggers for Automatic Notification Creation
-- =====================================================

-- Trigger 1: Notify truck owner when a new order is placed
-- =====================================================
CREATE OR REPLACE FUNCTION notify_owner_new_order()
RETURNS TRIGGER AS $$
DECLARE
  owner_id UUID;
  truck_name TEXT;
BEGIN
  -- Get owner_id and truck name
  SELECT ft.owner_id, ft.name INTO owner_id, truck_name
  FROM food_trucks ft
  WHERE ft.id = NEW.truck_id;

  -- Insert notification for owner
  IF owner_id IS NOT NULL THEN
    INSERT INTO notifications (user_id, type, title, message, data)
    VALUES (
      owner_id,
      'new_order',
      'New Order!',
      'New order #' || COALESCE(NEW.order_number, LEFT(NEW.id::text, 8)) || ' - $' || NEW.total,
      jsonb_build_object('order_id', NEW.id, 'truck_id', NEW.truck_id, 'total', NEW.total)
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_new_order ON orders;
CREATE TRIGGER on_new_order
  AFTER INSERT ON orders
  FOR EACH ROW
  EXECUTE FUNCTION notify_owner_new_order();


-- Trigger 2: Notify customer when order status changes
-- =====================================================
CREATE OR REPLACE FUNCTION notify_customer_order_status()
RETURNS TRIGGER AS $$
DECLARE
  truck_name TEXT;
  notification_type TEXT;
  notification_title TEXT;
  notification_message TEXT;
BEGIN
  -- Only notify on status changes
  IF OLD.status = NEW.status THEN
    RETURN NEW;
  END IF;

  -- Get truck name
  SELECT name INTO truck_name
  FROM food_trucks
  WHERE id = NEW.truck_id;

  -- Determine notification type and message based on status
  CASE NEW.status
    WHEN 'confirmed' THEN
      notification_type := 'order_confirmed';
      notification_title := 'Order Confirmed';
      notification_message := 'Your order #' || COALESCE(NEW.order_number, LEFT(NEW.id::text, 8)) || ' from ' || COALESCE(truck_name, 'the food truck') || ' has been confirmed.';
    WHEN 'preparing' THEN
      notification_type := 'order_status_update';
      notification_title := 'Order Being Prepared';
      notification_message := 'Your order #' || COALESCE(NEW.order_number, LEFT(NEW.id::text, 8)) || ' is now being prepared.';
    WHEN 'ready' THEN
      notification_type := 'order_ready';
      notification_title := 'Order Ready!';
      notification_message := 'Your order #' || COALESCE(NEW.order_number, LEFT(NEW.id::text, 8)) || ' from ' || COALESCE(truck_name, 'the food truck') || ' is ready for pickup!';
    WHEN 'completed' THEN
      notification_type := 'order_status_update';
      notification_title := 'Order Complete';
      notification_message := 'Your order #' || COALESCE(NEW.order_number, LEFT(NEW.id::text, 8)) || ' has been completed. Enjoy!';
    WHEN 'cancelled' THEN
      notification_type := 'order_status_update';
      notification_title := 'Order Cancelled';
      notification_message := 'Your order #' || COALESCE(NEW.order_number, LEFT(NEW.id::text, 8)) || ' has been cancelled.';
    ELSE
      -- Don't notify for other status changes
      RETURN NEW;
  END CASE;

  -- Insert notification for customer
  INSERT INTO notifications (user_id, type, title, message, data)
  VALUES (
    NEW.customer_id,
    notification_type,
    notification_title,
    notification_message,
    jsonb_build_object('order_id', NEW.id, 'truck_id', NEW.truck_id, 'status', NEW.status)
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_order_status_change ON orders;
CREATE TRIGGER on_order_status_change
  AFTER UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION notify_customer_order_status();


-- Trigger 3: Notify truck owner when they receive a new review
-- =====================================================
CREATE OR REPLACE FUNCTION notify_owner_new_review()
RETURNS TRIGGER AS $$
DECLARE
  owner_id UUID;
  truck_name TEXT;
BEGIN
  -- Get owner_id and truck name
  SELECT ft.owner_id, ft.name INTO owner_id, truck_name
  FROM food_trucks ft
  WHERE ft.id = NEW.truck_id;

  -- Insert notification for owner
  IF owner_id IS NOT NULL THEN
    INSERT INTO notifications (user_id, type, title, message, data)
    VALUES (
      owner_id,
      'new_review',
      'New Review',
      'New ' || NEW.rating || '-star review on ' || COALESCE(truck_name, 'your truck'),
      jsonb_build_object('review_id', NEW.id, 'truck_id', NEW.truck_id, 'rating', NEW.rating)
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_new_review ON reviews;
CREATE TRIGGER on_new_review
  AFTER INSERT ON reviews
  FOR EACH ROW
  EXECUTE FUNCTION notify_owner_new_review();


-- Trigger 4: Notify all admins when a new user signs up
-- =====================================================
CREATE OR REPLACE FUNCTION notify_admins_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert notification for all admins
  INSERT INTO notifications (user_id, type, title, message, data)
  SELECT
    p.id,
    'new_user_signup',
    'New User',
    COALESCE(NEW.name, 'Someone') || ' signed up as ' || COALESCE(NEW.role, 'customer'),
    jsonb_build_object('user_id', NEW.id, 'email', NEW.email, 'role', NEW.role)
  FROM profiles p
  WHERE p.role = 'admin';

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_new_user ON profiles;
CREATE TRIGGER on_new_user
  AFTER INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION notify_admins_new_user();


-- Trigger 5: Notify all admins when a new truck is registered
-- =====================================================
CREATE OR REPLACE FUNCTION notify_admins_new_truck()
RETURNS TRIGGER AS $$
DECLARE
  owner_name TEXT;
BEGIN
  -- Get owner name
  SELECT name INTO owner_name
  FROM profiles
  WHERE id = NEW.owner_id;

  -- Insert notification for all admins
  INSERT INTO notifications (user_id, type, title, message, data)
  SELECT
    p.id,
    'new_truck_registered',
    'New Truck',
    NEW.name || ' was registered by ' || COALESCE(owner_name, 'an owner'),
    jsonb_build_object('truck_id', NEW.id, 'owner_id', NEW.owner_id)
  FROM profiles p
  WHERE p.role = 'admin';

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_new_truck ON food_trucks;
CREATE TRIGGER on_new_truck
  AFTER INSERT ON food_trucks
  FOR EACH ROW
  EXECUTE FUNCTION notify_admins_new_truck();


-- Comments
-- =====================================================
COMMENT ON FUNCTION notify_owner_new_order() IS 'Creates notification for truck owner when a new order is placed';
COMMENT ON FUNCTION notify_customer_order_status() IS 'Creates notification for customer when their order status changes';
COMMENT ON FUNCTION notify_owner_new_review() IS 'Creates notification for truck owner when they receive a new review';
COMMENT ON FUNCTION notify_admins_new_user() IS 'Creates notification for all admins when a new user signs up';
COMMENT ON FUNCTION notify_admins_new_truck() IS 'Creates notification for all admins when a new truck is registered';
