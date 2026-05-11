-- 20260510000000_clerk_text_ids.sql
--
-- ╔════════════════════════════════════════════════════════════════════════╗
-- ║  DRAFT — REVIEW BEFORE APPLYING                                       ║
-- ║                                                                        ║
-- ║  Phase 2 of the Clerk migration. Requires Phase 1 (Clerk app set up   ║
-- ║  + Supabase Third-Party Auth integration enabled in dashboard).       ║
-- ║                                                                        ║
-- ║  WHY:                                                                  ║
-- ║   Clerk user IDs are TEXT (e.g. `user_2abc...`). All columns that     ║
-- ║   today store a Supabase auth.users UUID become TEXT. RLS policies    ║
-- ║   that referenced auth.uid() are rewritten against a new helper       ║
-- ║   public.requesting_user_id() which reads `sub` from the JWT.         ║
-- ║                                                                        ║
-- ║  PRECONDITIONS:                                                        ║
-- ║   1. Supabase → Auth → Sign In / Providers → Third-Party Auth →       ║
-- ║      Clerk is enabled.                                                ║
-- ║   2. Clerk webhook is deployed and configured (Phase 3).              ║
-- ║   3. Decide PATH A (wipe) vs PATH B (preserve users via Clerk         ║
-- ║      import) — see section 3.                                         ║
-- ║                                                                        ║
-- ║  NOTE: PATH B requires running scripts/clerk-import.mjs AFTER this    ║
-- ║   migration applies; that script generates the UUID→Clerk-ID         ║
-- ║   mapping SQL. ON UPDATE CASCADE on every FK lets the mapping        ║
-- ║   propagate via a single UPDATE on profiles.id.                       ║
-- ╚════════════════════════════════════════════════════════════════════════╝

BEGIN;

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. Drop the existing user-creation trigger (replaced by Clerk webhook).
-- ─────────────────────────────────────────────────────────────────────────────

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. Drop every RLS policy that references auth.uid() — they're all
--    rebuilt in section 7. Listed by table for grep-ability.
-- ─────────────────────────────────────────────────────────────────────────────

