-- Fix: Ensure ALL profiles have a matching row in the customers table
-- This fixes "violates foreign key constraint favorites_customer_id_fkey" errors
-- Owners also need a customers row so they can use features like favorites

-- 1. Backfill: insert missing customer rows for ALL existing profiles
--    (owners need a customers row too for favorites, rewards, etc.)
INSERT INTO customers (id)
SELECT p.id FROM profiles p
WHERE NOT EXISTS (SELECT 1 FROM customers c WHERE c.id = p.id)
ON CONFLICT (id) DO NOTHING;

-- 2. Backfill: insert missing owner rows for existing owner profiles
INSERT INTO owners (id)
SELECT p.id FROM profiles p
WHERE p.role = 'owner'
  AND NOT EXISTS (SELECT 1 FROM owners o WHERE o.id = p.id)
ON CONFLICT (id) DO NOTHING;

-- 3. Auto-create customer row for ALL new profiles + owner row for owners
CREATE OR REPLACE FUNCTION handle_new_profile()
RETURNS TRIGGER AS $$
BEGIN
  -- Every user gets a customers row (needed for favorites, rewards, etc.)
  INSERT INTO customers (id) VALUES (NEW.id) ON CONFLICT (id) DO NOTHING;

  -- Owners additionally get an owners row
  IF NEW.role = 'owner' THEN
    INSERT INTO owners (id) VALUES (NEW.id) ON CONFLICT (id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_handle_new_profile ON profiles;
CREATE TRIGGER trigger_handle_new_profile
  AFTER INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_profile();
