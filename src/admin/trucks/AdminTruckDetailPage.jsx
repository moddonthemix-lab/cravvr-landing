import React, { useEffect, useState, useCallback } from 'react';
import { Link, NavLink, Outlet, useParams, useNavigate } from 'react-router-dom';
import { fetchAdminTruckById } from '../../services/admin';
import { Icons } from '../../components/common/Icons';
import { useToast } from '../../contexts/ToastContext';
import { useAuth } from '../../components/auth/AuthContext';
import AdminBadgePanel from './components/AdminBadgePanel';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import LoadingSplash from '../../components/common/LoadingSplash';
import { cn } from '@/lib/utils';

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
  { path: 'danger', label: 'Danger Zone', danger: true },
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
      const { truck: data, owner: prof } = await fetchAdminTruckById(id);
      if (!data) {
        showToast('Truck not found', 'error');
        navigate('/admin/trucks');
        return;
      }
      setTruck(data);
      setOwner(prof);
    } catch (err) {
      console.error('Fetch truck failed', err);
      showToast(err.message || 'Failed to load truck', 'error');
    } finally {
      setLoading(false);
    }
  }, [id, navigate, showToast]);

  useEffect(() => { fetchTruck(); }, [fetchTruck]);

  if (loading || !truck) {
    return <LoadingSplash tagline="LOADING TRUCK" />;
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
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-6 space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2 min-w-0">
          <Link
            to="/admin/trucks"
            className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <span className="h-4 w-4">{Icons.chevronLeft}</span>
            All trucks
          </Link>
          <h1 className="text-2xl font-bold tracking-tight">
            {truck.name || '(unnamed truck)'}
          </h1>
          <p className="text-xs text-muted-foreground">
            Owner: {owner?.name || '—'}{owner?.email ? ` · ${owner.email}` : ''}
          </p>
          <div className="flex flex-wrap items-center gap-1.5">
            {truck.deleted_at && <Badge variant="destructive">Deleted</Badge>}
            {truck.suspended_at && <Badge variant="warning">Suspended</Badge>}
            {!truck.deleted_at && !truck.suspended_at && truck.is_open && (
              <Badge variant="positive">Open</Badge>
            )}
            {!truck.deleted_at && !truck.suspended_at && !truck.is_open && (
              <Badge variant="secondary">Closed</Badge>
            )}
            {truck.featured && <Badge variant="warning">Featured</Badge>}
            {truck.verified && <Badge variant="info">Verified</Badge>}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <Button asChild variant="outline" size="sm" className="gap-1.5">
            <a href={publicUrl} target="_blank" rel="noopener noreferrer">
              <span className="h-4 w-4">{Icons.eye}</span>
              View public page
            </a>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleViewAsOwner}
            disabled={!owner}
            className="gap-1.5"
          >
            <span className="h-4 w-4">{Icons.user}</span>
            View as owner
          </Button>
        </div>
      </div>

      {/* Sub-tabs (horizontal scroll) */}
      <nav className="-mx-4 sm:-mx-6 px-4 sm:px-6 flex gap-1.5 overflow-x-auto pb-2 border-b border-border">
        {SUBTABS.map(t => (
          <NavLink
            key={t.path}
            to={t.path}
            className={({ isActive }) =>
              cn(
                'inline-flex shrink-0 items-center rounded-full border px-3 py-1.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                isActive
                  ? t.danger
                    ? 'border-destructive bg-destructive text-destructive-foreground'
                    : 'border-primary bg-primary text-primary-foreground'
                  : t.danger
                    ? 'border-destructive/30 bg-background text-destructive hover:bg-destructive/10'
                    : 'border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground'
              )
            }
          >
            {t.label}
          </NavLink>
        ))}
      </nav>

      {/* Content area */}
      <div className="grid gap-5 lg:grid-cols-[260px_1fr]">
        <aside className="space-y-4">
          <AdminBadgePanel truck={truck} onChange={fetchTruck} />
        </aside>

        <section className="-mx-4 sm:-mx-6 lg:mx-0">
          <Outlet context={{ truck, owner, refetch: fetchTruck }} />
        </section>
      </div>
    </div>
  );
};

export default AdminTruckDetailPage;