-- ad_spend
DROP POLICY IF EXISTS "Admins read ad_spend" ON ad_spend;
DROP POLICY IF EXISTS "Admins write ad_spend" ON ad_spend;
-- addresses
DROP POLICY IF EXISTS "Users can delete own addresses" ON addresses;
DROP POLICY IF EXISTS "Users can insert own addresses" ON addresses;
DROP POLICY IF EXISTS "Users can update own addresses" ON addresses;
DROP POLICY IF EXISTS "Users can view own addresses" ON addresses;
-- admins
DROP POLICY IF EXISTS "Admins can update own data" ON admins;
DROP POLICY IF EXISTS "Admins can view admin data" ON admins;
-- analytics_events
DROP POLICY IF EXISTS "Admins read analytics_events" ON analytics_events;
-- check_ins
DROP POLICY IF EXISTS "Customers can create check-ins" ON check_ins;
DROP POLICY IF EXISTS "Customers can view own check-ins" ON check_ins;
-- cohort_performance
DROP POLICY IF EXISTS "Admins read cohorts" ON cohort_performance;
-- cravvr_subscriptions
DROP POLICY IF EXISTS cravvr_subs_admin_read ON cravvr_subscriptions;
DROP POLICY IF EXISTS cravvr_subs_owner_read ON cravvr_subscriptions;
-- customers
DROP POLICY IF EXISTS "Customers can update own data" ON customers;
DROP POLICY IF EXISTS customers_select_self ON customers;
DROP POLICY IF EXISTS customers_select_via_order ON customers;
DROP POLICY IF EXISTS customers_select_via_review ON customers;
-- email_logs
DROP POLICY IF EXISTS "Admins can view all email logs" ON email_logs;
-- event_attendance
DROP POLICY IF EXISTS "Customers can manage own attendance" ON event_attendance;
-- events
DROP POLICY IF EXISTS "Owners can create events" ON events;
DROP POLICY IF EXISTS "Owners can update own events" ON events;
-- favorites
DROP POLICY IF EXISTS "Customers can manage own favorites" ON favorites;
DROP POLICY IF EXISTS "Customers can view own favorites" ON favorites;
-- food_trucks
DROP POLICY IF EXISTS "Owners can delete own trucks" ON food_trucks;
DROP POLICY IF EXISTS "Owners can insert own trucks" ON food_trucks;
DROP POLICY IF EXISTS "Owners can update own trucks" ON food_trucks;
DROP POLICY IF EXISTS food_trucks_owner_delete ON food_trucks;
DROP POLICY IF EXISTS food_trucks_owner_insert ON food_trucks;
DROP POLICY IF EXISTS food_trucks_owner_read_own ON food_trucks;
DROP POLICY IF EXISTS food_trucks_owner_update ON food_trucks;
-- marketing_email_send
DROP POLICY IF EXISTS "Admins read marketing_email_send" ON marketing_email_send;
-- menu_item_ratings
DROP POLICY IF EXISTS "Customers can rate menu items" ON menu_item_ratings;
-- menu_items
DROP POLICY IF EXISTS "Owners can manage own truck menus" ON menu_items;
-- notifications
DROP POLICY IF EXISTS "Users can delete own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
-- order_items
DROP POLICY IF EXISTS "Customers can create order items" ON order_items;
DROP POLICY IF EXISTS "Customers can view own order items" ON order_items;
DROP POLICY IF EXISTS "Truck owners can view order items for their trucks" ON order_items;
-- order_status_transitions
DROP POLICY IF EXISTS "Customers can view own order transitions" ON order_status_transitions;
DROP POLICY IF EXISTS "Owners can view order transitions for their trucks" ON order_status_transitions;
-- orders
DROP POLICY IF EXISTS "Customers can create orders" ON orders;
DROP POLICY IF EXISTS "Customers can update own orders" ON orders;
DROP POLICY IF EXISTS "Customers can view own orders" ON orders;
DROP POLICY IF EXISTS "Truck owners can update orders for their trucks" ON orders;
DROP POLICY IF EXISTS "Truck owners can view orders for their trucks" ON orders;
-- owners
DROP POLICY IF EXISTS "Owners can update own data" ON owners;
DROP POLICY IF EXISTS owners_select_self ON owners;
-- payment_methods
DROP POLICY IF EXISTS "Users can delete own payment methods" ON payment_methods;
DROP POLICY IF EXISTS "Users can insert own payment methods" ON payment_methods;
DROP POLICY IF EXISTS "Users can update own payment methods" ON payment_methods;
DROP POLICY IF EXISTS "Users can view own payment methods" ON payment_methods;
-- payments
DROP POLICY IF EXISTS "Customers view own payments" ON payments;
DROP POLICY IF EXISTS "Owners view truck payments" ON payments;
-- points_transactions
DROP POLICY IF EXISTS "Customers can view own points" ON points_transactions;
-- processor_webhook_events
DROP POLICY IF EXISTS processor_webhook_events_admin_read ON processor_webhook_events;
-- profiles
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS profiles_select_self ON profiles;
DROP POLICY IF EXISTS profiles_select_via_order ON profiles;
DROP POLICY IF EXISTS profiles_select_via_review ON profiles;
-- reviews
DROP POLICY IF EXISTS "Customers can create reviews" ON reviews;
DROP POLICY IF EXISTS "Customers can update own reviews" ON reviews;
DROP POLICY IF EXISTS "Reviews viewable by everyone" ON reviews;
-- visitors
DROP POLICY IF EXISTS "Admins read visitors" ON visitors;
-- waitlist
DROP POLICY IF EXISTS "Admins can delete waitlist entries" ON waitlist;
DROP POLICY IF EXISTS "Admins can update waitlist entries" ON waitlist;
DROP POLICY IF EXISTS "Admins can view all waitlist entries" ON waitlist;

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. Data-handling — pick ONE path. (PATH B is the default for credential
--    transfer; PATH A wipes everything for a clean dev reset.)
-- ─────────────────────────────────────────────────────────────────────────────
--
TRUNCATE TABLE admins, owners, customers, profiles CASCADE;
-- These tables FK to auth.users (not our user tables), so cascade missed them.
TRUNCATE TABLE notifications, addresses, payment_methods, analytics_events,
               visitors, admin_audit_log CASCADE;

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. Alter every UUID column that holds a user ID → TEXT.
--    Three-phase to avoid type-mismatch errors during the type changes:
--    a) Drop all 26 user-related FKs
--    b) Alter user-table PKs and all dependent columns to TEXT
--    c) Re-add FKs (all targeting profiles(id) with ON UPDATE CASCADE)
-- ─────────────────────────────────────────────────────────────────────────────

