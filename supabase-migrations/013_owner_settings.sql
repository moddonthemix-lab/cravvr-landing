-- Migration: Add business info, phone, and notification preferences to owners table
-- Run this in Supabase SQL Editor

-- Business information fields
ALTER TABLE owners ADD COLUMN IF NOT EXISTS business_name TEXT;
ALTER TABLE owners ADD COLUMN IF NOT EXISTS tax_id TEXT;
ALTER TABLE owners ADD COLUMN IF NOT EXISTS business_address TEXT;
ALTER TABLE owners ADD COLUMN IF NOT EXISTS phone TEXT;

-- Notification preferences (stored as JSONB)
ALTER TABLE owners ADD COLUMN IF NOT EXISTS notification_preferences JSONB DEFAULT '{"new_order_alerts": true, "daily_summary": true, "marketing_emails": false}';

-- Allow owners to update their own data (skip if already exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'owners' AND policyname = 'Owners can update own data'
  ) THEN
    CREATE POLICY "Owners can update own data" ON owners FOR UPDATE USING (auth.uid() = id);
  END IF;
END $$;

-- Allow owners to read their own data (skip if already exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'owners' AND policyname = 'Owners can read own data'
  ) THEN
    CREATE POLICY "Owners can read own data" ON owners FOR SELECT USING (auth.uid() = id);
  END IF;
END $$;
