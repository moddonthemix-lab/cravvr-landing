-- ============================================
-- MIGRATION: Auto-create profile on user signup
-- ============================================
-- Run this in Supabase SQL Editor
-- This trigger automatically creates a profile record when a new user signs up
-- ============================================

-- 1. CREATE THE TRIGGER FUNCTION
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

  -- Create customer or owner record based on role
  IF COALESCE(new.raw_user_meta_data->>'role', 'customer') = 'customer' THEN
    INSERT INTO public.customers (id, created_at)
    VALUES (new.id, NOW())
    ON CONFLICT (id) DO NOTHING;
  ELSIF COALESCE(new.raw_user_meta_data->>'role', 'owner') = 'owner' THEN
    INSERT INTO public.owners (id, created_at)
    VALUES (new.id, NOW())
    ON CONFLICT (id) DO NOTHING;
  END IF;

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. DROP EXISTING TRIGGER IF IT EXISTS
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 3. CREATE THE TRIGGER
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- VERIFY: Check trigger is created
-- ============================================
-- Run this to verify the trigger exists:
-- SELECT * FROM information_schema.triggers WHERE trigger_name = 'on_auth_user_created';
