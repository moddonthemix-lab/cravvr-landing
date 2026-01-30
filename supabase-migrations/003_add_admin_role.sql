-- ============================================
-- MIGRATION: Add Admin Role to profiles
-- ============================================
-- Run this in Supabase SQL Editor
-- Adds 'admin' as a valid role option
-- ============================================

-- 1. DROP EXISTING CONSTRAINT
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;

-- 2. ADD NEW CONSTRAINT WITH ADMIN ROLE
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('customer', 'owner', 'admin'));

-- 3. CREATE ADMINS TABLE (for admin-specific data)
CREATE TABLE IF NOT EXISTS admins (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  permissions JSONB DEFAULT '{"users": true, "trucks": true, "orders": true, "analytics": true, "settings": true}'::jsonb,
  last_login TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. ENABLE RLS ON ADMINS TABLE
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;

-- 5. ADMIN POLICIES
DROP POLICY IF EXISTS "Admins can view admin data" ON admins;
CREATE POLICY "Admins can view admin data"
  ON admins FOR SELECT USING (
    auth.uid() = id OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "Admins can update own data" ON admins;
CREATE POLICY "Admins can update own data"
  ON admins FOR UPDATE USING (auth.uid() = id);

-- 6. UPDATE AUTO-PROFILE TRIGGER TO HANDLE ADMIN ROLE
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- Insert into profiles table
  INSERT INTO public.profiles (id, email, name, role, created_at, updated_at)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    COALESCE(new.raw_user_meta_data->>'role', 'customer'),
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;

  -- Create role-specific record based on role
  IF COALESCE(new.raw_user_meta_data->>'role', 'customer') = 'customer' THEN
    INSERT INTO public.customers (id, created_at)
    VALUES (new.id, NOW())
    ON CONFLICT (id) DO NOTHING;
  ELSIF new.raw_user_meta_data->>'role' = 'owner' THEN
    INSERT INTO public.owners (id, created_at)
    VALUES (new.id, NOW())
    ON CONFLICT (id) DO NOTHING;
  ELSIF new.raw_user_meta_data->>'role' = 'admin' THEN
    INSERT INTO public.admins (id, created_at)
    VALUES (new.id, NOW())
    ON CONFLICT (id) DO NOTHING;
  END IF;

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. CREATE INDEX
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_admins_id ON admins(id);

-- ============================================
-- VERIFY: Check role constraint updated
-- ============================================
-- SELECT constraint_name, check_clause
-- FROM information_schema.check_constraints
-- WHERE constraint_name = 'profiles_role_check';
