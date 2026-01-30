import React, { useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import './CustomerProfile.css';

// Icons
const Icons = {
  user: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  orders: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>,
  heart: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>,
  heartFilled: <svg viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>,
  gift: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/><line x1="12" y1="22" x2="12" y2="7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/></svg>,
  settings: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>,
  mapPin: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>,
  creditCard: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>,
  bell: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>,
  star: <svg viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
  clock: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  truck: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>,
  check: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>,
  chevronRight: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>,
  chevronLeft: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>,
  x: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  plus: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  edit: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  logout: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
  help: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
  shield: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  repeat: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>,
};

// Mock data
const mockOrders = [
  {
    id: 'ORD-2024-001',
    truck: 'Taco Loco',
    truckImage: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?auto=format&fit=crop&w=100&q=80',
    items: ['Street Tacos (3)', 'Loaded Nachos'],
    total: 27.98,
    status: 'delivered',
    date: 'Jan 15, 2025',
    rating: 5,
  },
  {
    id: 'ORD-2024-002',
    truck: 'Burger Joint',
    truckImage: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=100&q=80',
    items: ['Classic Smash', 'Truffle Fries', 'Milkshake'],
    total: 32.47,
    status: 'delivered',
    date: 'Jan 12, 2025',
    rating: 4,
  },
  {
    id: 'ORD-2024-003',
    truck: 'Thai Street',
    truckImage: 'https://images.unsplash.com/photo-1559314809-0d155014e29e?auto=format&fit=crop&w=100&q=80',
    items: ['Pad Thai', 'Green Curry'],
    total: 28.98,
    status: 'preparing',
    date: 'Today',
    rating: null,
  },
];

const mockFavorites = [
  {
    id: 1,
    name: 'Taco Loco',
    cuisine: 'Mexican',
    rating: 4.8,
    image: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?auto=format&fit=crop&w=200&q=80',
    isOpen: true,
  },
  {
    id: 2,
    name: 'Thai Street',
    cuisine: 'Thai',
    rating: 4.9,
    image: 'https://images.unsplash.com/photo-1559314809-0d155014e29e?auto=format&fit=crop&w=200&q=80',
    isOpen: false,
  },
  {
    id: 3,
    name: 'Slice Mobile',
    cuisine: 'Italian',
    rating: 4.7,
    image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=200&q=80',
    isOpen: true,
  },
];

const mockRewards = [
  { id: 1, truck: 'Taco Loco', punches: 7, total: 10, reward: 'Free Taco' },
  { id: 2, truck: 'Burger Joint', punches: 3, total: 8, reward: 'Free Fries' },
  { id: 3, truck: 'Morning Brew', punches: 9, total: 10, reward: 'Free Coffee' },
];

// Header Component
const ProfileHeader = ({ onBack, title }) => (
  <header className="profile-header">
    <button className="back-button" onClick={onBack}>
      {Icons.chevronLeft}
    </button>
    <h1>{title}</h1>
    <div className="header-spacer"></div>
  </header>
);

// Account Overview Tab
const AccountTab = ({ profile, setActiveTab }) => {
  const { signOut } = useAuth();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await signOut();
    } catch (err) {
      console.error('Logout failed:', err);
      setLoggingOut(false);
    }
  };

  const menuItems = [
    { icon: Icons.orders, label: 'Order History', tab: 'orders', badge: '3' },
    { icon: Icons.heart, label: 'Favorites', tab: 'favorites', badge: mockFavorites.length.toString() },
    { icon: Icons.gift, label: 'Rewards & Points', tab: 'rewards', badge: `${profile?.points || 0} pts` },
    { icon: Icons.mapPin, label: 'Saved Addresses', tab: 'addresses' },
    { icon: Icons.creditCard, label: 'Payment Methods', tab: 'payment' },
    { icon: Icons.bell, label: 'Notifications', tab: 'notifications' },
    { icon: Icons.shield, label: 'Privacy & Security', tab: 'security' },
    { icon: Icons.help, label: 'Help & Support', tab: 'help' },
  ];

  return (
    <div className="profile-content">
      <div className="profile-hero">
        <div className="profile-avatar-large">
          {profile?.name?.charAt(0) || 'U'}
        </div>
        <h2 className="profile-name">{profile?.name || 'User'}</h2>
        <p className="profile-email">{profile?.email}</p>
        <button className="edit-profile-btn">
          {Icons.edit}
          <span>Edit Profile</span>
        </button>
      </div>

      <div className="points-banner">
        <div className="points-info">
          <span className="points-icon">{Icons.gift}</span>
          <div className="points-text">
            <span className="points-value">{profile?.points || 0} Points</span>
            <span className="points-label">Earn more with every order!</span>
          </div>
        </div>
        <button className="view-rewards-btn" onClick={() => setActiveTab('rewards')}>
          View Rewards
        </button>
      </div>

      <div className="menu-section">
        <h3>Account Settings</h3>
        <div className="menu-list">
          {menuItems.map((item, index) => (
            <button
              key={index}
              className="menu-item"
              onClick={() => setActiveTab(item.tab)}
            >
              <span className="menu-icon">{item.icon}</span>
              <span className="menu-label">{item.label}</span>
              {item.badge && <span className="menu-badge">{item.badge}</span>}
              <span className="menu-chevron">{Icons.chevronRight}</span>
            </button>
          ))}
        </div>
      </div>

      <button className="logout-button" onClick={handleLogout} disabled={loggingOut}>
        {Icons.logout}
        <span>{loggingOut ? 'Logging out...' : 'Log Out'}</span>
      </button>

      <p className="version-text">Cravrr v1.0.0</p>
    </div>
  );
};

