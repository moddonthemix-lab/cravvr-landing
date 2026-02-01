import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { supabase } from '../../lib/supabase';
import { Icons } from '../common/Icons';
import { formatDate } from '../../utils/formatters';
import './CustomerProfile.css';

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
const AccountTab = ({ profile, setActiveTab, ordersCount, favoritesCount, onEditProfile, showDesktopTitle }) => {
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
      {showDesktopTitle && (
        <div className="profile-desktop-title">
          <h1>My Account</h1>
          <button className="desktop-settings-btn" onClick={() => setActiveTab('notifications')}>
            {Icons.bell}
            <span>Notifications</span>
          </button>
        </div>
      )}
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

// Orders Tab
const OrdersTab = ({ onBack, orders, loading, onReview, onTrack, onReorder }) => {
  const [filter, setFilter] = useState('all');

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
                          <button className="order-btn primary" onClick={() => onReview(order)}>
                            {Icons.star}
                            Rate
                          </button>
                        )}
                      </>
                    )}
                    {getDisplayStatus(order.status) === 'preparing' && (
                      <button className="order-btn primary" onClick={() => onTrack(order)}>
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

// Addresses Tab
const AddressesTab = ({ onBack, userId }) => {
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);

  const fetchAddresses = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('addresses')
        .select('*')
        .eq('user_id', userId)
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAddresses(data || []);
    } catch (err) {
      console.error('Error fetching addresses:', err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchAddresses();
  }, [fetchAddresses]);

  const handleAdd = () => {
    setEditingAddress(null);
    setShowModal(true);
  };

  const handleEdit = (address) => {
    setEditingAddress(address);
    setShowModal(true);
  };

  const handleDelete = async (addressId) => {
    if (!window.confirm('Are you sure you want to delete this address?')) return;
    try {
      const { error } = await supabase
        .from('addresses')
        .delete()
        .eq('id', addressId);

      if (error) throw error;
      fetchAddresses();
    } catch (err) {
      console.error('Error deleting address:', err);
      alert('Failed to delete address');
    }
  };

  const handleSave = () => {
    fetchAddresses();
  };

  return (
    <div className="tab-page">
      <ProfileHeader onBack={onBack} title="Saved Addresses" />

      <div className="tab-content">
        {loading ? (
          <div className="loading-state">{Icons.loader} Loading addresses...</div>
        ) : addresses.length === 0 ? (
          <div className="empty-state">
            <p>No saved addresses yet. Add one to make checkout faster!</p>
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
                  <button className="address-edit" onClick={() => handleEdit(addr)}>
                    {Icons.edit}
                  </button>
                  <button className="address-delete" onClick={() => handleDelete(addr.id)}>
                    {Icons.trash}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <button className="add-address-btn" onClick={handleAdd}>
          {Icons.plus}
          Add New Address
        </button>
      </div>

      <AddressModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        address={editingAddress}
        onSave={handleSave}
        userId={userId}
      />
    </div>
  );
};

// Payment Tab
const PaymentTab = ({ onBack, userId }) => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPayment, setEditingPayment] = useState(null);

  const fetchPayments = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('payment_methods')
        .select('*')
        .eq('user_id', userId)
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPayments(data || []);
    } catch (err) {
      console.error('Error fetching payment methods:', err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  const handleAdd = () => {
    setEditingPayment(null);
    setShowModal(true);
  };

  const handleEdit = (payment) => {
    setEditingPayment(payment);
    setShowModal(true);
  };

  const handleDelete = async (paymentId) => {
    if (!window.confirm('Are you sure you want to delete this payment method?')) return;
    try {
      const { error } = await supabase
        .from('payment_methods')
        .delete()
        .eq('id', paymentId);

      if (error) throw error;
      fetchPayments();
    } catch (err) {
      console.error('Error deleting payment method:', err);
      alert('Failed to delete payment method');
    }
  };

  const handleSave = () => {
    fetchPayments();
  };

  return (
    <div className="tab-page">
      <ProfileHeader onBack={onBack} title="Payment Methods" />

      <div className="tab-content">
        {loading ? (
          <div className="loading-state">{Icons.loader} Loading payment methods...</div>
        ) : payments.length === 0 ? (
          <div className="empty-state">
            <p>No payment methods saved yet. Add one for faster checkout!</p>
          </div>
        ) : (
          <div className="payment-list">
            {payments.map(card => (
              <div className={`payment-card ${card.is_default ? 'default' : ''}`} key={card.id}>
                <div className="card-icon">{Icons.creditCard}</div>
                <div className="card-info">
                  <div className="card-type">
                    {card.card_type} •••• {card.last_four}
                    {card.is_default && <span className="default-badge">Default</span>}
                  </div>
                  <span className="card-expiry">
                    Expires {String(card.expiry_month).padStart(2, '0')}/{card.expiry_year}
                  </span>
                </div>
                <div className="card-actions">
                  <button className="card-edit" onClick={() => handleEdit(card)}>
                    {Icons.edit}
                  </button>
                  <button className="card-delete" onClick={() => handleDelete(card.id)}>
                    {Icons.trash}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <button className="add-payment-btn" onClick={handleAdd}>
          {Icons.plus}
          Add Payment Method
        </button>
      </div>

      <PaymentModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        payment={editingPayment}
        onSave={handleSave}
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

// Review Modal
const ReviewModal = ({ isOpen, onClose, order, onSubmit }) => {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rating === 0) {
      alert('Please select a rating');
      return;
    }
    setSubmitting(true);
    try {
      await onSubmit({ rating, comment, orderId: order.id, truckId: order.truck_id });
      onClose();
      setRating(0);
      setComment('');
    } catch (err) {
      console.error('Failed to submit review:', err);
      alert('Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Rate Your Order</h2>
          <button className="modal-close" onClick={onClose}>{Icons.close}</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="order-review-info">
            <p><strong>{order?.truck_name}</strong></p>
            <p className="review-date">{formatDate(order?.created_at)}</p>
          </div>
          <div className="form-group">
            <label>Your Rating</label>
            <div className="star-rating">
              {[1, 2, 3, 4, 5].map(star => (
                <button
                  key={star}
                  type="button"
                  className={`star-btn ${star <= rating ? 'filled' : ''}`}
                  onClick={() => setRating(star)}
                >
                  {Icons.star}
                </button>
              ))}
            </div>
          </div>
          <div className="form-group">
            <label>Your Review (Optional)</label>
            <textarea
              value={comment}
              onChange={e => setComment(e.target.value)}
              placeholder="Share your experience..."
              rows="4"
            />
          </div>
          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={submitting}>
              {submitting ? 'Submitting...' : 'Submit Review'}
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
    { status: 'pending', label: 'Order Placed', icon: Icons.check },
    { status: 'confirmed', label: 'Confirmed', icon: Icons.check },
    { status: 'preparing', label: 'Preparing', icon: Icons.loader },
    { status: 'ready', label: 'Ready', icon: Icons.check },
    { status: 'completed', label: 'Completed', icon: Icons.check },
  ];

  const currentStatusIndex = statusSteps.findIndex(s => s.status === order?.status);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content track-order-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Track Order</h2>
          <button className="modal-close" onClick={onClose}>{Icons.close}</button>
        </div>
        <div className="track-order-content">
          <div className="order-track-info">
            <p><strong>{order?.truck_name}</strong></p>
            <p>Order #{order?.id?.slice(0, 8)}</p>
          </div>
          <div className="status-timeline">
            {statusSteps.map((step, index) => (
              <div
                key={step.status}
                className={`status-step ${index <= currentStatusIndex ? 'completed' : ''} ${index === currentStatusIndex ? 'current' : ''}`}
              >
                <div className="step-icon">{step.icon}</div>
                <div className="step-label">{step.label}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="modal-actions">
          <button className="btn-primary" onClick={onClose}>
            Close
          </button>
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
  const [error, setError] = useState('');

  useEffect(() => {
    if (address) {
      setFormData({
        label: address.label || '',
        address_line1: address.address_line1 || '',
        address_line2: address.address_line2 || '',
        city: address.city || '',
        state: address.state || '',
        zip_code: address.zip_code || '',
        is_default: address.is_default || false,
      });
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
    setError('');
    try {
      if (address) {
        // Update existing address
        const { error } = await supabase
          .from('addresses')
          .update(formData)
          .eq('id', address.id);
        if (error) throw error;
      } else {
        // Insert new address
        const { error } = await supabase
          .from('addresses')
          .insert([{ ...formData, user_id: userId }]);
        if (error) throw error;
      }
      onSave();
      onClose();
    } catch (err) {
      console.error('Failed to save address:', err);
      setError(err.message || 'Failed to save address');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{address ? 'Edit Address' : 'Add New Address'}</h2>
          <button className="modal-close" onClick={onClose}>{Icons.close}</button>
        </div>
        <form onSubmit={handleSubmit}>
          {error && <div className="error-message">{error}</div>}
          <div className="form-group">
            <label>Label</label>
            <select
              value={formData.label}
              onChange={e => setFormData({ ...formData, label: e.target.value })}
              required
            >
              <option value="">Select a label</option>
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
              onChange={e => setFormData({ ...formData, address_line1: e.target.value })}
              placeholder="123 Main St"
              required
            />
          </div>
          <div className="form-group">
            <label>Address Line 2 (Optional)</label>
            <input
              type="text"
              value={formData.address_line2}
              onChange={e => setFormData({ ...formData, address_line2: e.target.value })}
              placeholder="Apt, Suite, Unit, etc."
            />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>City</label>
              <input
                type="text"
                value={formData.city}
                onChange={e => setFormData({ ...formData, city: e.target.value })}
                placeholder="Portland"
                required
              />
            </div>
            <div className="form-group">
              <label>State</label>
              <input
                type="text"
                value={formData.state}
                onChange={e => setFormData({ ...formData, state: e.target.value })}
                placeholder="OR"
                required
              />
            </div>
            <div className="form-group">
              <label>ZIP Code</label>
              <input
                type="text"
                value={formData.zip_code}
                onChange={e => setFormData({ ...formData, zip_code: e.target.value })}
                placeholder="97201"
                required
              />
            </div>
          </div>
          <div className="form-group checkbox-group">
            <label>
              <input
                type="checkbox"
                checked={formData.is_default}
                onChange={e => setFormData({ ...formData, is_default: e.target.checked })}
              />
              <span>Set as default address</span>
            </label>
          </div>
          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Saving...' : (address ? 'Update Address' : 'Add Address')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Payment Modal
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
  const [error, setError] = useState('');

  useEffect(() => {
    if (payment) {
      setFormData({
        card_type: payment.card_type || '',
        last_four: payment.last_four || '',
        expiry_month: payment.expiry_month || '',
        expiry_year: payment.expiry_year || '',
        cardholder_name: payment.cardholder_name || '',
        is_default: payment.is_default || false,
      });
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
    setError('');
    try {
      if (payment) {
        // Update existing payment method
        const { error } = await supabase
          .from('payment_methods')
          .update(formData)
          .eq('id', payment.id);
        if (error) throw error;
      } else {
        // Insert new payment method
        const { error } = await supabase
          .from('payment_methods')
          .insert([{ ...formData, user_id: userId }]);
        if (error) throw error;
      }
      onSave();
      onClose();
    } catch (err) {
      console.error('Failed to save payment method:', err);
      setError(err.message || 'Failed to save payment method');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{payment ? 'Edit Payment Method' : 'Add Payment Method'}</h2>
          <button className="modal-close" onClick={onClose}>{Icons.close}</button>
        </div>
        <form onSubmit={handleSubmit}>
          {error && <div className="error-message">{error}</div>}
          <div className="form-group">
            <label>Card Type</label>
            <select
              value={formData.card_type}
              onChange={e => setFormData({ ...formData, card_type: e.target.value })}
              required
            >
              <option value="">Select card type</option>
              <option value="Visa">Visa</option>
              <option value="Mastercard">Mastercard</option>
              <option value="Amex">American Express</option>
              <option value="Discover">Discover</option>
            </select>
          </div>
          <div className="form-group">
            <label>Cardholder Name</label>
            <input
              type="text"
              value={formData.cardholder_name}
              onChange={e => setFormData({ ...formData, cardholder_name: e.target.value })}
              placeholder="John Doe"
              required
            />
          </div>
          <div className="form-group">
            <label>Last 4 Digits</label>
            <input
              type="text"
              value={formData.last_four}
              onChange={e => setFormData({ ...formData, last_four: e.target.value })}
              placeholder="4242"
              maxLength="4"
              pattern="[0-9]{4}"
              required
            />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Expiry Month</label>
              <select
                value={formData.expiry_month}
                onChange={e => setFormData({ ...formData, expiry_month: parseInt(e.target.value) })}
                required
              >
                <option value="">MM</option>
                {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                  <option key={month} value={month}>
                    {month.toString().padStart(2, '0')}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Expiry Year</label>
              <select
                value={formData.expiry_year}
                onChange={e => setFormData({ ...formData, expiry_year: parseInt(e.target.value) })}
                required
              >
                <option value="">YYYY</option>
                {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() + i).map(year => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="form-group checkbox-group">
            <label>
              <input
                type="checkbox"
                checked={formData.is_default}
                onChange={e => setFormData({ ...formData, is_default: e.target.checked })}
              />
              <span>Set as default payment method</span>
            </label>
          </div>
          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Saving...' : (payment ? 'Update Payment' : 'Add Payment')}
            </button>
          </div>
        </form>
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
  const [error, setError] = useState('');

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
    setError('');
    try {
      await onSave(formData);
      onClose();
    } catch (err) {
      console.error('Failed to update profile:', err);
      setError(err.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Edit Profile</h2>
          <button className="modal-close" onClick={onClose}>{Icons.close}</button>
        </div>
        <form onSubmit={handleSubmit}>
          {error && <div className="error-message">{error}</div>}
          <div className="form-group">
            <label>Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label>Phone</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={e => setFormData({ ...formData, phone: e.target.value })}
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
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Change Password</h2>
          <button className="modal-close" onClick={onClose}>{Icons.close}</button>
        </div>
        <form onSubmit={handleSubmit}>
          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message">{success}</div>}
          <div className="form-group">
            <label>New Password</label>
            <input
              type="password"
              value={formData.newPassword}
              onChange={e => setFormData({ ...formData, newPassword: e.target.value })}
              required
              minLength={6}
            />
          </div>
          <div className="form-group">
            <label>Confirm Password</label>
            <input
              type="password"
              value={formData.confirmPassword}
              onChange={e => setFormData({ ...formData, confirmPassword: e.target.value })}
              required
              minLength={6}
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

// Main Customer Profile Component
const CustomerProfile = ({ onBack }) => {
  const { profile, loading: authLoading, user, signOut } = useAuth();
  const [isMobile, setIsMobile] = React.useState(window.innerWidth < 768);

  // Track window size for responsive header display
  React.useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  const [searchParams, setSearchParams] = useSearchParams();
  const tabFromUrl = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState(tabFromUrl || 'account');

  // Sync activeTab changes to URL
  const handleTabChange = useCallback((tab) => {
    setActiveTab(tab);
    if (tab === 'account') {
      setSearchParams({});
    } else {
      setSearchParams({ tab });
    }
  }, [setSearchParams]);

  // Data state
  const [orders, setOrders] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [checkIns, setCheckIns] = useState([]);

  // Loading states
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [loadingFavorites, setLoadingFavorites] = useState(true);
  const [loadingCheckIns, setLoadingCheckIns] = useState(true);

  // Modal states
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showTrackModal, setShowTrackModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  // Handle profile update
  const handleSaveProfile = async (updatedData) => {
    if (!user?.id) return;
    const { error } = await supabase
      .from('customer_profiles')
      .update(updatedData)
      .eq('user_id', user.id);

    if (error) throw error;

    // Refresh profile data (AuthContext will handle this automatically)
    window.location.reload(); // Simple refresh for now
  };

  // Handle order actions
  const handleReorder = (order) => {
    alert(`Reorder functionality coming soon! Order ID: ${order.id}`);
    // TODO: Add items to cart and navigate to checkout
  };

  const handleReview = (order) => {
    setSelectedOrder(order);
    setShowReviewModal(true);
  };

  const handleTrackOrder = (order) => {
    setSelectedOrder(order);
    setShowTrackModal(true);
  };

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

      // Refresh orders
      fetchOrders();
      alert('Thank you for your review!');
    } catch (err) {
      console.error('Error submitting review:', err);
      throw err;
    }
  };

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
      const { error } = await supabase
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
    const showFallbackHeader = isMobile || onBack;
    return (
      <div className="customer-profile">
        {showFallbackHeader && (
          <header className="main-profile-header">
            {onBack ? (
              <button className="back-button" onClick={onBack}>
                {Icons.chevronLeft}
              </button>
            ) : (
              <div className="header-spacer"></div>
            )}
            <h1>Account</h1>
            <div className="header-spacer"></div>
          </header>
        )}
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

  const handleTabBack = () => handleTabChange('account');

  const renderTab = () => {
    switch (activeTab) {
      case 'account':
        return (
          <AccountTab
            profile={profile}
            setActiveTab={handleTabChange}
            ordersCount={orders.length}
            favoritesCount={favorites.length}
            onEditProfile={() => setShowEditProfile(true)}
            showDesktopTitle={!isMobile && !onBack}
          />
        );
      case 'orders':
        return (
          <OrdersTab
            onBack={handleTabBack}
            orders={orders}
            loading={loadingOrders}
            onReview={handleReview}
            onTrack={handleTrackOrder}
            onReorder={handleReorder}
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
            setActiveTab={handleTabChange}
            ordersCount={orders.length}
            favoritesCount={favorites.length}
            onEditProfile={() => setShowEditProfile(true)}
            showDesktopTitle={!isMobile && !onBack}
          />
        );
    }
  };

  // Show main header only on mobile when using AppLayout (no onBack provided on desktop)
  const showMainHeader = activeTab === 'account' && (isMobile || onBack);

  return (
    <div className="customer-profile">
      {showMainHeader && (
        <header className="main-profile-header">
          {onBack ? (
            <button className="back-button" onClick={onBack}>
              {Icons.chevronLeft}
            </button>
          ) : (
            <div className="header-spacer"></div>
          )}
          <h1>Account</h1>
          <button className="settings-button" onClick={() => handleTabChange('notifications')}>
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
      <ReviewModal
        isOpen={showReviewModal}
        onClose={() => setShowReviewModal(false)}
        order={selectedOrder}
        onSubmit={handleSubmitReview}
      />
      <TrackOrderModal
        isOpen={showTrackModal}
        onClose={() => setShowTrackModal(false)}
        order={selectedOrder}
      />
    </div>
  );
};

export default CustomerProfile;
