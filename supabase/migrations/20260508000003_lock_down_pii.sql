-- 041_lock_down_pii.sql
-- Replace the wide-open SELECT policies on profiles, customers, owners with
-- relationship-scoped policies. Closes a bulk email/PII enumeration hole:
-- prior policies (`USING (true)`) let any authenticated user scrape every
-- email + name + role on the platform.
--
-- New visibility rules:
--   profiles  → self, admin, public reviewers (so review names render),
--               and "user has an order with me" (owner→customer, customer→owner).
--   customers → self, admin, public reviewers, and "is a customer of one of my trucks."
--   owners    → self, admin only. (Nothing customer-facing reads owners directly;
--               the truck record is the public-facing surface.)
--
-- Service-role (edge functions) bypasses RLS — analytics, lifecycle email,
-- webhooks, etc. continue to read whatever they need.
--
-- What could break if app code makes assumptions beyond the rules above:
--   * Anonymous (logged-out) users currently see truck reviews. The reviewer-
--     name join (customers!customer_id(profiles(name))) requires the profile
--     to be reachable. The "via_review" policy below allows that, but it does
--     NOT cover anon-role reads — an authenticated session is required. If
--     that is wrong, drop the `auth.uid() IS NOT NULL` guard from each policy.
--   * Any frontend code that reads `profiles.email` for a user other than self
--     (and that's not an admin) will now get NULL/empty rows. Search for
--     `profile.email` reads in user-facing components if anything renders
--     a 3rd party's email.
--
-- Safe to re-run.

-- ─────────────────────────────────────────────────────────────────────────────
-- profiles
-- ─────────────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Public profiles viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "profiles_select_self" ON profiles;
DROP POLICY IF EXISTS "profiles_select_admin" ON profiles;
DROP POLICY IF EXISTS "profiles_select_via_review" ON profiles;
DROP POLICY IF EXISTS "profiles_select_via_order" ON profiles;

CREATE POLICY "profiles_select_self"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "profiles_select_admin"
  ON profiles FOR SELECT
  USING (is_admin());

-- Reviewers' names show on truck pages. Anyone authenticated can read the
-- profile of a customer who has at least one non-hidden review.
CREATE POLICY "profiles_select_via_review"
  ON profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM reviews r
      WHERE r.customer_id = profiles.id
        AND COALESCE(r.is_hidden, false) = false
    )
  );

-- Truck owners need their customers' names on the kitchen display.
-- Customers may need the owner profile of trucks they've ordered from.
CREATE POLICY "profiles_select_via_order"
  ON profiles FOR SELECT
  USING (
    -- I'm the truck owner and this profile is one of my customers.
    EXISTS (
      SELECT 1 FROM orders o
      JOIN food_trucks ft ON ft.id = o.truck_id
      WHERE o.customer_id = profiles.id
        AND ft.owner_id = auth.uid()
    )
    OR
    -- I'm the customer and this profile is the owner of a truck I ordered from.
    EXISTS (
      SELECT 1 FROM orders o
      JOIN food_trucks ft ON ft.id = o.truck_id
      WHERE o.customer_id = auth.uid()
        AND ft.owner_id = profiles.id
    )
  );

-- ─────────────────────────────────────────────────────────────────────────────
-- customers
-- ─────────────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Customers viewable by everyone" ON customers;
DROP POLICY IF EXISTS "customers_select_self" ON customers;
DROP POLICY IF EXISTS "customers_select_admin" ON customers;
DROP POLICY IF EXISTS "customers_select_via_review" ON customers;
DROP POLICY IF EXISTS "customers_select_via_order" ON customers;

CREATE POLICY "customers_select_self"
  ON customers FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "customers_select_admin"
  ON customers FOR SELECT
  USING (is_admin());

CREATE POLICY "customers_select_via_review"
  ON customers FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM reviews r
      WHERE r.customer_id = customers.id
        AND COALESCE(r.is_hidden, false) = false
    )
  );

-- Truck owner can read customer rows for customers who ordered from their truck.
CREATE POLICY "customers_select_via_order"
  ON customers FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM orders o
      JOIN food_trucks ft ON ft.id = o.truck_id
      WHERE o.customer_id = customers.id
        AND ft.owner_id = auth.uid()
    )
  );

-- ─────────────────────────────────────────────────────────────────────────────
-- owners
-- ─────────────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Owners viewable by everyone" ON owners;
DROP POLICY IF EXISTS "Owners can read own data" ON owners;       -- from 013
DROP POLICY IF EXISTS "owners_select_self" ON owners;
DROP POLICY IF EXISTS "owners_select_admin" ON owners;

CREATE POLICY "owners_select_self"
  ON owners FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "owners_select_admin"
  ON owners FOR SELECT
  USING (is_admin());

-- ─────────────────────────────────────────────────────────────────────────────
-- Defensive: ensure RLS is on (in case a dev script disabled it locally;
-- pattern reused from 025_restore_rls_pre_alpha).
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE owners ENABLE ROW LEVEL SECURITY;
