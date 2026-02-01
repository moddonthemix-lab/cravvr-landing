/**
 * Supabase Storage Utilities
 *
 * Helper functions for uploading and managing images in Supabase Storage
 */

import { supabase } from './supabase';

/**
 * Upload a truck image
 * @param {File} file - The image file to upload
 * @param {string} truckId - The truck ID (for folder organization)
 * @returns {Promise<string>} The public URL of the uploaded image
 */
export const uploadTruckImage = async (file, truckId) => {
  return uploadImage(file, 'images', `trucks/${truckId}`);
};

/**
 * Upload a menu item image
 * @param {File} file - The image file to upload
 * @param {string} truckId - The truck ID (for folder organization)
 * @param {string} menuItemId - Optional menu item ID
 * @returns {Promise<string>} The public URL of the uploaded image
 */
export const uploadMenuItemImage = async (file, truckId, menuItemId = null) => {
  const folder = menuItemId
    ? `menu-items/${truckId}/${menuItemId}`
    : `menu-items/${truckId}`;
  return uploadImage(file, 'images', folder);
};

/**
 * Upload a profile/avatar image
 * @param {File} file - The image file to upload
 * @param {string} userId - The user ID
 * @returns {Promise<string>} The public URL of the uploaded image
 */
export const uploadProfileImage = async (file, userId) => {
  return uploadImage(file, 'images', `profiles/${userId}`);
};

/**
 * Generic image upload function
 * @param {File} file - The image file to upload
 * @param {string} bucket - The storage bucket name
 * @param {string} folder - The folder path within the bucket
 * @returns {Promise<string>} The public URL of the uploaded image
 */
export const uploadImage = async (file, bucket = 'images', folder = '') => {
  // Validate file
  if (!file) {
    throw new Error('No file provided');
  }

  if (!file.type.startsWith('image/')) {
    throw new Error('File must be an image');
  }

  // Check file size (max 5MB)
  const MAX_SIZE = 5 * 1024 * 1024;
  if (file.size > MAX_SIZE) {
    throw new Error('Image must be less than 5MB');
  }

  // Generate unique filename
  const fileExt = file.name.split('.').pop();
  const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
  const filePath = folder ? `${folder}/${fileName}` : fileName;

  // Upload file
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false
    });

  if (error) {
    console.error('Upload error:', error);
    throw new Error(error.message || 'Upload failed');
  }

  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from(bucket)
    .getPublicUrl(filePath);

  return publicUrl;
};

/**
 * Delete an image from storage
 * @param {string} imageUrl - The public URL of the image to delete
 * @param {string} bucket - The storage bucket name (default: 'images')
 * @returns {Promise<boolean>} True if deletion was successful
 */
export const deleteImage = async (imageUrl, bucket = 'images') => {
  if (!imageUrl) {
    return false;
  }

  try {
    // Extract file path from URL
    // URL format: https://{project}.supabase.co/storage/v1/object/public/{bucket}/{path}
    const urlParts = imageUrl.split('/storage/v1/object/public/');
    if (urlParts.length < 2) {
      console.warn('Invalid image URL format:', imageUrl);
      return false;
    }

    const pathWithBucket = urlParts[1];
    const filePath = pathWithBucket.split('/').slice(1).join('/'); // Remove bucket name

    // Delete file
    const { error } = await supabase.storage
      .from(bucket)
      .remove([filePath]);

    if (error) {
      console.error('Delete error:', error);
      return false;
    }

    return true;
  } catch (err) {
    console.error('Error deleting image:', err);
    return false;
  }
};

/**
 * Replace an image - deletes old image and uploads new one
 * @param {File} newFile - The new image file to upload
 * @param {string} oldImageUrl - The URL of the old image to delete
 * @param {string} bucket - The storage bucket name
 * @param {string} folder - The folder path within the bucket
 * @returns {Promise<string>} The public URL of the new uploaded image
 */
export const replaceImage = async (newFile, oldImageUrl, bucket = 'images', folder = '') => {
  // Upload new image first
  const newUrl = await uploadImage(newFile, bucket, folder);

  // Delete old image (non-blocking, don't wait for it)
  if (oldImageUrl) {
    deleteImage(oldImageUrl, bucket).catch(err => {
      console.warn('Failed to delete old image:', err);
      // Continue anyway - new image is uploaded
    });
  }

  return newUrl;
};

/**
 * Validate image file
 * @param {File} file - The file to validate
 * @returns {Object} { valid: boolean, error: string|null }
 */
export const validateImageFile = (file) => {
  if (!file) {
    return { valid: false, error: 'No file provided' };
  }

  if (!file.type.startsWith('image/')) {
    return { valid: false, error: 'Please select an image file' };
  }

  const MAX_SIZE = 5 * 1024 * 1024;
  if (file.size > MAX_SIZE) {
    return { valid: false, error: 'Image must be less than 5MB' };
  }

  return { valid: true, error: null };
};
