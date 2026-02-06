-- Migration: Order State Machine with validated transitions and audit trail
-- Run this in Supabase SQL Editor

-- ============================================
-- 1. ADD 'rejected' TO ORDERS STATUS CONSTRAINT
-- ============================================

-- Drop the existing CHECK constraint and recreate with 'rejected'
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;
ALTER TABLE orders ADD CONSTRAINT orders_status_check
  CHECK (status IN ('pending', 'confirmed', 'preparing', 'ready', 'completed', 'cancelled', 'rejected'));

-- ============================================
-- 2. ADD NEW COLUMNS TO ORDERS TABLE
-- ============================================

ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'unpaid'
  CHECK (payment_status IN ('unpaid', 'pending', 'paid', 'refunded', 'failed'));

ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_intent_id TEXT;

ALTER TABLE orders ADD COLUMN IF NOT EXISTS rejected_reason TEXT;

-- ============================================
-- 3. CREATE ORDER STATUS TRANSITIONS AUDIT TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS order_status_transitions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  from_status TEXT NOT NULL,
  to_status TEXT NOT NULL,
  actor_id UUID NOT NULL REFERENCES auth.users(id),
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_order_status_transitions_order_id
  ON order_status_transitions(order_id);

CREATE INDEX IF NOT EXISTS idx_order_status_transitions_created_at
  ON order_status_transitions(created_at DESC);

-- Enable RLS
ALTER TABLE order_status_transitions ENABLE ROW LEVEL SECURITY;

-- Customers can view transitions for their own orders
CREATE POLICY "Customers can view own order transitions"
  ON order_status_transitions FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_status_transitions.order_id
      AND orders.customer_id = auth.uid()
    )
  );

-- Owners can view transitions for orders on their trucks
CREATE POLICY "Owners can view order transitions for their trucks"
  ON order_status_transitions FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM orders
      JOIN food_trucks ON food_trucks.id = orders.truck_id
      WHERE orders.id = order_status_transitions.order_id
      AND food_trucks.owner_id = auth.uid()
    )
  );

-- System/functions can insert transitions (SECURITY DEFINER functions bypass RLS,
-- but this policy allows service_role and trigger-based inserts)
CREATE POLICY "System can insert order transitions"
  ON order_status_transitions FOR INSERT WITH CHECK (true);

-- ============================================
-- 4. CREATE update_order_status RPC FUNCTION
-- ============================================

CREATE OR REPLACE FUNCTION update_order_status(
  p_order_id UUID,
  p_new_status TEXT,
  p_actor_id UUID DEFAULT auth.uid(),
  p_note TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_order RECORD;
  v_truck RECORD;
  v_is_owner BOOLEAN;
  v_is_customer BOOLEAN;
  v_allowed BOOLEAN := false;
  v_old_status TEXT;
BEGIN
  -- Fetch the order
  SELECT * INTO v_order
  FROM orders
  WHERE id = p_order_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Order not found'
    );
  END IF;

  v_old_status := v_order.status;

  -- Fetch the truck to determine ownership
  SELECT * INTO v_truck
  FROM food_trucks
  WHERE id = v_order.truck_id;

  -- Determine actor role
  v_is_owner := (v_truck.owner_id = p_actor_id);
  v_is_customer := (v_order.customer_id = p_actor_id);

  -- Validate that the actor is either the truck owner or the customer
  IF NOT v_is_owner AND NOT v_is_customer THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Unauthorized: you are not the truck owner or the customer for this order'
    );
  END IF;

  -- Prevent no-op transitions
  IF v_old_status = p_new_status THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Order is already in status: ' || p_new_status
    );
  END IF;

  -- Validate transition based on the state machine rules
  -- pending -> confirmed (owner), cancelled (customer), rejected (owner)
  -- confirmed -> preparing (owner), cancelled (both)
  -- preparing -> ready (owner)
  -- ready -> completed (owner)
  CASE v_old_status
    WHEN 'pending' THEN
      IF p_new_status = 'confirmed' AND v_is_owner THEN
        v_allowed := true;
      ELSIF p_new_status = 'cancelled' AND v_is_customer THEN
        v_allowed := true;
      ELSIF p_new_status = 'rejected' AND v_is_owner THEN
        v_allowed := true;
      END IF;

    WHEN 'confirmed' THEN
      IF p_new_status = 'preparing' AND v_is_owner THEN
        v_allowed := true;
      ELSIF p_new_status = 'cancelled' AND (v_is_owner OR v_is_customer) THEN
        v_allowed := true;
      END IF;

    WHEN 'preparing' THEN
      IF p_new_status = 'ready' AND v_is_owner THEN
        v_allowed := true;
      END IF;

    WHEN 'ready' THEN
      IF p_new_status = 'completed' AND v_is_owner THEN
        v_allowed := true;
      END IF;

    ELSE
      v_allowed := false;
  END CASE;

  IF NOT v_allowed THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Invalid transition from ' || v_old_status || ' to ' || p_new_status
                || ' for ' || CASE WHEN v_is_owner THEN 'owner' ELSE 'customer' END
    );
  END IF;

  -- Update the order status
  UPDATE orders
  SET status = p_new_status,
      completed_at = CASE WHEN p_new_status = 'completed' THEN NOW() ELSE completed_at END,
      rejected_reason = CASE WHEN p_new_status = 'rejected' THEN p_note ELSE rejected_reason END,
      updated_at = NOW()
  WHERE id = p_order_id;

  -- Insert audit trail record
  INSERT INTO order_status_transitions (order_id, from_status, to_status, actor_id, note)
  VALUES (p_order_id, v_old_status, p_new_status, p_actor_id, p_note);

  RETURN jsonb_build_object(
    'success', true,
    'order_id', p_order_id,
    'from_status', v_old_status,
    'to_status', p_new_status,
    'actor_role', CASE WHEN v_is_owner THEN 'owner' ELSE 'customer' END
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
