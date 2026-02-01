import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../auth/AuthContext';
import { supabase } from '../../lib/supabase';
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
  loader: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="animate-spin"><circle cx="12" cy="12" r="10" strokeOpacity="0.25"/><path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round"/></svg>,
  trash: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>,
};

// Helper to format date
const formatDate = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

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
const AccountTab = ({ profile, setActiveTab, ordersCount, favoritesCount, onEditProfile }) => {
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
    { icon: Icons.orders, label: 'Order History', tab: 'orders', badge: ordersCount > 0 ? ordersCount.toString() : null },
    { icon: Icons.heart, label: 'Favorites', tab: 'favorites', badge: favoritesCount > 0 ? favoritesCount.toString() : null },
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
        <button className="edit-profile-btn" onClick={onEditProfile}>
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

// Review Modal
const ReviewModal = ({ isOpen, onClose, order, onSubmit }) => {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rating === 0) {
      alert('Please select a rating');
      return;
    }

    setSaving(true);
    try {
      await onSubmit({ rating, comment, orderId: order.id, truckId: order.truck_id });
      onClose();
      setRating(0);
      setComment('');
    } catch (err) {
      console.error('Error submitting review:', err);
      alert('Failed to submit review');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal review-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Rate Your Order</h2>
          <button className="close-btn" onClick={onClose}>{Icons.x}</button>
        </div>
        <div className="review-truck-info">
          <h3>{order?.truck_name}</h3>
          <p>How was your experience?</p>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="rating-input">
            {[1, 2, 3, 4, 5].map(star => (
              <button
                key={star}
                type="button"
                className={`star-btn ${star <= rating ? 'active' : ''}`}
                onClick={() => setRating(star)}
              >
                {Icons.star}
              </button>
            ))}
          </div>
          <div className="form-group">
            <label>Comment (Optional)</label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Share your thoughts about the food, service, etc."
              rows={4}
            />
          </div>
          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Submitting...' : 'Submit Review'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Track Order Modal
const TrackOrderModal = ({ isOpen, onClose, order }) => {
  if (!isOpen) return null;

  const statusSteps = [
    { key: 'pending', label: 'Order Placed', icon: Icons.check },
    { key: 'confirmed', label: 'Confirmed', icon: Icons.check },
    { key: 'preparing', label: 'Preparing', icon: Icons.clock },
    { key: 'ready', label: 'Ready for Pickup', icon: Icons.truck },
  ];

  const currentIndex = statusSteps.findIndex(s => s.key === order?.status);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal track-order-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Track Your Order</h2>
          <button className="close-btn" onClick={onClose}>{Icons.x}</button>
        </div>
        <div className="order-tracking-info">
          <h3>{order?.truck_name}</h3>
          <p className="order-number">Order #{order?.order_number}</p>
          <p className="order-time">Placed {formatDate(order?.created_at)}</p>
        </div>
        <div className="tracking-steps">
          {statusSteps.map((step, index) => (
            <div key={step.key} className={`tracking-step ${index <= currentIndex ? 'completed' : ''} ${index === currentIndex ? 'current' : ''}`}>
              <div className="step-icon">{step.icon}</div>
              <div className="step-label">{step.label}</div>
              {index < statusSteps.length - 1 && <div className="step-line" />}
            </div>
          ))}
        </div>
        <div className="order-items-summary">
          <h4>Order Items:</h4>
          {order?.items && order.items.length > 0 ? (
            <ul>
              {order.items.map((item, i) => (
                <li key={i}>{item.name} x{item.quantity}</li>
              ))}
            </ul>
          ) : (
            <p>{order?.item_count || 0} items</p>
          )}
        </div>
        <div className="order-total-summary">
          <strong>Total:</strong> ${parseFloat(order?.total || 0).toFixed(2)}
        </div>
        <button className="btn-primary full-width" onClick={onClose}>Close</button>
      </div>
    </div>
  );
};

// Orders Tab
const OrdersTab = ({ onBack, orders, loading, onReorder, onReview }) => {
  const [filter, setFilter] = useState('all');
  const [reviewingOrder, setReviewingOrder] = useState(null);
  const [trackingOrder, setTrackingOrder] = useState(null);

  // Map database status to display status
  const getDisplayStatus = (status) => {
    switch (status) {
      case 'completed': return 'delivered';
      case 'pending':
      case 'confirmed':
      case 'preparing':
      case 'ready': return 'preparing';
      case 'cancelled': return 'cancelled';
      default: return status;
    }
  };

  const filteredOrders = filter === 'all'
    ? orders
    : orders.filter(o => getDisplayStatus(o.status) === filter);

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

        {loading ? (
          <div className="loading-state">{Icons.loader} Loading orders...</div>
        ) : filteredOrders.length === 0 ? (
          <div className="empty-state">
            <p>{filter === 'all' ? 'No orders yet. Start ordering to see your history!' : `No ${filter} orders`}</p>
          </div>
        ) : (
          <div className="orders-list">
            {filteredOrders.map(order => (
              <div className="order-card" key={order.id}>
                <div className="order-header">
                  <img
                    src={order.truck_image || 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?auto=format&fit=crop&w=100&q=80'}
                    alt={order.truck_name}
                    className="order-truck-img"
                  />
                  <div className="order-truck-info">
                    <h4>{order.truck_name || 'Food Truck'}</h4>
                    <span className="order-date">{formatDate(order.created_at)}</span>
                  </div>
                  <span className={`order-status ${getDisplayStatus(order.status)}`}>
                    {getDisplayStatus(order.status)}
                  </span>
                </div>
                <div className="order-items">
                  {order.items && order.items.length > 0 ? (
                    order.items.map((item, i) => (
                      <span key={i}>{item.name}{i < order.items.length - 1 ? ', ' : ''}</span>
                    ))
                  ) : (
                    <span className="order-items-count">{order.item_count || 0} items</span>
                  )}
                </div>
                <div className="order-footer">
                  <span className="order-total">${parseFloat(order.total).toFixed(2)}</span>
                  <div className="order-actions">
                    {getDisplayStatus(order.status) === 'delivered' && (
                      <>
                        <button className="order-btn secondary" onClick={() => onReorder(order)}>
                          {Icons.repeat}
                          Reorder
                        </button>
                        {!order.has_review && (
                          <button className="order-btn primary" onClick={() => setReviewingOrder(order)}>
                            {Icons.star}
                            Rate
                          </button>
                        )}
                      </>
                    )}
                    {getDisplayStatus(order.status) === 'preparing' && (
                      <button className="order-btn primary" onClick={() => setTrackingOrder(order)}>
                        {Icons.truck}
                        Track Order
                      </button>
                    )}
                  </div>
                </div>
                {order.review_rating && (
                  <div className="order-rating">
                    <span>Your rating:</span>
                    <div className="rating-stars">
                      {[1, 2, 3, 4, 5].map(star => (
                        <span
                          key={star}
                          className={`star ${star <= order.review_rating ? 'filled' : ''}`}
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
        )}
      </div>

      {/* Modals */}
      <ReviewModal
        isOpen={reviewingOrder !== null}
        onClose={() => setReviewingOrder(null)}
        order={reviewingOrder}
        onSubmit={onReview}
      />
      <TrackOrderModal
        isOpen={trackingOrder !== null}
        onClose={() => setTrackingOrder(null)}
        order={trackingOrder}
      />
    </div>
  );
};

// Favorites Tab
const FavoritesTab = ({ onBack, favorites, loading, onRemoveFavorite }) => (
  <div className="tab-page">
    <ProfileHeader onBack={onBack} title="Favorites" />

    <div className="tab-content">
      <p className="tab-subtitle">Your saved food trucks</p>

      {loading ? (
        <div className="loading-state">{Icons.loader} Loading favorites...</div>
      ) : favorites.length === 0 ? (
        <div className="empty-state">
          <p>No favorites yet. Explore food trucks and add your favorites!</p>
        </div>
      ) : (
        <div className="favorites-grid">
          {favorites.map(truck => (
            <div className="favorite-card" key={truck.id}>
              <div className="favorite-image">
                <img
                  src={truck.image_url || 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?auto=format&fit=crop&w=200&q=80'}
                  alt={truck.name}
                />
                <button
                  className="favorite-heart active"
                  onClick={() => onRemoveFavorite(truck.id)}
                >
                  {Icons.heartFilled}
                </button>
                {truck.is_open ? (
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
                  <span>{truck.average_rating || 'N/A'}</span>
                </div>
              </div>
              <button className="view-menu-btn">View Menu</button>
            </div>
          ))}
        </div>
      )}
    </div>
  </div>
);

// Rewards Tab
const RewardsTab = ({ onBack, points, checkIns, loading }) => {
  // Group check-ins by truck for punch cards
  const punchCards = Object.values(
    (checkIns || []).reduce((acc, checkIn) => {
      const truckId = checkIn.truck_id;
      if (!acc[truckId]) {
        acc[truckId] = {
          id: truckId,
          truck: checkIn.truck_name || 'Food Truck',
          punches: 0,
          total: 10,
          reward: 'Free Item',
        };
      }
      acc[truckId].punches += 1;
      return acc;
    }, {})
  );

  return (
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

          {loading ? (
            <div className="loading-state">{Icons.loader} Loading...</div>
          ) : punchCards.length === 0 ? (
            <div className="empty-state">
              <p>No punch cards yet. Check in at food trucks to start earning rewards!</p>
            </div>
          ) : (
            <div className="punch-cards">
              {punchCards.map(card => (
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
                          className={`punch-circle ${i < (card.punches % card.total) || (card.punches >= card.total && i < card.total) ? 'filled' : ''}`}
                        >
                          {(i < (card.punches % card.total) || (card.punches >= card.total && i < card.total)) && Icons.check}
                        </div>
                      ))}
                    </div>
                    <span className="punch-count">{card.punches % card.total}/{card.total}</span>
                  </div>
                  {card.punches >= card.total && (
                    <div className="reward-ready">Reward ready to claim!</div>
                  )}
                </div>
              ))}
            </div>
          )}
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
              <span className="earn-icon">{Icons.mapPin}</span>
              <div className="earn-info">
                <span className="earn-title">Check In</span>
                <span className="earn-desc">Earn 10 points per check-in</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Address Modal
const AddressModal = ({ isOpen, onClose, address, onSave, userId }) => {
  const [formData, setFormData] = useState({
    label: '',
    address_line1: '',
    address_line2: '',
    city: '',
    state: '',
    zip_code: '',
    is_default: false,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (address) {
      setFormData(address);
    } else {
      setFormData({
        label: '',
        address_line1: '',
        address_line2: '',
        city: '',
        state: '',
        zip_code: '',
        is_default: false,
      });
    }
  }, [address]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (address) {
        // Update existing
        const { error } = await supabase
          .from('addresses')
          .update(formData)
          .eq('id', address.id);
        if (error) throw error;
      } else {
        // Create new
        const { error } = await supabase
          .from('addresses')
          .insert([{ ...formData, user_id: userId }]);
        if (error) throw error;
      }
      await onSave();
      onClose();
    } catch (err) {
      console.error('Error saving address:', err);
      alert('Failed to save address');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal address-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{address ? 'Edit Address' : 'Add New Address'}</h2>
          <button className="close-btn" onClick={onClose}>{Icons.x}</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Label</label>
            <select value={formData.label} onChange={(e) => setFormData({ ...formData, label: e.target.value })} required>
              <option value="">Select label</option>
              <option value="Home">Home</option>
              <option value="Work">Work</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div className="form-group">
            <label>Address Line 1</label>
            <input
              type="text"
              value={formData.address_line1}
              onChange={(e) => setFormData({ ...formData, address_line1: e.target.value })}
              placeholder="123 Main St"
              required
            />
          </div>
          <div className="form-group">
            <label>Address Line 2 (Optional)</label>
            <input
              type="text"
              value={formData.address_line2}
              onChange={(e) => setFormData({ ...formData, address_line2: e.target.value })}
              placeholder="Apt 4B"
            />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>City</label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label>State</label>
              <input
                type="text"
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                placeholder="OR"
                maxLength={2}
                required
              />
            </div>
            <div className="form-group">
              <label>ZIP Code</label>
              <input
                type="text"
                value={formData.zip_code}
                onChange={(e) => setFormData({ ...formData, zip_code: e.target.value })}
                placeholder="97201"
                required
              />
            </div>
          </div>
          <div className="form-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={formData.is_default}
                onChange={(e) => setFormData({ ...formData, is_default: e.target.checked })}
              />
              <span>Set as default address</span>
            </label>
          </div>
          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Saving...' : 'Save Address'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Addresses Tab
const AddressesTab = ({ onBack, userId }) => {
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);

  const fetchAddresses = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('addresses')
        .select('*')
        .eq('user_id', userId)
        .order('is_default', { ascending: false });

      if (error) throw error;
      setAddresses(data || []);
    } catch (err) {
      console.error('Error fetching addresses:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAddresses();
  }, [userId]);

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this address?')) return;

    try {
      const { error } = await supabase
        .from('addresses')
        .delete()
        .eq('id', id);

      if (error) throw error;
      fetchAddresses();
    } catch (err) {
      console.error('Error deleting address:', err);
    }
  };

  const openEditModal = (address) => {
    setEditingAddress(address);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingAddress(null);
  };

  return (
    <div className="tab-page">
      <ProfileHeader onBack={onBack} title="Saved Addresses" />

      <div className="tab-content">
        {loading ? (
          <div className="loading-state">{Icons.loader} Loading addresses...</div>
        ) : addresses.length === 0 ? (
          <div className="empty-state">
            <p>No saved addresses yet. Add one to speed up checkout!</p>
          </div>
        ) : (
          <div className="addresses-list">
            {addresses.map(addr => (
              <div className={`address-card ${addr.is_default ? 'default' : ''}`} key={addr.id}>
                <div className="address-icon">{Icons.mapPin}</div>
                <div className="address-info">
                  <div className="address-label">
                    {addr.label}
                    {addr.is_default && <span className="default-badge">Default</span>}
                  </div>
                  <p className="address-text">
                    {addr.address_line1}
                    {addr.address_line2 && `, ${addr.address_line2}`}
                    <br />
                    {addr.city}, {addr.state} {addr.zip_code}
                  </p>
                </div>
                <div className="address-actions">
                  <button className="address-edit" onClick={() => openEditModal(addr)}>{Icons.edit}</button>
                  <button className="address-delete" onClick={() => handleDelete(addr.id)}>{Icons.trash}</button>
                </div>
              </div>
            ))}
          </div>
        )}

        <button className="add-address-btn" onClick={() => setShowModal(true)}>
          {Icons.plus}
          Add New Address
        </button>
      </div>

      <AddressModal
        isOpen={showModal}
        onClose={closeModal}
        address={editingAddress}
        onSave={fetchAddresses}
        userId={userId}
      />
    </div>
  );
};

// Payment Method Modal
const PaymentModal = ({ isOpen, onClose, payment, onSave, userId }) => {
  const [formData, setFormData] = useState({
    card_type: '',
    last_four: '',
    expiry_month: '',
    expiry_year: '',
    cardholder_name: '',
    is_default: false,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (payment) {
      setFormData(payment);
    } else {
      setFormData({
        card_type: '',
        last_four: '',
        expiry_month: '',
        expiry_year: '',
        cardholder_name: '',
        is_default: false,
      });
    }
  }, [payment]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const data = {
        ...formData,
        expiry_month: parseInt(formData.expiry_month),
        expiry_year: parseInt(formData.expiry_year),
      };

      if (payment) {
        // Update existing
        const { error } = await supabase
          .from('payment_methods')
          .update(data)
          .eq('id', payment.id);
        if (error) throw error;
      } else {
        // Create new
        const { error } = await supabase
          .from('payment_methods')
          .insert([{ ...data, user_id: userId }]);
        if (error) throw error;
      }
      await onSave();
      onClose();
    } catch (err) {
      console.error('Error saving payment method:', err);
      alert('Failed to save payment method');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 15 }, (_, i) => currentYear + i);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal payment-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{payment ? 'Edit Payment Method' : 'Add Payment Method'}</h2>
          <button className="close-btn" onClick={onClose}>{Icons.x}</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Cardholder Name</label>
            <input
              type="text"
              value={formData.cardholder_name}
              onChange={(e) => setFormData({ ...formData, cardholder_name: e.target.value })}
              placeholder="John Doe"
              required
            />
          </div>
          <div className="form-group">
            <label>Card Type</label>
            <select value={formData.card_type} onChange={(e) => setFormData({ ...formData, card_type: e.target.value })} required>
              <option value="">Select card type</option>
              <option value="Visa">Visa</option>
              <option value="Mastercard">Mastercard</option>
              <option value="Amex">American Express</option>
              <option value="Discover">Discover</option>
            </select>
          </div>
          <div className="form-group">
            <label>Last 4 Digits</label>
            <input
              type="text"
              value={formData.last_four}
              onChange={(e) => setFormData({ ...formData, last_four: e.target.value.replace(/\D/g, '') })}
              placeholder="4242"
              maxLength={4}
              required
            />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Expiry Month</label>
              <select value={formData.expiry_month} onChange={(e) => setFormData({ ...formData, expiry_month: e.target.value })} required>
                <option value="">Month</option>
                {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                  <option key={month} value={month}>{month.toString().padStart(2, '0')}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Expiry Year</label>
              <select value={formData.expiry_year} onChange={(e) => setFormData({ ...formData, expiry_year: e.target.value })} required>
                <option value="">Year</option>
                {years.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="form-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={formData.is_default}
                onChange={(e) => setFormData({ ...formData, is_default: e.target.checked })}
              />
              <span>Set as default payment method</span>
            </label>
          </div>
          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Saving...' : 'Save Card'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Payment Tab
const PaymentTab = ({ onBack, userId }) => {
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCard, setEditingCard] = useState(null);

  const fetchCards = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('payment_methods')
        .select('*')
        .eq('user_id', userId)
        .order('is_default', { ascending: false });

      if (error) throw error;
      setCards(data || []);
    } catch (err) {
      console.error('Error fetching payment methods:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCards();
  }, [userId]);

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to remove this payment method?')) return;

    try {
      const { error } = await supabase
        .from('payment_methods')
        .delete()
        .eq('id', id);

      if (error) throw error;
      fetchCards();
    } catch (err) {
      console.error('Error deleting payment method:', err);
    }
  };

  const openEditModal = (card) => {
    setEditingCard(card);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingCard(null);
  };

  return (
    <div className="tab-page">
      <ProfileHeader onBack={onBack} title="Payment Methods" />

      <div className="tab-content">
        {loading ? (
          <div className="loading-state">{Icons.loader} Loading payment methods...</div>
        ) : cards.length === 0 ? (
          <div className="empty-state">
            <p>No payment methods saved. Add one for faster checkout!</p>
          </div>
        ) : (
          <div className="payment-list">
            {cards.map(card => (
              <div className={`payment-card ${card.is_default ? 'default' : ''}`} key={card.id}>
                <div className="card-icon">{Icons.creditCard}</div>
                <div className="card-info">
                  <div className="card-type">
                    {card.card_type} •••• {card.last_four}
                    {card.is_default && <span className="default-badge">Default</span>}
                  </div>
                  <span className="card-expiry">
                    Expires {card.expiry_month.toString().padStart(2, '0')}/{card.expiry_year}
                  </span>
                </div>
                <div className="card-actions">
                  <button className="card-edit" onClick={() => openEditModal(card)}>{Icons.edit}</button>
                  <button className="card-delete" onClick={() => handleDelete(card.id)}>{Icons.trash}</button>
                </div>
              </div>
            ))}
          </div>
        )}

        <button className="add-payment-btn" onClick={() => setShowModal(true)}>
          {Icons.plus}
          Add Payment Method
        </button>
      </div>

      <PaymentModal
        isOpen={showModal}
        onClose={closeModal}
        payment={editingCard}
        onSave={fetchCards}
        userId={userId}
      />
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

// Edit Profile Modal
const EditProfileModal = ({ isOpen, onClose, profile, onSave }) => {
  const [formData, setFormData] = useState({
    name: profile?.name || '',
    phone: profile?.phone || '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile) {
      setFormData({
        name: profile.name || '',
        phone: profile.phone || '',
      });
    }
  }, [profile]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave(formData);
      onClose();
    } catch (err) {
      console.error('Failed to update profile:', err);
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal edit-profile-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Edit Profile</h2>
          <button className="close-btn" onClick={onClose}>{Icons.x}</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Full Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label>Phone Number</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="(555) 123-4567"
            />
          </div>
          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Change Password Modal
const ChangePasswordModal = ({ isOpen, onClose }) => {
  const [formData, setFormData] = useState({
    newPassword: '',
    confirmPassword: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (formData.newPassword !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: formData.newPassword,
      });

      if (error) throw error;

      setSuccess('Password updated successfully!');
      setTimeout(() => {
        onClose();
        setFormData({ newPassword: '', confirmPassword: '' });
        setSuccess('');
      }, 2000);
    } catch (err) {
      setError(err.message || 'Failed to update password');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal change-password-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Change Password</h2>
          <button className="close-btn" onClick={onClose}>{Icons.x}</button>
        </div>
        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>New Password</label>
            <input
              type="password"
              value={formData.newPassword}
              onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
              placeholder="Enter new password"
              required
            />
          </div>
          <div className="form-group">
            <label>Confirm New Password</label>
            <input
              type="password"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              placeholder="Confirm new password"
              required
            />
          </div>
          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Updating...' : 'Update Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Security Tab
const SecurityTab = ({ onBack, onChangePassword }) => (
  <div className="tab-page">
    <ProfileHeader onBack={onBack} title="Privacy & Security" />

    <div className="tab-content">
      <div className="security-section">
        <h3>Account Security</h3>
        <div className="security-list">
          <button className="security-item" onClick={onChangePassword}>
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
  const { profile, loading: authLoading, user, signOut, updateProfile } = useAuth();
  const [activeTab, setActiveTab] = useState('account');

  // Modal states
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);

  // Data state
  const [orders, setOrders] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [checkIns, setCheckIns] = useState([]);

  // Loading states
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [loadingFavorites, setLoadingFavorites] = useState(true);
  const [loadingCheckIns, setLoadingCheckIns] = useState(true);

  // Fetch customer orders
  const fetchOrders = useCallback(async () => {
    if (!user?.id) return;
    setLoadingOrders(true);
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          food_trucks:truck_id(name, image_url),
          order_items(name, quantity, price)
        `)
        .eq('customer_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedOrders = (data || []).map(order => ({
        ...order,
        truck_name: order.food_trucks?.name || 'Food Truck',
        truck_image: order.food_trucks?.image_url,
        items: order.order_items || [],
        item_count: order.order_items?.length || 0,
      }));

      setOrders(formattedOrders);
    } catch (err) {
      console.error('Error fetching orders:', err);
    } finally {
      setLoadingOrders(false);
    }
  }, [user?.id]);

  // Fetch customer favorites
  const fetchFavorites = useCallback(async () => {
    if (!user?.id) return;
    setLoadingFavorites(true);
    try {
      const { data, error } = await supabase
        .from('favorites')
        .select(`
          *,
          food_trucks:truck_id(*)
        `)
        .eq('customer_id', user.id);

      if (error) throw error;

      // Also get ratings for each truck
      const formattedFavorites = await Promise.all((data || []).map(async (fav) => {
        const truck = fav.food_trucks;
        if (!truck) return null;

        // Get rating from view
        const { data: ratingData } = await supabase
          .from('truck_ratings_summary')
          .select('average_rating')
          .eq('truck_id', truck.id)
          .single();

        return {
          ...truck,
          favorite_id: fav.id,
          average_rating: ratingData?.average_rating || null,
        };
      }));

      setFavorites(formattedFavorites.filter(f => f !== null));
    } catch (err) {
      console.error('Error fetching favorites:', err);
    } finally {
      setLoadingFavorites(false);
    }
  }, [user?.id]);

  // Fetch check-ins for punch cards
  const fetchCheckIns = useCallback(async () => {
    if (!user?.id) return;
    setLoadingCheckIns(true);
    try {
      const { data, error } = await supabase
        .from('check_ins')
        .select(`
          *,
          food_trucks:truck_id(name)
        `)
        .eq('customer_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedCheckIns = (data || []).map(ci => ({
        ...ci,
        truck_name: ci.food_trucks?.name || 'Food Truck',
      }));

      setCheckIns(formattedCheckIns);
    } catch (err) {
      console.error('Error fetching check-ins:', err);
    } finally {
      setLoadingCheckIns(false);
    }
  }, [user?.id]);

  // Remove from favorites
  const handleRemoveFavorite = async (truckId) => {
    try {
      const { error} = await supabase
        .from('favorites')
        .delete()
        .eq('customer_id', user.id)
        .eq('truck_id', truckId);

      if (error) throw error;
      setFavorites(prev => prev.filter(f => f.id !== truckId));
    } catch (err) {
      console.error('Error removing favorite:', err);
    }
  };

  // Save profile updates
  const handleSaveProfile = async (updatedData) => {
    try {
      await updateProfile(updatedData);
      // Profile will be updated via AuthContext
    } catch (err) {
      console.error('Error updating profile:', err);
      throw err;
    }
  };

  // Reorder functionality
  const handleReorder = async (order) => {
    try {
      // TODO: Implement cart context to add items
      // For now, just navigate to the truck page
      alert(`Reordering from ${order.truck_name}. (Feature coming soon - will add items to cart)`);
    } catch (err) {
      console.error('Error reordering:', err);
    }
  };

  // Submit review
  const handleSubmitReview = async ({ rating, comment, orderId, truckId }) => {
    try {
      // Insert review
      const { error: reviewError } = await supabase
        .from('reviews')
        .insert([{
          customer_id: user.id,
          truck_id: truckId,
          order_id: orderId,
          rating,
          comment,
        }]);

      if (reviewError) throw reviewError;

      // Mark order as reviewed
      const { error: orderError } = await supabase
        .from('orders')
        .update({ has_review: true })
        .eq('id', orderId);

      if (orderError) throw orderError;

      // Refresh orders to show review
      fetchOrders();

      alert('Thank you for your review!');
    } catch (err) {
      console.error('Error submitting review:', err);
      throw err;
    }
  };

  // Fetch data on mount
  useEffect(() => {
    if (user?.id) {
      fetchOrders();
      fetchFavorites();
      fetchCheckIns();
    }
  }, [user?.id, fetchOrders, fetchFavorites, fetchCheckIns]);

  // Real-time subscription for order status updates
  useEffect(() => {
    if (!user?.id) return;

    const subscription = supabase
      .channel('customer-orders')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `customer_id=eq.${user.id}`,
        },
        (payload) => {
          setOrders(prev =>
            prev.map(order =>
              order.id === payload.new.id
                ? { ...order, ...payload.new }
                : order
            )
          );
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user?.id]);

  if (authLoading) {
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
        return (
          <AccountTab
            profile={profile}
            setActiveTab={setActiveTab}
            ordersCount={orders.length}
            favoritesCount={favorites.length}
            onEditProfile={() => setShowEditProfile(true)}
          />
        );
      case 'orders':
        return (
          <OrdersTab
            onBack={handleTabBack}
            orders={orders}
            loading={loadingOrders}
            onReorder={handleReorder}
            onReview={handleSubmitReview}
          />
        );
      case 'favorites':
        return (
          <FavoritesTab
            onBack={handleTabBack}
            favorites={favorites}
            loading={loadingFavorites}
            onRemoveFavorite={handleRemoveFavorite}
          />
        );
      case 'rewards':
        return (
          <RewardsTab
            onBack={handleTabBack}
            points={profile?.points}
            checkIns={checkIns}
            loading={loadingCheckIns}
          />
        );
      case 'addresses':
        return <AddressesTab onBack={handleTabBack} userId={user?.id} />;
      case 'payment':
        return <PaymentTab onBack={handleTabBack} userId={user?.id} />;
      case 'notifications':
        return <NotificationsTab onBack={handleTabBack} />;
      case 'security':
        return <SecurityTab onBack={handleTabBack} onChangePassword={() => setShowChangePassword(true)} />;
      case 'help':
        return <HelpTab onBack={handleTabBack} />;
      default:
        return (
          <AccountTab
            profile={profile}
            setActiveTab={setActiveTab}
            ordersCount={orders.length}
            favoritesCount={favorites.length}
          />
        );
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

      {/* Modals */}
      <EditProfileModal
        isOpen={showEditProfile}
        onClose={() => setShowEditProfile(false)}
        profile={profile}
        onSave={handleSaveProfile}
      />
      <ChangePasswordModal
        isOpen={showChangePassword}
        onClose={() => setShowChangePassword(false)}
      />
    </div>
  );
};

export default CustomerProfile;
