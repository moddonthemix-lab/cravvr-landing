import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../auth/AuthContext';
import { supabase } from '../../lib/supabase';
import './OwnerDashboard.css';

// Icons
const Icons = {
  truck: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>,
  menu: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>,
  orders: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>,
  chart: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>,
  settings: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>,
  plus: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  edit: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  trash: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>,
  star: <svg viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
  dollar: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>,
  users: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  mapPin: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>,
  clock: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  check: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>,
  x: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  chevronLeft: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>,
  image: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>,
  trendingUp: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>,
  eye: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>,
  logout: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
  loader: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="animate-spin"><circle cx="12" cy="12" r="10" strokeOpacity="0.25"/><path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round"/></svg>,
  alertCircle: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>,
};

// Helper to format relative time
const formatRelativeTime = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} min ago`;
  if (diffHours < 24) return `${diffHours} hr ago`;
  return `${diffDays} days ago`;
};

// Sidebar Navigation
const Sidebar = ({ activeTab, setActiveTab, collapsed, setCollapsed, onBack }) => {
  const { profile, signOut } = useAuth();

  const navItems = [
    { id: 'overview', label: 'Overview', icon: Icons.chart },
    { id: 'trucks', label: 'My Trucks', icon: Icons.truck },
    { id: 'menu', label: 'Menu', icon: Icons.menu },
    { id: 'orders', label: 'Orders', icon: Icons.orders },
    { id: 'analytics', label: 'Analytics', icon: Icons.trendingUp },
    { id: 'settings', label: 'Settings', icon: Icons.settings },
  ];

  return (
    <aside className={`owner-sidebar ${collapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-header">
        <button className="back-btn" onClick={onBack}>
          {Icons.chevronLeft}
          {!collapsed && <span>Back to Site</span>}
        </button>
      </div>

      <div className="sidebar-brand">
        <div className="brand-icon">{Icons.truck}</div>
        {!collapsed && <span className="brand-text">Owner Portal</span>}
      </div>

      <nav className="sidebar-nav">
        {navItems.map(item => (
          <button
            key={item.id}
            className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
            onClick={() => setActiveTab(item.id)}
          >
            <span className="nav-icon">{item.icon}</span>
            {!collapsed && <span className="nav-label">{item.label}</span>}
          </button>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="user-info">
          <div className="user-avatar">
            {profile?.name?.charAt(0) || 'O'}
          </div>
          {!collapsed && (
            <div className="user-details">
              <span className="user-name">{profile?.name || 'Owner'}</span>
              <span className="user-role">Truck Owner</span>
            </div>
          )}
        </div>
        <button className="logout-btn" onClick={async () => {
          try {
            await signOut();
          } catch (err) {
            console.error('Logout failed:', err);
          }
        }}>
          {Icons.logout}
          {!collapsed && <span>Log Out</span>}
        </button>
      </div>
    </aside>
  );
};

// Overview Tab
const OverviewTab = ({ setActiveTab, trucks, orders, stats }) => {
  const recentOrders = orders.slice(0, 3);

  return (
    <div className="tab-content">
      <div className="content-header">
        <h1>Welcome back!</h1>
        <p>Here's what's happening with your trucks today.</p>
      </div>

      <div className="stats-grid">
        {stats.map((stat, i) => (
          <div className="stat-card" key={i}>
            <div className="stat-icon" style={{ background: `${stat.color}15`, color: stat.color }}>
              {stat.icon}
            </div>
            <div className="stat-info">
              <span className="stat-value">{stat.value}</span>
              <span className="stat-label">{stat.label}</span>
            </div>
            {stat.change && <span className="stat-change positive">{stat.change}</span>}
          </div>
        ))}
      </div>

      <div className="content-grid">
        <div className="card">
          <div className="card-header">
            <h3>Recent Orders</h3>
            <button className="btn-link" onClick={() => setActiveTab('orders')}>View All</button>
          </div>
          <div className="orders-list">
            {recentOrders.length === 0 ? (
              <p className="empty-state">No orders yet</p>
            ) : (
              recentOrders.map(order => (
                <div className="order-item" key={order.id}>
                  <div className="order-info">
                    <span className="order-id">{order.order_number}</span>
                    <span className="order-customer">{order.customer_name || 'Customer'}</span>
                  </div>
                  <div className="order-details">
                    <span className="order-total">${parseFloat(order.total).toFixed(2)}</span>
                    <span className={`order-status ${order.status}`}>{order.status}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3>Quick Actions</h3>
          </div>
          <div className="quick-actions">
            <button className="action-btn" onClick={() => setActiveTab('trucks')}>
              {Icons.plus}
              <span>Add New Truck</span>
            </button>
            <button className="action-btn" onClick={() => setActiveTab('menu')}>
              {Icons.edit}
              <span>Update Menu</span>
            </button>
            <button className="action-btn" onClick={() => setActiveTab('analytics')}>
              {Icons.chart}
              <span>View Reports</span>
            </button>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3>My Trucks</h3>
          <button className="btn-link" onClick={() => setActiveTab('trucks')}>Manage</button>
        </div>
        <div className="trucks-preview">
          {trucks.length === 0 ? (
            <p className="empty-state">No trucks yet. Add your first truck to get started!</p>
          ) : (
            trucks.map(truck => (
              <div className="truck-preview-card" key={truck.id}>
                <img src={truck.image_url || 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?auto=format&fit=crop&w=400&q=80'} alt={truck.name} />
                <div className="truck-preview-info">
                  <h4>{truck.name}</h4>
                  <span className="truck-cuisine">{truck.cuisine}</span>
                  <div className="truck-stats">
                    <span className="truck-rating">{Icons.star} {truck.average_rating || 'N/A'}</span>
                    <span className="truck-orders">{truck.today_orders || 0} orders today</span>
                  </div>
                </div>
                <span className={`truck-status ${truck.is_open ? 'active' : 'inactive'}`}>
                  {truck.is_open ? 'Open' : 'Closed'}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

// Trucks Management Tab
const TrucksTab = ({ trucks, onTruckCreate, onTruckUpdate, onTruckDelete, loading }) => {
  const [showForm, setShowForm] = useState(false);
  const [editingTruck, setEditingTruck] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    cuisine: '',
    price_range: '$',
    description: '',
    location: '',
    hours: '',
    phone: '',
    image_url: '',
  });

  const resetForm = () => {
    setFormData({
      name: '',
      cuisine: '',
      price_range: '$',
      description: '',
      location: '',
      hours: '',
      phone: '',
      image_url: '',
    });
    setEditingTruck(null);
  };

  const openEditForm = (truck) => {
    setFormData({
      name: truck.name || '',
      cuisine: truck.cuisine || '',
      price_range: truck.price_range || '$',
      description: truck.description || '',
      location: truck.location || '',
      hours: truck.hours || '',
      phone: truck.phone || '',
      image_url: truck.image_url || '',
    });
    setEditingTruck(truck);
    setShowForm(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingTruck) {
        await onTruckUpdate(editingTruck.id, formData);
      } else {
        await onTruckCreate(formData);
      }
      setShowForm(false);
      resetForm();
    } catch (err) {
      console.error('Failed to save truck:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (truckId) => {
    if (!window.confirm('Are you sure you want to delete this truck? This cannot be undone.')) {
      return;
    }
    try {
      await onTruckDelete(truckId);
    } catch (err) {
      console.error('Failed to delete truck:', err);
    }
  };

  return (
    <div className="tab-content">
      <div className="content-header">
        <div>
          <h1>My Trucks</h1>
          <p>Manage your food trucks and their details.</p>
        </div>
        <button className="btn-primary" onClick={() => { resetForm(); setShowForm(true); }}>
          {Icons.plus} Add Truck
        </button>
      </div>

      {showForm && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>{editingTruck ? 'Edit Truck' : 'Add New Truck'}</h2>
              <button className="close-btn" onClick={() => { setShowForm(false); resetForm(); }}>
                {Icons.x}
              </button>
            </div>
            <form onSubmit={handleSave}>
              <div className="form-group">
                <label>Truck Name</label>
                <input
                  type="text"
                  placeholder="Enter truck name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Cuisine Type</label>
                  <select
                    value={formData.cuisine}
                    onChange={(e) => setFormData({ ...formData, cuisine: e.target.value })}
                    required
                  >
                    <option value="">Select cuisine</option>
                    <option value="Mexican">Mexican</option>
                    <option value="American">American</option>
                    <option value="Asian">Asian</option>
                    <option value="Italian">Italian</option>
                    <option value="BBQ">BBQ</option>
                    <option value="Seafood">Seafood</option>
                    <option value="Indian">Indian</option>
                    <option value="Mediterranean">Mediterranean</option>
                    <option value="Fusion">Fusion</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Price Range</label>
                  <select
                    value={formData.price_range}
                    onChange={(e) => setFormData({ ...formData, price_range: e.target.value })}
                  >
                    <option value="$">$ (Budget)</option>
                    <option value="$$">$$ (Moderate)</option>
                    <option value="$$$">$$$ (Premium)</option>
                    <option value="$$$$">$$$$ (Luxury)</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea
                  placeholder="Describe your truck and cuisine..."
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                ></textarea>
              </div>
              <div className="form-group">
                <label>Location</label>
                <input
                  type="text"
                  placeholder="Current location or address"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  required
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Opening Hours</label>
                  <input
                    type="text"
                    placeholder="e.g., 11am - 10pm"
                    value={formData.hours}
                    onChange={(e) => setFormData({ ...formData, hours: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Phone</label>
                  <input
                    type="tel"
                    placeholder="Contact number"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Image URL (optional)</label>
                <input
                  type="url"
                  placeholder="https://example.com/image.jpg"
                  value={formData.image_url}
                  onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                />
              </div>
              <div className="form-actions">
                <button type="button" className="btn-secondary" onClick={() => { setShowForm(false); resetForm(); }}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={saving}>
                  {saving ? 'Saving...' : (editingTruck ? 'Save Changes' : 'Create Truck')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading ? (
        <div className="loading-state">{Icons.loader} Loading trucks...</div>
      ) : (
        <div className="trucks-grid">
          {trucks.map(truck => (
            <div className="truck-card" key={truck.id}>
              <div className="truck-image">
                <img src={truck.image_url || 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?auto=format&fit=crop&w=400&q=80'} alt={truck.name} />
                <span className={`status-badge ${truck.is_open ? 'active' : 'inactive'}`}>
                  {truck.is_open ? 'Open' : 'Closed'}
                </span>
              </div>
              <div className="truck-content">
                <h3>{truck.name}</h3>
                <p className="truck-cuisine">{truck.cuisine}</p>
                <div className="truck-meta">
                  <span>{Icons.star} {truck.average_rating || 'N/A'} ({truck.review_count || 0} reviews)</span>
                </div>
                <div className="truck-stats-row">
                  <div className="mini-stat">
                    <span className="mini-stat-value">{truck.today_orders || 0}</span>
                    <span className="mini-stat-label">Orders</span>
                  </div>
                  <div className="mini-stat">
                    <span className="mini-stat-value">${truck.today_revenue?.toFixed(2) || '0.00'}</span>
                    <span className="mini-stat-label">Revenue</span>
                  </div>
                </div>
              </div>
              <div className="truck-actions">
                <button className="btn-icon" onClick={() => openEditForm(truck)}>
                  {Icons.edit}
                </button>
                <button className="btn-icon danger" onClick={() => handleDelete(truck.id)}>
                  {Icons.trash}
                </button>
              </div>
            </div>
          ))}

          <div className="truck-card add-card" onClick={() => { resetForm(); setShowForm(true); }}>
            <div className="add-card-content">
              {Icons.plus}
              <span>Add New Truck</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Menu Management Tab
const MenuTab = ({ menuItems, trucks, selectedTruckId, onTruckSelect, onMenuItemCreate, onMenuItemUpdate, onMenuItemDelete, loading }) => {
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [activeCategory, setActiveCategory] = useState('all');
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    category: '',
    description: '',
    emoji: '',
  });

  const categories = ['all', ...new Set(menuItems.filter(item => item.category).map(item => item.category))];

  const filteredItems = activeCategory === 'all'
    ? menuItems
    : menuItems.filter(item => item.category === activeCategory);

  const resetForm = () => {
    setFormData({
      name: '',
      price: '',
      category: '',
      description: '',
      emoji: '',
    });
    setEditingItem(null);
  };

  const openEditForm = (item) => {
    setFormData({
      name: item.name || '',
      price: item.price || '',
      category: item.category || '',
      description: item.description || '',
      emoji: item.emoji || '',
    });
    setEditingItem(item);
    setShowForm(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!selectedTruckId) {
      alert('Please select a truck first');
      return;
    }
    setSaving(true);
    try {
      const data = {
        ...formData,
        price: parseFloat(formData.price),
        truck_id: selectedTruckId,
      };
      if (editingItem) {
        await onMenuItemUpdate(editingItem.id, data);
      } else {
        await onMenuItemCreate(data);
      }
      setShowForm(false);
      resetForm();
    } catch (err) {
      console.error('Failed to save menu item:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (itemId) => {
    if (!window.confirm('Are you sure you want to delete this menu item?')) {
      return;
    }
    try {
      await onMenuItemDelete(itemId);
    } catch (err) {
      console.error('Failed to delete menu item:', err);
    }
  };

  const toggleAvailability = async (item) => {
    try {
      await onMenuItemUpdate(item.id, { is_available: !item.is_available });
    } catch (err) {
      console.error('Failed to update availability:', err);
    }
  };

  return (
    <div className="tab-content">
      <div className="content-header">
        <div>
          <h1>Menu Management</h1>
          <p>Add, edit, and manage your menu items.</p>
        </div>
        <div className="header-actions">
          {trucks.length > 0 && (
            <select
              className="truck-select"
              value={selectedTruckId || ''}
              onChange={(e) => onTruckSelect(e.target.value)}
            >
              <option value="">Select a truck</option>
              {trucks.map(truck => (
                <option key={truck.id} value={truck.id}>{truck.name}</option>
              ))}
            </select>
          )}
          <button
            className="btn-primary"
            onClick={() => { resetForm(); setShowForm(true); }}
            disabled={!selectedTruckId}
          >
            {Icons.plus} Add Item
          </button>
        </div>
      </div>

      {!selectedTruckId ? (
        <div className="empty-state-card">
          <p>Please select a truck to manage its menu</p>
        </div>
      ) : (
        <>
          {categories.length > 1 && (
            <div className="category-tabs">
              {categories.map(cat => (
                <button
                  key={cat}
                  className={`category-tab ${activeCategory === cat ? 'active' : ''}`}
                  onClick={() => setActiveCategory(cat)}
                >
                  {cat === 'all' ? 'All Items' : cat}
                </button>
              ))}
            </div>
          )}

          {showForm && (
            <div className="modal-overlay">
              <div className="modal">
                <div className="modal-header">
                  <h2>{editingItem ? 'Edit Menu Item' : 'Add Menu Item'}</h2>
                  <button className="close-btn" onClick={() => { setShowForm(false); resetForm(); }}>
                    {Icons.x}
                  </button>
                </div>
                <form onSubmit={handleSave}>
                  <div className="form-group">
                    <label>Item Name</label>
                    <input
                      type="text"
                      placeholder="Enter item name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Price</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        value={formData.price}
                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Category</label>
                      <select
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      >
                        <option value="">Select category</option>
                        <option value="Appetizers">Appetizers</option>
                        <option value="Mains">Mains</option>
                        <option value="Tacos">Tacos</option>
                        <option value="Burritos">Burritos</option>
                        <option value="Bowls">Bowls</option>
                        <option value="Sides">Sides</option>
                        <option value="Desserts">Desserts</option>
                        <option value="Drinks">Drinks</option>
                        <option value="Specials">Specials</option>
                      </select>
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Description</label>
                      <textarea
                        placeholder="Describe this item..."
                        rows={2}
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      ></textarea>
                    </div>
                    <div className="form-group" style={{ flex: '0 0 80px' }}>
                      <label>Emoji</label>
                      <input
                        type="text"
                        placeholder="🌮"
                        value={formData.emoji}
                        onChange={(e) => setFormData({ ...formData, emoji: e.target.value })}
                        maxLength={4}
                        style={{ textAlign: 'center', fontSize: '1.5rem' }}
                      />
                    </div>
                  </div>
                  <div className="form-actions">
                    <button type="button" className="btn-secondary" onClick={() => { setShowForm(false); resetForm(); }}>
                      Cancel
                    </button>
                    <button type="submit" className="btn-primary" disabled={saving}>
                      {saving ? 'Saving...' : (editingItem ? 'Save Changes' : 'Add Item')}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {loading ? (
            <div className="loading-state">{Icons.loader} Loading menu items...</div>
          ) : filteredItems.length === 0 ? (
            <div className="empty-state-card">
              <p>No menu items yet. Add your first item to get started!</p>
            </div>
          ) : (
            <div className="menu-grid">
              {filteredItems.map(item => (
                <div className={`menu-item-card ${!item.is_available ? 'unavailable' : ''}`} key={item.id}>
                  <div className="menu-item-image">
                    {item.emoji ? (
                      <div className="menu-item-emoji">{item.emoji}</div>
                    ) : (
                      <div className="menu-item-placeholder">{Icons.menu}</div>
                    )}
                  </div>
                  <div className="menu-item-content">
                    <div className="menu-item-header">
                      <h4>{item.name}</h4>
                      <span className="menu-item-price">${parseFloat(item.price).toFixed(2)}</span>
                    </div>
                    {item.category && <span className="menu-item-category">{item.category}</span>}
                    {item.description && <p className="menu-item-desc">{item.description}</p>}
                    <div className="menu-item-actions">
                      <label className="toggle">
                        <input
                          type="checkbox"
                          checked={item.is_available}
                          onChange={() => toggleAvailability(item)}
                        />
                        <span className="toggle-slider"></span>
                        <span className="toggle-label">{item.is_available ? 'Available' : 'Unavailable'}</span>
                      </label>
                      <div className="action-buttons">
                        <button className="btn-icon small" onClick={() => openEditForm(item)}>
                          {Icons.edit}
                        </button>
                        <button className="btn-icon small danger" onClick={() => handleDelete(item.id)}>
                          {Icons.trash}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

// Orders Tab
const OrdersTab = ({ orders, onOrderStatusUpdate, loading }) => {
  const [filter, setFilter] = useState('all');
  const [updating, setUpdating] = useState(null);

  const statusColors = {
    pending: '#6366f1',
    confirmed: '#3b82f6',
    preparing: '#f59e0b',
    ready: '#16a34a',
    completed: '#64748b',
    cancelled: '#ef4444',
  };

  const statusLabels = {
    pending: 'Pending',
    confirmed: 'Confirmed',
    preparing: 'Preparing',
    ready: 'Ready',
    completed: 'Completed',
    cancelled: 'Cancelled',
  };

  const filteredOrders = filter === 'all'
    ? orders
    : orders.filter(o => o.status === filter);

  const updateStatus = async (orderId, newStatus) => {
    setUpdating(orderId);
    try {
      await onOrderStatusUpdate(orderId, newStatus);
    } catch (err) {
      console.error('Failed to update order status:', err);
    } finally {
      setUpdating(null);
    }
  };

  const getNextAction = (status) => {
    switch (status) {
      case 'pending':
        return { label: 'Confirm', next: 'confirmed', style: 'primary' };
      case 'confirmed':
        return { label: 'Start Preparing', next: 'preparing', style: 'primary' };
      case 'preparing':
        return { label: 'Mark Ready', next: 'ready', style: 'success' };
      case 'ready':
        return { label: 'Complete', next: 'completed', style: '' };
      default:
        return null;
    }
  };

  return (
    <div className="tab-content">
      <div className="content-header">
        <div>
          <h1>Orders</h1>
          <p>Manage incoming and past orders.</p>
        </div>
      </div>

      <div className="orders-filters">
        {['all', 'pending', 'confirmed', 'preparing', 'ready', 'completed'].map(status => (
          <button
            key={status}
            className={`filter-btn ${filter === status ? 'active' : ''}`}
            onClick={() => setFilter(status)}
          >
            {status === 'all' ? 'All Orders' : statusLabels[status]}
            {status !== 'all' && (
              <span className="filter-count" style={{ background: statusColors[status] }}>
                {orders.filter(o => o.status === status).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="loading-state">{Icons.loader} Loading orders...</div>
      ) : filteredOrders.length === 0 ? (
        <div className="empty-state-card">
          <p>{filter === 'all' ? 'No orders yet' : `No ${filter} orders`}</p>
        </div>
      ) : (
        <div className="orders-table-wrapper">
          <table className="orders-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Customer</th>
                <th>Items</th>
                <th>Total</th>
                <th>Time</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map(order => {
                const action = getNextAction(order.status);
                return (
                  <tr key={order.id}>
                    <td className="order-id-cell">{order.order_number}</td>
                    <td>{order.customer_name || 'Customer'}</td>
                    <td>{order.item_count || 0} items</td>
                    <td className="order-total-cell">${parseFloat(order.total).toFixed(2)}</td>
                    <td className="order-time-cell">{formatRelativeTime(order.created_at)}</td>
                    <td>
                      <span className="status-pill" style={{ background: `${statusColors[order.status]}20`, color: statusColors[order.status] }}>
                        {statusLabels[order.status] || order.status}
                      </span>
                    </td>
                    <td className="actions-cell">
                      {action ? (
                        <button
                          className={`btn-small ${action.style}`}
                          onClick={() => updateStatus(order.id, action.next)}
                          disabled={updating === order.id}
                        >
                          {updating === order.id ? 'Updating...' : action.label}
                        </button>
                      ) : order.status === 'completed' ? (
                        <button className="btn-small" disabled>Completed</button>
                      ) : order.status === 'cancelled' ? (
                        <button className="btn-small" disabled>Cancelled</button>
                      ) : null}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

// Analytics Tab
const AnalyticsTab = ({ trucks, orders }) => {
  // Calculate weekly data from actual orders
  const getWeeklyData = () => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const weekData = Array(7).fill(null).map((_, i) => ({
      day: days[i],
      orders: 0,
      revenue: 0,
    }));

    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    orders.forEach(order => {
      const orderDate = new Date(order.created_at);
      if (orderDate >= weekAgo) {
        const dayIndex = orderDate.getDay();
        weekData[dayIndex].orders += 1;
        weekData[dayIndex].revenue += parseFloat(order.total || 0);
      }
    });

    // Reorder to start from Monday
    return [...weekData.slice(1), weekData[0]];
  };

  const weeklyData = getWeeklyData();
  const maxRevenue = Math.max(...weeklyData.map(d => d.revenue), 1);
  const totalWeeklyRevenue = weeklyData.reduce((sum, d) => sum + d.revenue, 0);
  const totalWeeklyOrders = weeklyData.reduce((sum, d) => sum + d.orders, 0);

  // Calculate average order value
  const avgOrderValue = orders.length > 0
    ? orders.reduce((sum, o) => sum + parseFloat(o.total || 0), 0) / orders.length
    : 0;

  // Calculate orders per day (last 30 days)
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const recentOrders = orders.filter(o => new Date(o.created_at) >= thirtyDaysAgo);
  const ordersPerDay = recentOrders.length > 0 ? (recentOrders.length / 30).toFixed(1) : 0;

  // Find best performing truck
  const bestTruck = trucks.reduce((best, truck) => {
    if (!best || (truck.today_revenue || 0) > (best.today_revenue || 0)) return truck;
    return best;
  }, null);

  return (
    <div className="tab-content">
      <div className="content-header">
        <div>
          <h1>Analytics</h1>
          <p>Track your performance and insights.</p>
        </div>
        <select className="period-select">
          <option>This Week</option>
          <option>This Month</option>
          <option>Last 30 Days</option>
          <option>This Year</option>
        </select>
      </div>

      <div className="analytics-grid">
        <div className="card chart-card">
          <div className="card-header">
            <h3>Weekly Revenue</h3>
            <span className="chart-total">${totalWeeklyRevenue.toFixed(0)} total</span>
          </div>
          <div className="bar-chart">
            {weeklyData.map((d, i) => (
              <div className="bar-group" key={i}>
                <div
                  className="bar"
                  style={{ height: `${maxRevenue > 0 ? (d.revenue / maxRevenue) * 100 : 0}%` }}
                >
                  <span className="bar-value">${d.revenue.toFixed(0)}</span>
                </div>
                <span className="bar-label">{d.day}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3>Truck Performance</h3>
          </div>
          <div className="top-items-list">
            {trucks.length === 0 ? (
              <p className="empty-state">No trucks yet</p>
            ) : (
              trucks.map((truck, i) => (
                <div className="top-item" key={truck.id}>
                  <span className="top-item-rank">#{i + 1}</span>
                  <div className="top-item-info">
                    <span className="top-item-name">{truck.name}</span>
                    <span className="top-item-orders">{truck.today_orders || 0} orders today</span>
                  </div>
                  <span className="top-item-revenue">${(truck.today_revenue || 0).toFixed(0)}</span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3>Performance Metrics</h3>
          </div>
          <div className="metrics-list">
            <div className="metric-item">
              <span className="metric-label">Average Order Value</span>
              <span className="metric-value">${avgOrderValue.toFixed(2)}</span>
            </div>
            <div className="metric-item">
              <span className="metric-label">Orders Per Day (30d avg)</span>
              <span className="metric-value">{ordersPerDay}</span>
            </div>
            <div className="metric-item">
              <span className="metric-label">This Week Orders</span>
              <span className="metric-value">{totalWeeklyOrders}</span>
            </div>
            <div className="metric-item">
              <span className="metric-label">Active Trucks</span>
              <span className="metric-value">{trucks.filter(t => t.is_open).length}/{trucks.length}</span>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3>Insights</h3>
          </div>
          <div className="insights-list">
            <div className="insight-item">
              <div className="insight-icon peak">{Icons.chart}</div>
              <div className="insight-content">
                <span className="insight-title">Total Orders</span>
                <span className="insight-value">{orders.length} all time</span>
              </div>
            </div>
            {bestTruck && (
              <div className="insight-item">
                <div className="insight-icon location">{Icons.truck}</div>
                <div className="insight-content">
                  <span className="insight-title">Best Performer Today</span>
                  <span className="insight-value">{bestTruck.name}</span>
                </div>
              </div>
            )}
            <div className="insight-item">
              <div className="insight-icon rating">{Icons.star}</div>
              <div className="insight-content">
                <span className="insight-title">Average Rating</span>
                <span className="insight-value">
                  {trucks.filter(t => t.average_rating).length > 0
                    ? (trucks.filter(t => t.average_rating).reduce((sum, t) => sum + parseFloat(t.average_rating), 0) / trucks.filter(t => t.average_rating).length).toFixed(1)
                    : 'N/A'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Settings Tab
const SettingsTab = () => {
  const { profile, updateProfile } = useAuth();
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    // Save settings
    setTimeout(() => setSaving(false), 1000);
  };

  return (
    <div className="tab-content">
      <div className="content-header">
        <div>
          <h1>Settings</h1>
          <p>Manage your account and preferences.</p>
        </div>
      </div>

      <div className="settings-grid">
        <div className="card">
          <div className="card-header">
            <h3>Profile Information</h3>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Full Name</label>
              <input type="text" defaultValue={profile?.name} />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input type="email" defaultValue={profile?.email} disabled />
            </div>
            <div className="form-group">
              <label>Phone</label>
              <input type="tel" placeholder="Enter phone number" />
            </div>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        </div>

        <div className="card">
          <div className="card-header">
            <h3>Business Information</h3>
          </div>
          <form>
            <div className="form-group">
              <label>Business Name</label>
              <input type="text" placeholder="Your business name" />
            </div>
            <div className="form-group">
              <label>Tax ID (EIN)</label>
              <input type="text" placeholder="XX-XXXXXXX" />
            </div>
            <div className="form-group">
              <label>Business Address</label>
              <textarea placeholder="Enter business address" rows={2}></textarea>
            </div>
            <button type="submit" className="btn-primary">Save Changes</button>
          </form>
        </div>

        <div className="card">
          <div className="card-header">
            <h3>Notifications</h3>
          </div>
          <div className="settings-options">
            <label className="setting-option">
              <input type="checkbox" defaultChecked />
              <span className="option-info">
                <span className="option-title">New Order Alerts</span>
                <span className="option-desc">Get notified when you receive a new order</span>
              </span>
            </label>
            <label className="setting-option">
              <input type="checkbox" defaultChecked />
              <span className="option-info">
                <span className="option-title">Daily Summary</span>
                <span className="option-desc">Receive daily sales summary email</span>
              </span>
            </label>
            <label className="setting-option">
              <input type="checkbox" />
              <span className="option-info">
                <span className="option-title">Marketing Emails</span>
                <span className="option-desc">Tips and updates from Cravrr</span>
              </span>
            </label>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3>Subscription</h3>
          </div>
          <div className="subscription-info">
            <div className="current-plan">
              <span className="plan-badge free">Free Plan</span>
              <p>You're on the free plan with basic features.</p>
            </div>
            <button className="btn-primary upgrade-btn">
              {Icons.trendingUp} Upgrade to Pro
            </button>
            <ul className="pro-features">
              <li>{Icons.check} Priority support</li>
              <li>{Icons.check} Advanced analytics</li>
              <li>{Icons.check} Multiple truck management</li>
              <li>{Icons.check} Custom branding</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

// Main Owner Dashboard Component
const OwnerDashboard = ({ onBack }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { user, profile, loading: authLoading } = useAuth();

  // Data state
  const [trucks, setTrucks] = useState([]);
  const [orders, setOrders] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [selectedTruckId, setSelectedTruckId] = useState(null);

  // Loading states
  const [loadingTrucks, setLoadingTrucks] = useState(true);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [loadingMenu, setLoadingMenu] = useState(false);

  // Error state
  const [error, setError] = useState(null);

  // Fetch trucks for this owner
  const fetchTrucks = useCallback(async () => {
    if (!user?.id) return;
    setLoadingTrucks(true);
    try {
      // Get trucks owned by this user
      const { data: trucksData, error: trucksError } = await supabase
        .from('food_trucks')
        .select('*')
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false });

      if (trucksError) throw trucksError;

      // For each truck, get its rating and today's orders
      const trucksWithStats = await Promise.all((trucksData || []).map(async (truck) => {
        // Get average rating
        const { data: ratingData } = await supabase
          .from('truck_ratings_summary')
          .select('average_rating, review_count')
          .eq('truck_id', truck.id)
          .single();

        // Get today's orders
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const { data: todayOrders } = await supabase
          .from('orders')
          .select('total')
          .eq('truck_id', truck.id)
          .gte('created_at', today.toISOString());

        const todayRevenue = (todayOrders || []).reduce((sum, o) => sum + parseFloat(o.total || 0), 0);

        return {
          ...truck,
          average_rating: ratingData?.average_rating || null,
          review_count: ratingData?.review_count || 0,
          today_orders: todayOrders?.length || 0,
          today_revenue: todayRevenue,
        };
      }));

      setTrucks(trucksWithStats);

      // Auto-select first truck if none selected
      if (trucksWithStats.length > 0 && !selectedTruckId) {
        setSelectedTruckId(trucksWithStats[0].id);
      }
    } catch (err) {
      console.error('Error fetching trucks:', err);
      setError('Failed to load trucks');
    } finally {
      setLoadingTrucks(false);
    }
  }, [user?.id, selectedTruckId]);

  // Fetch orders for owner's trucks
  const fetchOrders = useCallback(async () => {
    if (!user?.id || trucks.length === 0) {
      setLoadingOrders(false);
      return;
    }
    setLoadingOrders(true);
    try {
      const truckIds = trucks.map(t => t.id);

      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select(`
          *,
          order_items(count),
          profiles:customer_id(name)
        `)
        .in('truck_id', truckIds)
        .order('created_at', { ascending: false })
        .limit(100);

      if (ordersError) throw ordersError;

      const formattedOrders = (ordersData || []).map(order => ({
        ...order,
        customer_name: order.profiles?.name || 'Customer',
        item_count: order.order_items?.[0]?.count || 0,
      }));

      setOrders(formattedOrders);
    } catch (err) {
      console.error('Error fetching orders:', err);
      setError('Failed to load orders');
    } finally {
      setLoadingOrders(false);
    }
  }, [user?.id, trucks]);

  // Fetch menu items for selected truck
  const fetchMenuItems = useCallback(async () => {
    if (!selectedTruckId) {
      setMenuItems([]);
      return;
    }
    setLoadingMenu(true);
    try {
      const { data, error: menuError } = await supabase
        .from('menu_items')
        .select('*')
        .eq('truck_id', selectedTruckId)
        .order('display_order', { ascending: true });

      if (menuError) throw menuError;
      setMenuItems(data || []);
    } catch (err) {
      console.error('Error fetching menu items:', err);
      setError('Failed to load menu items');
    } finally {
      setLoadingMenu(false);
    }
  }, [selectedTruckId]);

  // Initial data fetch
  useEffect(() => {
    if (user?.id) {
      fetchTrucks();
    }
  }, [user?.id, fetchTrucks]);

  // Fetch orders when trucks are loaded
  useEffect(() => {
    if (trucks.length > 0) {
      fetchOrders();
    }
  }, [trucks.length, fetchOrders]);

  // Fetch menu items when selected truck changes
  useEffect(() => {
    fetchMenuItems();
  }, [selectedTruckId, fetchMenuItems]);

  // CRUD operations for trucks
  const handleTruckCreate = async (truckData) => {
    const slug = truckData.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    const { data, error } = await supabase
      .from('food_trucks')
      .insert([{
        ...truckData,
        owner_id: user.id,
        slug: `${slug}-${Date.now()}`,
        is_open: true,
      }])
      .select()
      .single();

    if (error) throw error;
    setTrucks(prev => [{ ...data, today_orders: 0, today_revenue: 0 }, ...prev]);
    if (!selectedTruckId) setSelectedTruckId(data.id);
  };

  const handleTruckUpdate = async (truckId, updates) => {
    const { error } = await supabase
      .from('food_trucks')
      .update(updates)
      .eq('id', truckId);

    if (error) throw error;
    setTrucks(prev => prev.map(t => t.id === truckId ? { ...t, ...updates } : t));
  };

  const handleTruckDelete = async (truckId) => {
    const { error } = await supabase
      .from('food_trucks')
      .delete()
      .eq('id', truckId);

    if (error) throw error;
    setTrucks(prev => prev.filter(t => t.id !== truckId));
    if (selectedTruckId === truckId) {
      const remaining = trucks.filter(t => t.id !== truckId);
      setSelectedTruckId(remaining.length > 0 ? remaining[0].id : null);
    }
  };

  // CRUD operations for menu items
  const handleMenuItemCreate = async (itemData) => {
    const { data, error } = await supabase
      .from('menu_items')
      .insert([{
        ...itemData,
        is_available: true,
      }])
      .select()
      .single();

    if (error) throw error;
    setMenuItems(prev => [...prev, data]);
  };

  const handleMenuItemUpdate = async (itemId, updates) => {
    const { error } = await supabase
      .from('menu_items')
      .update(updates)
      .eq('id', itemId);

    if (error) throw error;
    setMenuItems(prev => prev.map(item => item.id === itemId ? { ...item, ...updates } : item));
  };

  const handleMenuItemDelete = async (itemId) => {
    const { error } = await supabase
      .from('menu_items')
      .delete()
      .eq('id', itemId);

    if (error) throw error;
    setMenuItems(prev => prev.filter(item => item.id !== itemId));
  };

  // Order status update
  const handleOrderStatusUpdate = async (orderId, newStatus) => {
    const updates = { status: newStatus };
    if (newStatus === 'completed') {
      updates.completed_at = new Date().toISOString();
    }

    const { error } = await supabase
      .from('orders')
      .update(updates)
      .eq('id', orderId);

    if (error) throw error;
    setOrders(prev => prev.map(order =>
      order.id === orderId ? { ...order, ...updates } : order
    ));
  };

  // Calculate stats for overview
  const calculateStats = () => {
    const todayOrders = trucks.reduce((sum, t) => sum + (t.today_orders || 0), 0);
    const todayRevenue = trucks.reduce((sum, t) => sum + (t.today_revenue || 0), 0);
    const avgRating = trucks.length > 0
      ? trucks.filter(t => t.average_rating).reduce((sum, t) => sum + parseFloat(t.average_rating), 0) / trucks.filter(t => t.average_rating).length
      : 0;
    const totalCustomers = orders.length; // Simplified - could be unique customers

    return [
      { label: "Today's Orders", value: todayOrders.toString(), icon: Icons.orders, color: '#e11d48' },
      { label: "Today's Revenue", value: `$${todayRevenue.toFixed(0)}`, icon: Icons.dollar, color: '#16a34a' },
      { label: 'Avg Rating', value: avgRating ? avgRating.toFixed(1) : 'N/A', icon: Icons.star, color: '#f59e0b' },
      { label: 'Total Orders', value: orders.length.toString(), icon: Icons.users, color: '#3b82f6' },
    ];
  };

  if (authLoading) {
    return (
      <div className="owner-loading">
        <div className="loading-spinner"></div>
        <p>Loading your dashboard...</p>
      </div>
    );
  }

  const renderTab = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <OverviewTab
            setActiveTab={setActiveTab}
            trucks={trucks}
            orders={orders}
            stats={calculateStats()}
          />
        );
      case 'trucks':
        return (
          <TrucksTab
            trucks={trucks}
            onTruckCreate={handleTruckCreate}
            onTruckUpdate={handleTruckUpdate}
            onTruckDelete={handleTruckDelete}
            loading={loadingTrucks}
          />
        );
      case 'menu':
        return (
          <MenuTab
            menuItems={menuItems}
            trucks={trucks}
            selectedTruckId={selectedTruckId}
            onTruckSelect={setSelectedTruckId}
            onMenuItemCreate={handleMenuItemCreate}
            onMenuItemUpdate={handleMenuItemUpdate}
            onMenuItemDelete={handleMenuItemDelete}
            loading={loadingMenu}
          />
        );
      case 'orders':
        return (
          <OrdersTab
            orders={orders}
            onOrderStatusUpdate={handleOrderStatusUpdate}
            loading={loadingOrders}
          />
        );
      case 'analytics':
        return <AnalyticsTab trucks={trucks} orders={orders} />;
      case 'settings':
        return <SettingsTab />;
      default:
        return (
          <OverviewTab
            setActiveTab={setActiveTab}
            trucks={trucks}
            orders={orders}
            stats={calculateStats()}
          />
        );
    }
  };

  return (
    <div className="owner-dashboard">
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        collapsed={sidebarCollapsed}
        setCollapsed={setSidebarCollapsed}
        onBack={onBack}
      />
      <main className="owner-main">
        {error && (
          <div className="error-banner">
            {Icons.alertCircle} {error}
            <button onClick={() => setError(null)}>{Icons.x}</button>
          </div>
        )}
        {renderTab()}
      </main>
    </div>
  );
};

export default OwnerDashboard;
