import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../components/auth/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { useConfirm } from '../contexts/ConfirmContext';
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import { Icons } from '../components/common/Icons';
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
    <div className="admin-login">
      <div className="login-card">
        <div className="login-header">
          <div className="login-logo">
            <span className="logo-icon">C</span>
            <span className="logo-text">Cravvr Admin</span>
          </div>
          <p>Sign in to your admin account</p>
        </div>

        <form onSubmit={handleSubmit}>
          {error && <div className="login-error">{error}</div>}

          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your admin email"
              required
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
            />
          </div>

          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="login-footer">
          <p className="login-hint">
            {Icons.shield}
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
    <div className="dashboard-overview">
      <div className="page-header">
        <h1>Dashboard Overview</h1>
        <div className="header-actions">
          <button className="btn-secondary" onClick={onRefresh} disabled={loading}>
            {Icons.refresh}
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        {statCards.map((stat, index) => (
          <div key={index} className="stat-card">
            <div className="stat-icon">{stat.icon}</div>
            <div className="stat-content">
              <span className="stat-label">{stat.label}</span>
              <span className="stat-value">{loading ? '...' : stat.value}</span>
              <span className="stat-change neutral">{stat.change}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Row - Using Real Data */}
      <div className="charts-grid">
        <div className="chart-card large">
          <div className="chart-header">
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
            <div className="chart-empty">
              <p>No activity data yet. Data will appear as users interact with the app.</p>
            </div>
          )}
        </div>

        <div className="chart-card">
          <div className="chart-header">
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
            <div className="chart-empty">
              <p>No food trucks registered yet.</p>
            </div>
          )}
        </div>
      </div>

      {/* Second Charts Row */}
      <div className="charts-grid">
        <div className="chart-card">
          <div className="chart-header">
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
            <div className="chart-empty">
              <p>No user registration data yet.</p>
            </div>
          )}
        </div>

        <div className="chart-card">
          <div className="chart-header">
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
            <div className="chart-empty">
              <p>No users registered yet.</p>
            </div>
          )}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="table-card">
        <div className="table-header">
          <h3>Recent Activity</h3>
        </div>
        <table className="data-table">
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
      const { data, error } = await supabase
        .from('waitlist')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setEntries(data || []);

      // Calculate stats
      const total = data?.length || 0;
      const lovers = data?.filter(e => e.type === 'lover').length || 0;
      const trucks = data?.filter(e => e.type === 'truck').length || 0;
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const thisWeek = data?.filter(e => new Date(e.created_at) > weekAgo).length || 0;
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

      const { error } = await supabase
        .from('waitlist')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
      fetchWaitlist();
    } catch (err) {
      console.error('Error updating status:', err);
      showToast('Error updating status: ' + err.message, 'error');
    }
  };

  const handleBulkStatusChange = async (newStatus) => {
    if (selectedEntries.length === 0) return;

    try {
      const updates = { status: newStatus };
      if (newStatus === 'invited') updates.invited_at = new Date().toISOString();
      if (newStatus === 'converted') updates.converted_at = new Date().toISOString();

      const { error } = await supabase
        .from('waitlist')
        .update(updates)
        .in('id', selectedEntries);

      if (error) throw error;
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
      const { error } = await supabase
        .from('waitlist')
        .delete()
        .eq('id', id);

      if (error) throw error;
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

        try {
          const { error } = await supabase
            .from('waitlist')
            .insert([{ name, email, type, status: 'pending' }]);

          if (error) {
            if (error.code === '23505') skipped++; // Duplicate
            else errors++;
          } else {
            imported++;
          }
        } catch {
          errors++;
        }
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
      <div className="page-header">
        <h1>Waitlist Management</h1>
        <div className="header-actions">
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
      <div className="stats-grid waitlist-stats">
        <div className="stat-card">
          <div className="stat-icon">{Icons.users}</div>
          <div className="stat-content">
            <span className="stat-value">{stats.total}</span>
            <span className="stat-label">Total Signups</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ color: '#10b981' }}>{Icons.trendUp}</div>
          <div className="stat-content">
            <span className="stat-value">{stats.thisWeek}</span>
            <span className="stat-label">This Week</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ color: '#f59e0b' }}>🍔</div>
          <div className="stat-content">
            <span className="stat-value">{stats.lovers}</span>
            <span className="stat-label">Food Lovers</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ color: '#3b82f6' }}>🚚</div>
          <div className="stat-content">
            <span className="stat-value">{stats.trucks}</span>
            <span className="stat-label">Truck Owners</span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="filters-bar">
        <div className="search-box">
          {Icons.search}
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="filter-group">
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
          <div className="bulk-actions">
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
      <div className="data-table">
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
                <td colSpan="7" className="loading-cell">
                  Loading waitlist entries...
                </td>
              </tr>
            ) : filteredEntries.length === 0 ? (
              <tr>
                <td colSpan="7" className="empty-cell">
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
                    <span className={`badge badge-${entry.type}`}>
                      {entry.type === 'lover' ? '🍔 Food Lover' : '🚚 Truck Owner'}
                    </span>
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
              <div className="file-upload">
                <input
                  type="file"
                  accept=".csv"
                  onChange={(e) => setImportFile(e.target.files[0])}
                  id="csv-upload"
                />
                <label htmlFor="csv-upload" className="file-label">
                  {Icons.upload}
                  {importFile ? importFile.name : 'Choose CSV file'}
                </label>
              </div>
              {importResults && (
                <div className="import-results">
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
const UsersManagement = () => {
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
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select(`
          *,
          customers (phone, points, avatar_url),
          owners (subscription_type)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const flattenedUsers = (profiles || []).map(profile => ({
        id: profile.id,
        name: profile.name,
        email: profile.email,
        role: profile.role,
        created_at: profile.created_at,
        phone: profile.customers?.phone || '',
        points: profile.customers?.points || 0,
        avatar_url: profile.customers?.avatar_url || '',
        subscription_type: profile.owners?.subscription_type || '',
      }));

      setUsers(flattenedUsers);
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
      const { error } = await supabase
        .from('profiles')
        .update({
          name: selectedUser.name,
          role: selectedUser.role,
        })
        .eq('id', selectedUser.id);

      if (error) throw error;

      if (selectedUser.role === 'customer' && selectedUser.phone) {
        await supabase
          .from('customers')
          .update({ phone: selectedUser.phone })
          .eq('id', selectedUser.id);
      }

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
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId);

      if (error) throw error;
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
    <div className="users-management">
      <div className="page-header">
        <h1>Users Management</h1>
        <button className="btn-primary" onClick={() => setShowInviteModal(true)}>
          {Icons.mail}
          Invite User
        </button>
      </div>

      {/* Filters */}
      <div className="filters-bar">
        <div className="search-box">
          {Icons.search}
          <input
            type="text"
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="filter-group">
          <select value={filterRole} onChange={(e) => setFilterRole(e.target.value)}>
            <option value="all">All Roles</option>
            <option value="customer">Customers</option>
            <option value="owner">Owners</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="table-card">
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px', color: '#64748b' }}>
            Loading users...
          </div>
        ) : (
          <table className="data-table">
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
                    <div className="user-cell">
                      <div className="user-avatar">{getInitials(user.name)}</div>
                      <div className="user-info">
                        <span className="user-name">{user.name || 'No name'}</span>
                        <span className="user-email">{user.email}</span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="contact-cell">
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
                    <div className="action-buttons">
                      <button className="icon-btn" onClick={() => handleViewUser(user)} title="View">
                        {Icons.eye}
                      </button>
                      <button className="icon-btn" onClick={() => handleEditUser(user)} title="Edit">
                        {Icons.edit}
                      </button>
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
                <div className="success-message" style={{
                  background: '#dcfce7',
                  color: '#166534',
                  padding: '12px',
                  borderRadius: '8px',
                  marginBottom: '16px'
                }}>
                  {inviteSuccess}
                </div>
              )}
              <div className="form-grid">
                <div className="form-group">
                  <label>Full Name *</label>
                  <input
                    type="text"
                    value={inviteName}
                    onChange={(e) => setInviteName(e.target.value)}
                    placeholder="Enter user's full name"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Email Address *</label>
                  <input
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="Enter email address"
                    required
                  />
                </div>
                <div className="form-group">
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
              <p className="form-hint" style={{ marginTop: '16px', color: '#64748b' }}>
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
                <div className="form-grid">
                  <div className="form-group">
                    <label>Name *</label>
                    <input
                      type="text"
                      value={selectedUser.name || ''}
                      onChange={(e) => setSelectedUser({ ...selectedUser, name: e.target.value })}
                      placeholder="Enter full name"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Email</label>
                    <input
                      type="email"
                      value={selectedUser.email || ''}
                      disabled
                      className="disabled"
                    />
                    <span className="form-hint">Email cannot be changed (linked to auth)</span>
                  </div>
                  <div className="form-group">
                    <label>Phone</label>
                    <input
                      type="tel"
                      value={selectedUser.phone || ''}
                      onChange={(e) => setSelectedUser({ ...selectedUser, phone: e.target.value })}
                      placeholder="Enter phone number"
                    />
                  </div>
                  <div className="form-group">
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
                <div className="user-details">
                  <div className="detail-header">
                    <div className="user-avatar large">{getInitials(selectedUser.name)}</div>
                    <div>
                      <h3>{selectedUser.name || 'No name'}</h3>
                      <span className={`role-badge ${selectedUser.role || 'customer'}`}>{selectedUser.role || 'customer'}</span>
                    </div>
                  </div>
                  <div className="detail-grid">
                    <div className="detail-item">
                      <span className="detail-label">Email</span>
                      <span className="detail-value">{selectedUser.email}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Phone</span>
                      <span className="detail-value">{selectedUser.phone || 'Not provided'}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Joined</span>
                      <span className="detail-value">{selectedUser.created_at ? format(new Date(selectedUser.created_at), 'MMM dd, yyyy') : 'N/A'}</span>
                    </div>
                    {selectedUser.role === 'customer' && (
                      <div className="detail-item">
                        <span className="detail-label">Points</span>
                        <span className="detail-value">{selectedUser.points || 0}</span>
                      </div>
                    )}
                    {selectedUser.role === 'owner' && (
                      <div className="detail-item">
                        <span className="detail-label">Subscription</span>
                        <span className="detail-value">{selectedUser.subscription_type || 'free'}</span>
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

// Food Trucks Management Component
const TrucksManagement = () => {
  const { showToast } = useToast();
  const { confirm } = useConfirm();
  const [trucks, setTrucks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTruck, setSelectedTruck] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchTrucks = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('food_trucks')
        .select(`
          *,
          owners:owner_id (
            id,
            profiles:id (name, email)
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const flattenedTrucks = (data || []).map(truck => ({
        ...truck,
        owner_name: truck.owners?.profiles?.name || 'Unknown',
        owner_email: truck.owners?.profiles?.email || '',
      }));

      setTrucks(flattenedTrucks);
    } catch (err) {
      console.error('Error fetching trucks:', err);
      setTrucks([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrucks();
  }, []);

  const filteredTrucks = trucks.filter(truck =>
    (truck.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (truck.cuisine || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEditTruck = (truck) => {
    setSelectedTruck({ ...truck });
    setEditMode(true);
    setShowModal(true);
  };

  const handleViewTruck = (truck) => {
    setSelectedTruck(truck);
    setEditMode(false);
    setShowModal(true);
  };

  const handleSaveTruck = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('food_trucks')
        .update({
          name: selectedTruck.name,
          description: selectedTruck.description,
          cuisine: selectedTruck.cuisine,
          location: selectedTruck.location,
          price_range: selectedTruck.price_range,
          is_open: selectedTruck.is_open,
          hours: selectedTruck.hours,
        })
        .eq('id', selectedTruck.id);

      if (error) throw error;
      setTrucks(trucks.map(t => t.id === selectedTruck.id ? selectedTruck : t));
      setShowModal(false);
      setSelectedTruck(null);
    } catch (err) {
      console.error('Error saving truck:', err);
      showToast('Error saving truck: ' + err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTruck = async (truckId) => {
    const confirmed = await confirm({
      title: 'Delete Food Truck',
      message: 'Are you sure you want to delete this food truck? This will also delete all menu items and reviews.',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      variant: 'danger',
    });
    if (!confirmed) return;

    try {
      const { error } = await supabase
        .from('food_trucks')
        .delete()
        .eq('id', truckId);

      if (error) throw error;
      setTrucks(trucks.filter(t => t.id !== truckId));
    } catch (err) {
      console.error('Error deleting truck:', err);
      showToast('Error deleting truck: ' + err.message, 'error');
    }
  };

  const handleToggleOpen = async (truckId, currentStatus) => {
    try {
      const { error } = await supabase
        .from('food_trucks')
        .update({ is_open: !currentStatus })
        .eq('id', truckId);

      if (error) throw error;
      setTrucks(trucks.map(t => t.id === truckId ? { ...t, is_open: !currentStatus } : t));
    } catch (err) {
      console.error('Error toggling status:', err);
    }
  };

  return (
    <div className="trucks-management">
      <div className="page-header">
        <h1>Food Trucks</h1>
        <span className="page-subtitle">Food trucks are created by owners through the app</span>
      </div>

      <div className="filters-bar">
        <div className="search-box">
          {Icons.search}
          <input
            type="text"
            placeholder="Search trucks..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: '#64748b' }}>
          Loading food trucks...
        </div>
      ) : filteredTrucks.length > 0 ? (
        <div className="trucks-grid">
          {filteredTrucks.map((truck) => (
            <div key={truck.id} className="truck-card">
              <div className="truck-card-header">
                <div className="truck-avatar">{(truck.name || '?').charAt(0)}</div>
                <div className="truck-info">
                  <h3>{truck.name || 'Unnamed'}</h3>
                  <span className="truck-cuisine">{truck.cuisine || 'Various'}</span>
                </div>
                <span className={`status-badge ${truck.is_open ? 'active' : 'inactive'}`}>
                  {truck.is_open ? 'Open' : 'Closed'}
                </span>
              </div>
              <div className="truck-card-body">
                <div className="truck-stat">
                  <span className="stat-label">Owner</span>
                  <span className="stat-value">{truck.owner_name || 'Unknown'}</span>
                </div>
                <div className="truck-stat">
                  <span className="stat-label">Location</span>
                  <span className="stat-value">{truck.location || 'Not set'}</span>
                </div>
                <div className="truck-stat">
                  <span className="stat-label">Price Range</span>
                  <span className="stat-value">{truck.price_range || '$'}</span>
                </div>
                <div className="truck-stat">
                  <span className="stat-label">Hours</span>
                  <span className="stat-value">{truck.hours || 'Not set'}</span>
                </div>
              </div>
              <div className="truck-card-footer">
                <button className="btn-secondary btn-sm" onClick={() => handleViewTruck(truck)}>View</button>
                <button className="btn-primary btn-sm" onClick={() => handleEditTruck(truck)}>Edit</button>
                <button
                  className={`btn-sm ${truck.is_open ? 'btn-danger' : 'btn-secondary'}`}
                  onClick={() => handleToggleOpen(truck.id, truck.is_open)}
                >
                  {truck.is_open ? 'Close' : 'Open'}
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '60px', color: '#64748b', background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          {searchTerm ? 'No trucks match your search.' : 'No food trucks yet. Owners can add trucks through the app.'}
        </div>
      )}

      {/* Truck Modal */}
      {showModal && selectedTruck && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editMode ? 'Edit Food Truck' : 'Truck Details'}</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>
                {Icons.x}
              </button>
            </div>
            <div className="modal-body">
              {editMode ? (
                <div className="form-grid">
                  <div className="form-group">
                    <label>Truck Name *</label>
                    <input
                      type="text"
                      value={selectedTruck.name || ''}
                      onChange={(e) => setSelectedTruck({ ...selectedTruck, name: e.target.value })}
                      placeholder="Enter truck name"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Cuisine Type</label>
                    <input
                      type="text"
                      value={selectedTruck.cuisine || ''}
                      onChange={(e) => setSelectedTruck({ ...selectedTruck, cuisine: e.target.value })}
                      placeholder="e.g., Mexican, Asian, American"
                    />
                  </div>
                  <div className="form-group">
                    <label>Location</label>
                    <input
                      type="text"
                      value={selectedTruck.location || ''}
                      onChange={(e) => setSelectedTruck({ ...selectedTruck, location: e.target.value })}
                      placeholder="Enter default location"
                    />
                  </div>
                  <div className="form-group">
                    <label>Hours</label>
                    <input
                      type="text"
                      value={selectedTruck.hours || ''}
                      onChange={(e) => setSelectedTruck({ ...selectedTruck, hours: e.target.value })}
                      placeholder="e.g., 11am - 9pm"
                    />
                  </div>
                  <div className="form-group">
                    <label>Price Range</label>
                    <select
                      value={selectedTruck.price_range || '$'}
                      onChange={(e) => setSelectedTruck({ ...selectedTruck, price_range: e.target.value })}
                    >
                      <option value="$">$ (Budget)</option>
                      <option value="$$">$$ (Moderate)</option>
                      <option value="$$$">$$$ (Upscale)</option>
                      <option value="$$$$">$$$$ (Premium)</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Status</label>
                    <select
                      value={selectedTruck.is_open ? 'open' : 'closed'}
                      onChange={(e) => setSelectedTruck({ ...selectedTruck, is_open: e.target.value === 'open' })}
                    >
                      <option value="open">Open</option>
                      <option value="closed">Closed</option>
                    </select>
                  </div>
                  <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                    <label>Description</label>
                    <textarea
                      value={selectedTruck.description || ''}
                      onChange={(e) => setSelectedTruck({ ...selectedTruck, description: e.target.value })}
                      placeholder="Enter truck description"
                      rows={3}
                    />
                  </div>
                </div>
              ) : (
                <div className="user-details">
                  <div className="detail-header">
                    <div className="user-avatar large">{(selectedTruck.name || '?').charAt(0)}</div>
                    <div>
                      <h3>{selectedTruck.name || 'Unnamed'}</h3>
                      <span className={`status-badge ${selectedTruck.is_open ? 'active' : 'inactive'}`}>
                        {selectedTruck.is_open ? 'Open' : 'Closed'}
                      </span>
                    </div>
                  </div>
                  <div className="detail-grid">
                    <div className="detail-item">
                      <span className="detail-label">Owner</span>
                      <span className="detail-value">{selectedTruck.owner_name || 'Unknown'}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Cuisine</span>
                      <span className="detail-value">{selectedTruck.cuisine || 'Various'}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Location</span>
                      <span className="detail-value">{selectedTruck.location || 'Not set'}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Price Range</span>
                      <span className="detail-value">{selectedTruck.price_range || '$'}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Hours</span>
                      <span className="detail-value">{selectedTruck.hours || 'Not set'}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Created</span>
                      <span className="detail-value">{selectedTruck.created_at ? format(new Date(selectedTruck.created_at), 'MMM dd, yyyy') : 'N/A'}</span>
                    </div>
                  </div>
                  {selectedTruck.description && (
                    <div className="detail-item" style={{ marginTop: '16px' }}>
                      <span className="detail-label">Description</span>
                      <span className="detail-value">{selectedTruck.description}</span>
                    </div>
                  )}
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
                  onClick={handleSaveTruck}
                  disabled={saving || !selectedTruck.name}
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
    <div className="analytics-page">
      <div className="page-header">
        <h1>Analytics</h1>
      </div>

      {/* Key Metrics */}
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-title">Total Users</span>
          </div>
          <div className="metric-value">{(stats.totalUsers || 0).toLocaleString()}</div>
        </div>
        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-title">Food Trucks</span>
          </div>
          <div className="metric-value">{(stats.totalTrucks || 0).toLocaleString()}</div>
        </div>
        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-title">Total Reviews</span>
          </div>
          <div className="metric-value">{(stats.totalReviews || 0).toLocaleString()}</div>
        </div>
        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-title">Total Check-ins</span>
          </div>
          <div className="metric-value">{(stats.totalCheckIns || 0).toLocaleString()}</div>
        </div>
      </div>

      {/* Charts */}
      <div className="charts-grid">
        <div className="chart-card large">
          <div className="chart-header">
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
            <div className="chart-empty">
              <p>No activity data yet. Charts will populate as users interact with the app.</p>
            </div>
          )}
        </div>

        <div className="chart-card">
          <div className="chart-header">
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
            <div className="chart-empty">
              <p>No food truck data yet.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Settings Component
const SettingsPage = ({ adminEmail }) => {
  const [settings, setSettings] = useState({
    siteName: 'Cravvr',
    siteDescription: 'The map-first food truck app',
    contactEmail: 'support@cravvr.com',
    commissionRate: 0,
    deliveryFee: 2.99,
    minOrderAmount: 10,
    maxDeliveryRadius: 5,
    enableNotifications: true,
    maintenanceMode: false,
  });

  return (
    <div className="settings-page">
      <div className="page-header">
        <h1>Settings</h1>
      </div>

      <div className="settings-grid">
        <div className="settings-card">
          <h3>Admin Information</h3>
          <div className="form-group">
            <label>Logged in as</label>
            <input type="text" value={adminEmail} disabled className="disabled" />
          </div>
          <div className="form-group">
            <label>Admin Access</label>
            <p className="form-info">
              Admin access is managed via the database. Set <code>role = 'admin'</code> in the <code>profiles</code> table to grant admin access.
            </p>
            <span className="form-hint">Contact your database administrator to add or remove admins</span>
          </div>
        </div>

        <div className="settings-card">
          <h3>General Settings</h3>
          <div className="form-group">
            <label>Site Name</label>
            <input
              type="text"
              value={settings.siteName}
              onChange={(e) => setSettings({ ...settings, siteName: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label>Site Description</label>
            <textarea
              value={settings.siteDescription}
              onChange={(e) => setSettings({ ...settings, siteDescription: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label>Contact Email</label>
            <input
              type="email"
              value={settings.contactEmail}
              onChange={(e) => setSettings({ ...settings, contactEmail: e.target.value })}
            />
          </div>
        </div>

        <div className="settings-card">
          <h3>Business Settings</h3>
          <div className="form-group">
            <label>Commission Rate (%)</label>
            <input
              type="number"
              value={settings.commissionRate}
              onChange={(e) => setSettings({ ...settings, commissionRate: parseFloat(e.target.value) || 0 })}
            />
            <span className="form-hint">0% = No commission on pickup orders</span>
          </div>
          <div className="form-group">
            <label>Default Delivery Fee ($)</label>
            <input
              type="number"
              step="0.01"
              value={settings.deliveryFee}
              onChange={(e) => setSettings({ ...settings, deliveryFee: parseFloat(e.target.value) || 0 })}
            />
          </div>
        </div>

        <div className="settings-card">
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
      </div>
    </div>
  );
};

// Main Admin Dashboard Component
const AdminDashboard = () => {
  const { user, profile, isAdmin, loading: authLoading, signOut } = useAuth();
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

  // Fetch all dashboard data from real tables
  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Fetch total users count
      const { count: usersCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      // Fetch users by role for pie chart
      const { data: userRoles } = await supabase
        .from('profiles')
        .select('role');

      const customerCount = (userRoles || []).filter(u => u.role === 'customer').length;
      const ownerCount = (userRoles || []).filter(u => u.role === 'owner').length;

      // Fetch food trucks count
      const { count: trucksCount } = await supabase
        .from('food_trucks')
        .select('*', { count: 'exact', head: true });

      // Fetch trucks by cuisine for pie chart
      const { data: trucksCuisine } = await supabase
        .from('food_trucks')
        .select('cuisine');

      const cuisineCounts = {};
      (trucksCuisine || []).forEach(t => {
        const cuisine = t.cuisine || 'Other';
        cuisineCounts[cuisine] = (cuisineCounts[cuisine] || 0) + 1;
      });
      const cuisineBreakdown = Object.entries(cuisineCounts)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 5);

      // Fetch reviews count
      const { count: reviewsCount } = await supabase
        .from('reviews')
        .select('*', { count: 'exact', head: true });

      // Fetch check-ins count
      const { count: checkInsCount } = await supabase
        .from('check_ins')
        .select('*', { count: 'exact', head: true });

      // Fetch recent check-ins
      const { data: recentCheckIns } = await supabase
        .from('check_ins')
        .select(`
          *,
          customers:customer_id (
            profiles:id (name)
          ),
          food_trucks:truck_id (name)
        `)
        .order('created_at', { ascending: false })
        .limit(5);

      // Fetch recent reviews
      const { data: recentReviews } = await supabase
        .from('reviews')
        .select(`
          *,
          customers:customer_id (
            profiles:id (name)
          ),
          food_trucks:truck_id (name)
        `)
        .order('created_at', { ascending: false })
        .limit(5);

      // Combine and sort recent activity
      const activity = [
        ...(recentCheckIns || []).map(ci => ({
          id: ci.id,
          customer_name: ci.customers?.profiles?.name || 'Guest',
          truck_name: ci.food_trucks?.name || 'Unknown',
          points: ci.points_earned || 10,
          created_at: ci.created_at,
          type: 'check_in'
        })),
        ...(recentReviews || []).map(r => ({
          id: r.id,
          customer_name: r.customers?.profiles?.name || 'Guest',
          truck_name: r.food_trucks?.name || 'Unknown',
          rating: r.rating,
          created_at: r.created_at,
          type: 'review'
        }))
      ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 10);

      // Generate daily activity for last 30 days
      const dailyActivity = [];
      for (let i = 29; i >= 0; i--) {
        const date = subDays(new Date(), i);
        const dateStr = format(date, 'yyyy-MM-dd');
        const displayDate = format(date, 'MMM dd');

        // Count check-ins for this day
        const { count: dayCheckIns } = await supabase
          .from('check_ins')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', startOfDay(date).toISOString())
          .lte('created_at', endOfDay(date).toISOString());

        // Count reviews for this day
        const { count: dayReviews } = await supabase
          .from('reviews')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', startOfDay(date).toISOString())
          .lte('created_at', endOfDay(date).toISOString());

        dailyActivity.push({
          date: displayDate,
          checkIns: dayCheckIns || 0,
          reviews: dayReviews || 0,
        });
      }

      // User growth by month (simplified - just show total at each month)
      const userGrowth = [];
      for (let i = 11; i >= 0; i--) {
        const date = subDays(new Date(), i * 30);
        const monthStr = format(date, 'MMM');

        const { count } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .lte('created_at', endOfDay(date).toISOString());

        userGrowth.push({
          month: monthStr,
          users: count || 0,
        });
      }

      setStats({
        totalUsers: usersCount || 0,
        totalTrucks: trucksCount || 0,
        totalReviews: reviewsCount || 0,
        totalCheckIns: checkInsCount || 0,
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
      <div className="admin-login">
        <div className="login-card">
          <div className="login-header">
            <div className="login-logo">
              <span className="logo-icon">C</span>
              <span className="logo-text">Cravvr Admin</span>
            </div>
            <p>Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  // Show access denied if user is logged in but not admin (including when profile is null/missing)
  if (user && !isAdmin) {
    return (
      <div className="admin-login">
        <div className="login-card">
          <div className="login-header">
            <div className="login-logo">
              <span className="logo-icon">C</span>
              <span className="logo-text">Cravvr Admin</span>
            </div>
            <p>Access Denied</p>
          </div>
          <div className="login-error">
            {!profile
              ? 'Your admin profile is not set up. Please contact support to configure your account.'
              : 'You do not have admin privileges. Please contact support if you believe this is an error.'
            }
          </div>
          <button className="login-btn" onClick={handleLogout}>
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
    { id: 'analytics', label: 'Analytics', icon: Icons.trendingUp },
    { id: 'settings', label: 'Settings', icon: Icons.settings },
  ];

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <DashboardOverview stats={stats} recentActivity={recentActivity} chartData={chartData} loading={loading} onRefresh={fetchDashboardData} />;
      case 'waitlist':
        return <WaitlistManagement />;
      case 'users':
        return <UsersManagement />;
      case 'trucks':
        return <TrucksManagement />;
      case 'analytics':
        return <AnalyticsPage stats={stats} chartData={chartData} />;
      case 'settings':
        return <SettingsPage adminEmail={user?.email} />;
      default:
        return <DashboardOverview stats={stats} recentActivity={recentActivity} chartData={chartData} loading={loading} onRefresh={fetchDashboardData} />;
    }
  };

  return (
    <div className="admin-dashboard-content">
      {/* Horizontal Tab Navigation */}
      <div className="admin-tabs">
        <div className="admin-tabs-header">
          <h1 className="admin-title">Admin Dashboard</h1>
          <span className="admin-badge">{Icons.shield} Admin</span>
        </div>
        <nav className="admin-tabs-nav">
          {navItems.map((item) => (
            <button
              key={item.id}
              className={`admin-tab ${currentPage === item.id ? 'active' : ''}`}
              onClick={() => setCurrentPage(item.id)}
            >
              <span className="tab-icon">{item.icon}</span>
              <span className="tab-label">{item.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="admin-tab-content">
        {renderPage()}
      </div>
    </div>
  );
};

export default AdminDashboard;
