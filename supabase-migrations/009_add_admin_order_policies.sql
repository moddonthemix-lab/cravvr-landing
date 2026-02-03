-- ============================================
-- ADD ADMIN POLICIES FOR ORDERS
-- Run this in Supabase SQL Editor
-- ============================================

-- Helper function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Admins can view all orders
CREATE POLICY "Admins can view all orders"
  ON orders FOR SELECT USING (is_admin());

-- Admins can create orders (for testing)
CREATE POLICY "Admins can create orders"
  ON orders FOR INSERT WITH CHECK (is_admin());

-- Admins can update any order
CREATE POLICY "Admins can update orders"
  ON orders FOR UPDATE USING (is_admin());

-- Admins can delete orders
CREATE POLICY "Admins can delete orders"
  ON orders FOR DELETE USING (is_admin());

-- Order Items policies for admins
CREATE POLICY "Admins can view all order items"
  ON order_items FOR SELECT USING (is_admin());

CREATE POLICY "Admins can create order items"
  ON order_items FOR INSERT WITH CHECK (is_admin());

CREATE POLICY "Admins can update order items"
  ON order_items FOR UPDATE USING (is_admin());

CREATE POLICY "Admins can delete order items"
  ON order_items FOR DELETE USING (is_admin());

-- Reviews policies for admins (if not already exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Admins can view all reviews'
  ) THEN
    CREATE POLICY "Admins can view all reviews"
      ON reviews FOR SELECT USING (is_admin());
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Admins can manage reviews'
  ) THEN
    CREATE POLICY "Admins can manage reviews"
      ON reviews FOR ALL USING (is_admin());
  END IF;
END $$;
