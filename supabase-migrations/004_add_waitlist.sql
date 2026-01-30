-- ============================================
-- WAITLIST TABLE
-- Run this migration in Supabase SQL Editor
-- ============================================

-- Create waitlist table for early access signups
CREATE TABLE IF NOT EXISTS waitlist (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('lover', 'truck')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'invited', 'converted')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  invited_at TIMESTAMPTZ,
  converted_at TIMESTAMPTZ
);

-- Enable Row Level Security
ALTER TABLE waitlist ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can join the waitlist (public insert)
CREATE POLICY "Anyone can join waitlist"
  ON waitlist
  FOR INSERT
  WITH CHECK (true);

-- Policy: Admins can view all waitlist entries
CREATE POLICY "Admins can view all waitlist entries"
  ON waitlist
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Policy: Admins can update waitlist entries
CREATE POLICY "Admins can update waitlist entries"
  ON waitlist
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Policy: Admins can delete waitlist entries
CREATE POLICY "Admins can delete waitlist entries"
  ON waitlist
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_waitlist_type ON waitlist(type);
CREATE INDEX IF NOT EXISTS idx_waitlist_status ON waitlist(status);
CREATE INDEX IF NOT EXISTS idx_waitlist_created ON waitlist(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_waitlist_email ON waitlist(email);

-- ============================================
-- VERIFICATION QUERY
-- Run this after migration to confirm success:
-- SELECT * FROM waitlist LIMIT 1;
-- ============================================