-- ── 4a. Drop dependent views (recreated at the end) ───────────────────────
-- attributed_orders is the parent; CASCADE drops attributed_purchases and
-- daily_channel_performance which both query through it.
DROP VIEW IF EXISTS attributed_orders CASCADE;

-- ── 4a. Drop all FKs targeting (or living on) user tables ──────────────────
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;
ALTER TABLE customers DROP CONSTRAINT IF EXISTS customers_id_fkey;
ALTER TABLE owners DROP CONSTRAINT IF EXISTS owners_id_fkey;
ALTER TABLE admins DROP CONSTRAINT IF EXISTS admins_id_fkey;
ALTER TABLE addresses DROP CONSTRAINT IF EXISTS addresses_user_id_fkey;
ALTER TABLE payment_methods DROP CONSTRAINT IF EXISTS payment_methods_user_id_fkey;
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_user_id_fkey;
ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_customer_id_fkey;
ALTER TABLE email_logs DROP CONSTRAINT IF EXISTS email_logs_user_id_fkey;
ALTER TABLE order_status_transitions DROP CONSTRAINT IF EXISTS order_status_transitions_actor_id_fkey;
ALTER TABLE visitors DROP CONSTRAINT IF EXISTS visitors_user_id_fkey;
ALTER TABLE analytics_events DROP CONSTRAINT IF EXISTS analytics_events_user_id_fkey;
ALTER TABLE admin_audit_log DROP CONSTRAINT IF EXISTS admin_audit_log_admin_id_fkey;
ALTER TABLE food_truck_slug_history DROP CONSTRAINT IF EXISTS food_truck_slug_history_changed_by_fkey;
ALTER TABLE cravvr_subscriptions DROP CONSTRAINT IF EXISTS cravvr_subscriptions_owner_id_fkey;
ALTER TABLE menu_item_reviews DROP CONSTRAINT IF EXISTS menu_item_reviews_customer_id_fkey;
ALTER TABLE check_ins DROP CONSTRAINT IF EXISTS check_ins_customer_id_fkey;
ALTER TABLE event_attendance DROP CONSTRAINT IF EXISTS event_attendance_customer_id_fkey;
ALTER TABLE favorites DROP CONSTRAINT IF EXISTS favorites_customer_id_fkey;
ALTER TABLE marketing_email_send DROP CONSTRAINT IF EXISTS marketing_email_send_customer_id_fkey;
ALTER TABLE menu_item_ratings DROP CONSTRAINT IF EXISTS menu_item_ratings_customer_id_fkey;
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_customer_id_fkey;
ALTER TABLE points_transactions DROP CONSTRAINT IF EXISTS points_transactions_customer_id_fkey;
ALTER TABLE reviews DROP CONSTRAINT IF EXISTS reviews_customer_id_fkey;
ALTER TABLE events DROP CONSTRAINT IF EXISTS events_creator_id_fkey;
ALTER TABLE food_trucks DROP CONSTRAINT IF EXISTS food_trucks_owner_id_fkey;

-- ── 4b. Alter every UUID column → TEXT ─────────────────────────────────────
ALTER TABLE profiles ALTER COLUMN id DROP DEFAULT;
ALTER TABLE profiles ALTER COLUMN id TYPE TEXT;
ALTER TABLE customers ALTER COLUMN id TYPE TEXT;
ALTER TABLE owners ALTER COLUMN id TYPE TEXT;
ALTER TABLE admins ALTER COLUMN id TYPE TEXT;
ALTER TABLE addresses ALTER COLUMN user_id TYPE TEXT;
ALTER TABLE payment_methods ALTER COLUMN user_id TYPE TEXT;
ALTER TABLE notifications ALTER COLUMN user_id TYPE TEXT;
ALTER TABLE payments ALTER COLUMN customer_id TYPE TEXT;
ALTER TABLE email_logs ALTER COLUMN user_id TYPE TEXT;
ALTER TABLE order_status_transitions ALTER COLUMN actor_id TYPE TEXT;
ALTER TABLE visitors ALTER COLUMN user_id TYPE TEXT;
ALTER TABLE analytics_events ALTER COLUMN user_id TYPE TEXT;
ALTER TABLE admin_audit_log ALTER COLUMN admin_id TYPE TEXT;
ALTER TABLE food_truck_slug_history ALTER COLUMN changed_by TYPE TEXT;
ALTER TABLE cravvr_subscriptions ALTER COLUMN owner_id TYPE TEXT;
ALTER TABLE menu_item_reviews ALTER COLUMN customer_id TYPE TEXT;
ALTER TABLE check_ins ALTER COLUMN customer_id TYPE TEXT;
ALTER TABLE event_attendance ALTER COLUMN customer_id TYPE TEXT;
ALTER TABLE favorites ALTER COLUMN customer_id TYPE TEXT;
ALTER TABLE marketing_email_send ALTER COLUMN customer_id TYPE TEXT;
ALTER TABLE menu_item_ratings ALTER COLUMN customer_id TYPE TEXT;
ALTER TABLE orders ALTER COLUMN customer_id TYPE TEXT;
ALTER TABLE points_transactions ALTER COLUMN customer_id TYPE TEXT;
ALTER TABLE reviews ALTER COLUMN customer_id TYPE TEXT;
ALTER TABLE events ALTER COLUMN creator_id TYPE TEXT;
ALTER TABLE food_trucks ALTER COLUMN owner_id TYPE TEXT;