// Orders Tab
const OrdersTab = ({ onBack }) => {
  const [filter, setFilter] = useState('all');

  const filteredOrders = filter === 'all'
    ? mockOrders
    : mockOrders.filter(o => o.status === filter);

  return (
    <div className="tab-page">
      <ProfileHeader onBack={onBack} title="Order History" />

      <div className="tab-content">
        <div className="orders-filters">
          {['all', 'preparing', 'delivered'].map(f => (
            <button
              key={f}
              className={`filter-chip ${filter === f ? 'active' : ''}`}
              onClick={() => setFilter(f)}
            >
              {f === 'all' ? 'All Orders' : f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        <div className="orders-list">
          {filteredOrders.map(order => (
            <div className="order-card" key={order.id}>
              <div className="order-header">
                <img src={order.truckImage} alt={order.truck} className="order-truck-img" />
                <div className="order-truck-info">
                  <h4>{order.truck}</h4>
                  <span className="order-date">{order.date}</span>
                </div>
                <span className={`order-status ${order.status}`}>{order.status}</span>
              </div>
              <div className="order-items">
                {order.items.map((item, i) => (
                  <span key={i}>{item}{i < order.items.length - 1 ? ', ' : ''}</span>
                ))}
              </div>
              <div className="order-footer">
                <span className="order-total">${order.total.toFixed(2)}</span>
                <div className="order-actions">
                  {order.status === 'delivered' && (
                    <>
                      <button className="order-btn secondary">
                        {Icons.repeat}
                        Reorder
                      </button>
                      {!order.rating && (
                        <button className="order-btn primary">
                          {Icons.star}
                          Rate
                        </button>
                      )}
                    </>
                  )}
                  {order.status === 'preparing' && (
                    <button className="order-btn primary">
                      {Icons.truck}
                      Track Order
                    </button>
                  )}
                </div>
              </div>
              {order.rating && (
                <div className="order-rating">
                  <span>Your rating:</span>
                  <div className="rating-stars">
                    {[1, 2, 3, 4, 5].map(star => (
                      <span
                        key={star}
                        className={`star ${star <= order.rating ? 'filled' : ''}`}
                      >
                        {Icons.star}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Favorites Tab
const FavoritesTab = ({ onBack }) => (
  <div className="tab-page">
    <ProfileHeader onBack={onBack} title="Favorites" />

    <div className="tab-content">
      <p className="tab-subtitle">Your saved food trucks</p>

      <div className="favorites-grid">
        {mockFavorites.map(truck => (
          <div className="favorite-card" key={truck.id}>
            <div className="favorite-image">
              <img src={truck.image} alt={truck.name} />
              <button className="favorite-heart active">
                {Icons.heartFilled}
              </button>
              {truck.isOpen ? (
                <span className="open-badge">Open</span>
              ) : (
                <span className="closed-badge">Closed</span>
              )}
            </div>
            <div className="favorite-info">
              <h4>{truck.name}</h4>
              <span className="favorite-cuisine">{truck.cuisine}</span>
              <div className="favorite-rating">
                {Icons.star}
                <span>{truck.rating}</span>
              </div>
            </div>
            <button className="view-menu-btn">View Menu</button>
          </div>
        ))}
      </div>
    </div>
  </div>
);

// Rewards Tab
const RewardsTab = ({ onBack, points }) => (
  <div className="tab-page">
    <ProfileHeader onBack={onBack} title="Rewards & Points" />

    <div className="tab-content">
      <div className="rewards-hero">
        <div className="rewards-points-display">
          <span className="points-number">{points || 0}</span>
          <span className="points-suffix">Points</span>
        </div>
        <p className="rewards-subtitle">Keep ordering to earn more points!</p>
        <div className="points-info-row">
          <div className="points-info-item">
            <span className="info-value">10</span>
            <span className="info-label">pts per $1</span>
          </div>
          <div className="points-divider"></div>
          <div className="points-info-item">
            <span className="info-value">500</span>
            <span className="info-label">pts = $5 off</span>
          </div>
        </div>
      </div>

      <div className="rewards-section">
        <h3>Punch Cards</h3>
        <p className="section-subtitle">Get rewards from your favorite trucks</p>

        <div className="punch-cards">
          {mockRewards.map(card => (
            <div className="punch-card" key={card.id}>
              <div className="punch-card-header">
                <h4>{card.truck}</h4>
                <span className="punch-reward">{card.reward}</span>
              </div>
              <div className="punch-progress">
                <div className="punch-circles">
                  {Array.from({ length: card.total }).map((_, i) => (
                    <div
                      key={i}
                      className={`punch-circle ${i < card.punches ? 'filled' : ''}`}
                    >
                      {i < card.punches && Icons.check}
                    </div>
                  ))}
                </div>
                <span className="punch-count">{card.punches}/{card.total}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="rewards-section">
        <h3>How to Earn</h3>
        <div className="earn-methods">
          <div className="earn-item">
            <span className="earn-icon">{Icons.orders}</span>
            <div className="earn-info">
              <span className="earn-title">Place Orders</span>
              <span className="earn-desc">Earn 10 points per $1 spent</span>
            </div>
          </div>
          <div className="earn-item">
            <span className="earn-icon">{Icons.star}</span>
            <div className="earn-info">
              <span className="earn-title">Leave Reviews</span>
              <span className="earn-desc">Earn 50 points per review</span>
            </div>
          </div>
          <div className="earn-item">
            <span className="earn-icon">{Icons.user}</span>
            <div className="earn-info">
              <span className="earn-title">Refer Friends</span>
              <span className="earn-desc">Earn 200 points per referral</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

// Addresses Tab
const AddressesTab = ({ onBack }) => {
  const addresses = [
    { id: 1, label: 'Home', address: '123 Main St, Portland, OR 97201', isDefault: true },
    { id: 2, label: 'Work', address: '456 Business Ave, Portland, OR 97204', isDefault: false },
  ];

  return (
    <div className="tab-page">
      <ProfileHeader onBack={onBack} title="Saved Addresses" />

      <div className="tab-content">
        <div className="addresses-list">
          {addresses.map(addr => (
            <div className={`address-card ${addr.isDefault ? 'default' : ''}`} key={addr.id}>
              <div className="address-icon">{Icons.mapPin}</div>
              <div className="address-info">
                <div className="address-label">
                  {addr.label}
                  {addr.isDefault && <span className="default-badge">Default</span>}
                </div>
                <p className="address-text">{addr.address}</p>
              </div>
              <button className="address-edit">{Icons.edit}</button>
            </div>
          ))}
        </div>

        <button className="add-address-btn">
          {Icons.plus}
          Add New Address
        </button>
      </div>
    </div>
  );
};

// Payment Tab
const PaymentTab = ({ onBack }) => {
  const cards = [
    { id: 1, type: 'Visa', last4: '4242', expiry: '12/25', isDefault: true },
    { id: 2, type: 'Mastercard', last4: '8888', expiry: '06/26', isDefault: false },
  ];

  return (
    <div className="tab-page">
      <ProfileHeader onBack={onBack} title="Payment Methods" />

      <div className="tab-content">
        <div className="payment-list">
          {cards.map(card => (
            <div className={`payment-card ${card.isDefault ? 'default' : ''}`} key={card.id}>
              <div className="card-icon">{Icons.creditCard}</div>
              <div className="card-info">
                <div className="card-type">
                  {card.type} •••• {card.last4}
                  {card.isDefault && <span className="default-badge">Default</span>}
                </div>
                <span className="card-expiry">Expires {card.expiry}</span>
              </div>
              <button className="card-edit">{Icons.edit}</button>
            </div>
          ))}
        </div>

        <button className="add-payment-btn">
          {Icons.plus}
          Add Payment Method
        </button>
      </div>
    </div>
  );
};

// Notifications Tab
const NotificationsTab = ({ onBack }) => {
  const [settings, setSettings] = useState({
    orderUpdates: true,
    promotions: true,
    newTrucks: false,
    favorites: true,
    rewards: true,
  });

  const toggle = (key) => {
    setSettings({ ...settings, [key]: !settings[key] });
  };

  return (
    <div className="tab-page">
      <ProfileHeader onBack={onBack} title="Notifications" />

      <div className="tab-content">
        <div className="settings-list">
          <div className="setting-item">
            <div className="setting-info">
              <span className="setting-title">Order Updates</span>
              <span className="setting-desc">Get notified about your order status</span>
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={settings.orderUpdates}
                onChange={() => toggle('orderUpdates')}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>

          <div className="setting-item">
            <div className="setting-info">
              <span className="setting-title">Promotions & Deals</span>
              <span className="setting-desc">Special offers from food trucks</span>
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={settings.promotions}
                onChange={() => toggle('promotions')}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>

          <div className="setting-item">
            <div className="setting-info">
              <span className="setting-title">New Trucks Nearby</span>
              <span className="setting-desc">Discover new trucks in your area</span>
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={settings.newTrucks}
                onChange={() => toggle('newTrucks')}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>

          <div className="setting-item">
            <div className="setting-info">
              <span className="setting-title">Favorite Truck Updates</span>
              <span className="setting-desc">When your favorites are nearby or have deals</span>
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={settings.favorites}
                onChange={() => toggle('favorites')}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>

          <div className="setting-item">
            <div className="setting-info">
              <span className="setting-title">Rewards & Points</span>
              <span className="setting-desc">Updates about your rewards status</span>
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={settings.rewards}
                onChange={() => toggle('rewards')}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};

// Security Tab
const SecurityTab = ({ onBack }) => (
  <div className="tab-page">
    <ProfileHeader onBack={onBack} title="Privacy & Security" />

    <div className="tab-content">
      <div className="security-section">
        <h3>Account Security</h3>
        <div className="security-list">
          <button className="security-item">
            <span className="security-icon">{Icons.edit}</span>
            <span className="security-label">Change Password</span>
            {Icons.chevronRight}
          </button>
          <button className="security-item">
            <span className="security-icon">{Icons.shield}</span>
            <span className="security-label">Two-Factor Authentication</span>
            <span className="security-status off">Off</span>
            {Icons.chevronRight}
          </button>
        </div>
      </div>

      <div className="security-section">
        <h3>Privacy</h3>
        <div className="security-list">
          <button className="security-item">
            <span className="security-icon">{Icons.mapPin}</span>
            <span className="security-label">Location Permissions</span>
            {Icons.chevronRight}
          </button>
          <button className="security-item">
            <span className="security-icon">{Icons.user}</span>
            <span className="security-label">Data & Personalization</span>
            {Icons.chevronRight}
          </button>
        </div>
      </div>

      <div className="security-section danger-zone">
        <h3>Danger Zone</h3>
        <button className="delete-account-btn">Delete Account</button>
        <p className="delete-warning">This will permanently delete your account and all associated data.</p>
      </div>
    </div>
  </div>
);

// Help Tab
const HelpTab = ({ onBack }) => (
  <div className="tab-page">
    <ProfileHeader onBack={onBack} title="Help & Support" />

    <div className="tab-content">
      <div className="help-search">
        <input type="text" placeholder="Search for help..." />
      </div>

      <div className="help-section">
        <h3>Quick Help</h3>
        <div className="help-list">
          <button className="help-item">
            <span>How do I track my order?</span>
            {Icons.chevronRight}
          </button>
          <button className="help-item">
            <span>How do rewards work?</span>
            {Icons.chevronRight}
          </button>
          <button className="help-item">
            <span>How to update payment method?</span>
            {Icons.chevronRight}
          </button>
          <button className="help-item">
            <span>Cancellation & refund policy</span>
            {Icons.chevronRight}
          </button>
        </div>
      </div>

      <div className="help-section">
        <h3>Contact Us</h3>
        <div className="contact-options">
          <button className="contact-btn">
            <span className="contact-icon">{Icons.help}</span>
            <span>Chat with Support</span>
          </button>
          <button className="contact-btn">
            <span className="contact-icon">{Icons.edit}</span>
            <span>Send Email</span>
          </button>
        </div>
      </div>
    </div>
  </div>
);

// Main Customer Profile Component
const CustomerProfile = ({ onBack }) => {
  const { profile, loading, user, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState('account');

  if (loading) {
    return (
      <div className="profile-loading">
        <div className="loading-spinner"></div>
        <p>Loading profile...</p>
      </div>
    );
  }

  // Handle case where profile doesn't exist (e.g., admin without profile record)
  if (!profile && user) {
    return (
      <div className="customer-profile">
        <header className="main-profile-header">
          <button className="back-button" onClick={onBack}>
            {Icons.chevronLeft}
          </button>
          <h1>Account</h1>
          <div className="header-spacer"></div>
        </header>
        <div className="profile-content">
          <div className="profile-hero">
            <div className="profile-avatar-large">
              {user.email?.charAt(0).toUpperCase() || '?'}
            </div>
            <h2 className="profile-name">{user.user_metadata?.name || 'User'}</h2>
            <p className="profile-email">{user.email}</p>
          </div>
          <div className="profile-notice">
            <p>Your profile is being set up. Some features may be limited.</p>
          </div>
          <button className="logout-button" onClick={async () => {
            try {
              await signOut();
            } catch (err) {
              console.error('Logout failed:', err);
            }
          }}>
            {Icons.logout}
            <span>Log Out</span>
          </button>
        </div>
      </div>
    );
  }

  const handleTabBack = () => setActiveTab('account');

  const renderTab = () => {
    switch (activeTab) {
      case 'account':
        return <AccountTab profile={profile} setActiveTab={setActiveTab} />;
      case 'orders':
        return <OrdersTab onBack={handleTabBack} />;
      case 'favorites':
        return <FavoritesTab onBack={handleTabBack} />;
      case 'rewards':
        return <RewardsTab onBack={handleTabBack} points={profile?.points} />;
      case 'addresses':
        return <AddressesTab onBack={handleTabBack} />;
      case 'payment':
        return <PaymentTab onBack={handleTabBack} />;
      case 'notifications':
        return <NotificationsTab onBack={handleTabBack} />;
      case 'security':
        return <SecurityTab onBack={handleTabBack} />;
      case 'help':
        return <HelpTab onBack={handleTabBack} />;
      default:
        return <AccountTab profile={profile} setActiveTab={setActiveTab} />;
    }
  };

  return (
    <div className="customer-profile">
      {activeTab === 'account' && (
        <header className="main-profile-header">
          <button className="back-button" onClick={onBack}>
            {Icons.chevronLeft}
          </button>
          <h1>Account</h1>
          <button className="settings-button" onClick={() => setActiveTab('notifications')}>
            {Icons.bell}
          </button>
        </header>
      )}
      {renderTab()}
    </div>
  );
};

export default CustomerProfile;
