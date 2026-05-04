-- Check if RLS policies are working
-- Run this in Supabase SQL Editor

-- Check RLS status for food_trucks
SELECT
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename = 'food_trucks';

-- Check what policies exist
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies
WHERE tablename = 'food_trucks';
