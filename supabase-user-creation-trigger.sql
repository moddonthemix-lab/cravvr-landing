-- ============================================
-- AUTO-CREATE PROFILE AND CUSTOMER ON SIGNUP
-- ============================================
-- This trigger automatically creates profile and customer records
-- when a new user signs up via Supabase Auth

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
  IF COALESCE(NEW.raw_user_meta_data->>'role', 'customer') = 'owner' THEN
    INSERT INTO public.owners (id, subscription_type)
    VALUES (NEW.id, 'free');
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on auth.users table
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Note: If trigger already exists, drop it first:
-- DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