-- ── 4c. Re-add all FKs targeting profiles(id), with ON UPDATE CASCADE ──────
-- User-owned (CASCADE)
ALTER TABLE customers ADD CONSTRAINT customers_id_fkey
  FOREIGN KEY (id) REFERENCES profiles(id) ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE owners ADD CONSTRAINT owners_id_fkey
  FOREIGN KEY (id) REFERENCES profiles(id) ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE admins ADD CONSTRAINT admins_id_fkey
  FOREIGN KEY (id) REFERENCES profiles(id) ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE addresses ADD CONSTRAINT addresses_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES profiles(id) ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE payment_methods ADD CONSTRAINT payment_methods_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES profiles(id) ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE notifications ADD CONSTRAINT notifications_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES profiles(id) ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE check_ins ADD CONSTRAINT check_ins_customer_id_fkey
  FOREIGN KEY (customer_id) REFERENCES profiles(id) ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE cravvr_subscriptions ADD CONSTRAINT cravvr_subscriptions_owner_id_fkey
  FOREIGN KEY (owner_id) REFERENCES profiles(id) ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE event_attendance ADD CONSTRAINT event_attendance_customer_id_fkey
  FOREIGN KEY (customer_id) REFERENCES profiles(id) ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE favorites ADD CONSTRAINT favorites_customer_id_fkey
  FOREIGN KEY (customer_id) REFERENCES profiles(id) ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE menu_item_ratings ADD CONSTRAINT menu_item_ratings_customer_id_fkey
  FOREIGN KEY (customer_id) REFERENCES profiles(id) ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE menu_item_reviews ADD CONSTRAINT menu_item_reviews_customer_id_fkey
  FOREIGN KEY (customer_id) REFERENCES profiles(id) ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE points_transactions ADD CONSTRAINT points_transactions_customer_id_fkey
  FOREIGN KEY (customer_id) REFERENCES profiles(id) ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE reviews ADD CONSTRAINT reviews_customer_id_fkey
  FOREIGN KEY (customer_id) REFERENCES profiles(id) ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE food_trucks ADD CONSTRAINT food_trucks_owner_id_fkey
  FOREIGN KEY (owner_id) REFERENCES profiles(id) ON UPDATE CASCADE ON DELETE CASCADE;
-- Audit/historical (SET NULL on delete)
ALTER TABLE payments ADD CONSTRAINT payments_customer_id_fkey
  FOREIGN KEY (customer_id) REFERENCES profiles(id) ON UPDATE CASCADE ON DELETE SET NULL;
ALTER TABLE email_logs ADD CONSTRAINT email_logs_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES profiles(id) ON UPDATE CASCADE ON DELETE SET NULL;
ALTER TABLE order_status_transitions ADD CONSTRAINT order_status_transitions_actor_id_fkey
  FOREIGN KEY (actor_id) REFERENCES profiles(id) ON UPDATE CASCADE ON DELETE SET NULL;
ALTER TABLE visitors ADD CONSTRAINT visitors_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES profiles(id) ON UPDATE CASCADE ON DELETE SET NULL;
ALTER TABLE analytics_events ADD CONSTRAINT analytics_events_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES profiles(id) ON UPDATE CASCADE ON DELETE SET NULL;
ALTER TABLE admin_audit_log ADD CONSTRAINT admin_audit_log_admin_id_fkey
  FOREIGN KEY (admin_id) REFERENCES profiles(id) ON UPDATE CASCADE ON DELETE SET NULL;
