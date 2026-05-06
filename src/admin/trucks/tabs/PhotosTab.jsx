import React, { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { supabase } from '../../../lib/supabase';
import ImageUpload from '../../../components/common/ImageUpload';
import { Icons } from '../../../components/common/Icons';
import { useToast } from '../../../contexts/ToastContext';
import { useConfirm } from '../../../contexts/ConfirmContext';

const PhotosTab = () => {
  const { truck } = useOutletContext();
  const { showToast } = useToast();
  const { confirm } = useConfirm();
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pendingUrl, setPendingUrl] = useState('');

  const folder = `trucks/${truck.id}`;

  const fetchPhotos = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.storage.from('images').list(folder, { limit: 100 });
      if (error) throw error;
      const items = (data || []).filter(o => o.name && !o.name.endsWith('/'));
      const withUrls = items.map(o => {
        const path = `${folder}/${o.name}`;
        const { data: pub } = supabase.storage.from('images').getPublicUrl(path);
        return { name: o.name, path, url: pub?.publicUrl };
      });
      setPhotos(withUrls);
    } catch (err) {
      console.error('List photos failed', err);
      showToast('Could not list photos', 'error');
      setPhotos([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPhotos(); }, [truck.id]);

  const handleUploaded = (url) => {
    setPendingUrl(url);
    fetchPhotos();
  };

  const handleDelete = async (path) => {
    const ok = await confirm({
      title: 'Delete photo',
      message: 'Remove this image from storage? This cannot be undone.',
      confirmText: 'Delete',
      variant: 'danger',
    });
    if (!ok) return;
    try {
      const { error } = await supabase.storage.from('images').remove([path]);
      if (error) throw error;
      showToast('Photo deleted', 'success');
      fetchPhotos();
    } catch (err) {
      console.error(err);
      showToast(err.message || 'Delete failed', 'error');
    }
  };

  return (
    <div className="admin-tab-form">
      <h2>Photos</h2>
      <p className="cell-sub">Files in <code>images/{folder}/</code></p>

      <ImageUpload
        label="Upload a new photo"
        currentImage={pendingUrl}
        onUpload={handleUploaded}
        bucket="images"
        folder={folder}
      />

      {loading ? (
        <div className="loading-state">{Icons.loader} Loading...</div>
      ) : photos.length === 0 ? (
        <p className="cell-sub">No photos uploaded yet.</p>
      ) : (
        <div className="photo-grid">
          {photos.map(p => (
            <div className="photo-tile" key={p.path}>
              <img src={p.url} alt={p.name} />
              <div className="photo-tile-actions">
                <a href={p.url} target="_blank" rel="noopener noreferrer" className="btn-link">Open</a>
                <button type="button" className="btn-link danger" onClick={() => handleDelete(p.path)}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PhotosTab;
