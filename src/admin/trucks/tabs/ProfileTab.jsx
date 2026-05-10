import React, { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import LocationInput from '../../../components/truck-form/LocationInput';
import ImageUpload from '../../../components/common/ImageUpload';
import { Icons } from '../../../components/common/Icons';
import { isTruckSlugAvailable } from '../../../services/admin';
import { useTruckAdmin } from '../hooks/useTruckAdmin';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

const PRICE_RANGES = ['$', '$$', '$$$', '$$$$'];
const SLUG_RE = /^[a-z0-9-]+$/;

const ProfileTab = () => {
  const { truck, refetch } = useOutletContext();
  const { updateTruck, busy } = useTruckAdmin();

  const [form, setForm] = useState({
    name: '', slug: '', description: '', cuisine: '', price_range: '$',
    location: '', coordinates: null, phone: '', website: '', instagram: '', image_url: '',
  });
  const [reason, setReason] = useState('');
  const [slugStatus, setSlugStatus] = useState('idle');

  useEffect(() => {
    setForm({
      name: truck.name || '',
      slug: truck.slug || '',
      description: truck.description || '',
      cuisine: truck.cuisine || '',
      price_range: truck.price_range || '$',
      location: truck.location || '',
      coordinates: truck.coordinates || null,
      phone: truck.phone || '',
      website: truck.website || '',
      instagram: truck.instagram || '',
      image_url: truck.image_url || '',
    });
  }, [truck]);

  useEffect(() => {
    if (!form.slug || form.slug === truck.slug) {
      setSlugStatus('idle');
      return;
    }
    if (!SLUG_RE.test(form.slug)) {
      setSlugStatus('invalid');
      return;
    }
    setSlugStatus('checking');
    const handle = setTimeout(async () => {
      const available = await isTruckSlugAvailable(form.slug, truck.id).catch(() => false);
      setSlugStatus(available ? 'ok' : 'conflict');
    }, 350);
    return () => clearTimeout(handle);
  }, [form.slug, truck.slug, truck.id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (slugStatus === 'conflict' || slugStatus === 'invalid') return;
    const patch = {
      name: form.name,
      slug: form.slug || null,
      description: form.description,
      cuisine: form.cuisine,
      price_range: form.price_range,
      location: form.location,
      coordinates: form.coordinates,
      phone: form.phone,
      website: form.website,
      instagram: form.instagram,
      image_url: form.image_url,
    };
    await updateTruck(truck.id, patch, reason || null);
    setReason('');
    refetch();
  };

  const slugHint = (() => {
    if (slugStatus === 'checking') return <span className="text-xs text-muted-foreground">Checking…</span>;
    if (slugStatus === 'invalid') return <span className="text-xs text-destructive">Use lowercase letters, digits, hyphens only</span>;
    if (slugStatus === 'conflict') return <span className="text-xs text-destructive">Slug already in use</span>;
    if (slugStatus === 'ok') return <span className="text-xs text-positive font-semibold">Available</span>;
    return null;
  })();

  return (
    <form
      onSubmit={handleSubmit}
      className="mx-auto max-w-3xl px-4 sm:px-6 py-6 space-y-5"
    >
      <h2 className="text-xl font-bold tracking-tight">Profile</h2>

      <div className="space-y-2">
        <Label htmlFor="profile-name">Truck name</Label>
        <Input
          id="profile-name"
          type="text"
          required
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="profile-slug">
          Slug <span className="font-normal text-xs text-muted-foreground">(URL handle — lowercase letters, digits, hyphens)</span>
        </Label>
        <Input
          id="profile-slug"
          type="text"
          value={form.slug}
          onChange={(e) => setForm({ ...form, slug: e.target.value.trim() })}
        />
        {slugHint}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="profile-cuisine">Cuisine</Label>
          <Input
            id="profile-cuisine"
            type="text"
            value={form.cuisine}
            onChange={(e) => setForm({ ...form, cuisine: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="profile-price-range">Price range</Label>
          <select
            id="profile-price-range"
            value={form.price_range}
            onChange={(e) => setForm({ ...form, price_range: e.target.value })}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          >
            {PRICE_RANGES.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="profile-description">Description</Label>
        <Textarea
          id="profile-description"
          rows={3}
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />
      </div>

      <div className="space-y-2">
        <Label>Location</Label>
        <LocationInput
          value={form.location}
          coordinates={form.coordinates}
          onChange={({ location, coordinates }) => setForm(f => ({ ...f, location, coordinates: coordinates ?? f.coordinates }))}
          required={false}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="profile-phone">Phone</Label>
          <Input
            id="profile-phone"
            type="tel"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="profile-website">Website</Label>
          <Input
            id="profile-website"
            type="url"
            value={form.website}
            onChange={(e) => setForm({ ...form, website: e.target.value })}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="profile-instagram">Instagram handle</Label>
        <Input
          id="profile-instagram"
          type="text"
          placeholder="@handle"
          value={form.instagram}
          onChange={(e) => setForm({ ...form, instagram: e.target.value })}
        />
      </div>

      <ImageUpload
        label="Hero image"
        currentImage={form.image_url}
        onUpload={(url) => setForm({ ...form, image_url: url })}
        bucket="images"
        folder={`trucks/${truck.id}`}
        disabled={busy}
      />

      <div className="space-y-2">
        <Label htmlFor="profile-audit-reason">
          Audit reason <span className="font-normal text-xs text-muted-foreground">(optional, recorded in audit log)</span>
        </Label>
        <Input
          id="profile-audit-reason"
          type="text"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="e.g. owner email request 2026-05-04"
        />
      </div>

      <div className="flex justify-end">
        <Button
          type="submit"
          disabled={busy || slugStatus === 'conflict' || slugStatus === 'invalid'}
          className="gap-1.5"
        >
          {busy ? (
            'Saving…'
          ) : (
            <>
              <span className="h-4 w-4">{Icons.check}</span>
              Save profile
            </>
          )}
        </Button>
      </div>
    </form>
  );
};

export default ProfileTab;
