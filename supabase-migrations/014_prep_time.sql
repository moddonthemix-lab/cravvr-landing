-- Migration: Add estimated_prep_time to food_trucks table
-- Run this in Supabase SQL Editor

ALTER TABLE food_trucks ADD COLUMN IF NOT EXISTS estimated_prep_time TEXT DEFAULT '15-25 min';
