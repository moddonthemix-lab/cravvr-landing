import React, { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { supabase } from '../../../lib/supabase';
import ImageUpload from '../../../components/common/ImageUpload';
import { useToast } from '../../../contexts/ToastContext';
import { useConfirm } from '../../../contexts/ConfirmContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import LoadingSplash from '../../../components/common/LoadingSplash';

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
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-6 space-y-5">
      <div>
        <h2 className="text-xl font-bold tracking-tight">Photos</h2>
        <p className="text-xs text-muted-foreground mt-1">
          Files in <code className="rounded bg-muted px-1.5 py-0.5 text-foreground">images/{folder}/</code>
        </p>
      </div>

      <ImageUpload
        label="Upload a new photo"
        currentImage={pendingUrl}
        onUpload={handleUploaded}
        bucket="images"
        folder={folder}
      />

      {loading ? (
        <LoadingSplash size="inline" tagline="LOADING PHOTOS" />
      ) : photos.length === 0 ? (
        <Card>
          <CardContent className="flex items-center justify-center py-10 text-sm text-muted-foreground">
            No photos uploaded yet.
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {photos.map(p => (
            <Card key={p.path} className="overflow-hidden">
              <div className="aspect-square overflow-hidden bg-muted">
                <img src={p.url} alt={p.name} className="h-full w-full object-cover" />
              </div>
              <CardContent className="p-2 flex items-center justify-between gap-1">
                <Button asChild variant="ghost" size="sm">
                  <a href={p.url} target="_blank" rel="noopener noreferrer">
                    Open
                  </a>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(p.path)}
                  className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                >
                  Delete
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default PhotosTab;
