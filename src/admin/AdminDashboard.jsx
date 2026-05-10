import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import {
  fetchWaitlistEntries,
  updateWaitlistEntry,
  updateWaitlistEntries,
  deleteWaitlistEntry,
  insertWaitlistEntry,
  fetchAdminUsers,
  updateAdminUserProfile,
  deleteAdminUser,
  fetchAdminAllOrders,
  fetchAdminCustomersForTestOrder,
  fetchAdminTrucksForTestOrder,
  fetchTruckAvailableMenuSample,
  createAdminTestOrder,
  fetchAdminDashboardStats,
  fetchProfileNamesByIds,
  fetchTruckNamesByIds,
} from '../services/admin';
import { useAuth } from '../components/auth/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { useConfirm } from '../contexts/ConfirmContext';
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import { Icons } from '../components/common/Icons';
import MarketingPage from '../components/admin/MarketingPage';
import {
  DashboardTabBar,
} from '@/components/ui/dashboard-sidebar';
import './AdminDashboard.css';

// Chart colors
const CHART_COLORS = ['#e11d48', '#f43f5e', '#fb7185', '#fda4af', '#fecdd3'];

// Login Component using AuthContext
const AdminLogin = ({ onLoginSuccess }) => {
  const { signIn, isAdmin } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Sign in using AuthContext
      const { data, error: authError } = await signIn({ email, password });

      if (authError) throw authError;

      // The signIn will update context, and isAdmin will be determined by profile.role
      // We need to wait a moment for the profile to load, then check admin status
      // onLoginSuccess will be called if user is admin (checked in parent component)

    } catch (err) {
      setError(err?.message || err || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-background to-rose-100/40 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 shadow-xl">
        <div className="text-center space-y-2 mb-6">
          <div className="flex items-center justify-center gap-2">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground font-bold text-lg shadow-md shadow-primary/30">
              C
            </span>
            <span className="text-xl font-bold tracking-tight">Cravvr Admin</span>
          </div>
          <p className="text-sm text-muted-foreground">Sign in to your admin account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              <span className="h-4 w-4 shrink-0 mt-0.5">{Icons.alertCircle}</span>
              {error}
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your admin email"
              required
              className="h-11 w-full rounded-md border border-input bg-background px-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
              className="h-11 w-full rounded-md border border-input bg-background px-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-11 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground shadow-md transition-colors hover:bg-primary/90 disabled:opacity-50"
          >
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        <div className="mt-6 pt-5 border-t border-border">
          <p className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <span className="h-3.5 w-3.5">{Icons.shield}</span>
            <span>Admin access only. Contact support if you need access.</span>
          </p>
        </div>
      </div>
    </div>
  );
};

