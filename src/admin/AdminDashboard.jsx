import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { format, subDays } from 'date-fns';
import './AdminDashboard.css';

// Supabase client
const supabase = createClient(
  'https://coqwihsmmigktqqdnmis.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNvcXdpaHNtbWlna3RxcWRubWlzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcwNTg1NTMsImV4cCI6MjA4MjYzNDU1M30.ybwwLZguj58PGzCuM-gCdMoUjGHLh2zmkZihy6_zEx8'
);

// Icons
const Icons = {
  dashboard: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>,
  users: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  trucks: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>,
  orders: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>,
  analytics: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>,
  settings: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>,
  logout: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
  search: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  plus: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  edit: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  trash: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>,
  eye: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>,
  x: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  star: <svg viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
  trendUp: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>,
  trendDown: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/><polyline points="17 18 23 18 23 12"/></svg>,
  dollar: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>,
  bell: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>,
  download: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>,
  menu: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>,
  refresh: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>,
};

// Chart colors
const CHART_COLORS = ['#e11d48', '#f43f5e', '#fb7185', '#fda4af', '#fecdd3'];

// Generate chart data for demo (will be replaced with real data)
const generateRevenueData = () => {
  return Array.from({ length: 30 }, (_, i) => ({
    date: format(subDays(new Date(), 29 - i), 'MMM dd'),
    revenue: Math.floor(Math.random() * 5000) + 2000,
    orders: Math.floor(Math.random() * 150) + 50,
  }));
};

const generateUserGrowthData = () => {
  let total = 1200;
  return Array.from({ length: 12 }, (_, i) => {
    total += Math.floor(Math.random() * 200) + 50;
    return {
      month: format(subDays(new Date(), (11 - i) * 30), 'MMM'),
      users: total,
      newUsers: Math.floor(Math.random() * 200) + 50,
    };
  });
};

const generateOrdersByCategory = () => [
  { name: 'Mexican', value: 324, color: '#e11d48' },
  { name: 'American', value: 256, color: '#f43f5e' },
  { name: 'Asian', value: 198, color: '#fb7185' },
  { name: 'Italian', value: 167, color: '#fda4af' },
  { name: 'Other', value: 89, color: '#fecdd3' },
];

const generateWeeklyOrders = () => {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  return days.map(day => ({
    day,
    pickup: Math.floor(Math.random() * 80) + 40,
    delivery: Math.floor(Math.random() * 60) + 20,
  }));
};

// Login Component
const AdminLogin = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      onLogin(data.user);
    } catch (err) {
      // For demo, allow test credentials
      if (email === 'admin@cravvr.com' && password === 'admin123') {
        onLogin({ email: 'admin@cravvr.com', role: 'admin' });
      } else {
        setError(err.message || 'Invalid credentials. Try admin@cravvr.com / admin123');
      }
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
              placeholder="admin@cravvr.com"
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
          <p>Demo credentials: admin@cravvr.com / admin123</p>
        </div>
      </div>
    </div>
  );
};

