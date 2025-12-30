import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { format, subDays, startOfWeek, endOfWeek } from 'date-fns';
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
  check: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>,
  x: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  calendar: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  mail: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>,
  phone: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>,
  star: <svg viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
  trendUp: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>,
  trendDown: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/><polyline points="17 18 23 18 23 12"/></svg>,
  dollar: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>,
  map: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/><line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/></svg>,
  bell: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>,
  filter: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>,
  download: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>,
  menu: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>,
};

// Chart colors
const CHART_COLORS = ['#e11d48', '#f43f5e', '#fb7185', '#fda4af', '#fecdd3'];
const CHART_GREEN = '#16a34a';
const CHART_BLUE = '#3b82f6';

// Mock data generators
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

// Mock users data
const mockUsers = [
  { id: 1, name: 'John Smith', email: 'john@example.com', phone: '+1 555-0101', role: 'customer', status: 'active', orders: 23, spent: 456.78, joined: '2024-01-15', avatar: 'JS' },
  { id: 2, name: 'Sarah Johnson', email: 'sarah@example.com', phone: '+1 555-0102', role: 'customer', status: 'active', orders: 45, spent: 892.30, joined: '2024-02-20', avatar: 'SJ' },
  { id: 3, name: 'Mike Chen', email: 'mike@tacotruck.com', phone: '+1 555-0103', role: 'vendor', status: 'active', orders: 0, spent: 0, joined: '2024-01-10', avatar: 'MC' },
  { id: 4, name: 'Emily Davis', email: 'emily@example.com', phone: '+1 555-0104', role: 'customer', status: 'inactive', orders: 8, spent: 123.45, joined: '2024-03-05', avatar: 'ED' },
  { id: 5, name: 'Alex Rodriguez', email: 'alex@burgerbus.com', phone: '+1 555-0105', role: 'vendor', status: 'active', orders: 0, spent: 0, joined: '2024-02-01', avatar: 'AR' },
  { id: 6, name: 'Lisa Wang', email: 'lisa@example.com', phone: '+1 555-0106', role: 'customer', status: 'active', orders: 67, spent: 1234.56, joined: '2023-12-10', avatar: 'LW' },
  { id: 7, name: 'Tom Wilson', email: 'tom@example.com', phone: '+1 555-0107', role: 'customer', status: 'pending', orders: 0, spent: 0, joined: '2024-04-01', avatar: 'TW' },
  { id: 8, name: 'Jessica Brown', email: 'jess@pizzawheels.com', phone: '+1 555-0108', role: 'vendor', status: 'pending', orders: 0, spent: 0, joined: '2024-04-05', avatar: 'JB' },
];

