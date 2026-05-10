import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { fetchAdminTrucksWithOwners } from '../../services/admin';
import { Icons } from '../../components/common/Icons';
import { useToast } from '../../contexts/ToastContext';
import { useConfirm } from '../../contexts/ConfirmContext';
import { useAuth } from '../../components/auth/AuthContext';
import { useTruckAdmin } from './hooks/useTruckAdmin';
import CreateTruckModal from './components/CreateTruckModal';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import LoadingSplash from '../../components/common/LoadingSplash';
import { cn } from '@/lib/utils';

const STATUS_FILTERS = [
  { value: 'active', label: 'Active' },
  { value: 'suspended', label: 'Suspended' },
  { value: 'deleted', label: 'Trash' },
  { value: 'all', label: 'All' },
];

const AdminTrucksListPage = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { prompt } = useConfirm();
  const { hasAdminPermission } = useAuth();
  const canCreate = hasAdminPermission('truck.create');
  const canFlags = hasAdminPermission('truck.flags');
  const canSuspend = hasAdminPermission('truck.suspend');
  const { setFlag, restore, suspend, busy } = useTruckAdmin();
  const [trucks, setTrucks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('active');
  const [cuisineFilter, setCuisineFilter] = useState('');
  const [selected, setSelected] = useState(new Set());
  const [showCreate, setShowCreate] = useState(false);

  const fetchTrucks = async () => {
    setLoading(true);
    try {
      setTrucks(await fetchAdminTrucksWithOwners());
    } catch (err) {
      console.error('Fetch trucks failed', err);
      showToast('Failed to load trucks', 'error');
      setTrucks([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTrucks(); }, []);

  const cuisines = useMemo(
    () => [...new Set(trucks.map(t => t.cuisine).filter(Boolean))].sort(),
    [trucks]
  );

  const filtered = useMemo(() => {
    return trucks.filter(t => {
      if (statusFilter === 'active' && (t.deleted_at || t.suspended_at)) return false;
      if (statusFilter === 'suspended' && !t.suspended_at) return false;
      if (statusFilter === 'deleted' && !t.deleted_at) return false;
      if (cuisineFilter && t.cuisine !== cuisineFilter) return false;
      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        const hay = `${t.name || ''} ${t.cuisine || ''} ${t.owner_name || ''} ${t.owner_email || ''} ${t.location || ''}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [trucks, statusFilter, cuisineFilter, searchTerm]);

  const toggleSelectAll = () => {
    if (selected.size === filtered.length) setSelected(new Set());
    else setSelected(new Set(filtered.map(t => t.id)));
  };

  const toggleOne = (id) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelected(next);
  };

  const bulkSetFlag = async (flag, value) => {
    const ids = [...selected];
    if (ids.length === 0) return;
    try {
      for (const id of ids) await setFlag(id, flag, value);
      showToast(`${ids.length} trucks updated`, 'success');
      setSelected(new Set());
      await fetchTrucks();
    } catch (e) { /* errors already toasted */ }
  };

  const bulkSuspend = async () => {
    const reason = await prompt({
      title: `Suspend ${selected.size} trucks`,
      message: 'All selected trucks will be hidden from public listings.',
      confirmText: 'Suspend all',
      variant: 'danger',
      inputLabel: 'Reason',
    });
    if (!reason) return;
    const ids = [...selected];
    for (const id of ids) await suspend(id, reason);
    setSelected(new Set());
    await fetchTrucks();
  };

  const bulkRestore = async () => {
    const ids = [...selected];
    for (const id of ids) await restore(id, 'bulk restore');
    setSelected(new Set());
    await fetchTrucks();
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-6 space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Food Trucks</h1>
          <p className="text-sm text-muted-foreground">Browse, edit, and moderate every truck.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {canCreate && (
            <Button onClick={() => setShowCreate(true)} size="sm" className="gap-1.5">
              <span className="h-4 w-4">{Icons.plus}</span>
              New truck
            </Button>
          )}
          <Button asChild variant="outline" size="sm" className="gap-1.5">
            <Link to="/admin">
              <span className="h-4 w-4">{Icons.chevronLeft}</span>
              Back to dashboard
            </Link>
          </Button>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <input
          type="search"
          placeholder="Search by name, cuisine, owner, or location…"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="h-10 flex-1 rounded-md border border-input bg-background px-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 lg:max-w-md"
        />
        <div className="flex flex-wrap items-center gap-1.5">
          {STATUS_FILTERS.map(s => {
            const isActive = statusFilter === s.value;
            return (
              <button
                key={s.value}
                onClick={() => setStatusFilter(s.value)}
                className={cn(
                  'inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium transition-colors',
                  isActive
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground'
                )}
              >
                {s.label}
              </button>
            );
          })}
        </div>
        <select
          value={cuisineFilter}
          onChange={(e) => setCuisineFilter(e.target.value)}
          className="h-10 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        >
          <option value="">All cuisines</option>
          {cuisines.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {/* Bulk bar */}
      {selected.size > 0 && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="flex flex-wrap items-center gap-2 p-3 text-sm">
            <span className="font-semibold tabular-nums">
              {selected.size} selected
            </span>
            <span className="text-border">·</span>
            {canFlags && (
              <>
                <Button variant="ghost" size="sm" disabled={busy} onClick={() => bulkSetFlag('featured', true)}>
                  Feature
                </Button>
                <Button variant="ghost" size="sm" disabled={busy} onClick={() => bulkSetFlag('featured', false)}>
                  Unfeature
                </Button>
                <Button variant="ghost" size="sm" disabled={busy} onClick={() => bulkSetFlag('verified', true)}>
                  Verify
                </Button>
                <Button variant="ghost" size="sm" disabled={busy} onClick={() => bulkSetFlag('verified', false)}>
                  Unverify
                </Button>
              </>
            )}
            {canSuspend && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={busy}
                  onClick={bulkSuspend}
                  className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                >
                  Suspend
                </Button>
                <Button variant="ghost" size="sm" disabled={busy} onClick={bulkRestore}>
                  Restore
                </Button>
              </>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelected(new Set())}
              className="ml-auto"
            >
              Clear
            </Button>
          </CardContent>
        </Card>
      )}

      {showCreate && (
        <CreateTruckModal
          onClose={() => setShowCreate(false)}
          onCreated={(truck) => {
            showToast('Truck created', 'success');
            navigate(`/admin/trucks/${truck.id}`);
          }}
        />
      )}

      {/* Table */}
      {loading ? (
        <LoadingSplash size="inline" tagline="LOADING TRUCKS" />
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  <th className="w-10 px-4 py-3">
                    <input
                      type="checkbox"
                      checked={filtered.length > 0 && selected.size === filtered.length}
                      onChange={toggleSelectAll}
                      className="h-4 w-4 rounded border-input text-primary accent-primary"
                    />
                  </th>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Cuisine</th>
                  <th className="px-4 py-3">Owner</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Updated</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-10 text-center text-sm text-muted-foreground">
                      No trucks match these filters.
                    </td>
                  </tr>
                )}
                {filtered.map(t => (
                  <tr
                    key={t.id}
                    className={cn(
                      'hover:bg-muted/30 transition-colors',
                      t.deleted_at && 'opacity-50',
                      t.suspended_at && 'bg-warning/5'
                    )}
                  >
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selected.has(t.id)}
                        onChange={() => toggleOne(t.id)}
                        className="h-4 w-4 rounded border-input text-primary accent-primary"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        to={`/admin/trucks/${t.id}`}
                        className="inline-flex items-center gap-2.5 font-semibold text-foreground hover:text-primary transition-colors"
                      >
                        {t.image_url && (
                          <img
                            src={t.image_url}
                            alt=""
                            className="h-9 w-9 rounded-md object-cover ring-1 ring-black/5"
                          />
                        )}
                        <span>{t.name || '(unnamed)'}</span>
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{t.cuisine || '—'}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col leading-tight">
                        <span>{t.owner_name}</span>
                        {t.owner_email && (
                          <span className="text-xs text-muted-foreground">{t.owner_email}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap items-center gap-1">
                        {t.deleted_at && <Badge variant="destructive">Deleted</Badge>}
                        {t.suspended_at && <Badge variant="warning">Suspended</Badge>}
                        {!t.deleted_at && !t.suspended_at && t.is_open && <Badge variant="positive">Open</Badge>}
                        {!t.deleted_at && !t.suspended_at && !t.is_open && <Badge variant="secondary">Closed</Badge>}
                        {t.featured && <Badge variant="warning">Featured</Badge>}
                        {t.verified && <Badge variant="info">Verified</Badge>}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground tabular-nums">
                      {t.updated_at ? new Date(t.updated_at).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <Button asChild variant="ghost" size="sm">
                        <Link to={`/admin/trucks/${t.id}`}>Open</Link>
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
};

export default AdminTrucksListPage;