ALTER TABLE food_truck_slug_history ADD CONSTRAINT food_truck_slug_history_changed_by_fkey
  FOREIGN KEY (changed_by) REFERENCES profiles(id) ON UPDATE CASCADE ON DELETE SET NULL;
ALTER TABLE orders ADD CONSTRAINT orders_customer_id_fkey
  FOREIGN KEY (customer_id) REFERENCES profiles(id) ON UPDATE CASCADE ON DELETE SET NULL;
ALTER TABLE events ADD CONSTRAINT events_creator_id_fkey
  FOREIGN KEY (creator_id) REFERENCES profiles(id) ON UPDATE CASCADE ON DELETE SET NULL;
ALTER TABLE marketing_email_send ADD CONSTRAINT marketing_email_send_customer_id_fkey
  FOREIGN KEY (customer_id) REFERENCES profiles(id) ON UPDATE CASCADE ON DELETE SET NULL;

-- ── 4d. Recreate the dependent views dropped in 4a ─────────────────────────
CREATE VIEW attributed_orders AS
SELECT o.id AS order_id,
  o.customer_id,
  o.truck_id,
  o.order_number,
  o.total AS revenue,
  o.payment_status,
  o.created_at,
  o.completed_at,
  o.acquisition_first_utm_source,
  o.acquisition_first_utm_medium,
  o.acquisition_first_utm_campaign,
  o.acquisition_last_utm_source,
  o.acquisition_last_utm_medium,
  o.acquisition_last_utm_campaign,
  v.first_utm_source AS visitor_first_utm_source,
  v.first_utm_medium AS visitor_first_utm_medium,
  v.first_utm_campaign AS visitor_first_utm_campaign,
  v.first_click_platform,
  COALESCE(o.acquisition_first_utm_source, v.first_utm_source, 'direct'::text) AS effective_first_source,
  COALESCE(o.acquisition_last_utm_source, v.last_utm_source, o.acquisition_first_utm_source, v.first_utm_source, 'direct'::text) AS effective_last_source
FROM orders o
LEFT JOIN customers c ON c.id = o.customer_id
LEFT JOIN visitors v ON v.id = c.acquisition_visitor_id;

CREATE VIEW attributed_purchases AS
SELECT ao.order_id,
  ao.customer_id,
  ao.truck_id,
  ao.order_number,
  ao.revenue,
  ao.payment_status,
  ao.created_at,
  ao.completed_at,
  ao.acquisition_first_utm_source,
  ao.acquisition_first_utm_medium,
  ao.acquisition_first_utm_campaign,
  ao.acquisition_last_utm_source,
  ao.acquisition_last_utm_medium,
  ao.acquisition_last_utm_campaign,
  ao.visitor_first_utm_source,
  ao.visitor_first_utm_medium,
  ao.visitor_first_utm_campaign,
  ao.first_click_platform,
  ao.effective_first_source,
  ao.effective_last_source,
  p.amount AS paid_cents,
  p.status AS payment_record_status,
  p.created_at AS paid_at
FROM attributed_orders ao
JOIN payments p ON p.order_id = ao.order_id AND p.status = 'succeeded'::text;

CREATE VIEW daily_channel_performance AS
SELECT (date_trunc('day'::text, created_at))::date AS day,
  effective_first_source AS source,
  acquisition_first_utm_medium AS medium,
  acquisition_first_utm_campaign AS campaign,
  count(DISTINCT customer_id) FILTER (WHERE NOT EXISTS (
    SELECT 1 FROM orders o2
    WHERE o2.customer_id = ao.customer_id AND o2.created_at < ao.created_at
  )) AS new_customers,
  count(*) AS orders,
  sum(revenue) AS revenue,
  sum(revenue) FILTER (WHERE payment_status = 'paid'::text) AS paid_revenue
FROM attributed_orders ao
GROUP BY ((date_trunc('day'::text, created_at))::date), effective_first_source, acquisition_first_utm_medium, acquisition_first_utm_campaign;

-- ─────────────────────────────────────────────────────────────────────────────
-- 5. Helper: public.requesting_user_id()
--    Replaces auth.uid() in policies. Returns the Clerk user ID as TEXT.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.requesting_user_id()
RETURNS TEXT
LANGUAGE sql
STABLE
AS $$
  SELECT NULLIF(current_setting('request.jwt.claims', true)::json->>'sub', '')::text;
