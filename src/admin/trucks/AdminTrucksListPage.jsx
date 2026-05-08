import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Icons } from '../../components/common/Icons';
import { useToast } from '../../contexts/ToastContext';
import { useConfirm } from '../../contexts/ConfirmContext';
import { useAuth } from '../../components/auth/AuthContext';
import { useTruckAdmin } from './hooks/useTruckAdmin';
import CreateTruckModal from './components/CreateTruckModal';
import './AdminTrucks.css';

const STATUS_FILTERS = [
  { value: 'active', label: 'Active' },
  { value: 'suspended', label: 'Suspended' },
  { value: 'deleted', label: 'Trash' },
  { value: 'all', label: 'All' },
];

const Badge = ({ tone, children }) => (
  <span className={`admin-badge admin-badge-${tone}`}>{children}</span>
);

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
      const { data, error } = await supabase
        .from('food_trucks')
        .select('*')
        .order('updated_at', { ascending: false, nullsFirst: false });
      if (error) throw error;

      const ownerIds = [...new Set((data || []).map(t => t.owner_id).filter(Boolean))];
      let owners = {};
      if (ownerIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, name, email')
          .in('id', ownerIds);
        (profiles || []).forEach(p => { owners[p.id] = p; });
      }

      const enriched = (data || []).map(t => ({
        ...t,
        owner_name: owners[t.owner_id]?.name || '—',
        owner_email: owners[t.owner_id]?.email || '',
      }));
      setTrucks(enriched);
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
      for (const id of ids) {
        await setFlag(id, flag, value);
      }
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
    <div className="admin-trucks-page">
      <div className="admin-trucks-header">
        <div>
          <h1>Food Trucks</h1>
          <p>Browse, edit, and moderate every truck.</p>
        </div>
        <div className="admin-trucks-actions">
          {canCreate && (
            <button className="btn-primary" onClick={() => setShowCreate(true)}>
              {Icons.plus} New truck
            </button>
          )}
          <Link to="/admin" className="btn-secondary">{Icons.chevronLeft} Back to dashboard</Link>
        </div>
      </div>

      <div className="admin-trucks-controls">
        <input
          type="search"
          className="admin-search"
          placeholder="Search by name, cuisine, owner, or location..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <div className="admin-filter-group">
          {STATUS_FILTERS.map(s => (
            <button
              key={s.value}
              className={`admin-filter ${statusFilter === s.value ? 'active' : ''}`}
              onClick={() => setStatusFilter(s.value)}
            >
              {s.label}
            </button>
          ))}
        </div>
        <select
          className="admin-cuisine-filter"
          value={cuisineFilter}
          onChange={(e) => setCuisineFilter(e.target.value)}
        >
          <option value="">All cuisines</option>
          {cuisines.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {selected.size > 0 && (
        <div className="admin-bulk-bar">
          <span>{selected.size} selected</span>
          {canFlags && <button className="btn-link" disabled={busy} onClick={() => bulkSetFlag('featured', true)}>Feature</button>}
          {canFlags && <button className="btn-link" disabled={busy} onClick={() => bulkSetFlag('featured', false)}>Unfeature</button>}
          {canFlags && <button className="btn-link" disabled={busy} onClick={() => bulkSetFlag('verified', true)}>Verify</button>}
          {canFlags && <button className="btn-link" disabled={busy} onClick={() => bulkSetFlag('verified', false)}>Unverify</button>}
          {canSuspend && <button className="btn-link danger" disabled={busy} onClick={bulkSuspend}>Suspend</button>}
          {canSuspend && <button className="btn-link" disabled={busy} onClick={bulkRestore}>Restore</button>}
          <button className="btn-link" onClick={() => setSelected(new Set())}>Clear</button>
        </div>
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

      {loading ? (
        <div className="loading-state">{Icons.loader} Loading trucks...</div>
      ) : (
        <div className="admin-trucks-table-wrapper">
          <table className="admin-trucks-table">
            <thead>
              <tr>
                <th style={{ width: 32 }}>
                  <input
                    type="checkbox"
                    checked={filtered.length > 0 && selected.size === filtered.length}
                    onChange={toggleSelectAll}
                  />
                </th>
                <th>Name</th>
                <th>Cuisine</th>
                <th>Owner</th>
                <th>Status</th>
                <th>Updated</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={7} className="empty-row">No trucks match these filters.</td></tr>
              )}
              {filtered.map(t => (
                <tr key={t.id} className={t.deleted_at ? 'row-deleted' : t.suspended_at ? 'row-suspended' : ''}>
                  <td>
                    <input
                      type="checkbox"
                      checked={selected.has(t.id)}
                      onChange={() => toggleOne(t.id)}
                    />
                  </td>
                  <td>
                    <Link to={`/admin/trucks/${t.id}`} className="truck-name-link">
                      {t.image_url && <img src={t.image_url} alt="" className="truck-thumb" />}
                      <span>{t.name || '(unnamed)'}</span>
                    </Link>
                  </td>
                  <td>{t.cuisine || '—'}</td>
                  <td>
                    <div className="cell-stack">
                      <span>{t.owner_name}</span>
                      {t.owner_email && <span className="cell-sub">{t.owner_email}</span>}
                    </div>
                  </td>
                  <td>
                    <div className="badge-row">
                      {t.deleted_at && <Badge tone="danger">Deleted</Badge>}
                      {t.suspended_at && <Badge tone="warning">Suspended</Badge>}
                      {!t.deleted_at && !t.suspended_at && t.is_open && <Badge tone="success">Open</Badge>}
                      {!t.deleted_at && !t.suspended_at && !t.is_open && <Badge tone="neutral">Closed</Badge>}
                      {t.featured && <Badge tone="accent">Featured</Badge>}
                      {t.verified && <Badge tone="info">Verified</Badge>}
                    </div>
                  </td>
                  <td className="cell-sub">
                    {t.updated_at ? new Date(t.updated_at).toLocaleDateString() : '—'}
                  </td>
                  <td>
                    <Link to={`/admin/trucks/${t.id}`} className="btn-link">Open</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminTrucksListPage;
