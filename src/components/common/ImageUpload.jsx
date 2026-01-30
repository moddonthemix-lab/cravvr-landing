import React, { useState, useRef } from 'react';
import './ImageUpload.css';

const Icons = {
  upload: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>,
  image: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>,
  x: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  loader: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="animate-spin"><circle cx="12" cy="12" r="10" strokeOpacity="0.25"/><path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round"/></svg>,
};

/**
 * ImageUpload Component
 *
 * Reusable image upload component with drag & drop support
 * Uploads to Supabase Storage and returns the public URL
 *
 * @param {string} currentImage - Current image URL (if any)
 * @param {function} onUpload - Callback when image is uploaded (url) => void
 * @param {string} bucket - Supabase storage bucket name
 * @param {string} folder - Folder path within bucket (e.g., 'trucks', 'menu-items')
 * @param {string} label - Label for the upload area
 * @param {boolean} disabled - Disable uploads
 */
const ImageUpload = ({
  currentImage,
  onUpload,
  bucket = 'images',
  folder = '',
  label = 'Upload Image',
  disabled = false
}) => {
  const [preview, setPreview] = useState(currentImage);
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  // Handle file selection
  const handleFileSelect = async (file) => {
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be less than 5MB');
      return;
    }

    setError(null);
    setUploading(true);

    try {
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => setPreview(e.target.result);
      reader.readAsDataURL(file);

      // Upload to Supabase Storage
      const url = await uploadImage(file, bucket, folder);

      // Call parent callback with URL
      onUpload(url);
    } catch (err) {
      setError(err.message || 'Upload failed');
      setPreview(currentImage); // Revert preview
    } finally {
      setUploading(false);
    }
  };

  // Upload image to Supabase Storage
  const uploadImage = async (file, bucketName, folderPath) => {
    const supabase = window.supabaseClient;

    if (!supabase) {
      throw new Error('Supabase client not initialized');
    }

    // Generate unique filename
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = folderPath ? `${folderPath}/${fileName}` : fileName;

    // Upload file
    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      throw new Error(error.message);
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from(bucketName)
      .getPublicUrl(filePath);

    return publicUrl;
  };

  // Handle drag & drop
  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(false);

    if (disabled) return;

    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) {
      setDragging(true);
    }
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(false);
  };

  // Handle click to select file
  const handleClick = () => {
    if (!disabled) {
      fileInputRef.current?.click();
    }
  };

  // Handle remove image
  const handleRemove = (e) => {
    e.stopPropagation();
    setPreview(null);
    onUpload(''); // Clear image URL
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="image-upload-container">
      {label && <label className="image-upload-label">{label}</label>}

      <div
        className={`image-upload-area ${dragging ? 'dragging' : ''} ${disabled ? 'disabled' : ''} ${preview ? 'has-image' : ''}`}
        onClick={handleClick}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={(e) => handleFileSelect(e.target.files[0])}
          style={{ display: 'none' }}
          disabled={disabled}
        />

        {uploading ? (
          <div className="upload-state">
            {Icons.loader}
            <span>Uploading...</span>
          </div>
        ) : preview ? (
          <div className="image-preview">
            <img src={preview} alt="Preview" />
            <button
              className="remove-image-btn"
              onClick={handleRemove}
              type="button"
            >
              {Icons.x}
            </button>
          </div>
        ) : (
          <div className="upload-placeholder">
            {Icons.upload}
            <span className="upload-text">Click or drag image here</span>
            <span className="upload-hint">PNG, JPG up to 5MB</span>
          </div>
        )}
      </div>

      {error && (
        <div className="image-upload-error">
          {error}
        </div>
      )}
    </div>
  );
};

export default ImageUpload;