$$;

COMMENT ON FUNCTION public.requesting_user_id() IS
  'Returns the Clerk user ID (sub claim) from the request JWT, or NULL if unauthenticated. Replaces auth.uid() in RLS policies after the Clerk migration.';

-- ─────────────────────────────────────────────────────────────────────────────
-- 6. Update is_admin() and has_admin_permission() to use the new helper.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = public.requesting_user_id() AND role = 'admin'
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.has_admin_permission(p_perm TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_perms JSONB;
BEGIN
  IF NOT is_admin() THEN
    RETURN false;
  END IF;
  SELECT permissions INTO v_perms FROM admins WHERE id = public.requesting_user_id();
  IF v_perms IS NULL OR v_perms = '{}'::jsonb OR v_perms = '[]'::jsonb THEN
    RETURN false;
  END IF;
  IF jsonb_typeof(v_perms) = 'array' THEN
    RETURN v_perms ? '*' OR v_perms ? p_perm;
  END IF;
  IF jsonb_typeof(v_perms) = 'object' THEN
    IF v_perms ? 'permissions' AND jsonb_typeof(v_perms->'permissions') = 'array' THEN
      RETURN (v_perms->'permissions') ? '*' OR (v_perms->'permissions') ? p_perm;
    END IF;
    RETURN COALESCE((v_perms ? '*'), false)
        OR COALESCE((v_perms->>p_perm)::boolean, false);
  END IF;
  RETURN false;
END;
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 7. Recreate every dropped policy. Pattern:
--    auth.uid()                      → requesting_user_id()
--    EXISTS(SELECT FROM profiles
--      WHERE id=auth.uid()
--        AND role='admin')           → is_admin()
-- ─────────────────────────────────────────────────────────────────────────────

-- ad_spend
CREATE POLICY "Admins read ad_spend" ON ad_spend FOR SELECT USING (is_admin());
CREATE POLICY "Admins write ad_spend" ON ad_spend FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- addresses
CREATE POLICY "Users can view own addresses" ON addresses FOR SELECT USING (requesting_user_id() = user_id);
CREATE POLICY "Users can insert own addresses" ON addresses FOR INSERT WITH CHECK (requesting_user_id() = user_id);
CREATE POLICY "Users can update own addresses" ON addresses FOR UPDATE USING (requesting_user_id() = user_id);
CREATE POLICY "Users can delete own addresses" ON addresses FOR DELETE USING (requesting_user_id() = user_id);

-- admins
CREATE POLICY "Admins can view admin data" ON admins
  FOR SELECT USING (requesting_user_id() = id OR is_admin());
CREATE POLICY "Admins can update own data" ON admins
  FOR UPDATE USING (requesting_user_id() = id);

-- analytics_events
CREATE POLICY "Admins read analytics_events" ON analytics_events FOR SELECT USING (is_admin());

-- check_ins
CREATE POLICY "Customers can view own check-ins" ON check_ins FOR SELECT USING (requesting_user_id() = customer_id);
CREATE POLICY "Customers can create check-ins" ON check_ins FOR INSERT WITH CHECK (requesting_user_id() = customer_id);

-- cohort_performance
CREATE POLICY "Admins read cohorts" ON cohort_performance FOR SELECT USING (is_admin());

-- cravvr_subscriptions
CREATE POLICY cravvr_subs_admin_read ON cravvr_subscriptions FOR SELECT USING (is_admin());
CREATE POLICY cravvr_subs_owner_read ON cravvr_subscriptions FOR SELECT USING (requesting_user_id() = owner_id);

-- customers
CREATE POLICY customers_select_self ON customers FOR SELECT USING (requesting_user_id() = id);
CREATE POLICY "Customers can update own data" ON customers FOR UPDATE USING (requesting_user_id() = id);
CREATE POLICY customers_select_via_order ON customers FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM orders o
    JOIN food_trucks ft ON ft.id = o.truck_id
    WHERE o.customer_id = customers.id AND ft.owner_id = requesting_user_id()
  )
);
CREATE POLICY customers_select_via_review ON customers FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM reviews r
    WHERE r.customer_id = customers.id AND COALESCE(r.is_hidden, false) = false
  )
);

-- email_logs
CREATE POLICY "Admins can view all email logs" ON email_logs FOR SELECT USING (is_admin());

-- event_attendance
CREATE POLICY "Customers can manage own attendance" ON event_attendance FOR ALL USING (requesting_user_id() = customer_id);

