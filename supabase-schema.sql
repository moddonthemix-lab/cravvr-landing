-- ============================================
-- CRAVVR DATABASE SCHEMA FOR SUPABASE
-- ============================================
-- Run this entire file in Supabase SQL Editor
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- USERS & AUTHENTICATION
-- ============================================

-- Users table (extends Supabase auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('customer', 'owner')),
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Customer-specific data
CREATE TABLE customers (
  id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  points INTEGER DEFAULT 0,
  avatar_url TEXT,
  phone TEXT,
  preferences JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Owner-specific data
CREATE TABLE owners (
  id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  subscription_type TEXT DEFAULT 'free' CHECK (subscription_type IN ('free', 'pro')),
  subscription_started_at TIMESTAMPTZ,
  subscription_ends_at TIMESTAMPTZ,
  events_created_this_month INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- FOOD TRUCKS
-- ============================================

CREATE TABLE food_trucks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID NOT NULL REFERENCES owners(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  image_url TEXT,
  cuisine TEXT NOT NULL,
  location TEXT NOT NULL,
  coordinates JSONB,
  hours TEXT,
  price_range TEXT CHECK (price_range IN ('$', '$$', '$$$', '$$$$')),
  is_open BOOLEAN DEFAULT true,
  features TEXT[],
  phone TEXT,
  website TEXT,
  instagram TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Menu items
CREATE TABLE menu_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  truck_id UUID NOT NULL REFERENCES food_trucks(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10, 2),
  emoji TEXT,
  category TEXT,
  is_available BOOLEAN DEFAULT true,
  dietary_tags TEXT[],
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- EVENTS
-- ============================================

CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  creator_id UUID NOT NULL REFERENCES owners(id),
  name TEXT NOT NULL,
  description TEXT,
  location TEXT NOT NULL,
  coordinates JSONB,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  image_url TEXT,
  is_featured BOOLEAN DEFAULT false,
  max_attendees INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trucks participating in events
CREATE TABLE event_trucks (
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  truck_id UUID REFERENCES food_trucks(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (event_id, truck_id)
);

-- Customer event attendance
CREATE TABLE event_attendance (
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('going', 'interested')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (event_id, customer_id)
);

-- ============================================
-- REVIEWS & RATINGS
-- ============================================

-- Truck reviews
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  truck_id UUID NOT NULL REFERENCES food_trucks(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  is_hidden BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(truck_id, customer_id)
);

-- Menu item ratings
CREATE TABLE menu_item_ratings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  menu_item_id UUID NOT NULL REFERENCES menu_items(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(menu_item_id, customer_id)
);

-- ============================================
-- USER INTERACTIONS
-- ============================================

-- Favorites
CREATE TABLE favorites (
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  truck_id UUID REFERENCES food_trucks(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (customer_id, truck_id)
);

-- Check-ins
CREATE TABLE check_ins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  truck_id UUID NOT NULL REFERENCES food_trucks(id) ON DELETE CASCADE,
  location JSONB,
  points_earned INTEGER DEFAULT 10,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Points history
CREATE TABLE points_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  points INTEGER NOT NULL,
  reason TEXT NOT NULL,
  related_entity_type TEXT,
  related_entity_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

CREATE INDEX idx_trucks_owner ON food_trucks(owner_id);
CREATE INDEX idx_trucks_cuisine ON food_trucks(cuisine);
CREATE INDEX idx_reviews_truck ON reviews(truck_id) WHERE NOT is_hidden;
CREATE INDEX idx_reviews_customer ON reviews(customer_id);
CREATE INDEX idx_menu_items_truck ON menu_items(truck_id);
CREATE INDEX idx_events_time ON events(start_time);
CREATE INDEX idx_favorites_customer ON favorites(customer_id);
CREATE INDEX idx_checkins_customer ON check_ins(customer_id);

-- ============================================
-- VIEWS FOR COMPUTED DATA
-- ============================================

-- Truck ratings summary
CREATE VIEW truck_ratings_summary AS
SELECT
  truck_id,
  COUNT(*) as review_count,
  ROUND(AVG(rating)::numeric, 1) as average_rating
FROM reviews
WHERE NOT is_hidden
GROUP BY truck_id;

-- Menu item ratings summary
CREATE VIEW menu_item_ratings_summary AS
SELECT
  menu_item_id,
  COUNT(*) as rating_count,
  ROUND(AVG(rating)::numeric, 1) as average_rating
FROM menu_item_ratings
GROUP BY menu_item_id;

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_food_trucks_updated_at BEFORE UPDATE ON food_trucks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Auto-update customer points when transaction added
CREATE OR REPLACE FUNCTION update_customer_points()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE customers
  SET points = points + NEW.points
  WHERE id = NEW.customer_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_points_on_transaction AFTER INSERT ON points_transactions
  FOR EACH ROW EXECUTE FUNCTION update_customer_points();

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE owners ENABLE ROW LEVEL SECURITY;
ALTER TABLE food_trucks ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_trucks ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_item_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE check_ins ENABLE ROW LEVEL SECURITY;
ALTER TABLE points_transactions ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can read all, update own
CREATE POLICY "Public profiles viewable by everyone"
  ON profiles FOR SELECT USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE USING (auth.uid() = id);

-- Customers
CREATE POLICY "Customers viewable by everyone"
  ON customers FOR SELECT USING (true);

CREATE POLICY "Customers can update own data"
  ON customers FOR UPDATE USING (auth.uid() = id);

-- Owners
CREATE POLICY "Owners viewable by everyone"
  ON owners FOR SELECT USING (true);

CREATE POLICY "Owners can update own data"
  ON owners FOR UPDATE USING (auth.uid() = id);

-- Food Trucks: Everyone view, owners manage own
CREATE POLICY "Food trucks viewable by everyone"
  ON food_trucks FOR SELECT USING (true);

CREATE POLICY "Owners can insert own trucks"
  ON food_trucks FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owners can update own trucks"
  ON food_trucks FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY "Owners can delete own trucks"
  ON food_trucks FOR DELETE USING (auth.uid() = owner_id);

-- Menu Items
CREATE POLICY "Menu items viewable by everyone"
  ON menu_items FOR SELECT USING (true);

CREATE POLICY "Owners can manage own truck menus"
  ON menu_items FOR ALL USING (
    EXISTS (
      SELECT 1 FROM food_trucks
      WHERE food_trucks.id = menu_items.truck_id
      AND food_trucks.owner_id = auth.uid()
    )
  );

-- Events
CREATE POLICY "Events viewable by everyone"
  ON events FOR SELECT USING (true);

CREATE POLICY "Owners can create events"
  ON events FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM owners WHERE id = auth.uid())
  );

CREATE POLICY "Owners can update own events"
  ON events FOR UPDATE USING (auth.uid() = creator_id);

-- Reviews
CREATE POLICY "Reviews viewable by everyone"
  ON reviews FOR SELECT USING (NOT is_hidden OR customer_id = auth.uid());

CREATE POLICY "Customers can create reviews"
  ON reviews FOR INSERT WITH CHECK (
    auth.uid() = customer_id
    AND EXISTS (SELECT 1 FROM customers WHERE id = auth.uid())
  );

CREATE POLICY "Customers can update own reviews"
  ON reviews FOR UPDATE USING (auth.uid() = customer_id);

-- Favorites
CREATE POLICY "Customers can view own favorites"
  ON favorites FOR SELECT USING (auth.uid() = customer_id);

CREATE POLICY "Customers can manage own favorites"
  ON favorites FOR ALL USING (auth.uid() = customer_id);

-- Check-ins
CREATE POLICY "Customers can view own check-ins"
  ON check_ins FOR SELECT USING (auth.uid() = customer_id);

CREATE POLICY "Customers can create check-ins"
  ON check_ins FOR INSERT WITH CHECK (auth.uid() = customer_id);

-- Points transactions
CREATE POLICY "Customers can view own points"
  ON points_transactions FOR SELECT USING (auth.uid() = customer_id);

-- Event attendance
CREATE POLICY "Everyone can view event attendance"
  ON event_attendance FOR SELECT USING (true);

CREATE POLICY "Customers can manage own attendance"
  ON event_attendance FOR ALL USING (auth.uid() = customer_id);

-- Event trucks
CREATE POLICY "Everyone can view event trucks"
  ON event_trucks FOR SELECT USING (true);

-- Menu item ratings
CREATE POLICY "Everyone can view menu ratings"
  ON menu_item_ratings FOR SELECT USING (true);

CREATE POLICY "Customers can rate menu items"
  ON menu_item_ratings FOR ALL USING (auth.uid() = customer_id);