// Dashboard Overview Component with REAL data
const DashboardOverview = ({ stats, recentActivity, chartData, loading, onRefresh }) => {
  const statCards = [
    { label: 'Total Users', value: stats.totalUsers?.toLocaleString() || '0', change: 'All time', trend: 'neutral', icon: Icons.users },
    { label: 'Food Trucks', value: stats.totalTrucks?.toLocaleString() || '0', change: 'Registered', trend: 'neutral', icon: Icons.trucks },
    { label: 'Total Reviews', value: stats.totalReviews?.toLocaleString() || '0', change: 'All time', trend: 'neutral', icon: Icons.star },
    { label: 'Check-ins', value: stats.totalCheckIns?.toLocaleString() || '0', change: 'All time', trend: 'neutral', icon: Icons.orders },
  ];

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between mb-6">
        <h1>Dashboard Overview</h1>
        <div className="flex flex-wrap items-center gap-2">
          <button className="btn-secondary" onClick={onRefresh} disabled={loading}>
            {Icons.refresh}
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {statCards.map((stat, index) => (
          <div key={index} className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 shadow-sm">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">{stat.icon}</div>
            <div className="min-w-0 flex flex-col">
              <span className="text-xs text-muted-foreground">{stat.label}</span>
              <span className="text-2xl font-bold tracking-tight tabular-nums leading-tight" style={loading ? { opacity: 0.6 } : {}}>{stat.value}</span>
              <span className="text-xs text-muted-foreground mt-0.5">{stat.change}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Row - Using Real Data */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <div className="lg:col-span-2 rounded-xl border border-border bg-card p-5 shadow-sm">
          <div className="mb-3">
            <h3>Activity (Last 30 Days)</h3>
          </div>
          {chartData.dailyActivity.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={chartData.dailyActivity}>
                <defs>
                  <linearGradient id="colorActivity" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#e11d48" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#e11d48" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="date" stroke="#64748b" fontSize={12} />
                <YAxis stroke="#64748b" fontSize={12} />
                <Tooltip contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px' }} />
                <Area type="monotone" dataKey="checkIns" stroke="#e11d48" strokeWidth={2} fill="url(#colorActivity)" name="Check-ins" />
                <Area type="monotone" dataKey="reviews" stroke="#3b82f6" strokeWidth={2} fill="transparent" name="Reviews" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center py-16 text-sm text-muted-foreground text-center">
              <p>No activity data yet. Data will appear as users interact with the app.</p>
            </div>
          )}
        </div>

        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <div className="mb-3">
            <h3>Trucks by Cuisine</h3>
          </div>
          {chartData.cuisineBreakdown.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={chartData.cuisineBreakdown}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {chartData.cuisineBreakdown.map((entry, index) => (
                    <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [value, 'Trucks']} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center py-16 text-sm text-muted-foreground text-center">
              <p>No food trucks registered yet.</p>
            </div>
          )}
        </div>
      </div>

      {/* Second Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <div className="mb-3">
            <h3>User Registrations (Last 12 Months)</h3>
          </div>
          {chartData.userGrowth.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={chartData.userGrowth}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="month" stroke="#64748b" fontSize={12} />
                <YAxis stroke="#64748b" fontSize={12} />
                <Tooltip contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px' }} />
                <Bar dataKey="users" fill="#e11d48" radius={[4, 4, 0, 0]} name="New Users" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center py-16 text-sm text-muted-foreground text-center">
              <p>No user registration data yet.</p>
            </div>
          )}
        </div>

        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <div className="mb-3">
            <h3>User Types</h3>
          </div>
          {chartData.userTypes.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={chartData.userTypes}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {chartData.userTypes.map((entry, index) => (
                    <Cell key={index} fill={index === 0 ? '#e11d48' : '#3b82f6'} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center py-16 text-sm text-muted-foreground text-center">
              <p>No users registered yet.</p>
            </div>
          )}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm mb-6">
        <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-4">
          <h3>Recent Activity</h3>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr>
              <th>Activity ID</th>
              <th>Customer</th>
              <th>Food Truck</th>
              <th>Type</th>
              <th>Details</th>
              <th>Time</th>
            </tr>
          </thead>
          <tbody>
            {recentActivity.length > 0 ? recentActivity.map((activity, index) => (
              <tr key={activity.id || index}>
                <td className="font-medium">#{activity.id?.slice(0, 8) || `ACT-${index + 1}`}</td>
                <td>{activity.customer_name || 'Guest'}</td>
                <td>{activity.truck_name || 'Unknown'}</td>
                <td>
                  <span className={`status-badge ${activity.type === 'review' ? 'warning' : 'active'}`}>
                    {activity.type === 'review' ? 'Review' : 'Check-in'}
                  </span>
                </td>
                <td>{activity.type === 'review' ? `${activity.rating} stars` : `+${activity.points || 10} pts`}</td>
                <td className="text-muted">{activity.created_at ? format(new Date(activity.created_at), 'MMM dd, HH:mm') : 'N/A'}</td>
              </tr>
            )) : (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                  No activity yet. Check-ins and reviews will appear here as users interact with the app.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// Waitlist Management Component
const WaitlistManagement = () => {
  const { showToast } = useToast();
  const { confirm } = useConfirm();
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedEntries, setSelectedEntries] = useState([]);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [importing, setImporting] = useState(false);
  const [importResults, setImportResults] = useState(null);
  const [stats, setStats] = useState({ total: 0, lovers: 0, trucks: 0, thisWeek: 0 });

  // Fetch waitlist entries
  const fetchWaitlist = async () => {
    setLoading(true);
    try {
      const data = await fetchWaitlistEntries();
      setEntries(data);
      const total = data.length;
      const lovers = data.filter(e => e.type === 'lover').length;
      const trucks = data.filter(e => e.type === 'truck').length;
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const thisWeek = data.filter(e => new Date(e.created_at) > weekAgo).length;
      setStats({ total, lovers, trucks, thisWeek });
    } catch (err) {
      console.error('Error fetching waitlist:', err);
      setEntries([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWaitlist();
  }, []);

  const filteredEntries = entries.filter(entry => {
    const matchesSearch =
      (entry.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (entry.email || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || entry.type === filterType;
    const matchesStatus = filterStatus === 'all' || entry.status === filterStatus;
    return matchesSearch && matchesType && matchesStatus;
  });

  const handleStatusChange = async (id, newStatus) => {
    try {
      const updates = { status: newStatus };
      if (newStatus === 'invited') updates.invited_at = new Date().toISOString();
      if (newStatus === 'converted') updates.converted_at = new Date().toISOString();
      await updateWaitlistEntry(id, updates);
      fetchWaitlist();
    } catch (err) {
      console.error('Error updating status:', err);
      showToast('Error updating status: ' + err.message, 'error');
    }
  };

  const handleTypeChange = async (id, newType) => {
    try {
      await updateWaitlistEntry(id, { type: newType });
      fetchWaitlist();
      showToast('User type updated', 'success');
    } catch (err) {
      console.error('Error updating type:', err);
      showToast('Error updating type: ' + err.message, 'error');
    }
  };

  const handleBulkStatusChange = async (newStatus) => {
    if (selectedEntries.length === 0) return;

    try {
      const updates = { status: newStatus };
      if (newStatus === 'invited') updates.invited_at = new Date().toISOString();
      if (newStatus === 'converted') updates.converted_at = new Date().toISOString();
      await updateWaitlistEntries(selectedEntries, updates);
      setSelectedEntries([]);
      fetchWaitlist();
    } catch (err) {
      console.error('Error bulk updating:', err);
      showToast('Error updating entries: ' + err.message, 'error');
    }
  };

  const handleDelete = async (id) => {
    const confirmed = await confirm({
      title: 'Delete Entry',
      message: 'Are you sure you want to delete this entry?',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      variant: 'danger',
    });
    if (!confirmed) return;

    try {
      await deleteWaitlistEntry(id);
      fetchWaitlist();
    } catch (err) {
      console.error('Error deleting entry:', err);
      showToast('Error deleting entry: ' + err.message, 'error');
    }
  };

  const handleExportCSV = () => {
    const headers = ['Name', 'Email', 'Type', 'Status', 'Signed Up', 'Invited At', 'Converted At'];
    const rows = filteredEntries.map(e => [
      e.name,
      e.email,
      e.type,
      e.status,
      new Date(e.created_at).toLocaleDateString(),
      e.invited_at ? new Date(e.invited_at).toLocaleDateString() : '',
      e.converted_at ? new Date(e.converted_at).toLocaleDateString() : ''
    ]);

    const csv = [headers.join(','), ...rows.map(r => r.map(cell => `"${cell}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `waitlist-export-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportCSV = async () => {
    if (!importFile) return;

    setImporting(true);
    setImportResults(null);

    try {
      const text = await importFile.text();
      const lines = text.split('\n').filter(line => line.trim());
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/"/g, ''));

      const nameIdx = headers.findIndex(h => h === 'name' || h === 'full name');
      const emailIdx = headers.findIndex(h => h === 'email' || h === 'email address');
      const typeIdx = headers.findIndex(h => h === 'type' || h === 'user type');

      if (emailIdx === -1) {
        throw new Error('CSV must have an "email" column');
      }

      let imported = 0;
      let skipped = 0;
      let errors = 0;

      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
        const email = values[emailIdx];
        const name = nameIdx >= 0 ? values[nameIdx] : email.split('@')[0];
        let type = typeIdx >= 0 ? values[typeIdx]?.toLowerCase() : 'lover';

        // Normalize type
        if (type === 'food lover' || type === 'customer' || type === 'eater') type = 'lover';
        if (type === 'truck owner' || type === 'owner' || type === 'truck') type = 'truck';
        if (type !== 'lover' && type !== 'truck') type = 'lover';

        if (!email || !email.includes('@')) {
          skipped++;
          continue;
        }

        const result = await insertWaitlistEntry({ name, email, type });
        if (result.ok) imported++;
        else if (result.code === '23505') skipped++;
        else errors++;
      }

      setImportResults({ imported, skipped, errors });
      fetchWaitlist();
    } catch (err) {
      console.error('Import error:', err);
      showToast('Error importing CSV: ' + err.message, 'error');
    } finally {
      setImporting(false);
    }
  };

  const toggleSelectAll = () => {
    if (selectedEntries.length === filteredEntries.length) {
      setSelectedEntries([]);
    } else {
      setSelectedEntries(filteredEntries.map(e => e.id));
    }
  };

  const toggleSelect = (id) => {
    if (selectedEntries.includes(id)) {
      setSelectedEntries(selectedEntries.filter(e => e !== id));
    } else {
      setSelectedEntries([...selectedEntries, id]);
    }
  };

  return (
    <div className="waitlist-management">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between mb-6">
        <h1>Waitlist Management</h1>
        <div className="flex flex-wrap items-center gap-2">
          <button className="btn-secondary" onClick={handleExportCSV}>
            {Icons.download}
            Export CSV
          </button>
          <button className="btn-primary" onClick={() => setShowImportModal(true)}>
            {Icons.upload}
            Import CSV
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 shadow-sm">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">{Icons.users}</div>
          <div className="min-w-0 flex flex-col">
            <span className="text-2xl font-bold tracking-tight tabular-nums leading-tight">{stats.total}</span>
            <span className="text-xs text-muted-foreground">Total Signups</span>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 shadow-sm">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0" style={{ color: '#10b981' }}>{Icons.trendUp}</div>
          <div className="min-w-0 flex flex-col">
            <span className="text-2xl font-bold tracking-tight tabular-nums leading-tight">{stats.thisWeek}</span>
            <span className="text-xs text-muted-foreground">This Week</span>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 shadow-sm">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0" style={{ color: '#f59e0b' }}>🍔</div>
          <div className="min-w-0 flex flex-col">
            <span className="text-2xl font-bold tracking-tight tabular-nums leading-tight">{stats.lovers}</span>
            <span className="text-xs text-muted-foreground">Food Lovers</span>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 shadow-sm">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0" style={{ color: '#3b82f6' }}>🚚</div>
          <div className="min-w-0 flex flex-col">
            <span className="text-2xl font-bold tracking-tight tabular-nums leading-tight">{stats.trucks}</span>
            <span className="text-xs text-muted-foreground">Truck Owners</span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <div className="relative w-full sm:max-w-md">
          {Icons.search}
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-1.5">
          <select value={filterType} onChange={(e) => setFilterType(e.target.value)}>
            <option value="all">All Types</option>
            <option value="lover">Food Lovers</option>
            <option value="truck">Truck Owners</option>
          </select>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="invited">Invited</option>
            <option value="converted">Converted</option>
          </select>
        </div>
        {selectedEntries.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 rounded-lg bg-primary/5 border border-primary/20 px-4 py-3 mb-4 text-sm">
            <span>{selectedEntries.length} selected</span>
            <button className="btn-sm" onClick={() => handleBulkStatusChange('invited')}>
              Mark Invited
            </button>
            <button className="btn-sm" onClick={() => handleBulkStatusChange('converted')}>
              Mark Converted
            </button>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="w-full text-sm">
        <table>
          <thead>
            <tr>
              <th>
                <input
                  type="checkbox"
                  checked={selectedEntries.length === filteredEntries.length && filteredEntries.length > 0}
                  onChange={toggleSelectAll}
                />
              </th>
              <th>Name</th>
              <th>Email</th>
              <th>Type</th>
              <th>Status</th>
              <th>Signed Up</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="7" className="px-4 py-12 text-center text-sm text-muted-foreground">
                  Loading waitlist entries...
                </td>
              </tr>
            ) : filteredEntries.length === 0 ? (
              <tr>
                <td colSpan="7" className="px-4 py-12 text-center text-sm text-muted-foreground">
                  No waitlist entries found.
                </td>
              </tr>
            ) : (
              filteredEntries.map((entry) => (
                <tr key={entry.id}>
                  <td>
                    <input
                      type="checkbox"
                      checked={selectedEntries.includes(entry.id)}
                      onChange={() => toggleSelect(entry.id)}
                    />
                  </td>
                  <td>{entry.name}</td>
                  <td>{entry.email}</td>
                  <td>
                    <select
                      value={entry.type}
                      onChange={(e) => handleTypeChange(entry.id, e.target.value)}
                      className={`type-select type-${entry.type}`}
                    >
                      <option value="lover">🍔 Food Lover</option>
                      <option value="truck">🚚 Truck Owner</option>
                    </select>
                  </td>
                  <td>
                    <select
                      value={entry.status}
                      onChange={(e) => handleStatusChange(entry.id, e.target.value)}
                      className={`status-select status-${entry.status}`}
                    >
                      <option value="pending">Pending</option>
                      <option value="invited">Invited</option>
                      <option value="converted">Converted</option>
                    </select>
                  </td>
                  <td>{new Date(entry.created_at).toLocaleDateString()}</td>
                  <td>
                    <button className="btn-icon-only" onClick={() => handleDelete(entry.id)} title="Delete">
                      {Icons.trash}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Import Modal */}
      {showImportModal && (
        <div className="modal-overlay" onClick={() => setShowImportModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Import CSV</h2>
              <button className="modal-close" onClick={() => setShowImportModal(false)}>
                {Icons.x}
              </button>
            </div>
            <div className="modal-body">
              <p>Upload a CSV file with waitlist entries. Required column: <strong>email</strong>. Optional columns: <strong>name</strong>, <strong>type</strong>.</p>
              <div className="rounded-lg border border-dashed border-border bg-muted/40 p-6 text-center">
                <input
                  type="file"
                  accept=".csv"
                  onChange={(e) => setImportFile(e.target.files[0])}
                  id="csv-upload"
                />
                <label htmlFor="csv-upload" className="block text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                  {Icons.upload}
                  {importFile ? importFile.name : 'Choose CSV file'}
                </label>
              </div>
              {importResults && (
                <div className="rounded-lg border border-info/30 bg-info/5 p-4 mb-4">
                  <p>✅ Imported: <strong>{importResults.imported}</strong></p>
                  <p>⏭️ Skipped (duplicates): <strong>{importResults.skipped}</strong></p>
                  {importResults.errors > 0 && <p>❌ Errors: <strong>{importResults.errors}</strong></p>}
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowImportModal(false)}>
                Cancel
              </button>
              <button
                className="btn-primary"
                onClick={handleImportCSV}
                disabled={!importFile || importing}
              >
                {importing ? (
                  <>{Icons.loader} Importing...</>
                ) : (
                  <>Import</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Users Management Component with Email Invite
const UsersManagement = ({ onViewAs }) => {
  const { showToast } = useToast();
  const { confirm } = useConfirm();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [selectedUser, setSelectedUser] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('customer');
  const [inviteName, setInviteName] = useState('');
  const [inviting, setInviting] = useState(false);
  const [inviteSuccess, setInviteSuccess] = useState('');

  // Fetch users from Supabase profiles table with customer/owner details
  const fetchUsers = async () => {
    setLoading(true);
    try {
      setUsers(await fetchAdminUsers());
    } catch (err) {
      console.error('Error fetching users:', err);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const filteredUsers = users.filter(user => {
    const matchesSearch = (user.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (user.email || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === 'all' || user.role === filterRole;
    return matchesSearch && matchesRole;
  });

  const handleInviteUser = async () => {
    if (!inviteEmail || !inviteName) {
      showToast('Please enter both name and email', 'error');
      return;
    }

    setInviting(true);
    setInviteSuccess('');

    try {
      // Use Supabase Auth Admin API to invite user
      // Note: This requires service_role key for production
      // For now, we'll use the magic link invite approach
      const { data, error } = await supabase.auth.signInWithOtp({
        email: inviteEmail,
        options: {
          data: {
            name: inviteName,
            role: inviteRole,
          },
          emailRedirectTo: `${window.location.origin}/`,
        },
      });

      if (error) throw error;

      setInviteSuccess(`Invitation sent to ${inviteEmail}! They will receive an email to set up their account.`);
      setInviteEmail('');
      setInviteName('');

      // Refresh users list after a short delay
      setTimeout(() => {
        fetchUsers();
      }, 2000);

    } catch (err) {
      console.error('Error inviting user:', err);
      showToast('Error sending invitation: ' + err.message, 'error');
    } finally {
      setInviting(false);
    }
  };

  const handleEditUser = (user) => {
    setSelectedUser({ ...user });
    setEditMode(true);
    setShowModal(true);
  };

  const handleViewUser = (user) => {
    setSelectedUser(user);
    setEditMode(false);
    setShowModal(true);
  };

  const handleSaveUser = async () => {
    setSaving(true);
    try {
      await updateAdminUserProfile(selectedUser.id, {
        name: selectedUser.name,
        role: selectedUser.role,
        phone: selectedUser.role === 'customer' ? selectedUser.phone : undefined,
      });
      setUsers(users.map(u => u.id === selectedUser.id ? selectedUser : u));
      setShowModal(false);
      setSelectedUser(null);
    } catch (err) {
      console.error('Error saving user:', err);
      showToast('Error saving user: ' + err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteUser = async (userId) => {
    const confirmed = await confirm({
      title: 'Delete User',
      message: 'Are you sure you want to delete this user? This will remove their profile and all associated data.',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      variant: 'danger',
    });
    if (!confirmed) return;

    try {
      await deleteAdminUser(userId);
      setUsers(users.filter(u => u.id !== userId));
    } catch (err) {
      console.error('Error deleting user:', err);
      showToast('Error deleting user: ' + err.message, 'error');
    }
  };

  const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between mb-6">
        <h1>Users Management</h1>
        <button className="btn-primary" onClick={() => setShowInviteModal(true)}>
          {Icons.mail}
          Invite User
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <div className="relative w-full sm:max-w-md">
          {Icons.search}
          <input
            type="text"
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-1.5">
          <select value={filterRole} onChange={(e) => setFilterRole(e.target.value)}>
            <option value="all">All Roles</option>
            <option value="customer">Customers</option>
            <option value="owner">Owners</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm mb-6">
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px', color: '#64748b' }}>
            Loading users...
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th>User</th>
                <th>Contact</th>
                <th>Role</th>
                <th>Points</th>
                <th>Subscription</th>
                <th>Joined</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length > 0 ? filteredUsers.map((user) => (
                <tr key={user.id}>
                  <td>
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">{getInitials(user.name)}</div>
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="text-sm font-semibold truncate">{user.name || 'No name'}</span>
                        <span className="text-xs text-muted-foreground truncate">{user.email}</span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="flex flex-col leading-tight">
                      <span>{user.phone || 'No phone'}</span>
                    </div>
                  </td>
                  <td>
                    <span className={`role-badge ${user.role || 'customer'}`}>{user.role || 'customer'}</span>
                  </td>
                  <td>{user.role === 'customer' ? (user.points || 0) : '-'}</td>
                  <td>{user.role === 'owner' ? (user.subscription_type || 'free') : '-'}</td>
                  <td>{user.created_at ? format(new Date(user.created_at), 'MMM dd, yyyy') : 'N/A'}</td>
                  <td>
                    <div className="flex items-center gap-1">
                      <button className="icon-btn" onClick={() => handleViewUser(user)} title="View">
                        {Icons.eye}
                      </button>
                      <button className="icon-btn" onClick={() => handleEditUser(user)} title="Edit">
                        {Icons.edit}
                      </button>
                      {user.role === 'customer' && (
                        <button className="icon-btn view-as" onClick={() => onViewAs?.(user)} title="View As Customer">
                          {Icons.user}
                        </button>
                      )}
                      <button className="icon-btn danger" onClick={() => handleDeleteUser(user.id)} title="Delete">
                        {Icons.trash}
                      </button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '60px', color: '#64748b' }}>
                    {searchTerm || filterRole !== 'all'
                      ? 'No users match your filters.'
                      : 'No users yet. Invite users to get started.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Invite User Modal */}
      {showInviteModal && (
        <div className="modal-overlay" onClick={() => setShowInviteModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Invite New User</h2>
              <button className="modal-close" onClick={() => setShowInviteModal(false)}>
                {Icons.x}
              </button>
            </div>
            <div className="modal-body">
              {inviteSuccess && (
                <div className="flex items-center gap-2 rounded-lg border border-positive/30 bg-positive/10 px-4 py-3 text-sm text-positive mb-4" style={{
                  background: '#dcfce7',
                  color: '#166534',
                  padding: '12px',
                  borderRadius: '8px',
                  marginBottom: '16px'
                }}>
                  {inviteSuccess}
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-2 mb-4">
                  <label>Full Name *</label>
                  <input
                    type="text"
                    value={inviteName}
                    onChange={(e) => setInviteName(e.target.value)}
                    placeholder="Enter user's full name"
                    required
                  />
                </div>
                <div className="space-y-2 mb-4">
                  <label>Email Address *</label>
                  <input
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="Enter email address"
                    required
                  />
                </div>
                <div className="space-y-2 mb-4">
                  <label>Role</label>
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value)}
                  >
                    <option value="customer">Customer</option>
                    <option value="owner">Food Truck Owner</option>
                  </select>
                </div>
              </div>
              <p className="text-xs text-muted-foreground" style={{ marginTop: '16px', color: '#64748b' }}>
                The user will receive an email with a link to set up their account.
              </p>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowInviteModal(false)}>
                Cancel
              </button>
              <button
                className="btn-primary"
                onClick={handleInviteUser}
                disabled={inviting || !inviteEmail || !inviteName}
              >
                {inviting ? 'Sending...' : 'Send Invitation'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* User Details/Edit Modal */}
      {showModal && selectedUser && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editMode ? 'Edit User' : 'User Details'}</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>
                {Icons.x}
              </button>
            </div>
            <div className="modal-body">
              {editMode ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-2 mb-4">
                    <label>Name *</label>
                    <input
                      type="text"
                      value={selectedUser.name || ''}
                      onChange={(e) => setSelectedUser({ ...selectedUser, name: e.target.value })}
                      placeholder="Enter full name"
                      required
                    />
                  </div>
                  <div className="space-y-2 mb-4">
                    <label>Email</label>
                    <input
                      type="email"
                      value={selectedUser.email || ''}
                      disabled
                      className="disabled"
                    />
                    <span className="text-xs text-muted-foreground">Email cannot be changed (linked to auth)</span>
                  </div>
                  <div className="space-y-2 mb-4">
                    <label>Phone</label>
                    <input
                      type="tel"
                      value={selectedUser.phone || ''}
                      onChange={(e) => setSelectedUser({ ...selectedUser, phone: e.target.value })}
                      placeholder="Enter phone number"
                    />
                  </div>
                  <div className="space-y-2 mb-4">
                    <label>Role</label>
                    <select
                      value={selectedUser.role || 'customer'}
                      onChange={(e) => setSelectedUser({ ...selectedUser, role: e.target.value })}
                    >
                      <option value="customer">Customer</option>
                      <option value="owner">Owner</option>
                    </select>
                  </div>
                </div>
              ) : (
                <div className="min-w-0 flex flex-col leading-tight">
                  <div className="border-b border-border pb-3 mb-4">
                    <div className="user-avatar large">{getInitials(selectedUser.name)}</div>
                    <div>
                      <h3>{selectedUser.name || 'No name'}</h3>
                      <span className={`role-badge ${selectedUser.role || 'customer'}`}>{selectedUser.role || 'customer'}</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="rounded-lg border border-border bg-card p-3">
                      <span className="block text-xs text-muted-foreground mb-1">Email</span>
                      <span className="font-semibold text-sm">{selectedUser.email}</span>
                    </div>
                    <div className="rounded-lg border border-border bg-card p-3">
                      <span className="block text-xs text-muted-foreground mb-1">Phone</span>
                      <span className="font-semibold text-sm">{selectedUser.phone || 'Not provided'}</span>
                    </div>
                    <div className="rounded-lg border border-border bg-card p-3">
                      <span className="block text-xs text-muted-foreground mb-1">Joined</span>
                      <span className="font-semibold text-sm">{selectedUser.created_at ? format(new Date(selectedUser.created_at), 'MMM dd, yyyy') : 'N/A'}</span>
                    </div>
                    {selectedUser.role === 'customer' && (
                      <div className="rounded-lg border border-border bg-card p-3">
                        <span className="block text-xs text-muted-foreground mb-1">Points</span>
                        <span className="font-semibold text-sm">{selectedUser.points || 0}</span>
                      </div>
                    )}
                    {selectedUser.role === 'owner' && (
                      <div className="rounded-lg border border-border bg-card p-3">
                        <span className="block text-xs text-muted-foreground mb-1">Subscription</span>
                        <span className="font-semibold text-sm">{selectedUser.subscription_type || 'free'}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowModal(false)}>
                Cancel
              </button>
              {editMode && (
                <button
                  className="btn-primary"
                  onClick={handleSaveUser}
                  disabled={saving || !selectedUser.name}
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


// Analytics Component - Real Data Only
const AnalyticsPage = ({ stats, chartData }) => {
  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between mb-6">
        <h1>Analytics</h1>
      </div>

      {/* Key Metrics */}
      <div className="metrics-grid">
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Total Users</span>
          </div>
          <div className="text-3xl font-bold tracking-tight tabular-nums">{(stats.totalUsers || 0).toLocaleString()}</div>
        </div>
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Food Trucks</span>
          </div>
          <div className="text-3xl font-bold tracking-tight tabular-nums">{(stats.totalTrucks || 0).toLocaleString()}</div>
        </div>
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Total Reviews</span>
          </div>
          <div className="text-3xl font-bold tracking-tight tabular-nums">{(stats.totalReviews || 0).toLocaleString()}</div>
        </div>
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Total Check-ins</span>
          </div>
          <div className="text-3xl font-bold tracking-tight tabular-nums">{(stats.totalCheckIns || 0).toLocaleString()}</div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <div className="lg:col-span-2 rounded-xl border border-border bg-card p-5 shadow-sm">
          <div className="mb-3">
            <h3>Daily Activity (Last 30 Days)</h3>
          </div>
          {chartData.dailyActivity.length > 0 ? (
            <ResponsiveContainer width="100%" height={350}>
              <LineChart data={chartData.dailyActivity}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="date" stroke="#64748b" fontSize={12} />
                <YAxis stroke="#64748b" fontSize={12} />
                <Tooltip contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px' }} />
                <Legend />
                <Line type="monotone" dataKey="checkIns" stroke="#e11d48" strokeWidth={2} name="Check-ins" />
                <Line type="monotone" dataKey="reviews" stroke="#3b82f6" strokeWidth={2} name="Reviews" />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center py-16 text-sm text-muted-foreground text-center">
              <p>No activity data yet. Charts will populate as users interact with the app.</p>
            </div>
          )}
        </div>

        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <div className="mb-3">
            <h3>Trucks by Cuisine</h3>
          </div>
          {chartData.cuisineBreakdown.length > 0 ? (
            <ResponsiveContainer width="100%" height={350}>
              <PieChart>
                <Pie
                  data={chartData.cuisineBreakdown}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={110}
                  paddingAngle={2}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {chartData.cuisineBreakdown.map((entry, index) => (
                    <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center py-16 text-sm text-muted-foreground text-center">
              <p>No food truck data yet.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Orders Management Component
const OrdersManagement = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true);
      try {
        setOrders(await fetchAdminAllOrders({ limit: 50 }));
      } catch (err) {
        console.error('Error fetching orders:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return '#22c55e';
      case 'pending': return '#f59e0b';
      case 'preparing': return '#3b82f6';
      case 'ready': return '#8b5cf6';
      case 'cancelled': return '#ef4444';
      default: return '#64748b';
    }
  };

  return (
    <div className="orders-management">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between mb-6">
        <h1>Orders Management</h1>
        <span className="inline-flex items-center rounded-full bg-primary/15 px-2 py-0.5 text-xs font-semibold text-primary tabular-nums">{orders.length} orders</span>
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm mb-6">
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px', color: '#64748b' }}>
            Loading orders...
          </div>
        ) : orders.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px', color: '#64748b' }}>
            No orders found. Create a test order in Settings → Developer Settings.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th>Order #</th>
                <th>Customer</th>
                <th>Truck</th>
                <th>Items</th>
                <th>Total</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id}>
                  <td>
                    <code style={{ fontSize: '12px', background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px' }}>
                      {order.order_number}
                    </code>
                  </td>
                  <td>
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-sm font-semibold truncate">{order.profiles?.name || 'Unknown'}</span>
                      <span className="text-xs text-muted-foreground truncate" style={{ fontSize: '11px', color: '#64748b' }}>
                        {order.profiles?.email}
                      </span>
                    </div>
                  </td>
                  <td>{order.food_trucks?.name || 'Unknown Truck'}</td>
                  <td>
                    <span title={order.order_items?.map(i => `${i.quantity}x ${i.name}`).join(', ')}>
                      {order.order_items?.length || 0} items
                    </span>
                  </td>
                  <td>${parseFloat(order.total || 0).toFixed(2)}</td>
                  <td>
                    <span
                      className="status-badge"
                      style={{
                        background: `${getStatusColor(order.status)}20`,
                        color: getStatusColor(order.status),
                        padding: '4px 10px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: '500',
                      }}
                    >
                      {order.status}
                    </span>
                  </td>
                  <td style={{ fontSize: '12px', color: '#64748b' }}>
                    {order.created_at ? format(new Date(order.created_at), 'MMM dd, yyyy HH:mm') : 'N/A'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

// Settings Component
const SettingsPage = ({ adminEmail, devSettings, onUpdateDevSettings }) => {
  const { showToast } = useToast();
  const [settings, setSettings] = useState({
    siteName: 'Cravvr',
    siteDescription: 'The map-first food truck app',
    contactEmail: 'support@cravvr.com',
    commissionRate: 0,
    minOrderAmount: 10,
    enableNotifications: true,
    maintenanceMode: false,
  });
  const [creatingTestUser, setCreatingTestUser] = useState(false);
  const [creatingTestOrder, setCreatingTestOrder] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [trucks, setTrucks] = useState([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [selectedTruckId, setSelectedTruckId] = useState('');

  // Fetch customers and trucks for test order creation
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [customerData, truckData] = await Promise.all([
          fetchAdminCustomersForTestOrder({ limit: 30 }),
          fetchAdminTrucksForTestOrder(),
        ]);
        setCustomers(customerData);
        setTrucks(truckData);
      } catch (err) {
        console.error('Error fetching test order data:', err);
      }
    };
    fetchData();
  }, []);

  const handleCreateTestCustomer = async () => {
    setCreatingTestUser(true);
    try {
      // Create a test customer via Supabase
      const testEmail = `test.customer.${Date.now()}@cravvr.local`;
      const { error } = await supabase.auth.signUp({
        email: testEmail,
        password: 'TestCustomer123!',
        options: {
          data: {
            name: 'Test Customer',
            role: 'customer',
          },
        },
      });

      if (error) throw error;

      showToast(`Test customer created!\nEmail: ${testEmail}\n\nNote: Confirm user in Supabase Auth → Users to enable login`, 'success');
    } catch (err) {
      console.error('Error creating test customer:', err);
      showToast('Error creating test customer: ' + err.message, 'error');
    } finally {
      setCreatingTestUser(false);
    }
  };

  const handleCreateTestOrder = async () => {
    if (!selectedCustomerId || !selectedTruckId) {
      showToast('Please select both a customer and a truck', 'error');
      return;
    }

    setCreatingTestOrder(true);
    try {
      const menuItems = await fetchTruckAvailableMenuSample(selectedTruckId, { limit: 3 });

      if (menuItems.length === 0) {
        showToast('No menu items found for this truck. Add some menu items first.', 'error');
        setCreatingTestOrder(false);
        return;
      }

      // Calculate order totals
      const subtotal = menuItems.reduce((sum, item) => sum + (parseFloat(item.price) || 9.99), 0);
      const tax = subtotal * 0.0825; // 8.25% tax
      const total = subtotal + tax;
      const orderNumber = `TEST-${Date.now()}`;

      await createAdminTestOrder({
        customerId: selectedCustomerId,
        truckId: selectedTruckId,
        orderNumber,
        subtotal,
        tax,
        total,
        items: menuItems,
      });

      const truckName = trucks.find(t => t.id === selectedTruckId)?.name || 'Unknown Truck';
      const customerName = customers.find(c => c.id === selectedCustomerId)?.name || 'Unknown Customer';

      showToast(
        `Test order created!\nOrder #${orderNumber}\nCustomer: ${customerName}\nTruck: ${truckName}\nItems: ${menuItems.length}\nTotal: $${total.toFixed(2)}`,
        'success'
      );
    } catch (err) {
      console.error('Error creating test order:', err);
      showToast('Error creating test order: ' + err.message, 'error');
    } finally {
      setCreatingTestOrder(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between mb-6">
        <h1>Settings</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm mb-4">
          <h3>Admin Information</h3>
          <div className="space-y-2 mb-4">
            <label>Logged in as</label>
            <input type="text" value={adminEmail} disabled className="disabled" />
          </div>
          <div className="space-y-2 mb-4">
            <label>Admin Access</label>
            <p className="rounded-lg bg-muted/40 px-4 py-3 text-xs text-muted-foreground mb-3">
              Admin access is managed via the database. Set <code>role = 'admin'</code> in the <code>profiles</code> table to grant admin access.
            </p>
            <span className="text-xs text-muted-foreground">Contact your database administrator to add or remove admins</span>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-5 shadow-sm mb-4">
          <h3>General Settings</h3>
          <div className="space-y-2 mb-4">
            <label>Site Name</label>
            <input
              type="text"
              value={settings.siteName}
              onChange={(e) => setSettings({ ...settings, siteName: e.target.value })}
            />
          </div>
          <div className="space-y-2 mb-4">
            <label>Site Description</label>
            <textarea
              value={settings.siteDescription}
              onChange={(e) => setSettings({ ...settings, siteDescription: e.target.value })}
            />
          </div>
          <div className="space-y-2 mb-4">
            <label>Contact Email</label>
            <input
              type="email"
              value={settings.contactEmail}
              onChange={(e) => setSettings({ ...settings, contactEmail: e.target.value })}
            />
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-5 shadow-sm mb-4">
          <h3>Business Settings</h3>
          <div className="space-y-2 mb-4">
            <label>Commission Rate (%)</label>
            <input
              type="number"
              value={settings.commissionRate}
              onChange={(e) => setSettings({ ...settings, commissionRate: parseFloat(e.target.value) || 0 })}
            />
            <span className="text-xs text-muted-foreground">0% = No commission on pickup orders</span>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-5 shadow-sm mb-4">
          <h3>Feature Toggles</h3>
          <div className="toggle-group">
            <label className="toggle-label">
              <span>Enable Push Notifications</span>
              <input
                type="checkbox"
                checked={settings.enableNotifications}
                onChange={(e) => setSettings({ ...settings, enableNotifications: e.target.checked })}
              />
              <span className="toggle-switch"></span>
            </label>
          </div>
          <div className="toggle-group">
            <label className="toggle-label danger">
              <span>Maintenance Mode</span>
              <input
                type="checkbox"
                checked={settings.maintenanceMode}
                onChange={(e) => setSettings({ ...settings, maintenanceMode: e.target.checked })}
              />
              <span className="toggle-switch"></span>
            </label>
          </div>
        </div>

        <div className="settings-card dev-settings">
          <h3>
            {Icons.code}
            Developer Settings
          </h3>
          <p className="text-xs text-muted-foreground" style={{ marginBottom: '16px' }}>
            These settings are for local development and testing only.
          </p>

          <div className="toggle-group">
            <label className="toggle-label">
              <span>Skip Order Requirement for Reviews</span>
              <input
                type="checkbox"
                checked={devSettings?.skipReviewOrderRequirement || false}
                onChange={(e) => onUpdateDevSettings?.({ skipReviewOrderRequirement: e.target.checked })}
              />
              <span className="toggle-switch"></span>
            </label>
            <span className="text-xs text-muted-foreground">Allow users to write reviews without completing an order first</span>
          </div>

          <div className="space-y-2 mb-4" style={{ marginTop: '24px' }}>
            <label>Test User Management</label>
            <button
              className="btn-secondary"
              onClick={handleCreateTestCustomer}
              disabled={creatingTestUser}
              style={{ marginTop: '8px' }}
            >
              {creatingTestUser ? 'Creating...' : 'Create Test Customer'}
            </button>
            <span className="text-xs text-muted-foreground">Creates a test customer. Confirm in Supabase Auth to enable login.</span>
          </div>

          <div className="space-y-2 mb-4" style={{ marginTop: '24px', paddingTop: '24px', borderTop: '1px solid var(--border)' }}>
            <label>Create Test Order (Completed)</label>
            <p className="text-xs text-muted-foreground" style={{ marginBottom: '12px' }}>
              Create a completed order so the customer can write reviews
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <select
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
                style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border)' }}
              >
                <option value="">Select Customer...</option>
                {customers.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name || c.email} {c.role === 'admin' ? '(Admin)' : ''}
                  </option>
                ))}
              </select>
              <select
                value={selectedTruckId}
                onChange={(e) => setSelectedTruckId(e.target.value)}
                style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border)' }}
              >
                <option value="">Select Truck...</option>
                {trucks.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
              <button
                className="btn-primary"
                onClick={handleCreateTestOrder}
                disabled={creatingTestOrder || !selectedCustomerId || !selectedTruckId}
                style={{ marginTop: '4px' }}
              >
                {creatingTestOrder ? 'Creating Order...' : 'Create Completed Order'}
              </button>
            </div>
            <span className="text-xs text-muted-foreground" style={{ marginTop: '8px', display: 'block' }}>
              This creates an order with status "completed" including menu items from the selected truck
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

// Main Admin Dashboard Component
const AdminDashboard = () => {
  const navigate = useNavigate();
  const { user, profile, isAdmin, loading: authLoading, signOut, startViewingAs, devSettings, updateDevSettings } = useAuth();
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalTrucks: 0,
    totalReviews: 0,
    totalCheckIns: 0,
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [chartData, setChartData] = useState({
    dailyActivity: [],
    cuisineBreakdown: [],
    userGrowth: [],
    userTypes: [],
  });
  const [loading, setLoading] = useState(true);
  const [hasFetched, setHasFetched] = useState(false);
  const [initialAuthDone, setInitialAuthDone] = useState(false);

  // Track when initial auth check completes
  useEffect(() => {
    if (!authLoading && !initialAuthDone) {
      setInitialAuthDone(true);
    }
  }, [authLoading, initialAuthDone]);

  // Fetch all dashboard data from real tables - OPTIMIZED
  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Run all independent queries in parallel for speed
      const thirtyDaysAgo = subDays(new Date(), 30).toISOString();
      const oneYearAgo = subDays(new Date(), 365).toISOString();

      const {
        usersResult,
        trucksResult,
        reviewsResult,
        checkInsResult,
        recentCheckInsResult,
        recentReviewsResult,
        checkInsLast30Result,
        reviewsLast30Result,
        usersWithDatesResult,
      } = await fetchAdminDashboardStats({
        thirtyDaysAgoIso: thirtyDaysAgo,
        oneYearAgoIso: oneYearAgo,
      });

      // Process user roles
      const userRoles = usersResult.data || [];
      const customerCount = userRoles.filter(u => u.role === 'customer').length;
      const ownerCount = userRoles.filter(u => u.role === 'owner').length;

      // Process cuisine breakdown
      const trucksCuisine = trucksResult.data || [];
      const cuisineCounts = {};
      trucksCuisine.forEach(t => {
        const cuisine = t.cuisine || 'Other';
        cuisineCounts[cuisine] = (cuisineCounts[cuisine] || 0) + 1;
      });
      const cuisineBreakdown = Object.entries(cuisineCounts)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 5);

      // Get customer and truck names for recent activity
      const recentCheckIns = recentCheckInsResult.data || [];
      const recentReviews = recentReviewsResult.data || [];

      // Collect IDs for batch lookup
      const customerIds = [...new Set([
        ...recentCheckIns.map(c => c.customer_id),
        ...recentReviews.map(r => r.customer_id)
      ].filter(Boolean))];
      const truckIds = [...new Set([
        ...recentCheckIns.map(c => c.truck_id),
        ...recentReviews.map(r => r.truck_id)
      ].filter(Boolean))];

      // Batch fetch names
      const [profileNames, truckNames] = await Promise.all([
        fetchProfileNamesByIds(customerIds),
        fetchTruckNamesByIds(truckIds),
      ]);

      const profilesMap = {};
      profileNames.forEach(p => { profilesMap[p.id] = p.name; });
      const trucksMap = {};
      truckNames.forEach(t => { trucksMap[t.id] = t.name; });

      // Build recent activity
      const activity = [
        ...recentCheckIns.map(ci => ({
          id: ci.id,
          customer_name: profilesMap[ci.customer_id] || 'Guest',
          truck_name: trucksMap[ci.truck_id] || 'Unknown',
          points: ci.points_earned || 10,
          created_at: ci.created_at,
          type: 'check_in'
        })),
        ...recentReviews.map(r => ({
          id: r.id,
          customer_name: profilesMap[r.customer_id] || 'Guest',
          truck_name: trucksMap[r.truck_id] || 'Unknown',
          rating: r.rating,
          created_at: r.created_at,
          type: 'review'
        }))
      ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 10);

      // Aggregate daily activity from fetched data (no more 30 queries!)
      const checkInsLast30 = checkInsLast30Result.data || [];
      const reviewsLast30 = reviewsLast30Result.data || [];

      const dailyActivity = [];
      for (let i = 29; i >= 0; i--) {
        const date = subDays(new Date(), i);
        const displayDate = format(date, 'MMM dd');
        const dayStart = startOfDay(date);
        const dayEnd = endOfDay(date);

        const dayCheckIns = checkInsLast30.filter(c => {
          const d = new Date(c.created_at);
          return d >= dayStart && d <= dayEnd;
        }).length;

        const dayReviews = reviewsLast30.filter(r => {
          const d = new Date(r.created_at);
          return d >= dayStart && d <= dayEnd;
        }).length;

        dailyActivity.push({
          date: displayDate,
          checkIns: dayCheckIns,
          reviews: dayReviews,
        });
      }

      // Aggregate user growth from fetched data (no more 12 queries!)
      const usersWithDates = usersWithDatesResult.data || [];
      const userGrowth = [];
      for (let i = 11; i >= 0; i--) {
        const date = subDays(new Date(), i * 30);
        const monthStr = format(date, 'MMM');
        const endDate = endOfDay(date);

        // Count users created up to this point
        const usersUpToDate = usersWithDates.filter(u =>
          new Date(u.created_at) <= endDate
        ).length;

        // Add base count for users created before our range
        const baseCount = (usersResult.count || 0) - usersWithDates.length;

        userGrowth.push({
          month: monthStr,
          users: baseCount + usersUpToDate,
        });
      }

      setStats({
        totalUsers: usersResult.count || 0,
        totalTrucks: trucksResult.count || 0,
        totalReviews: reviewsResult.count || 0,
        totalCheckIns: checkInsResult.count || 0,
      });

      setRecentActivity(activity);

      setChartData({
        dailyActivity,
        cuisineBreakdown,
        userGrowth,
        userTypes: customerCount + ownerCount > 0 ? [
          { name: 'Customers', value: customerCount },
          { name: 'Owners', value: ownerCount },
        ] : [],
      });

    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setStats({ totalUsers: 0, totalTrucks: 0, totalReviews: 0, totalCheckIns: 0 });
      setRecentActivity([]);
      setChartData({ dailyActivity: [], cuisineBreakdown: [], userGrowth: [], userTypes: [] });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Only fetch once when user becomes admin and we haven't fetched yet
    if (user && isAdmin && !hasFetched) {
      setHasFetched(true);
      fetchDashboardData();
    }
  }, [user, isAdmin, hasFetched]);

  const handleLogout = async () => {
    await signOut();
  };

  // Show loading only during INITIAL auth check (not on tab return)
  if (authLoading && !initialAuthDone) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 via-background to-rose-100/40 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 shadow-xl text-center space-y-2">
          <div className="flex items-center justify-center gap-2">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground font-bold text-lg shadow-md shadow-primary/30">
              C
            </span>
            <span className="text-xl font-bold tracking-tight">Cravvr Admin</span>
          </div>
          <p className="text-sm text-muted-foreground">Loading…</p>
        </div>
      </div>
    );
  }

  // Show access denied if user is logged in but not admin (including when profile is null/missing)
  if (user && !isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 via-background to-rose-100/40 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 shadow-xl space-y-4">
          <div className="text-center space-y-2">
            <div className="flex items-center justify-center gap-2">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground font-bold text-lg shadow-md shadow-primary/30">
                C
              </span>
              <span className="text-xl font-bold tracking-tight">Cravvr Admin</span>
            </div>
            <p className="text-sm text-muted-foreground">Access Denied</p>
          </div>
          <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            <span className="h-4 w-4 shrink-0 mt-0.5">{Icons.alertCircle}</span>
            {!profile
              ? 'Your admin profile is not set up. Please contact support to configure your account.'
              : 'You do not have admin privileges. Please contact support if you believe this is an error.'}
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="w-full h-11 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground shadow-md transition-colors hover:bg-primary/90"
          >
            Sign Out & Try Again
          </button>
        </div>
      </div>
    );
  }

  // Show login if not authenticated
  if (!user) {
    return <AdminLogin onLoginSuccess={() => {}} />;
  }

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Icons.chart },
    { id: 'waitlist', label: 'Waitlist', icon: Icons.users },
    { id: 'users', label: 'Users', icon: Icons.user },
    { id: 'trucks', label: 'Food Trucks', icon: Icons.truck },
    { id: 'orders', label: 'Orders', icon: Icons.shoppingBag },
    { id: 'analytics', label: 'Analytics', icon: Icons.trendingUp },
    { id: 'marketing', label: 'Marketing', icon: Icons.megaphone },
    { id: 'growth', label: 'Growth', icon: Icons.target },
    { id: 'settings', label: 'Settings', icon: Icons.settings },
  ];

  const handleViewAs = async (targetUser) => {
    await startViewingAs(targetUser);
    // Navigate to home page to view as customer
    window.location.href = '/';
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <DashboardOverview stats={stats} recentActivity={recentActivity} chartData={chartData} loading={loading} onRefresh={fetchDashboardData} />;
      case 'waitlist':
        return <WaitlistManagement />;
      case 'users':
        return <UsersManagement onViewAs={handleViewAs} />;
      case 'trucks':
        // Truck management has moved to /admin/trucks (richer UI, audit log, soft delete).
        // This case is kept only as a defensive fallback if the navigate() above is bypassed.
        return (
          <div className="mx-auto max-w-7xl px-4 sm:px-6 py-6 space-y-3">
            <p className="text-sm text-muted-foreground">Truck management has moved.</p>
            <button
              type="button"
              className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              onClick={() => navigate('/admin/trucks')}
            >
              Open truck manager
            </button>
          </div>
        );
      case 'orders':
        return <OrdersManagement />;
      case 'analytics':
        return <AnalyticsPage stats={stats} chartData={chartData} />;
      case 'marketing':
        return <MarketingPage />;
      case 'settings':
        return <SettingsPage adminEmail={user?.email} devSettings={devSettings} onUpdateDevSettings={updateDevSettings} />;
      default:
        return <DashboardOverview stats={stats} recentActivity={recentActivity} chartData={chartData} loading={loading} onRefresh={fetchDashboardData} />;
    }
  };

  // Map nav item clicks: trucks/growth navigate to dedicated routes, the rest
  // are local state changes. Pre-bind onClick on the items that need it so the
  // shared sidebar primitive can stay logic-free.
  const sidebarNavItems = navItems.map((item) => {
    if (item.id === 'trucks') {
      return { ...item, onClick: () => navigate('/admin/trucks') };
    }
    if (item.id === 'growth') {
      return { ...item, onClick: () => navigate('/admin/growth') };
    }
    return item;
  });

  const sidebarBrand = (
    <div className="flex items-center gap-3">
      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
        <span className="h-4 w-4">{Icons.shield}</span>
      </span>
      <div className="min-w-0">
        <h2 className="text-sm font-bold tracking-tight leading-tight">Admin Dashboard</h2>
        <p className="text-[11px] text-muted-foreground truncate">Cravvr operations</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-muted/30">
      <DashboardTabBar
        navItems={sidebarNavItems}
        activeId={currentPage}
        onNavigate={setCurrentPage}
        header={
          <div className="px-3 sm:px-6 pt-4 pb-2">
            <h1 className="text-lg font-bold tracking-tight">Admin Dashboard</h1>
            <p className="text-xs text-muted-foreground">Cravvr internal tools</p>
          </div>
        }
      />
      <main className="px-3 py-4 sm:px-6 lg:py-6">
        {renderPage()}
      </main>
    </div>
  );
};

export default AdminDashboard;