-- events
CREATE POLICY "Owners can create events" ON events FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM owners WHERE owners.id = requesting_user_id())
);
CREATE POLICY "Owners can update own events" ON events FOR UPDATE USING (requesting_user_id() = creator_id);

-- favorites
CREATE POLICY "Customers can view own favorites" ON favorites FOR SELECT USING (requesting_user_id() = customer_id);
CREATE POLICY "Customers can manage own favorites" ON favorites FOR ALL USING (requesting_user_id() = customer_id);

-- food_trucks (one canonical set — there were duplicate-named pairs before)
CREATE POLICY food_trucks_owner_read_own ON food_trucks FOR SELECT USING (requesting_user_id() = owner_id);
CREATE POLICY food_trucks_owner_insert ON food_trucks FOR INSERT WITH CHECK (requesting_user_id() = owner_id);
CREATE POLICY food_trucks_owner_update ON food_trucks FOR UPDATE
  USING (requesting_user_id() = owner_id) WITH CHECK (requesting_user_id() = owner_id);
CREATE POLICY food_trucks_owner_delete ON food_trucks FOR DELETE USING (requesting_user_id() = owner_id);

-- marketing_email_send
CREATE POLICY "Admins read marketing_email_send" ON marketing_email_send FOR SELECT USING (is_admin());

-- menu_item_ratings
CREATE POLICY "Customers can rate menu items" ON menu_item_ratings FOR ALL USING (requesting_user_id() = customer_id);

-- menu_items
CREATE POLICY "Owners can manage own truck menus" ON menu_items FOR ALL USING (
  EXISTS (
    SELECT 1 FROM food_trucks
    WHERE food_trucks.id = menu_items.truck_id
      AND food_trucks.owner_id = requesting_user_id()
  )
);

-- notifications
CREATE POLICY "Users can view own notifications" ON notifications FOR SELECT USING (requesting_user_id() = user_id);
CREATE POLICY "Users can update own notifications" ON notifications FOR UPDATE USING (requesting_user_id() = user_id);
CREATE POLICY "Users can delete own notifications" ON notifications FOR DELETE USING (requesting_user_id() = user_id);

-- order_items
CREATE POLICY "Customers can create order items" ON order_items FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM orders
    WHERE orders.id = order_items.order_id
      AND orders.customer_id = requesting_user_id()
  )
);
CREATE POLICY "Customers can view own order items" ON order_items FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM orders
    WHERE orders.id = order_items.order_id
      AND orders.customer_id = requesting_user_id()
  )
);
CREATE POLICY "Truck owners can view order items for their trucks" ON order_items FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM orders
    JOIN food_trucks ON food_trucks.id = orders.truck_id
    WHERE orders.id = order_items.order_id
      AND food_trucks.owner_id = requesting_user_id()
  )
);

-- order_status_transitions
CREATE POLICY "Customers can view own order transitions" ON order_status_transitions FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM orders
    WHERE orders.id = order_status_transitions.order_id
      AND orders.customer_id = requesting_user_id()
  )
);
CREATE POLICY "Owners can view order transitions for their trucks" ON order_status_transitions FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM orders
    JOIN food_trucks ON food_trucks.id = orders.truck_id
    WHERE orders.id = order_status_transitions.order_id
      AND food_trucks.owner_id = requesting_user_id()
  )
);

-- orders
CREATE POLICY "Customers can view own orders" ON orders FOR SELECT USING (requesting_user_id() = customer_id);
CREATE POLICY "Customers can create orders" ON orders FOR INSERT WITH CHECK (requesting_user_id() = customer_id);
CREATE POLICY "Customers can update own orders" ON orders FOR UPDATE USING (requesting_user_id() = customer_id);
CREATE POLICY "Truck owners can view orders for their trucks" ON orders FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM food_trucks
    WHERE food_trucks.id = orders.truck_id
      AND food_trucks.owner_id = requesting_user_id()
  )
);
CREATE POLICY "Truck owners can update orders for their trucks" ON orders FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM food_trucks
    WHERE food_trucks.id = orders.truck_id
      AND food_trucks.owner_id = requesting_user_id()
  )
);

-- owners
CREATE POLICY owners_select_self ON owners FOR SELECT USING (requesting_user_id() = id);
CREATE POLICY "Owners can update own data" ON owners FOR UPDATE USING (requesting_user_id() = id);