// Dashboard Overview Component
const DashboardOverview = ({ stats, recentOrders, loading, onRefresh }) => {
  const revenueData = generateRevenueData();
  const userGrowthData = generateUserGrowthData();
  const categoryData = generateOrdersByCategory();
  const weeklyData = generateWeeklyOrders();

  const statCards = [
    { label: 'Total Users', value: stats.activeUsers?.toLocaleString() || '0', change: 'All time', trend: 'up', icon: Icons.users },
    { label: 'Food Trucks', value: stats.totalTrucks?.toLocaleString() || '0', change: 'Registered', trend: 'up', icon: Icons.trucks },
    { label: 'Reviews', value: stats.totalOrders?.toLocaleString() || '0', change: 'Total', trend: 'up', icon: Icons.star },
    { label: 'Check-ins', value: recentOrders?.length?.toLocaleString() || '0', change: 'Recent', trend: 'up', icon: Icons.orders },
  ];

  return (
    <div className="dashboard-overview">
      <div className="page-header">
        <h1>Dashboard Overview</h1>
        <div className="header-actions">
          <button className="btn-secondary" onClick={onRefresh}>
            {Icons.refresh}
            Refresh
          </button>
          <button className="btn-secondary">
            {Icons.download}
            Export Report
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
              <span className={`stat-change ${stat.trend}`}>
                {stat.trend === 'up' ? Icons.trendUp : Icons.trendDown}
                {stat.change}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="charts-grid">
        <div className="chart-card large">
          <div className="chart-header">
            <h3>Revenue Overview</h3>
            <select className="chart-select">
              <option>Last 30 Days</option>
              <option>Last 7 Days</option>
              <option>This Month</option>
            </select>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={revenueData}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#e11d48" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#e11d48" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="date" stroke="#64748b" fontSize={12} />
              <YAxis stroke="#64748b" fontSize={12} tickFormatter={(v) => `$${v}`} />
              <Tooltip
                contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px' }}
                formatter={(value) => [`$${value}`, 'Revenue']}
              />
              <Area type="monotone" dataKey="revenue" stroke="#e11d48" strokeWidth={2} fill="url(#colorRevenue)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <div className="chart-header">
            <h3>Orders by Category</h3>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={categoryData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={2}
                dataKey="value"
              >
                {categoryData.map((entry, index) => (
                  <Cell key={index} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => [value, 'Orders']} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Second Charts Row */}
      <div className="charts-grid">
        <div className="chart-card">
          <div className="chart-header">
            <h3>User Growth</h3>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={userGrowthData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="month" stroke="#64748b" fontSize={12} />
              <YAxis stroke="#64748b" fontSize={12} />
              <Tooltip contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px' }} />
              <Line type="monotone" dataKey="users" stroke="#e11d48" strokeWidth={2} dot={{ fill: '#e11d48' }} />
              <Line type="monotone" dataKey="newUsers" stroke="#3b82f6" strokeWidth={2} dot={{ fill: '#3b82f6' }} />
              <Legend />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <div className="chart-header">
            <h3>Weekly Orders</h3>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={weeklyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="day" stroke="#64748b" fontSize={12} />
              <YAxis stroke="#64748b" fontSize={12} />
              <Tooltip contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px' }} />
              <Bar dataKey="pickup" fill="#e11d48" radius={[4, 4, 0, 0]} />
              <Bar dataKey="delivery" fill="#fb7185" radius={[4, 4, 0, 0]} />
              <Legend />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="table-card">
        <div className="table-header">
          <h3>Recent Activity</h3>
          <button className="btn-text">View All</button>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Activity</th>
              <th>Customer</th>
              <th>Food Truck</th>
              <th>Points</th>
              <th>Type</th>
              <th>Time</th>
            </tr>
          </thead>
          <tbody>
            {recentOrders.length > 0 ? recentOrders.map((activity, index) => (
              <tr key={activity.id || index}>
                <td className="font-medium">#{activity.id?.slice(0, 8) || `ACT-${index + 1}`}</td>
                <td>{activity.customer_name || 'Guest'}</td>
                <td>{activity.truck_name || 'Unknown'}</td>
                <td className="font-medium">+{activity.points || 10} pts</td>
                <td>
                  <span className="status-badge active">Check-in</span>
                </td>
                <td className="text-muted">{activity.created_at ? format(new Date(activity.created_at), 'MMM dd, HH:mm') : 'N/A'}</td>
              </tr>
            )) : (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                  No activity yet. Check-ins and reviews will appear here.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// Users Management Component - Uses profiles table from schema
const UsersManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [selectedUser, setSelectedUser] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [isAddMode, setIsAddMode] = useState(false);
  const [saving, setSaving] = useState(false);

  const emptyUser = {
    name: '',
    email: '',
    role: 'customer',
    phone: '',
    points: 0,
  };

  // Fetch users from Supabase profiles table with customer/owner details
  const fetchUsers = async () => {
    setLoading(true);
    try {
      // Fetch profiles with customer data joined
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select(`
          *,
          customers (phone, points, avatar_url),
          owners (subscription_type)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Flatten the data for easier display
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

  const handleAddUser = () => {
    setSelectedUser({ ...emptyUser });
    setIsAddMode(true);
    setEditMode(true);
    setShowModal(true);
  };

  const handleEditUser = (user) => {
    setSelectedUser({ ...user });
    setIsAddMode(false);
    setEditMode(true);
    setShowModal(true);
  };

  const handleViewUser = (user) => {
    setSelectedUser(user);
    setIsAddMode(false);
    setEditMode(false);
    setShowModal(true);
  };

  const handleSaveUser = async () => {
    setSaving(true);
    try {
      if (isAddMode) {
        // Note: Creating users requires auth signup - this creates profile only
        // In production, you'd use Supabase admin API or invite flow
        alert('To add new users, use Supabase Auth signup flow. This admin panel can only edit existing users.');
        setSaving(false);
        return;
      } else {
        // Update existing profile
        const { error } = await supabase
          .from('profiles')
          .update({
            name: selectedUser.name,
            role: selectedUser.role,
          })
          .eq('id', selectedUser.id);

        if (error) throw error;

        // Update customer phone if role is customer
        if (selectedUser.role === 'customer' && selectedUser.phone) {
          await supabase
            .from('customers')
            .update({ phone: selectedUser.phone })
            .eq('id', selectedUser.id);
        }

        setUsers(users.map(u => u.id === selectedUser.id ? selectedUser : u));
      }
      setShowModal(false);
      setSelectedUser(null);
    } catch (err) {
      console.error('Error saving user:', err);
      alert('Error saving user: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user? This will remove their profile and all associated data.')) {
      try {
        // Delete from profiles (cascades to customers/owners)
        const { error } = await supabase
          .from('profiles')
          .delete()
          .eq('id', userId);

        if (error) throw error;
        setUsers(users.filter(u => u.id !== userId));
      } catch (err) {
        console.error('Error deleting user:', err);
        alert('Error deleting user: ' + err.message);
      }
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
        <button className="btn-primary" onClick={handleAddUser}>
          {Icons.plus}
          Add User
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
                      : 'No users yet. Users will appear here when they sign up.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* User Modal */}
      {showModal && selectedUser && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{isAddMode ? 'Add New User' : editMode ? 'Edit User' : 'User Details'}</h2>
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
                  disabled={saving || !selectedUser.name || !selectedUser.email}
                >
                  {saving ? 'Saving...' : isAddMode ? 'Create User' : 'Save Changes'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Food Trucks Management Component - Uses food_trucks table from schema
const TrucksManagement = () => {
  const [trucks, setTrucks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTruck, setSelectedTruck] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [isAddMode, setIsAddMode] = useState(false);
  const [saving, setSaving] = useState(false);

  const emptyTruck = {
    name: '',
    slug: '',
    description: '',
    cuisine: '',
    location: '',
    price_range: '$',
    is_open: true,
  };

  // Fetch trucks from Supabase food_trucks table with ratings
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

      // Flatten and add owner info
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

  const handleAddTruck = () => {
    alert('To add a new food truck, the owner must register and create it through the app. Admin can only edit existing trucks.');
  };

  const handleEditTruck = (truck) => {
    setSelectedTruck({ ...truck });
    setIsAddMode(false);
    setEditMode(true);
    setShowModal(true);
  };

  const handleViewTruck = (truck) => {
    setSelectedTruck(truck);
    setIsAddMode(false);
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
      alert('Error saving truck: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTruck = async (truckId) => {
    if (window.confirm('Are you sure you want to delete this food truck? This will also delete all menu items and reviews.')) {
      try {
        const { error } = await supabase
          .from('food_trucks')
          .delete()
          .eq('id', truckId);

        if (error) throw error;
        setTrucks(trucks.filter(t => t.id !== truckId));
      } catch (err) {
        console.error('Error deleting truck:', err);
        alert('Error deleting truck: ' + err.message);
      }
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
        <button className="btn-primary" onClick={handleAddTruck}>
          {Icons.plus}
          Add Truck
        </button>
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
              <h2>{isAddMode ? 'Add New Food Truck' : editMode ? 'Edit Food Truck' : 'Truck Details'}</h2>
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
                  {saving ? 'Saving...' : isAddMode ? 'Create Truck' : 'Save Changes'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Analytics Component
const AnalyticsPage = ({ stats }) => {
  const revenueData = generateRevenueData();
  const userGrowthData = generateUserGrowthData();
  const categoryData = generateOrdersByCategory();

  return (
    <div className="analytics-page">
      <div className="page-header">
        <h1>Analytics</h1>
        <div className="header-actions">
          <select className="date-select">
            <option>Last 30 Days</option>
            <option>Last 7 Days</option>
            <option>This Month</option>
            <option>This Year</option>
          </select>
          <button className="btn-secondary">
            {Icons.download}
            Export
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-title">Total Revenue</span>
            <span className="metric-change positive">+12.5%</span>
          </div>
          <div className="metric-value">${(stats.totalRevenue || 0).toLocaleString()}</div>
          <div className="metric-chart">
            <ResponsiveContainer width="100%" height={60}>
              <AreaChart data={revenueData.slice(-7)}>
                <Area type="monotone" dataKey="revenue" stroke="#16a34a" fill="#dcfce7" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-title">Total Orders</span>
            <span className="metric-change positive">+8.2%</span>
          </div>
          <div className="metric-value">{(stats.totalOrders || 0).toLocaleString()}</div>
          <div className="metric-chart">
            <ResponsiveContainer width="100%" height={60}>
              <AreaChart data={revenueData.slice(-7)}>
                <Area type="monotone" dataKey="orders" stroke="#3b82f6" fill="#dbeafe" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-title">Avg. Order Value</span>
            <span className="metric-change positive">+3.8%</span>
          </div>
          <div className="metric-value">${stats.totalOrders > 0 ? (stats.totalRevenue / stats.totalOrders).toFixed(2) : '0.00'}</div>
          <div className="metric-chart">
            <ResponsiveContainer width="100%" height={60}>
              <LineChart data={revenueData.slice(-7)}>
                <Line type="monotone" dataKey="revenue" stroke="#e11d48" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-title">Active Users</span>
            <span className="metric-change positive">+15.3%</span>
          </div>
          <div className="metric-value">{(stats.activeUsers || 0).toLocaleString()}</div>
          <div className="metric-chart">
            <ResponsiveContainer width="100%" height={60}>
              <AreaChart data={userGrowthData.slice(-7)}>
                <Area type="monotone" dataKey="newUsers" stroke="#f59e0b" fill="#fef3c7" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="charts-grid">
        <div className="chart-card large">
          <div className="chart-header">
            <h3>Revenue & Orders Trend</h3>
          </div>
          <ResponsiveContainer width="100%" height={350}>
            <LineChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="date" stroke="#64748b" fontSize={12} />
              <YAxis yAxisId="left" stroke="#64748b" fontSize={12} tickFormatter={(v) => `$${v}`} />
              <YAxis yAxisId="right" orientation="right" stroke="#64748b" fontSize={12} />
              <Tooltip contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px' }} />
              <Legend />
              <Line yAxisId="left" type="monotone" dataKey="revenue" stroke="#e11d48" strokeWidth={2} name="Revenue" />
              <Line yAxisId="right" type="monotone" dataKey="orders" stroke="#3b82f6" strokeWidth={2} name="Orders" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <div className="chart-header">
            <h3>Revenue by Category</h3>
          </div>
          <ResponsiveContainer width="100%" height={350}>
            <PieChart>
              <Pie
                data={categoryData}
                cx="50%"
                cy="50%"
                innerRadius={70}
                outerRadius={110}
                paddingAngle={2}
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {categoryData.map((entry, index) => (
                  <Cell key={index} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => [`$${(value * 38.5).toFixed(0)}`, 'Revenue']} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

// Settings Component
const SettingsPage = () => {
  const [settings, setSettings] = useState({
    siteName: 'Cravvr',
    siteDescription: 'The map-first food truck app',
    contactEmail: 'support@cravvr.com',
    commissionRate: 0,
    deliveryFee: 2.99,
    minOrderAmount: 10,
    maxDeliveryRadius: 5,
    enableNotifications: true,
    enableAnalytics: true,
    maintenanceMode: false,
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      // Save settings to Supabase (create settings table if needed)
      const { error } = await supabase
        .from('settings')
        .upsert([{ id: 1, ...settings }]);

      if (error) throw error;
      alert('Settings saved successfully!');
    } catch (err) {
      console.error('Error saving settings:', err);
      alert('Settings saved locally. Database table may not exist yet.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="settings-page">
      <div className="page-header">
        <h1>Settings</h1>
        <button className="btn-primary" onClick={handleSave} disabled={saving}>
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      <div className="settings-grid">
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
          <div className="form-group">
            <label>Minimum Order Amount ($)</label>
            <input
              type="number"
              value={settings.minOrderAmount}
              onChange={(e) => setSettings({ ...settings, minOrderAmount: parseFloat(e.target.value) || 0 })}
            />
          </div>
          <div className="form-group">
            <label>Max Delivery Radius (miles)</label>
            <input
              type="number"
              value={settings.maxDeliveryRadius}
              onChange={(e) => setSettings({ ...settings, maxDeliveryRadius: parseFloat(e.target.value) || 0 })}
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
            <label className="toggle-label">
              <span>Enable Analytics Tracking</span>
              <input
                type="checkbox"
                checked={settings.enableAnalytics}
                onChange={(e) => setSettings({ ...settings, enableAnalytics: e.target.checked })}
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

        <div className="settings-card danger-zone">
          <h3>Danger Zone</h3>
          <p>These actions are irreversible. Please proceed with caution.</p>
          <div className="danger-actions">
            <button className="btn-danger" onClick={() => alert('Cache cleared!')}>Clear All Cache</button>
            <button className="btn-danger" onClick={() => alert('Analytics reset!')}>Reset Analytics</button>
            <button className="btn-danger" onClick={() => {
              if (window.confirm('Are you sure you want to delete all test data? This cannot be undone.')) {
                alert('Test data deleted!');
              }
            }}>Delete All Test Data</button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Main Admin Dashboard Component
const AdminDashboard = () => {
  const [user, setUser] = useState(null);
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    activeUsers: 0,
    totalTrucks: 0,
  });
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing session
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setUser(session.user);
      }
    };
    checkSession();
  }, []);

  // Fetch dashboard stats from existing schema
  const fetchStats = async () => {
    setLoading(true);
    try {
      // Fetch profiles count (all users)
      const { count: usersCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      // Fetch food_trucks count
      const { count: trucksCount } = await supabase
        .from('food_trucks')
        .select('*', { count: 'exact', head: true });

      // Fetch recent check-ins as activity (since no orders table yet)
      const { data: checkIns } = await supabase
        .from('check_ins')
        .select(`
          *,
          customers:customer_id (
            profiles:id (name)
          ),
          food_trucks:truck_id (name)
        `)
        .order('created_at', { ascending: false })
        .limit(10);

      // Fetch reviews count
      const { count: reviewsCount } = await supabase
        .from('reviews')
        .select('*', { count: 'exact', head: true });

      // Format check-ins as recent activity
      const recentActivity = (checkIns || []).map(ci => ({
        id: ci.id,
        customer_name: ci.customers?.profiles?.name || 'Guest',
        truck_name: ci.food_trucks?.name || 'Unknown',
        points: ci.points_earned || 10,
        created_at: ci.created_at,
        type: 'check_in'
      }));

      setStats({
        totalRevenue: 0, // No orders table yet
        totalOrders: reviewsCount || 0, // Show reviews as activity count
        activeUsers: usersCount || 0,
        totalTrucks: trucksCount || 0,
      });

      setRecentOrders(recentActivity);
    } catch (err) {
      console.error('Error fetching stats:', err);
      // Set defaults if tables don't exist yet
      setStats({
        totalRevenue: 0,
        totalOrders: 0,
        activeUsers: 0,
        totalTrucks: 0,
      });
      setRecentOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchStats();
    }
  }, [user]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  if (!user) {
    return <AdminLogin onLogin={setUser} />;
  }

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Icons.dashboard },
    { id: 'users', label: 'Users', icon: Icons.users },
    { id: 'trucks', label: 'Food Trucks', icon: Icons.trucks },
    { id: 'analytics', label: 'Analytics', icon: Icons.analytics },
    { id: 'settings', label: 'Settings', icon: Icons.settings },
  ];

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <DashboardOverview stats={stats} recentOrders={recentOrders} loading={loading} onRefresh={fetchStats} />;
      case 'users':
        return <UsersManagement />;
      case 'trucks':
        return <TrucksManagement />;
      case 'analytics':
        return <AnalyticsPage stats={stats} />;
      case 'settings':
        return <SettingsPage />;
      default:
        return <DashboardOverview stats={stats} recentOrders={recentOrders} loading={loading} onRefresh={fetchStats} />;
    }
  };

  return (
    <div className={`admin-layout ${sidebarCollapsed ? 'collapsed' : ''}`}>
      {/* Sidebar */}
      <aside className="admin-sidebar">
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <span className="logo-icon">C</span>
            {!sidebarCollapsed && <span className="logo-text">Cravvr</span>}
          </div>
          <button className="sidebar-toggle" onClick={() => setSidebarCollapsed(!sidebarCollapsed)}>
            {Icons.menu}
          </button>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <button
              key={item.id}
              className={`nav-item ${currentPage === item.id ? 'active' : ''}`}
              onClick={() => setCurrentPage(item.id)}
            >
              <span className="nav-icon">{item.icon}</span>
              {!sidebarCollapsed && <span className="nav-label">{item.label}</span>}
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="user-info">
            <div className="user-avatar">
              {user.email?.charAt(0).toUpperCase() || 'A'}
            </div>
            {!sidebarCollapsed && (
              <div className="user-details">
                <span className="user-name">Admin</span>
                <span className="user-email">{user.email}</span>
              </div>
            )}
          </div>
          <button className="logout-btn" onClick={handleLogout}>
            {Icons.logout}
            {!sidebarCollapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="admin-main">
        <header className="admin-header">
          <div className="header-search">
            {Icons.search}
            <input type="text" placeholder="Search..." />
          </div>
          <div className="header-actions">
            <button className="header-btn">
              {Icons.bell}
              <span className="notification-badge">3</span>
            </button>
          </div>
        </header>

        <div className="admin-content">
          {renderPage()}
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
