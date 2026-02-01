-- ============================================
-- Migration: Add image_url to menu_items
-- ============================================
-- This column was missing from the original schema but is used by the frontend

ALTER TABLE menu_items
ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Add comment for documentation
COMMENT ON COLUMN menu_items.image_url IS 'URL to the menu item image stored in Supabase storage';
