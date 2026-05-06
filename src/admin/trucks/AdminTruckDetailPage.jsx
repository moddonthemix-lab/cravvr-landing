import React, { useEffect, useState, useCallback } from 'react';
import { Link, NavLink, Outlet, useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Icons } from '../../components/common/Icons';
import { useToast } from '../../contexts/ToastContext';
import { useAuth } from '../../components/auth/AuthContext';
import AdminBadgePanel from './components/AdminBadgePanel';
import './AdminTrucks.css';

const SUBTABS = [
  { path: 'profile', label: 'Profile' },
  { path: 'analytics', label: 'Analytics' },
  { path: 'menu', label: 'Menu' },
  { path: 'hours', label: 'Hours' },
  { path: 'photos', label: 'Photos' },
  { path: 'orders', label: 'Orders' },
  { path: 'reviews', label: 'Reviews' },
  { path: 'settings', label: 'Settings' },
  { path: 'owner', label: 'Owner profile' },
  { path: 'audit', label: 'Audit' },
  { path: 'danger', label: 'Danger Zone' },
];

const AdminTruckDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { startViewingAs } = useAuth();
  const [truck, setTruck] = useState(null);
  const [owner, setOwner] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchTruck = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('food_trucks')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      if (error) throw error;
      if (!data) {
        showToast('Truck not found', 'error');
        navigate('/admin/trucks');
        return;
      }
      setTruck(data);
      if (data.owner_id) {
        const { data: prof } = await supabase
          .from('profiles')
          .select('id, name, email')
          .eq('id', data.owner_id)
          .maybeSingle();
        setOwner(prof || null);
      } else {
        setOwner(null);
      }
    } catch (err) {
      console.error('Fetch truck failed', err);
      showToast(err.message || 'Failed to load truck', 'error');
    } finally {
      setLoading(false);
    }
  }, [id, navigate, showToast]);

  useEffect(() => { fetchTruck(); }, [fetchTruck]);

  if (loading || !truck) {
    return (
      <div className="admin-trucks-page">
        <div className="loading-state">{Icons.loader} Loading...</div>
      </div>
    );
  }

  const publicUrl = `/truck/${truck.id}`;

  const handleViewAsOwner = async () => {
    if (!owner) {
      showToast('No owner linked to this truck', 'error');
      return;
    }
    await startViewingAs({ id: owner.id, email: owner.email });
    navigate(`/owner?truckId=${truck.id}`);
  };

  return (
    <div className="admin-trucks-page admin-truck-detail">
      <div className="admin-trucks-header">
        <div>
          <Link to="/admin/trucks" className="back-link">{Icons.chevronLeft} All trucks</Link>
          <h1>{truck.name || '(unnamed truck)'}</h1>
          <p className="cell-sub">
            Owner: {owner?.name || '—'}{owner?.email ? ` · ${owner.email}` : ''}
          </p>
          <div className="badge-row" style={{ marginTop: 8 }}>
            {truck.deleted_at && <span className="admin-badge admin-badge-danger">Deleted</span>}
            {truck.suspended_at && <span className="admin-badge admin-badge-warning">Suspended</span>}
            {!truck.deleted_at && !truck.suspended_at && truck.is_open && <span className="admin-badge admin-badge-success">Open</span>}
            {!truck.deleted_at && !truck.suspended_at && !truck.is_open && <span className="admin-badge admin-badge-neutral">Closed</span>}
            {truck.featured && <span className="admin-badge admin-badge-accent">Featured</span>}
            {truck.verified && <span className="admin-badge admin-badge-info">Verified</span>}
          </div>
        </div>
        <div className="admin-trucks-actions">
          <a href={publicUrl} target="_blank" rel="noopener noreferrer" className="btn-secondary">
            {Icons.eye} View public page
          </a>
          <button type="button" className="btn-secondary" onClick={handleViewAsOwner} disabled={!owner}>
            {Icons.user} View as owner
          </button>
        </div>
      </div>

      <div className="admin-truck-body">
        <aside className="admin-truck-sidebar">
          <nav className="admin-subtabs">
            {SUBTABS.map(t => (
              <NavLink
                key={t.path}
                to={t.path}
                className={({ isActive }) => `admin-subtab ${isActive ? 'active' : ''} ${t.path === 'danger' ? 'danger' : ''}`}
              >
                {t.label}
              </NavLink>
            ))}
          </nav>
          <AdminBadgePanel truck={truck} onChange={fetchTruck} />
        </aside>

        <section className="admin-truck-content">
          <Outlet context={{ truck, owner, refetch: fetchTruck }} />
        </section>
      </div>
    </div>
  );
};

export default AdminTruckDetailPage;
