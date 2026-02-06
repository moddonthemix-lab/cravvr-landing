-- Migration: Stripe Connect for marketplace payments
-- Run this in Supabase SQL Editor

-- 1. Add Stripe fields to the owners/profiles or food_trucks table
-- We'll add to food_trucks since each truck can have its own Stripe account
ALTER TABLE food_trucks ADD COLUMN IF NOT EXISTS stripe_account_id TEXT;
ALTER TABLE food_trucks ADD COLUMN IF NOT EXISTS stripe_onboarding_complete BOOLEAN DEFAULT false;
ALTER TABLE food_trucks ADD COLUMN IF NOT EXISTS stripe_charges_enabled BOOLEAN DEFAULT false;

-- 2. Create payments tracking table
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  truck_id UUID REFERENCES food_trucks(id) ON DELETE SET NULL,
  customer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  stripe_payment_intent_id TEXT,
  amount INTEGER NOT NULL, -- in cents
  platform_fee INTEGER DEFAULT 0, -- in cents
  currency TEXT DEFAULT 'usd',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'succeeded', 'failed', 'refunded', 'partially_refunded')),
  refund_amount INTEGER DEFAULT 0,
  refund_reason TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Enable RLS
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Customers can view their own payments
CREATE POLICY "Customers view own payments" ON payments
  FOR SELECT USING (auth.uid() = customer_id);

-- Owners can view payments for their trucks
CREATE POLICY "Owners view truck payments" ON payments
  FOR SELECT USING (
    truck_id IN (SELECT id FROM food_trucks WHERE owner_id = auth.uid())
  );

-- Service role can do everything (for edge functions)
CREATE POLICY "Service role full access" ON payments
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- 4. Index for faster queries
CREATE INDEX IF NOT EXISTS idx_payments_order_id ON payments(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_truck_id ON payments(truck_id);
CREATE INDEX IF NOT EXISTS idx_payments_customer_id ON payments(customer_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);

-- 5. Updated_at trigger
CREATE OR REPLACE FUNCTION update_payments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_payments_updated_at ON payments;
CREATE TRIGGER trg_payments_updated_at
  BEFORE UPDATE ON payments
  FOR EACH ROW EXECUTE FUNCTION update_payments_updated_at();
