import React, { useState, useEffect } from 'react';
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
};

// Mock data for demo
const mockTrucks = [
  {
    id: 1,
    name: "Taco Loco",
    cuisine: "Mexican",
    status: "active",
    rating: 4.8,
    reviewCount: 328,
    todayOrders: 47,
    todayRevenue: 892.50,
    image: "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?auto=format&fit=crop&w=400&q=80"
  }
];

const mockOrders = [
  { id: 'ORD-001', customer: 'John D.', items: 3, total: 34.99, status: 'preparing', time: '2 min ago' },
  { id: 'ORD-002', customer: 'Sarah M.', items: 2, total: 22.50, status: 'ready', time: '5 min ago' },
  { id: 'ORD-003', customer: 'Mike R.', items: 5, total: 67.25, status: 'completed', time: '12 min ago' },
  { id: 'ORD-004', customer: 'Emily K.', items: 1, total: 12.99, status: 'new', time: 'Just now' },
];

const mockMenuItems = [
  { id: 1, name: 'Street Tacos (3)', price: 12.99, category: 'Tacos', available: true, image: 'https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?auto=format&fit=crop&w=200&q=80' },
  { id: 2, name: 'Loaded Nachos', price: 14.99, category: 'Appetizers', available: true, image: 'https://images.unsplash.com/photo-1513456852971-30c0b8199d4d?auto=format&fit=crop&w=200&q=80' },
  { id: 3, name: 'Burrito Supreme', price: 13.99, category: 'Burritos', available: false, image: 'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?auto=format&fit=crop&w=200&q=80' },
  { id: 4, name: 'Quesadilla', price: 10.99, category: 'Specials', available: true, image: 'https://images.unsplash.com/photo-1618040996337-56904b7850b9?auto=format&fit=crop&w=200&q=80' },
];

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
const OverviewTab = ({ setActiveTab }) => {
  const stats = [
    { label: "Today's Orders", value: '47', change: '+12%', icon: Icons.orders, color: '#e11d48' },
    { label: "Today's Revenue", value: '$892', change: '+8%', icon: Icons.dollar, color: '#16a34a' },
    { label: 'Avg Rating', value: '4.8', change: '+0.2', icon: Icons.star, color: '#f59e0b' },
    { label: 'Customers', value: '2.1K', change: '+156', icon: Icons.users, color: '#3b82f6' },
  ];

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
            <span className="stat-change positive">{stat.change}</span>
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
            {mockOrders.slice(0, 3).map(order => (
              <div className="order-item" key={order.id}>
                <div className="order-info">
                  <span className="order-id">{order.id}</span>
                  <span className="order-customer">{order.customer}</span>
                </div>
                <div className="order-details">
                  <span className="order-total">${order.total.toFixed(2)}</span>
                  <span className={`order-status ${order.status}`}>{order.status}</span>
                </div>
              </div>
            ))}
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
          {mockTrucks.map(truck => (
            <div className="truck-preview-card" key={truck.id}>
              <img src={truck.image} alt={truck.name} />
              <div className="truck-preview-info">
                <h4>{truck.name}</h4>
                <span className="truck-cuisine">{truck.cuisine}</span>
                <div className="truck-stats">
                  <span className="truck-rating">{Icons.star} {truck.rating}</span>
                  <span className="truck-orders">{truck.todayOrders} orders today</span>
                </div>
              </div>
              <span className={`truck-status ${truck.status}`}>{truck.status}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Trucks Management Tab
const TrucksTab = () => {
  const [showForm, setShowForm] = useState(false);
  const [trucks, setTrucks] = useState(mockTrucks);
  const [editingTruck, setEditingTruck] = useState(null);

  const handleSave = (e) => {
    e.preventDefault();
    // Save truck logic here
    setShowForm(false);
    setEditingTruck(null);
  };

  return (
    <div className="tab-content">
      <div className="content-header">
        <div>
          <h1>My Trucks</h1>
          <p>Manage your food trucks and their details.</p>
        </div>
        <button className="btn-primary" onClick={() => setShowForm(true)}>
          {Icons.plus} Add Truck
        </button>
      </div>

      {showForm && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>{editingTruck ? 'Edit Truck' : 'Add New Truck'}</h2>
              <button className="close-btn" onClick={() => { setShowForm(false); setEditingTruck(null); }}>
                {Icons.x}
              </button>
            </div>
            <form onSubmit={handleSave}>
              <div className="form-group">
                <label>Truck Name</label>
                <input type="text" placeholder="Enter truck name" defaultValue={editingTruck?.name} required />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Cuisine Type</label>
                  <select defaultValue={editingTruck?.cuisine || ''}>
                    <option value="">Select cuisine</option>
                    <option value="Mexican">Mexican</option>
                    <option value="American">American</option>
                    <option value="Asian">Asian</option>
                    <option value="Italian">Italian</option>
                    <option value="BBQ">BBQ</option>
                    <option value="Seafood">Seafood</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Price Range</label>
                  <select>
                    <option value="$">$ (Budget)</option>
                    <option value="$$">$$ (Moderate)</option>
                    <option value="$$$">$$$ (Premium)</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea placeholder="Describe your truck and cuisine..." rows={3}></textarea>
              </div>
              <div className="form-group">
                <label>Location</label>
                <input type="text" placeholder="Current location or address" />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Opening Hours</label>
                  <input type="text" placeholder="e.g., 11am - 10pm" />
                </div>
                <div className="form-group">
                  <label>Phone</label>
                  <input type="tel" placeholder="Contact number" />
                </div>
              </div>
              <div className="form-group">
                <label>Truck Image</label>
                <div className="image-upload">
                  {Icons.image}
                  <span>Click to upload or drag and drop</span>
                  <input type="file" accept="image/*" />
                </div>
              </div>
              <div className="form-actions">
                <button type="button" className="btn-secondary" onClick={() => { setShowForm(false); setEditingTruck(null); }}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  {editingTruck ? 'Save Changes' : 'Create Truck'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="trucks-grid">
        {trucks.map(truck => (
          <div className="truck-card" key={truck.id}>
            <div className="truck-image">
              <img src={truck.image} alt={truck.name} />
              <span className={`status-badge ${truck.status}`}>{truck.status}</span>
            </div>
            <div className="truck-content">
              <h3>{truck.name}</h3>
              <p className="truck-cuisine">{truck.cuisine}</p>
              <div className="truck-meta">
                <span>{Icons.star} {truck.rating} ({truck.reviewCount} reviews)</span>
              </div>
              <div className="truck-stats-row">
                <div className="mini-stat">
                  <span className="mini-stat-value">{truck.todayOrders}</span>
                  <span className="mini-stat-label">Orders</span>
                </div>
                <div className="mini-stat">
                  <span className="mini-stat-value">${truck.todayRevenue}</span>
                  <span className="mini-stat-label">Revenue</span>
                </div>
              </div>
            </div>
            <div className="truck-actions">
              <button className="btn-icon" onClick={() => { setEditingTruck(truck); setShowForm(true); }}>
                {Icons.edit}
              </button>
              <button className="btn-icon danger">
                {Icons.trash}
              </button>
            </div>
          </div>
        ))}

        <div className="truck-card add-card" onClick={() => setShowForm(true)}>
          <div className="add-card-content">
            {Icons.plus}
            <span>Add New Truck</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// Menu Management Tab
const MenuTab = () => {
  const [items, setItems] = useState(mockMenuItems);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [activeCategory, setActiveCategory] = useState('all');

  const categories = ['all', ...new Set(mockMenuItems.map(item => item.category))];

  const filteredItems = activeCategory === 'all'
    ? items
    : items.filter(item => item.category === activeCategory);

  const toggleAvailability = (id) => {
    setItems(items.map(item =>
      item.id === id ? { ...item, available: !item.available } : item
    ));
  };

  return (
    <div className="tab-content">
      <div className="content-header">
        <div>
          <h1>Menu Management</h1>
          <p>Add, edit, and manage your menu items.</p>
        </div>
        <button className="btn-primary" onClick={() => setShowForm(true)}>
          {Icons.plus} Add Item
        </button>
      </div>

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

      {showForm && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>{editingItem ? 'Edit Menu Item' : 'Add Menu Item'}</h2>
              <button className="close-btn" onClick={() => { setShowForm(false); setEditingItem(null); }}>
                {Icons.x}
              </button>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); setShowForm(false); setEditingItem(null); }}>
              <div className="form-group">
                <label>Item Name</label>
                <input type="text" placeholder="Enter item name" defaultValue={editingItem?.name} required />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Price</label>
                  <input type="number" step="0.01" placeholder="0.00" defaultValue={editingItem?.price} required />
                </div>
                <div className="form-group">
                  <label>Category</label>
                  <select defaultValue={editingItem?.category || ''}>
                    <option value="">Select category</option>
                    <option value="Tacos">Tacos</option>
                    <option value="Burritos">Burritos</option>
                    <option value="Appetizers">Appetizers</option>
                    <option value="Specials">Specials</option>
                    <option value="Drinks">Drinks</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea placeholder="Describe this item..." rows={2}></textarea>
              </div>
              <div className="form-group">
                <label>Item Image</label>
                <div className="image-upload">
                  {Icons.image}
                  <span>Click to upload or drag and drop</span>
                  <input type="file" accept="image/*" />
                </div>
              </div>
              <div className="form-actions">
                <button type="button" className="btn-secondary" onClick={() => { setShowForm(false); setEditingItem(null); }}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  {editingItem ? 'Save Changes' : 'Add Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="menu-grid">
        {filteredItems.map(item => (
          <div className={`menu-item-card ${!item.available ? 'unavailable' : ''}`} key={item.id}>
            <div className="menu-item-image">
              <img src={item.image} alt={item.name} />
            </div>
            <div className="menu-item-content">
              <div className="menu-item-header">
                <h4>{item.name}</h4>
                <span className="menu-item-price">${item.price.toFixed(2)}</span>
              </div>
              <span className="menu-item-category">{item.category}</span>
              <div className="menu-item-actions">
                <label className="toggle">
                  <input
                    type="checkbox"
                    checked={item.available}
                    onChange={() => toggleAvailability(item.id)}
                  />
                  <span className="toggle-slider"></span>
                  <span className="toggle-label">{item.available ? 'Available' : 'Unavailable'}</span>
                </label>
                <div className="action-buttons">
                  <button className="btn-icon small" onClick={() => { setEditingItem(item); setShowForm(true); }}>
                    {Icons.edit}
                  </button>
                  <button className="btn-icon small danger">
                    {Icons.trash}
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Orders Tab
const OrdersTab = () => {
  const [orders, setOrders] = useState(mockOrders);
  const [filter, setFilter] = useState('all');

  const statusColors = {
    new: '#3b82f6',
    preparing: '#f59e0b',
    ready: '#16a34a',
    completed: '#64748b',
  };

  const filteredOrders = filter === 'all'
    ? orders
    : orders.filter(o => o.status === filter);

  const updateStatus = (orderId, newStatus) => {
    setOrders(orders.map(o =>
      o.id === orderId ? { ...o, status: newStatus } : o
    ));
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
        {['all', 'new', 'preparing', 'ready', 'completed'].map(status => (
          <button
            key={status}
            className={`filter-btn ${filter === status ? 'active' : ''}`}
            onClick={() => setFilter(status)}
          >
            {status === 'all' ? 'All Orders' : status.charAt(0).toUpperCase() + status.slice(1)}
            {status !== 'all' && (
              <span className="filter-count" style={{ background: statusColors[status] }}>
                {orders.filter(o => o.status === status).length}
              </span>
            )}
          </button>
        ))}
      </div>

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
            {filteredOrders.map(order => (
              <tr key={order.id}>
                <td className="order-id-cell">{order.id}</td>
                <td>{order.customer}</td>
                <td>{order.items} items</td>
                <td className="order-total-cell">${order.total.toFixed(2)}</td>
                <td className="order-time-cell">{order.time}</td>
                <td>
                  <span className="status-pill" style={{ background: `${statusColors[order.status]}20`, color: statusColors[order.status] }}>
                    {order.status}
                  </span>
                </td>
                <td className="actions-cell">
                  {order.status === 'new' && (
                    <button className="btn-small primary" onClick={() => updateStatus(order.id, 'preparing')}>
                      Start Preparing
                    </button>
                  )}
                  {order.status === 'preparing' && (
                    <button className="btn-small success" onClick={() => updateStatus(order.id, 'ready')}>
                      Mark Ready
                    </button>
                  )}
                  {order.status === 'ready' && (
                    <button className="btn-small" onClick={() => updateStatus(order.id, 'completed')}>
                      Complete
                    </button>
                  )}
                  {order.status === 'completed' && (
                    <button className="btn-small" disabled>Completed</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// Analytics Tab
const AnalyticsTab = () => {
  const weeklyData = [
    { day: 'Mon', orders: 45, revenue: 856 },
    { day: 'Tue', orders: 52, revenue: 978 },
    { day: 'Wed', orders: 49, revenue: 912 },
    { day: 'Thu', orders: 63, revenue: 1205 },
    { day: 'Fri', orders: 78, revenue: 1489 },
    { day: 'Sat', orders: 92, revenue: 1756 },
    { day: 'Sun', orders: 67, revenue: 1287 },
  ];

  const maxRevenue = Math.max(...weeklyData.map(d => d.revenue));
  const topItems = [
    { name: 'Street Tacos (3)', orders: 156, revenue: 2023 },
    { name: 'Burrito Supreme', orders: 98, revenue: 1371 },
    { name: 'Loaded Nachos', orders: 87, revenue: 1304 },
    { name: 'Quesadilla', orders: 72, revenue: 791 },
  ];

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
            <span className="chart-total">$8,483 total</span>
          </div>
          <div className="bar-chart">
            {weeklyData.map((d, i) => (
              <div className="bar-group" key={i}>
                <div
                  className="bar"
                  style={{ height: `${(d.revenue / maxRevenue) * 100}%` }}
                >
                  <span className="bar-value">${d.revenue}</span>
                </div>
                <span className="bar-label">{d.day}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3>Top Selling Items</h3>
          </div>
          <div className="top-items-list">
            {topItems.map((item, i) => (
              <div className="top-item" key={i}>
                <span className="top-item-rank">#{i + 1}</span>
                <div className="top-item-info">
                  <span className="top-item-name">{item.name}</span>
                  <span className="top-item-orders">{item.orders} orders</span>
                </div>
                <span className="top-item-revenue">${item.revenue}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3>Performance Metrics</h3>
          </div>
          <div className="metrics-list">
            <div className="metric-item">
              <span className="metric-label">Average Order Value</span>
              <span className="metric-value">$18.75</span>
            </div>
            <div className="metric-item">
              <span className="metric-label">Orders Per Day</span>
              <span className="metric-value">63</span>
            </div>
            <div className="metric-item">
              <span className="metric-label">Repeat Customers</span>
              <span className="metric-value">34%</span>
            </div>
            <div className="metric-item">
              <span className="metric-label">Avg Preparation Time</span>
              <span className="metric-value">12 min</span>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3>Customer Insights</h3>
          </div>
          <div className="insights-list">
            <div className="insight-item">
              <div className="insight-icon peak">{Icons.clock}</div>
              <div className="insight-content">
                <span className="insight-title">Peak Hours</span>
                <span className="insight-value">12pm - 2pm, 6pm - 8pm</span>
              </div>
            </div>
            <div className="insight-item">
              <div className="insight-icon location">{Icons.mapPin}</div>
              <div className="insight-content">
                <span className="insight-title">Best Location</span>
                <span className="insight-value">Downtown Portland</span>
              </div>
            </div>
            <div className="insight-item">
              <div className="insight-icon rating">{Icons.star}</div>
              <div className="insight-content">
                <span className="insight-title">Top Rated Item</span>
                <span className="insight-value">Street Tacos (4.9)</span>
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
  const { profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="owner-loading">
        <div className="loading-spinner"></div>
        <p>Loading your dashboard...</p>
      </div>
    );
  }

  const renderTab = () => {
    switch (activeTab) {
      case 'overview': return <OverviewTab setActiveTab={setActiveTab} />;
      case 'trucks': return <TrucksTab />;
      case 'menu': return <MenuTab />;
      case 'orders': return <OrdersTab />;
      case 'analytics': return <AnalyticsTab />;
      case 'settings': return <SettingsTab />;
      default: return <OverviewTab setActiveTab={setActiveTab} />;
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
        {renderTab()}
      </main>
    </div>
  );
};

export default OwnerDashboard;
