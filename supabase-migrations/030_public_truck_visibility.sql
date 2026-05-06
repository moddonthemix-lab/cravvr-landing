-- 030_public_truck_visibility.sql
-- Hide soft-deleted and suspended trucks from public reads. Admins continue
-- to see everything via the existing food_trucks_admin_all policy
-- (migration 025) and the is_admin() helper.
-- Owner reads of own truck unchanged; only the public_read policy is tightened.
-- Safe to re-run.

-- ─────────────────────────────────────────────────────────────────────────────
-- food_trucks: tighten public SELECT
-- ─────────────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "food_trucks_public_read" ON food_trucks;
CREATE POLICY "food_trucks_public_read"
  ON food_trucks
  FOR SELECT
  USING (
    deleted_at IS NULL
    AND suspended_at IS NULL
  );

-- Owner can always see own trucks even if suspended
DROP POLICY IF EXISTS "food_trucks_owner_read_own" ON food_trucks;
CREATE POLICY "food_trucks_owner_read_own"
  ON food_trucks
  FOR SELECT
  USING (auth.uid() = owner_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- menu_items: hide items belonging to deleted/suspended trucks from public
-- ─────────────────────────────────────────────────────────────────────────────
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'menu_items') THEN
    EXECUTE 'ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY';
    EXECUTE 'DROP POLICY IF EXISTS "menu_items_public_read" ON menu_items';
    EXECUTE $POLICY$
      CREATE POLICY "menu_items_public_read"
        ON menu_items
        FOR SELECT
        USING (
          EXISTS (
            SELECT 1 FROM food_trucks
            WHERE food_trucks.id = menu_items.truck_id
              AND food_trucks.deleted_at IS NULL
              AND food_trucks.suspended_at IS NULL
          )
        )
    $POLICY$;
  END IF;
END $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- reviews: filter hidden_at out of public reads
-- ─────────────────────────────────────────────────────────────────────────────
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'reviews') THEN
    EXECUTE 'ALTER TABLE reviews ENABLE ROW LEVEL SECURITY';
    EXECUTE 'DROP POLICY IF EXISTS "reviews_public_read" ON reviews';
    EXECUTE $POLICY$
      CREATE POLICY "reviews_public_read"
        ON reviews
        FOR SELECT
        USING (
          (hidden_at IS NULL)
          AND (
            COALESCE(is_hidden, false) = false
          )
          AND EXISTS (
            SELECT 1 FROM food_trucks
            WHERE food_trucks.id = reviews.truck_id
              AND food_trucks.deleted_at IS NULL
              AND food_trucks.suspended_at IS NULL
          )
        )
    $POLICY$;
  END IF;
END $$;
