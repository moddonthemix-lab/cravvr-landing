-- ============================================
-- COMPREHENSIVE FIX FOR FAVORITES ERROR
-- ============================================
-- Run this entire script in Supabase SQL Editor
-- It will diagnose and fix the customer_id foreign key issue
-- ============================================

-- Step 1: Check current state
SELECT 'Checking for users without customer records...' as status;

SELECT
  au.id,
  au.email,
  au.created_at,
  CASE
    WHEN p.id IS NULL THEN 'Missing Profile'
    WHEN c.id IS NULL AND p.role = 'customer' THEN 'Missing Customer Record'
    ELSE 'OK'
  END as issue
FROM auth.users au
LEFT JOIN profiles p ON au.id = p.id
LEFT JOIN customers c ON au.id = c.id;

-- Step 2: Fix missing profiles
SELECT 'Creating missing profiles...' as status;

INSERT INTO profiles (id, email, name, role)
SELECT
  au.id,
  au.email,
  COALESCE(au.raw_user_meta_data->>'name', 'User'),
  COALESCE(au.raw_user_meta_data->>'role', 'customer')
FROM auth.users au
LEFT JOIN profiles p ON au.id = p.id
WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- Step 3: Fix missing customer records
SELECT 'Creating missing customer records...' as status;

INSERT INTO customers (id, points, avatar_url, phone)
SELECT
  p.id,
  0,
  NULL,
  NULL
FROM profiles p
LEFT JOIN customers c ON p.id = c.id
WHERE p.role = 'customer' AND c.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- Step 4: Install trigger for future signups
SELECT 'Installing automatic user creation trigger...' as status;

-- Drop trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user();

-- Create function
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Create profile record
  INSERT INTO public.profiles (id, email, name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', 'User'),
    COALESCE(NEW.raw_user_meta_data->>'role', 'customer')
  );

  -- If role is customer, create customer record
  IF COALESCE(NEW.raw_user_meta_data->>'role', 'customer') = 'customer' THEN
    INSERT INTO public.customers (id, points)
    VALUES (NEW.id, 0);
  END IF;

  -- If role is owner, create owner record
  IF NEW.raw_user_meta_data->>'role' = 'owner' THEN
    INSERT INTO public.owners (id, subscription_type)
    VALUES (NEW.id, 'free');
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Step 5: Verify fix
SELECT 'Verification - All users should now have proper records:' as status;

SELECT
  au.email,
  p.role,
  CASE
    WHEN p.id IS NOT NULL THEN '✓ Profile exists'
    ELSE '✗ Missing profile'
  END as profile_status,
  CASE
    WHEN p.role = 'customer' AND c.id IS NOT NULL THEN '✓ Customer record exists'
    WHEN p.role = 'customer' AND c.id IS NULL THEN '✗ Missing customer record'
    WHEN p.role = 'owner' AND o.id IS NOT NULL THEN '✓ Owner record exists'
    WHEN p.role = 'owner' AND o.id IS NULL THEN '✗ Missing owner record'
    ELSE 'N/A'
  END as role_record_status
FROM auth.users au
LEFT JOIN profiles p ON au.id = p.id
LEFT JOIN customers c ON au.id = c.id
LEFT JOIN owners o ON au.id = o.id
ORDER BY au.created_at DESC;

SELECT '✓ Fix complete! You should now be able to add favorites.' as final_status;