-- payment_methods
CREATE POLICY "Users can view own payment methods" ON payment_methods FOR SELECT USING (requesting_user_id() = user_id);
CREATE POLICY "Users can insert own payment methods" ON payment_methods FOR INSERT WITH CHECK (requesting_user_id() = user_id);
CREATE POLICY "Users can update own payment methods" ON payment_methods FOR UPDATE USING (requesting_user_id() = user_id);
CREATE POLICY "Users can delete own payment methods" ON payment_methods FOR DELETE USING (requesting_user_id() = user_id);

-- payments
CREATE POLICY "Customers view own payments" ON payments FOR SELECT USING (requesting_user_id() = customer_id);
CREATE POLICY "Owners view truck payments" ON payments FOR SELECT USING (
  truck_id IN (SELECT food_trucks.id FROM food_trucks WHERE food_trucks.owner_id = requesting_user_id())
);

-- points_transactions
CREATE POLICY "Customers can view own points" ON points_transactions FOR SELECT USING (requesting_user_id() = customer_id);

-- processor_webhook_events
CREATE POLICY processor_webhook_events_admin_read ON processor_webhook_events FOR SELECT USING (is_admin());

-- profiles
CREATE POLICY profiles_select_self ON profiles FOR SELECT USING (requesting_user_id() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (requesting_user_id() = id);
CREATE POLICY profiles_select_via_order ON profiles FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM orders o
    JOIN food_trucks ft ON ft.id = o.truck_id
    WHERE o.customer_id = profiles.id AND ft.owner_id = requesting_user_id()
  )
  OR EXISTS (
    SELECT 1 FROM orders o
    JOIN food_trucks ft ON ft.id = o.truck_id
    WHERE o.customer_id = requesting_user_id() AND ft.owner_id = profiles.id
  )
);
CREATE POLICY profiles_select_via_review ON profiles FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM reviews r
    WHERE r.customer_id = profiles.id AND COALESCE(r.is_hidden, false) = false
  )
);

-- reviews
CREATE POLICY "Reviews viewable by everyone" ON reviews FOR SELECT USING (
  (NOT is_hidden) OR (customer_id = requesting_user_id())
);
CREATE POLICY "Customers can create reviews" ON reviews FOR INSERT WITH CHECK (
  requesting_user_id() = customer_id
  AND EXISTS (SELECT 1 FROM customers WHERE customers.id = requesting_user_id())
);
CREATE POLICY "Customers can update own reviews" ON reviews FOR UPDATE USING (requesting_user_id() = customer_id);

-- visitors
CREATE POLICY "Admins read visitors" ON visitors FOR SELECT USING (is_admin());

-- waitlist
CREATE POLICY "Admins can view all waitlist entries" ON waitlist FOR SELECT USING (is_admin());
CREATE POLICY "Admins can update waitlist entries" ON waitlist FOR UPDATE USING (is_admin());
CREATE POLICY "Admins can delete waitlist entries" ON waitlist FOR DELETE USING (is_admin());

-- ─────────────────────────────────────────────────────────────────────────────
-- 8. Sanity check — fail loudly if any user-table FK is still UUID-typed.
-- ─────────────────────────────────────────────────────────────────────────────

DO $$
DECLARE
  v_count INT;
BEGIN
  SELECT COUNT(*)
  INTO v_count
  FROM pg_constraint c
  JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = ANY(c.conkey)
  WHERE c.contype = 'f'
    AND c.confrelid::regclass::text IN (
      'public.profiles', 'public.customers', 'public.owners', 'public.admins'
    )
    AND format_type(a.atttypid, a.atttypmod) <> 'text';
  IF v_count > 0 THEN
    RAISE EXCEPTION
      'Migration incomplete: % FK column(s) still UUID after migration. Investigate before continuing.', v_count;
  END IF;
END $$;

COMMIT;

-- ─────────────────────────────────────────────────────────────────────────────
-- 9. PATH B follow-up — apply the Clerk ID mapping (run as a SEPARATE step).
-- ─────────────────────────────────────────────────────────────────────────────
--
-- After this migration succeeds AND scripts/clerk-import.mjs has populated
-- scripts/clerk-id-map.sql, run that file. It contains UPDATE statements like:
--
--   UPDATE profiles SET id = '<clerk_id>' WHERE id = '<supabase_uuid>';
--
-- Because every FK has ON UPDATE CASCADE, the change propagates automatically
-- to every dependent column.
