# Supabase Storage Setup Guide

This guide explains how to set up Supabase Storage buckets for the Cravvr app to enable image uploads.

## Overview

The app needs storage for:
- **Truck photos** - Main image for each food truck
- **Menu item photos** - Photos of food/menu items
- **Profile pictures** - User/owner avatar images

All images will be stored in a single `images` bucket with organized folder structure.

## Step 1: Create Storage Bucket

1. Go to your Supabase Dashboard: https://coqwihsmmigktqqdnmis.supabase.co
2. Navigate to **Storage** in the left sidebar
3. Click **New Bucket**
4. Configure the bucket:
   - **Name**: `images`
   - **Public bucket**: ✅ Check this box (so images are publicly accessible)
   - **Allowed MIME types**: Leave empty or add: `image/jpeg, image/png, image/jpg, image/webp, image/gif`
   - **File size limit**: `5242880` (5MB in bytes)

5. Click **Create Bucket**

## Step 2: Set Up Storage Policies

The bucket needs RLS (Row Level Security) policies to control who can upload/delete images.

### Policy 1: Public Read Access (Anyone can view images)

Go to **Storage** → **Policies** → Click **New Policy** on the `images` bucket:

```sql
-- Policy Name: Public read access
-- Operation: SELECT
-- Policy Definition:

CREATE POLICY "Public read access"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'images');
```

### Policy 2: Authenticated Upload (Logged in users can upload)

```sql
-- Policy Name: Authenticated users can upload
-- Operation: INSERT
-- Policy Definition:

CREATE POLICY "Authenticated users can upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'images');
```

### Policy 3: Users Can Update Their Own Files

```sql
-- Policy Name: Users can update own files
-- Operation: UPDATE
-- Policy Definition:

CREATE POLICY "Users can update own files"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'images' AND auth.uid()::text = owner);
```

### Policy 4: Users Can Delete Their Own Files

```sql
-- Policy Name: Users can delete own files
-- Operation: DELETE
-- Policy Definition:

CREATE POLICY "Users can delete own files"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'images' AND auth.uid()::text = owner);
```

## Step 3: Alternative - Use Supabase Dashboard UI

Instead of SQL, you can create policies through the UI:

1. Go to **Storage** → Click on `images` bucket → **Policies** tab
2. Click **New Policy**
3. Choose template or create custom policy
4. For each operation (SELECT, INSERT, UPDATE, DELETE), create appropriate policies

**Quick Setup Option:**
- Select "Allow public access" template for SELECT
- Select "Allow authenticated access" template for INSERT/UPDATE/DELETE

## Step 4: Folder Structure

The app will automatically organize uploads into folders:

```
images/
├── trucks/
│   ├── {truckId}/
│   │   └── {timestamp}_{random}.jpg
│   └── {truckId}/
│       └── {timestamp}_{random}.png
├── menu-items/
│   ├── {truckId}/
│   │   ├── {menuItemId}/
│   │   │   └── {timestamp}_{random}.jpg
│   │   └── {timestamp}_{random}.png
└── profiles/
    └── {userId}/
        └── {timestamp}_{random}.jpg
```

No manual folder creation needed - folders are created automatically when files are uploaded.

## Step 5: Verify Setup

Test the storage setup:

1. Go to **Storage** → `images` bucket
2. Try uploading a test image manually
3. Click on the image and copy the public URL
4. Open the URL in a new tab - you should see the image

If you can see the image, the bucket is configured correctly!

## Step 6: Environment Variables (Optional)

The app currently loads Supabase credentials from `/public/supabase-init.js`. The storage bucket name is hardcoded as `'images'` in the utility functions.

If you want to use a different bucket name, update these files:
- `/src/lib/storage.js` - Change `bucket = 'images'` parameter defaults
- `/src/components/common/ImageUpload.jsx` - Change `bucket = 'images'` prop default

## Troubleshooting

### Images won't upload
- Check that user is authenticated (logged in)
- Verify bucket name is exactly `images` (case-sensitive)
- Check browser console for errors
- Verify policies are enabled

### Images upload but can't be viewed
- Make sure bucket is set to **Public**
- Check the "Public read access" policy is enabled
- Verify the public URL format is correct

### Upload says "Permission denied"
- User must be logged in for uploads
- Check INSERT policy exists for authenticated users
- Verify bucket_id in policy matches `'images'`

### Old images not deleting
- Check DELETE policy exists
- Verify user is the owner of the image
- Note: Delete failures are non-blocking (won't prevent new uploads)

## SQL Scripts (Alternative Setup)

If you prefer to run SQL directly, go to **SQL Editor** in Supabase and run:

```sql
-- Create storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('images', 'images', true);

-- Enable RLS
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Public read access"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'images');

CREATE POLICY "Authenticated users can upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'images');

CREATE POLICY "Users can update own files"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'images' AND auth.uid()::text = owner);

CREATE POLICY "Users can delete own files"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'images' AND auth.uid()::text = owner);
```

## Security Notes

- Max file size: 5MB (validated both client-side and server-side)
- Allowed file types: Images only (validated client-side)
- Users can only delete their own uploads
- All uploads are public (anyone with URL can view)
- Authentication required for uploads

## Next Steps

After setting up storage:
1. Test uploading a truck image from Owner Dashboard
2. Test uploading a menu item image
3. Test uploading a profile picture
4. Verify images display correctly on the browse page
5. Test image deletion/replacement
