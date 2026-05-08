import React, { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import LocationInput from '../../../components/truck-form/LocationInput';
import ImageUpload from '../../../components/common/ImageUpload';
import { Icons } from '../../../components/common/Icons';
import { isTruckSlugAvailable } from '../../../services/admin';
import { useTruckAdmin } from '../hooks/useTruckAdmin';

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
  const [slugStatus, setSlugStatus] = useState('idle'); // idle | checking | ok | conflict | invalid

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

  // Debounced slug check
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

  return (
    <form className="admin-tab-form" onSubmit={handleSubmit}>
      <h2>Profile</h2>

      <div className="form-group">
        <label>Truck name</label>
        <input type="text" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
      </div>

      <div className="form-group">
        <label>
          Slug <span className="cell-sub">(URL handle — lowercase letters, digits, hyphens)</span>
        </label>
        <input
          type="text"
          value={form.slug}
          onChange={(e) => setForm({ ...form, slug: e.target.value.trim() })}
        />
        {slugStatus === 'checking' && <span className="cell-sub">Checking…</span>}
        {slugStatus === 'invalid' && <span className="form-error">Use lowercase letters, digits, hyphens only</span>}
        {slugStatus === 'conflict' && <span className="form-error">Slug already in use</span>}
        {slugStatus === 'ok' && <span className="form-ok">Available</span>}
      </div>

      <div className="form-row">
        <div className="form-group">
          <label>Cuisine</label>
          <input type="text" value={form.cuisine} onChange={(e) => setForm({ ...form, cuisine: e.target.value })} />
        </div>
        <div className="form-group">
          <label>Price range</label>
          <select value={form.price_range} onChange={(e) => setForm({ ...form, price_range: e.target.value })}>
            {PRICE_RANGES.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
      </div>

      <div className="form-group">
        <label>Description</label>
        <textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
      </div>

      <div className="form-group">
        <label>Location</label>
        <LocationInput
          value={form.location}
          coordinates={form.coordinates}
          onChange={({ location, coordinates }) => setForm(f => ({ ...f, location, coordinates: coordinates ?? f.coordinates }))}
          required={false}
        />
      </div>

      <div className="form-row">
        <div className="form-group">
          <label>Phone</label>
          <input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        </div>
        <div className="form-group">
          <label>Website</label>
          <input type="url" value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} />
        </div>
      </div>

      <div className="form-group">
        <label>Instagram handle</label>
        <input type="text" placeholder="@handle" value={form.instagram} onChange={(e) => setForm({ ...form, instagram: e.target.value })} />
      </div>

      <ImageUpload
        label="Hero image"
        currentImage={form.image_url}
        onUpload={(url) => setForm({ ...form, image_url: url })}
        bucket="images"
        folder={`trucks/${truck.id}`}
        disabled={busy}
      />

      <div className="form-group">
        <label>Audit reason <span className="cell-sub">(optional, recorded in audit log)</span></label>
        <input type="text" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. owner email request 2026-05-04" />
      </div>

      <div className="form-actions">
        <button type="submit" className="btn-primary" disabled={busy || slugStatus === 'conflict' || slugStatus === 'invalid'}>
          {busy ? 'Saving...' : <>{Icons.check} Save profile</>}
        </button>
      </div>
    </form>
  );
};

export default ProfileTab;
