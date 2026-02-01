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
const AccountTab = ({ profile, setActiveTab, ordersCount, favoritesCount }) => {
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
const OrdersTab = ({ onBack, orders, loading }) => {
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
                        <button className="order-btn secondary">
                          {Icons.repeat}
                          Reorder
                        </button>
                        {!order.has_review && (
                          <button className="order-btn primary">
                            {Icons.star}
                            Rate
                          </button>
                        )}
                      </>
                    )}
                    {getDisplayStatus(order.status) === 'preparing' && (
                      <button className="order-btn primary">
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
  const { profile, loading: authLoading, user, signOut } = useAuth();
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
          />
        );
      case 'orders':
        return (
          <OrdersTab
            onBack={handleTabBack}
            orders={orders}
            loading={loadingOrders}
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
        return (
          <AccountTab
            profile={profile}
            setActiveTab={handleTabChange}
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
          <button className="settings-button" onClick={() => handleTabChange('notifications')}>
            {Icons.bell}
          </button>
        </header>
      )}
      {renderTab()}
    </div>
  );
};

export default CustomerProfile;
