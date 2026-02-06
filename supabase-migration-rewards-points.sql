-- Migration: Wire up rewards/points system
-- Run this in Supabase SQL Editor

-- Function to award points when an order is completed
-- Awards 10 points per $1 spent (matching UI copy)
CREATE OR REPLACE FUNCTION award_order_points()
RETURNS TRIGGER AS $$
DECLARE
  points_to_award INTEGER;
BEGIN
  -- Only fire when status changes to 'completed'
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    -- Calculate points: 10 points per dollar
    points_to_award := FLOOR(NEW.total * 10);

    IF points_to_award > 0 THEN
      -- Insert points transaction
      INSERT INTO points_transactions (customer_id, points, reason, related_entity_type, related_entity_id)
      VALUES (NEW.customer_id, points_to_award, 'Order completed', 'order', NEW.id);

      -- Update customer's total points
      UPDATE customers
      SET points = COALESCE(points, 0) + points_to_award
      WHERE id = NEW.customer_id;

      -- Insert a check-in for punch card tracking
      INSERT INTO check_ins (customer_id, truck_id, points_earned)
      VALUES (NEW.customer_id, NEW.truck_id, points_to_award);
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on orders table
DROP TRIGGER IF EXISTS trigger_award_order_points ON orders;
CREATE TRIGGER trigger_award_order_points
  AFTER UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION award_order_points();

-- Function to claim a punch card reward (called from client)
CREATE OR REPLACE FUNCTION claim_punch_card_reward(p_customer_id UUID, p_truck_id UUID)
RETURNS JSONB AS $$
DECLARE
  punch_count INTEGER;
  result JSONB;
BEGIN
  -- Count check-ins for this customer at this truck
  SELECT COUNT(*) INTO punch_count
  FROM check_ins
  WHERE customer_id = p_customer_id AND truck_id = p_truck_id;

  IF punch_count >= 10 THEN
    -- Award bonus points for completing a punch card
    INSERT INTO points_transactions (customer_id, points, reason, related_entity_type, related_entity_id)
    VALUES (p_customer_id, 100, 'Punch card reward', 'truck', p_truck_id);

    UPDATE customers
    SET points = COALESCE(points, 0) + 100
    WHERE id = p_customer_id;

    -- Delete the used check-ins (reset the punch card)
    DELETE FROM check_ins
    WHERE customer_id = p_customer_id
      AND truck_id = p_truck_id
      AND id IN (
        SELECT id FROM check_ins
        WHERE customer_id = p_customer_id AND truck_id = p_truck_id
        ORDER BY created_at ASC
        LIMIT 10
      );

    result := jsonb_build_object('success', true, 'points_awarded', 100, 'message', 'Punch card reward claimed!');
  ELSE
    result := jsonb_build_object('success', false, 'punches', punch_count, 'message', 'Not enough punches yet');
  END IF;

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
