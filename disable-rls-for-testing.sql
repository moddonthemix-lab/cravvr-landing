-- Temporarily disable RLS on food_trucks table for testing
-- Run this in Supabase SQL Editor

-- Allow anyone to read food_trucks (for testing)
ALTER TABLE food_trucks DISABLE ROW LEVEL SECURITY;

-- Or create a policy that allows all reads
-- ALTER TABLE food_trucks ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Allow public read access" ON food_trucks FOR SELECT USING (true);