// Mock trucks data
const mockTrucks = [
  { id: 1, name: 'Taco Loco', owner: 'Mike Chen', cuisine: 'Mexican', status: 'active', rating: 4.8, orders: 1234, revenue: 45678.90, location: 'Downtown Portland' },
  { id: 2, name: 'Burger Bus', owner: 'Alex Rodriguez', cuisine: 'American', status: 'active', rating: 4.6, orders: 987, revenue: 34567.80, location: 'Pearl District' },
  { id: 3, name: 'Pizza Wheels', owner: 'Jessica Brown', cuisine: 'Italian', status: 'pending', rating: 0, orders: 0, revenue: 0, location: 'SE Division' },
  { id: 4, name: 'Thai Express', owner: 'Kim Nguyen', cuisine: 'Thai', status: 'active', rating: 4.9, orders: 756, revenue: 28934.50, location: 'NW 23rd' },
  { id: 5, name: 'The Coffee Cart', owner: 'Sam Miller', cuisine: 'Coffee', status: 'inactive', rating: 4.5, orders: 2345, revenue: 12345.60, location: 'PSU Campus' },
];

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
const DashboardOverview = () => {
  const revenueData = generateRevenueData();
  const userGrowthData = generateUserGrowthData();
  const categoryData = generateOrdersByCategory();
  const weeklyData = generateWeeklyOrders();

  const stats = [
    { label: 'Total Revenue', value: '$128,450', change: '+12.5%', trend: 'up', icon: Icons.dollar },
    { label: 'Total Orders', value: '3,847', change: '+8.2%', trend: 'up', icon: Icons.orders },
    { label: 'Active Users', value: '2,156', change: '+15.3%', trend: 'up', icon: Icons.users },
    { label: 'Food Trucks', value: '48', change: '+3', trend: 'up', icon: Icons.trucks },
  ];

  const recentOrders = [
    { id: '#ORD-001', customer: 'John Smith', truck: 'Taco Loco', amount: '$24.50', status: 'completed', time: '5 min ago' },
    { id: '#ORD-002', customer: 'Sarah Johnson', truck: 'Burger Bus', amount: '$18.90', status: 'preparing', time: '12 min ago' },
    { id: '#ORD-003', customer: 'Mike Wilson', truck: 'Thai Express', amount: '$32.00', status: 'pending', time: '18 min ago' },
    { id: '#ORD-004', customer: 'Emily Davis', truck: 'Pizza Wheels', amount: '$45.00', status: 'completed', time: '25 min ago' },
    { id: '#ORD-005', customer: 'Alex Chen', truck: 'Coffee Cart', amount: '$8.50', status: 'completed', time: '32 min ago' },
  ];

  return (
    <div className="dashboard-overview">
      <div className="page-header">
        <h1>Dashboard Overview</h1>
        <div className="header-actions">
          <button className="btn-secondary">
            {Icons.download}
            Export Report
          </button>
          <button className="btn-primary">
            {Icons.plus}
            Add Truck
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        {stats.map((stat, index) => (
          <div key={index} className="stat-card">
            <div className="stat-icon">{stat.icon}</div>
            <div className="stat-content">
              <span className="stat-label">{stat.label}</span>
              <span className="stat-value">{stat.value}</span>
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

      {/* Recent Orders */}
      <div className="table-card">
        <div className="table-header">
          <h3>Recent Orders</h3>
          <button className="btn-text">View All</button>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Customer</th>
              <th>Food Truck</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Time</th>
            </tr>
          </thead>
          <tbody>
            {recentOrders.map((order, index) => (
              <tr key={index}>
                <td className="font-medium">{order.id}</td>
                <td>{order.customer}</td>
                <td>{order.truck}</td>
                <td className="font-medium">{order.amount}</td>
                <td>
                  <span className={`status-badge ${order.status}`}>{order.status}</span>
                </td>
                <td className="text-muted">{order.time}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// Users Management Component
const UsersManagement = () => {
  const [users, setUsers] = useState(mockUsers);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedUser, setSelectedUser] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === 'all' || user.role === filterRole;
    const matchesStatus = filterStatus === 'all' || user.status === filterStatus;
    return matchesSearch && matchesRole && matchesStatus;
  });

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

  const handleSaveUser = () => {
    setUsers(users.map(u => u.id === selectedUser.id ? selectedUser : u));
    setShowModal(false);
    setSelectedUser(null);
  };

  const handleDeleteUser = (userId) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      setUsers(users.filter(u => u.id !== userId));
    }
  };

  const handleStatusChange = (userId, newStatus) => {
    setUsers(users.map(u => u.id === userId ? { ...u, status: newStatus } : u));
  };

  return (
    <div className="users-management">
      <div className="page-header">
        <h1>Users Management</h1>
        <button className="btn-primary">
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
            <option value="vendor">Vendors</option>
            <option value="admin">Admins</option>
          </select>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="pending">Pending</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="table-card">
        <table className="data-table">
          <thead>
            <tr>
              <th>User</th>
              <th>Contact</th>
              <th>Role</th>
              <th>Status</th>
              <th>Orders</th>
              <th>Total Spent</th>
              <th>Joined</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((user) => (
              <tr key={user.id}>
                <td>
                  <div className="user-cell">
                    <div className="user-avatar">{user.avatar}</div>
                    <div className="user-info">
                      <span className="user-name">{user.name}</span>
                      <span className="user-email">{user.email}</span>
                    </div>
                  </div>
                </td>
                <td>
                  <div className="contact-cell">
                    <span>{user.phone}</span>
                  </div>
                </td>
                <td>
                  <span className={`role-badge ${user.role}`}>{user.role}</span>
                </td>
                <td>
                  <select
                    className={`status-select ${user.status}`}
                    value={user.status}
                    onChange={(e) => handleStatusChange(user.id, e.target.value)}
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="pending">Pending</option>
                  </select>
                </td>
                <td>{user.orders}</td>
                <td>${user.spent.toFixed(2)}</td>
                <td>{user.joined}</td>
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
            ))}
          </tbody>
        </table>
      </div>

      {/* User Modal */}
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
                    <label>Name</label>
                    <input
                      type="text"
                      value={selectedUser.name}
                      onChange={(e) => setSelectedUser({ ...selectedUser, name: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Email</label>
                    <input
                      type="email"
                      value={selectedUser.email}
                      onChange={(e) => setSelectedUser({ ...selectedUser, email: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Phone</label>
                    <input
                      type="tel"
                      value={selectedUser.phone}
                      onChange={(e) => setSelectedUser({ ...selectedUser, phone: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Role</label>
                    <select
                      value={selectedUser.role}
                      onChange={(e) => setSelectedUser({ ...selectedUser, role: e.target.value })}
                    >
                      <option value="customer">Customer</option>
                      <option value="vendor">Vendor</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Status</label>
                    <select
                      value={selectedUser.status}
                      onChange={(e) => setSelectedUser({ ...selectedUser, status: e.target.value })}
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="pending">Pending</option>
                    </select>
                  </div>
                </div>
              ) : (
                <div className="user-details">
                  <div className="detail-header">
                    <div className="user-avatar large">{selectedUser.avatar}</div>
                    <div>
                      <h3>{selectedUser.name}</h3>
                      <span className={`role-badge ${selectedUser.role}`}>{selectedUser.role}</span>
                    </div>
                  </div>
                  <div className="detail-grid">
                    <div className="detail-item">
                      <span className="detail-label">Email</span>
                      <span className="detail-value">{selectedUser.email}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Phone</span>
                      <span className="detail-value">{selectedUser.phone}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Status</span>
                      <span className={`status-badge ${selectedUser.status}`}>{selectedUser.status}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Joined</span>
                      <span className="detail-value">{selectedUser.joined}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Total Orders</span>
                      <span className="detail-value">{selectedUser.orders}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Total Spent</span>
                      <span className="detail-value">${selectedUser.spent.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowModal(false)}>
                Cancel
              </button>
              {editMode && (
                <button className="btn-primary" onClick={handleSaveUser}>
                  Save Changes
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
  const [trucks, setTrucks] = useState(mockTrucks);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredTrucks = trucks.filter(truck =>
    truck.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    truck.owner.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="trucks-management">
      <div className="page-header">
        <h1>Food Trucks</h1>
        <button className="btn-primary">
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

      <div className="trucks-grid">
        {filteredTrucks.map((truck) => (
          <div key={truck.id} className="truck-card">
            <div className="truck-card-header">
              <div className="truck-avatar">{truck.name.charAt(0)}</div>
              <div className="truck-info">
                <h3>{truck.name}</h3>
                <span className="truck-cuisine">{truck.cuisine}</span>
              </div>
              <span className={`status-badge ${truck.status}`}>{truck.status}</span>
            </div>
            <div className="truck-card-body">
              <div className="truck-stat">
                <span className="stat-label">Owner</span>
                <span className="stat-value">{truck.owner}</span>
              </div>
              <div className="truck-stat">
                <span className="stat-label">Location</span>
                <span className="stat-value">{truck.location}</span>
              </div>
              <div className="truck-stat">
                <span className="stat-label">Rating</span>
                <span className="stat-value rating">
                  {Icons.star}
                  {truck.rating > 0 ? truck.rating : 'N/A'}
                </span>
              </div>
              <div className="truck-stat">
                <span className="stat-label">Total Orders</span>
                <span className="stat-value">{truck.orders.toLocaleString()}</span>
              </div>
              <div className="truck-stat">
                <span className="stat-label">Revenue</span>
                <span className="stat-value">${truck.revenue.toLocaleString()}</span>
              </div>
            </div>
            <div className="truck-card-footer">
              <button className="btn-secondary btn-sm">View Details</button>
              <button className="btn-primary btn-sm">Edit</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Analytics Component
const AnalyticsPage = () => {
  const revenueData = generateRevenueData();
  const userGrowthData = generateUserGrowthData();
  const categoryData = generateOrdersByCategory();

  const topTrucks = [
    { name: 'Taco Loco', orders: 1234, revenue: 45678, growth: 12.5 },
    { name: 'Burger Bus', orders: 987, revenue: 34567, growth: 8.3 },
    { name: 'Thai Express', orders: 756, revenue: 28934, growth: 15.2 },
    { name: 'Coffee Cart', orders: 2345, revenue: 12345, growth: -2.1 },
    { name: 'Pizza Wheels', orders: 543, revenue: 21098, growth: 5.7 },
  ];

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
          <div className="metric-value">$128,450</div>
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
          <div className="metric-value">3,847</div>
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
          <div className="metric-value">$33.40</div>
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
            <span className="metric-title">Conversion Rate</span>
            <span className="metric-change negative">-1.2%</span>
          </div>
          <div className="metric-value">24.8%</div>
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

      {/* Top Performers */}
      <div className="table-card">
        <div className="table-header">
          <h3>Top Performing Trucks</h3>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Rank</th>
              <th>Food Truck</th>
              <th>Orders</th>
              <th>Revenue</th>
              <th>Growth</th>
            </tr>
          </thead>
          <tbody>
            {topTrucks.map((truck, index) => (
              <tr key={index}>
                <td>
                  <span className="rank-badge">#{index + 1}</span>
                </td>
                <td className="font-medium">{truck.name}</td>
                <td>{truck.orders.toLocaleString()}</td>
                <td>${truck.revenue.toLocaleString()}</td>
                <td>
                  <span className={`growth-badge ${truck.growth >= 0 ? 'positive' : 'negative'}`}>
                    {truck.growth >= 0 ? '+' : ''}{truck.growth}%
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
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

  const handleSave = () => {
    alert('Settings saved successfully!');
  };

  return (
    <div className="settings-page">
      <div className="page-header">
        <h1>Settings</h1>
        <button className="btn-primary" onClick={handleSave}>
          Save Changes
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
              onChange={(e) => setSettings({ ...settings, commissionRate: parseFloat(e.target.value) })}
            />
            <span className="form-hint">0% = No commission on pickup orders</span>
          </div>
          <div className="form-group">
            <label>Default Delivery Fee ($)</label>
            <input
              type="number"
              step="0.01"
              value={settings.deliveryFee}
              onChange={(e) => setSettings({ ...settings, deliveryFee: parseFloat(e.target.value) })}
            />
          </div>
          <div className="form-group">
            <label>Minimum Order Amount ($)</label>
            <input
              type="number"
              value={settings.minOrderAmount}
              onChange={(e) => setSettings({ ...settings, minOrderAmount: parseFloat(e.target.value) })}
            />
          </div>
          <div className="form-group">
            <label>Max Delivery Radius (miles)</label>
            <input
              type="number"
              value={settings.maxDeliveryRadius}
              onChange={(e) => setSettings({ ...settings, maxDeliveryRadius: parseFloat(e.target.value) })}
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
            <button className="btn-danger">Clear All Cache</button>
            <button className="btn-danger">Reset Analytics</button>
            <button className="btn-danger">Delete All Test Data</button>
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
    { id: 'orders', label: 'Orders', icon: Icons.orders },
    { id: 'analytics', label: 'Analytics', icon: Icons.analytics },
    { id: 'settings', label: 'Settings', icon: Icons.settings },
  ];

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <DashboardOverview />;
      case 'users':
        return <UsersManagement />;
      case 'trucks':
        return <TrucksManagement />;
      case 'analytics':
        return <AnalyticsPage />;
      case 'settings':
        return <SettingsPage />;
      default:
        return <DashboardOverview />;
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
