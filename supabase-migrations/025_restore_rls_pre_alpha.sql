-- 025_restore_rls_pre_alpha.sql
-- Pre-alpha RLS lockdown.
-- Re-enables RLS on food_trucks (which an earlier dev script disabled) and
-- ensures public-readable / owner-writable policies are in place.
-- Safe to re-run.

-- ─────────────────────────────────────────────────────────────────────────────
-- food_trucks
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE food_trucks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "food_trucks_public_read" ON food_trucks;
CREATE POLICY "food_trucks_public_read"
  ON food_trucks
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "food_trucks_owner_insert" ON food_trucks;
CREATE POLICY "food_trucks_owner_insert"
  ON food_trucks
  FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS "food_trucks_owner_update" ON food_trucks;
CREATE POLICY "food_trucks_owner_update"
  ON food_trucks
  FOR UPDATE
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS "food_trucks_owner_delete" ON food_trucks;
CREATE POLICY "food_trucks_owner_delete"
  ON food_trucks
  FOR DELETE
  USING (auth.uid() = owner_id);

-- Admin override
DROP POLICY IF EXISTS "food_trucks_admin_all" ON food_trucks;
CREATE POLICY "food_trucks_admin_all"
  ON food_trucks
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- ─────────────────────────────────────────────────────────────────────────────
-- orders / order_items / payments — make sure RLS is on. (Policies already
-- exist from 001_add_orders.sql and 005_add_addresses_and_payments.sql; this
-- is just a safety net in case a dev disabled them locally.)
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- payments table may not exist on every environment, guard the call
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'payments') THEN
    EXECUTE 'ALTER TABLE payments ENABLE ROW LEVEL SECURITY';
  END IF;
END $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- profiles — never disable, but make sure
-- ─────────────────────────────────────────────────────────────────────────────
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'profiles') THEN
    EXECUTE 'ALTER TABLE profiles ENABLE ROW LEVEL SECURITY';
  END IF;
END $$;
