import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { useCart } from '../../contexts/CartContext';
import { supabase } from '../../lib/supabase';

// Icons (matching the existing app icons)
const Icons = {
  chevronLeft: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>,
  chevronRight: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>,
  heart: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>,
  heartFilled: <svg viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>,
  star: <svg viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
  starOutline: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
  mapPin: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>,
  clock: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  target: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>,
  check: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>,
  share: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>,
  shoppingBag: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>,
  search: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  x: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  truck: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>,
  tag: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>,
  home: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
  orders: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>,
  user: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
};

// Default menu items for trucks without menu
const defaultMenuItems = [
  {
    id: 'default-1',
    name: 'Signature Special',
    description: 'Our most popular dish, made fresh daily with premium ingredients.',
    price: '$12.99',
    image: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?auto=format&fit=crop&w=400&q=80',
    popular: true,
    emoji: '🌟',
    category: 'Mains',
  },
  {
    id: 'default-2',
    name: 'Classic Favorite',
    description: 'A customer favorite that keeps people coming back.',
    price: '$10.99',
    image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=400&q=80',
    popular: false,
    emoji: '🍽️',
    category: 'Mains',
  },
  {
    id: 'default-3',
    name: 'Chef\'s Choice',
    description: 'Today\'s special selection prepared by our chef.',
    price: '$14.99',
    image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=400&q=80',
    popular: true,
    emoji: '👨‍🍳',
    category: 'Specials',
  },
];

// Default features
const defaultFeatures = ['Cash Accepted', 'Card Accepted', 'Mobile Pay', 'Outdoor Seating'];

// Default deals/promotions
const defaultDeals = [
  { id: 1, title: 'First Order', description: 'Get $5 off orders $15+', code: 'FIRST5', emoji: '🎉' },
  { id: 2, title: 'Free Pickup', description: '0% fees on all pickup orders', code: null, emoji: '🚶' },
];

// Helper function for relative time
const formatRelativeTime = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffDays < 1) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  return `${Math.floor(diffDays / 30)} months ago`;
};

const TruckDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signOut } = useAuth();
  const { addItem, openCart, itemCount } = useCart();

  // Core state
  const [truck, setTruck] = useState(location.state?.truck || null);
  const [menuItems, setMenuItems] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(!location.state?.truck);
  const [isFavorite, setIsFavorite] = useState(false);
  const [addedItem, setAddedItem] = useState(null);

  // New feature state
  const [orderType, setOrderType] = useState('pickup');
  const [activeCategory, setActiveCategory] = useState('all');
  const [menuSearchQuery, setMenuSearchQuery] = useState('');

  // Refs for scrolling
  const featuredScrollRef = useRef(null);

  // Fetch truck data if not passed via state
  useEffect(() => {
    const fetchTruck = async () => {
      if (truck) {
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('food_trucks')
          .select('*')
          .eq('id', id)
          .single();

        if (error) throw error;

        if (data) {
          setTruck({
            id: data.id,
            name: data.name || 'Food Truck',
            image: data.image_url || 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?auto=format&fit=crop&w=800&q=80',
            coverImage: data.cover_image_url || data.image_url || 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?auto=format&fit=crop&w=1200&q=80',
            logoUrl: data.logo_url || null,
            cuisine: data.cuisine_type || 'Food Truck',
            priceRange: data.price_range || '$$',
            description: data.description || 'Delicious food made fresh daily. Visit us to discover our amazing menu!',
            location: data.current_location || 'Portland, OR',
            hours: data.hours || '11am - 9pm',
            distance: '1.0 mi',
            rating: data.rating || 4.5,
            reviewCount: data.review_count || 0,
            isOpen: data.is_open !== false,
            deliveryTime: data.delivery_time || '15-30 min',
            deliveryFee: data.delivery_fee || null,
            featured: data.featured || false,
            features: data.features || defaultFeatures,
            promotions: data.promotions || null,
          });
        }
      } catch (err) {
        console.error('Error fetching truck:', err);
        navigate('/');
      } finally {
        setLoading(false);
      }
    };

    fetchTruck();
  }, [id, truck, navigate]);

  // Fetch menu items
  useEffect(() => {
    const fetchMenuItems = async () => {
      try {
        const { data, error } = await supabase
          .from('menu_items')
          .select('*')
          .eq('truck_id', id);

        if (error) throw error;

        if (data && data.length > 0) {
          setMenuItems(data.map(item => ({
            id: item.id,
            name: item.name,
            description: item.description || 'A delicious menu item.',
            price: `$${item.price?.toFixed(2) || '0.00'}`,
            image: item.image_url || 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?auto=format&fit=crop&w=400&q=80',
            popular: item.popular || false,
            featured: item.featured || false,
            emoji: item.emoji || '🍽️',
            category: item.category || 'Other',
          })));
        } else {
          setMenuItems(defaultMenuItems);
        }
      } catch (err) {
        console.error('Error fetching menu items:', err);
        setMenuItems(defaultMenuItems);
      }
    };

    if (id) {
      fetchMenuItems();
    }
  }, [id]);

  // Fetch reviews
  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const { data, error } = await supabase
          .from('reviews')
          .select('*')
          .eq('truck_id', id)
          .order('created_at', { ascending: false })
          .limit(5);

        if (!error && data) {
          setReviews(data);
        }
      } catch (err) {
        console.error('Error fetching reviews:', err);
      }
    };

    if (id) {
      fetchReviews();
    }
  }, [id]);

  // Check if truck is favorited
  useEffect(() => {
    const checkFavorite = async () => {
      if (!user || !id) return;

      const { data } = await supabase
        .from('favorites')
        .select('id')
        .eq('customer_id', user.id)
        .eq('truck_id', id)
        .single();

      setIsFavorite(!!data);
    };

    checkFavorite();
  }, [user, id]);

  const toggleFavorite = async () => {
    if (!user) return;

    if (isFavorite) {
      setIsFavorite(false);
      await supabase.from('favorites').delete().eq('customer_id', user.id).eq('truck_id', id);
    } else {
      setIsFavorite(true);
      await supabase.from('favorites').insert({ customer_id: user.id, truck_id: id });
    }
  };

  const handleAddToCart = (item) => {
    const cartItem = {
      id: item.id,
      name: item.name,
      description: item.description,
      price: parseFloat(item.price.replace('$', '')),
      emoji: item.emoji || '🍽️',
    };

    const truckData = {
      id: truck.id,
      name: truck.name,
    };

    const success = addItem(cartItem, truckData);
    if (success) {
      setAddedItem(item.id);
      setTimeout(() => setAddedItem(null), 1500);
    }
  };

  const handleBack = () => {
    navigate(-1);
  };

  const handleGetDirections = () => {
    const address = encodeURIComponent(truck.location || 'Portland, OR');
    window.open(`https://www.google.com/maps/search/?api=1&query=${address}`, '_blank');
  };

  const handleShare = async () => {
    const shareData = {
      title: truck.name,
      text: `Check out ${truck.name} on Cravrr!`,
      url: window.location.href,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.log('Share cancelled or failed');
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Link copied to clipboard!');
    }
  };

  const scrollFeatured = (direction) => {
    if (featuredScrollRef.current) {
      const scrollAmount = direction === 'left' ? -200 : 200;
      featuredScrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  if (loading) {
    return (
      <div className="app-view truck-detail-view-img" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: '40px', height: '40px', border: '3px solid #e5e7eb', borderTopColor: '#e11d48', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }}></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (!truck) {
    return (
      <div className="app-view truck-detail-view-img" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <div style={{ textAlign: 'center' }}>
          <h2>Truck not found</h2>
          <button onClick={() => navigate('/')} style={{ marginTop: '16px', padding: '12px 24px', background: '#e11d48', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
            Go Home
          </button>
        </div>
      </div>
    );
  }

  // Derived data
  const features = Array.isArray(truck.features) ? truck.features : defaultFeatures;
  const deals = truck.promotions || defaultDeals;
  const featuredItems = menuItems.filter(item => item.popular || item.featured);
  const categories = ['all', ...new Set(menuItems.filter(item => item.category).map(item => item.category))];

  const filteredMenuItems = menuItems.filter(item => {
    const matchesCategory = activeCategory === 'all' || item.category === activeCategory;
    const matchesSearch = !menuSearchQuery ||
      item.name.toLowerCase().includes(menuSearchQuery.toLowerCase()) ||
      item.description?.toLowerCase().includes(menuSearchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="truck-detail-page">
      {/* Left Sidebar */}
      <aside className="truck-detail-sidebar">
        <div className="sidebar-logo" onClick={() => navigate('/')}>
          <img src="/logo/cravvr-logo.png" alt="Cravrr" />
        </div>

        <nav className="sidebar-nav">
          <button className="nav-item" onClick={() => navigate('/')}>
            {Icons.home}
            <span>Home</span>
          </button>
          <button className="nav-item" onClick={() => navigate('/favorites')}>
            {Icons.heart}
            <span>Favorites</span>
          </button>
          <button className="nav-item" onClick={() => navigate('/orders')}>
            {Icons.orders}
            <span>Orders</span>
          </button>
        </nav>

        <div className="sidebar-divider" />

        <nav className="sidebar-nav">
          {user ? (
            <>
              <button className="nav-item" onClick={() => navigate('/profile')}>
                {Icons.user}
                <span>Account</span>
              </button>
              <button className="nav-item signout" onClick={signOut}>
                <span>Sign Out</span>
              </button>
            </>
          ) : (
            <button className="nav-item signin" onClick={() => navigate('/eat')}>
              {Icons.user}
              <span>Sign In</span>
            </button>
          )}
        </nav>
      </aside>

      {/* Main Content */}
      <div className="truck-detail-main">
        <div className="app-view truck-detail-view-img">
          {/* Sticky Header */}
          <div className="detail-header-img">
            <button className="detail-back-btn" onClick={handleBack}>
              {Icons.chevronLeft}
            </button>
            <div className="detail-header-title">
              <span>{truck.name}</span>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                className={`detail-fav-btn ${isFavorite ? 'active' : ''}`}
                onClick={toggleFavorite}
              >
                {isFavorite ? Icons.heartFilled : Icons.heart}
              </button>
              <button
                className="detail-fav-btn"
                onClick={openCart}
                style={{ position: 'relative' }}
              >
                {Icons.shoppingBag}
                {itemCount > 0 && (
                  <span style={{
                    position: 'absolute',
                    top: '-4px',
                    right: '-4px',
                    width: '18px',
                    height: '18px',
                    background: '#e11d48',
                    color: 'white',
                    fontSize: '0.7rem',
                    fontWeight: '600',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>{itemCount}</span>
                )}
              </button>
            </div>
          </div>

          {/* Hero Image Section with Logo Overlay */}
      <div className="truck-detail-hero-img">
        <img src={truck.coverImage || truck.image} alt={truck.name} className="hero-cover-image" />
        <div className="hero-image-overlay"></div>
        {truck.featured && (
          <div className="hero-featured-badge">
            <span>{Icons.star}</span>
            Featured
          </div>
        )}
        <div className="hero-delivery-badge">
          <span>{truck.deliveryTime || '15-25 min'}</span>
        </div>
        {/* Logo Overlay */}
        <div className="store-logo-overlay">
          <img
            src={truck.logoUrl || truck.image}
            alt={`${truck.name} logo`}
            onError={(e) => { e.target.src = truck.image; }}
          />
        </div>
      </div>

      {/* Content */}
      <div className="truck-detail-body">
        {/* Title Section */}
        <div className="detail-title-section">
          <div className="title-row">
            <h1>{truck.name}</h1>
            <div className="rating-pill">
              <span className="star">{Icons.star}</span>
              <span className="rating-num">{truck.rating || 4.5}</span>
              <span className="review-text">({truck.reviewCount || 0})</span>
            </div>
          </div>
          <p className="detail-cuisine">{truck.cuisine || 'Food Truck'} • {truck.priceRange || '$$'}</p>
          <p className="detail-description">{truck.description || 'Delicious food made fresh daily. Visit us to discover our amazing menu!'}</p>
        </div>

        {/* Order Type Toggle */}
        <div className="order-type-section">
          <div className="order-type-toggle-detail">
            <button
              className={`order-type-btn ${orderType === 'delivery' ? 'active' : ''}`}
              onClick={() => setOrderType('delivery')}
              disabled
            >
              <span className="order-type-icon">{Icons.truck}</span>
              <div className="order-type-info">
                <span className="order-type-label">Delivery</span>
                <span className="order-type-detail">{truck.deliveryFee ? `$${truck.deliveryFee} fee` : 'Coming soon'}</span>
              </div>
            </button>
            <button
              className={`order-type-btn ${orderType === 'pickup' ? 'active' : ''}`}
              onClick={() => setOrderType('pickup')}
            >
              <span className="order-type-icon">{Icons.mapPin}</span>
              <div className="order-type-info">
                <span className="order-type-label">Pickup</span>
                <span className="order-type-detail">{truck.deliveryTime || '15-25 min'} • Free</span>
              </div>
            </button>
          </div>
        </div>

        {/* Quick Info Cards */}
        <div className="quick-info-grid">
          <div className="quick-info-card">
            <span className="info-icon">{Icons.mapPin}</span>
            <div className="info-text">
              <span className="info-label">Location</span>
              <span className="info-value">{truck.location || 'Portland, OR'}</span>
            </div>
          </div>
          <div className="quick-info-card">
            <span className="info-icon">{Icons.clock}</span>
            <div className="info-text">
              <span className="info-label">Hours</span>
              <span className="info-value">{truck.hours || '11am - 9pm'}</span>
            </div>
          </div>
          <div className="quick-info-card distance">
            <span className="info-icon">{Icons.target}</span>
            <div className="info-text">
              <span className="info-label">Distance</span>
              <span className="info-value">{truck.distance || '1.0 mi'}</span>
            </div>
          </div>
          <div className={`quick-info-card status ${truck.isOpen !== false ? 'open' : 'closed'}`}>
            <span className="status-indicator">
              <span className="status-dot"></span>
            </span>
            <div className="info-text">
              <span className="info-label">Status</span>
              <span className="info-value">{truck.isOpen !== false ? 'Open Now' : 'Closed'}</span>
            </div>
          </div>
        </div>

        {/* Deals & Benefits Section */}
        {deals.length > 0 && (
          <div className="detail-section deals-section">
            <h3>Deals & Benefits</h3>
            <div className="deals-scroll">
              {deals.map(deal => (
                <div key={deal.id} className="deal-card">
                  <span className="deal-emoji">{deal.emoji}</span>
                  <div className="deal-content">
                    <h4>{deal.title}</h4>
                    <p>{deal.description}</p>
                    {deal.code && <span className="deal-code">{deal.code}</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Featured Items Carousel */}
        {featuredItems.length > 0 && (
          <div className="detail-section featured-items-section">
            <div className="section-header-detail">
              <h3>Featured Items</h3>
              <div className="scroll-btns-detail">
                <button onClick={() => scrollFeatured('left')}>{Icons.chevronLeft}</button>
                <button onClick={() => scrollFeatured('right')}>{Icons.chevronRight}</button>
              </div>
            </div>
            <div className="featured-items-scroll" ref={featuredScrollRef}>
              {featuredItems.map(item => (
                <div key={item.id} className="featured-item-card" onClick={() => handleAddToCart(item)}>
                  <div className="featured-item-image">
                    <img src={item.image} alt={item.name} />
                    <span className="featured-add-btn">+</span>
                  </div>
                  <div className="featured-item-info">
                    <h4>{item.name}</h4>
                    <span className="featured-item-price">{item.price}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Features */}
        <div className="detail-section">
          <h3>Features & Dietary</h3>
          <div className="features-grid">
            {features.map((feature, idx) => (
              <span key={idx} className="feature-tag">
                <span className="feature-check">{Icons.check}</span>
                {feature}
              </span>
            ))}
          </div>
        </div>

        {/* Menu Section */}
        <div className="detail-section menu-section-img">
          <div className="section-header">
            <h3>Menu {menuItems === defaultMenuItems ? '(Sample)' : ''}</h3>
            <span className="menu-count">{filteredMenuItems.length} items</span>
          </div>

          {/* Menu Search */}
          <div className="menu-search">
            <span className="search-icon">{Icons.search}</span>
            <input
              type="text"
              placeholder={`Search ${truck.name}'s menu...`}
              value={menuSearchQuery}
              onChange={(e) => setMenuSearchQuery(e.target.value)}
            />
            {menuSearchQuery && (
              <button className="search-clear" onClick={() => setMenuSearchQuery('')}>
                {Icons.x}
              </button>
            )}
          </div>

          {/* Category Pills */}
          {categories.length > 1 && (
            <div className="menu-categories">
              {categories.map(cat => (
                <button
                  key={cat}
                  className={`menu-category-pill ${activeCategory === cat ? 'active' : ''}`}
                  onClick={() => setActiveCategory(cat)}
                >
                  {cat === 'all' ? 'All' : cat}
                </button>
              ))}
            </div>
          )}

          {/* Menu Items Grid */}
          <div className="menu-grid-img">
            {filteredMenuItems.length === 0 ? (
              <div className="no-menu-results">
                <span>🔍</span>
                <p>No items match your search</p>
                <button onClick={() => { setMenuSearchQuery(''); setActiveCategory('all'); }}>Clear filters</button>
              </div>
            ) : (
              filteredMenuItems.map(item => (
                <div key={item.id} className="menu-item-card-img">
                  <div className="menu-item-image">
                    <img src={item.image} alt={item.name} />
                    {item.popular && <span className="popular-badge">Popular</span>}
                  </div>
                  <div className="menu-item-details">
                    <div className="menu-item-header">
                      <h4>{item.name}</h4>
                      <span className="menu-item-price">{item.price}</span>
                    </div>
                    <p className="menu-item-desc">{item.description}</p>
                    <button
                      className={`add-to-cart-btn ${addedItem === item.id ? 'added' : ''}`}
                      onClick={() => handleAddToCart(item)}
                    >
                      {addedItem === item.id ? (
                        <>
                          Added!
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="20 6 9 17 4 12"></polyline>
                          </svg>
                        </>
                      ) : (
                        <>
                          Add to Order
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="12" y1="5" x2="12" y2="19"></line>
                            <line x1="5" y1="12" x2="19" y2="12"></line>
                          </svg>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Reviews Section */}
        <div className="detail-section reviews-section">
          <div className="section-header-detail">
            <h3>Reviews ({truck.reviewCount || reviews.length})</h3>
          </div>

          {reviews.length === 0 ? (
            <div className="no-reviews">
              <span className="no-reviews-emoji">📝</span>
              <p>No reviews yet. Be the first to review!</p>
            </div>
          ) : (
            <div className="reviews-list">
              {reviews.map(review => (
                <div key={review.id} className="review-card">
                  <div className="review-header">
                    <div className="reviewer-info">
                      <div className="reviewer-avatar">
                        {review.customer_name?.charAt(0) || 'C'}
                      </div>
                      <div>
                        <span className="reviewer-name">{review.customer_name || 'Customer'}</span>
                        <div className="review-rating">
                          {[...Array(5)].map((_, i) => (
                            <span key={i} className={`star-icon ${i < review.rating ? 'filled' : ''}`}>
                              {i < review.rating ? Icons.star : Icons.starOutline}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                    <span className="review-date">{formatRelativeTime(review.created_at)}</span>
                  </div>
                  {review.comment && <p className="review-comment">{review.comment}</p>}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* CTA Buttons */}
        <div className="detail-cta">
          <button className="cta-directions" onClick={handleGetDirections}>
            {Icons.mapPin}
            Get Directions
          </button>
          <button className="cta-share" onClick={handleShare}>
            {Icons.share}
            Share
          </button>
        </div>
      </div>
        </div>
      </div>
    </div>
  );
};

export default TruckDetailPage;
