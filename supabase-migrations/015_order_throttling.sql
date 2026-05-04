-- Migration: Order throttling and kitchen capacity controls
-- Run this in Supabase SQL Editor

-- ============================================
-- 1. ADD THROTTLING COLUMNS TO FOOD_TRUCKS
-- ============================================

ALTER TABLE food_trucks ADD COLUMN IF NOT EXISTS accepting_orders BOOLEAN DEFAULT true;
ALTER TABLE food_trucks ADD COLUMN IF NOT EXISTS max_queue_size INTEGER DEFAULT 20;
ALTER TABLE food_trucks ADD COLUMN IF NOT EXISTS auto_pause_enabled BOOLEAN DEFAULT false;

-- ============================================
-- 2. CREATE check_truck_accepting_orders RPC
-- ============================================

CREATE OR REPLACE FUNCTION check_truck_accepting_orders(p_truck_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_truck RECORD;
  v_active_count INTEGER;
BEGIN
  -- Check if truck exists
  SELECT * INTO v_truck
  FROM food_trucks
  WHERE id = p_truck_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'accepting', false,
      'reason', 'Truck not found',
      'queue_size', 0
    );
  END IF;

  -- Check if truck is open
  IF NOT v_truck.is_open THEN
    RETURN jsonb_build_object(
      'accepting', false,
      'reason', 'Truck is currently closed',
      'queue_size', 0
    );
  END IF;

  -- Check if truck is accepting orders
  IF NOT v_truck.accepting_orders THEN
    RETURN jsonb_build_object(
      'accepting', false,
      'reason', 'Truck is not accepting orders right now',
      'queue_size', 0
    );
  END IF;

  -- Count active orders
  SELECT COUNT(*) INTO v_active_count
  FROM orders
  WHERE truck_id = p_truck_id
    AND status IN ('pending', 'confirmed', 'preparing', 'ready');

  -- If auto_pause_enabled and queue is full, return not accepting
  IF v_truck.auto_pause_enabled AND v_active_count >= v_truck.max_queue_size THEN
    RETURN jsonb_build_object(
      'accepting', false,
      'reason', 'Kitchen is at full capacity, please try again shortly',
      'queue_size', v_active_count
    );
  END IF;

  -- Truck is accepting orders
  RETURN jsonb_build_object(
    'accepting', true,
    'reason', NULL,
    'queue_size', v_active_count
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 3. CREATE AUTO-PAUSE TRIGGER
-- ============================================

CREATE OR REPLACE FUNCTION auto_pause_if_queue_full()
RETURNS TRIGGER AS $$
DECLARE
  v_truck RECORD;
  v_active_count INTEGER;
BEGIN
  -- Fetch the truck
  SELECT accepting_orders, auto_pause_enabled, max_queue_size
  INTO v_truck
  FROM food_trucks
  WHERE id = NEW.truck_id;

  -- Only proceed if auto_pause is enabled and truck is currently accepting
  IF v_truck.auto_pause_enabled AND v_truck.accepting_orders THEN
    -- Count active orders for this truck
    SELECT COUNT(*) INTO v_active_count
    FROM orders
    WHERE truck_id = NEW.truck_id
      AND status IN ('pending', 'confirmed', 'preparing', 'ready');

    -- If at or over capacity, pause accepting orders
    IF v_active_count >= v_truck.max_queue_size THEN
      UPDATE food_trucks
      SET accepting_orders = false
      WHERE id = NEW.truck_id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger on orders table
DROP TRIGGER IF EXISTS trigger_auto_pause_if_queue_full ON orders;
CREATE TRIGGER trigger_auto_pause_if_queue_full
  AFTER INSERT ON orders
  FOR EACH ROW
  EXECUTE FUNCTION auto_pause_if_queue_full();

-- ============================================
-- 4. RLS POLICIES FOR THROTTLING COLUMNS
-- ============================================
-- The existing "Owners can update own trucks" policy already covers
-- updating accepting_orders, max_queue_size, and auto_pause_enabled
-- since it uses: FOR UPDATE USING (auth.uid() = owner_id)
--
-- The existing "Food trucks viewable by everyone" policy already
-- covers reading these columns.
--
-- No additional policies are needed, but we add a comment for clarity.

-- Verify existing policies cover the new columns (no action needed):
-- "Food trucks viewable by everyone" ON food_trucks FOR SELECT USING (true)
-- "Owners can update own trucks" ON food_trucks FOR UPDATE USING (auth.uid() = owner_id)
