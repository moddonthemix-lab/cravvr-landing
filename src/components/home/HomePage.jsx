import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { useCart } from '../../contexts/CartContext';
import { useTrucks } from '../../contexts/TruckContext';
import { useFavorites } from '../../contexts/FavoritesContext';
import { Icons } from '../common/Icons';
import { mockTrucks } from '../../data/mockData';
import './HomePage.css';

// Food Categories with emojis (specific to HomePage filter UI)
const categories = [
  { id: 'all', name: 'All', emoji: '🍽️' },
  { id: 'tacos', name: 'Tacos', emoji: '🌮' },
  { id: 'burgers', name: 'Burgers', emoji: '🍔' },
  { id: 'pizza', name: 'Pizza', emoji: '🍕' },
  { id: 'asian', name: 'Asian', emoji: '🍜' },
  { id: 'bbq', name: 'BBQ', emoji: '🍖' },
  { id: 'seafood', name: 'Seafood', emoji: '🦐' },
  { id: 'coffee', name: 'Coffee', emoji: '☕' },
  { id: 'desserts', name: 'Desserts', emoji: '🍩' },
  { id: 'healthy', name: 'Healthy', emoji: '🥗' },
  { id: 'vegan', name: 'Vegan', emoji: '🌱' },
];

const HomePage = ({ embedded = false }) => {
  const navigate = useNavigate();
  const { user, profile, signOut, openAuth, isOwner, isAdmin } = useAuth();
  const { itemCount, openCart } = useCart();
  const { trucks: contextTrucks, loading } = useTrucks();
  const { favorites, toggleFavorite } = useFavorites();

  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const popularScrollRef = useRef(null);
  const nearbyScrollRef = useRef(null);
  const allTrucksRef = useRef(null);

  // Use context trucks or fallback to mock data while loading
  const trucks = contextTrucks.length > 0 ? contextTrucks : mockTrucks;

  const scrollToAllTrucks = () => {
    allTrucksRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleToggleFavorite = (truckId) => {
    toggleFavorite(truckId);
  };

  const handleTruckClick = (truck) => {
    navigate(`/truck/${truck.id}`, { state: { truck } });
  };

  const filteredTrucks = trucks.filter(truck => {
    const matchesCategory = selectedCategory === 'all' ||
      truck.cuisine?.toLowerCase().includes(selectedCategory.toLowerCase());
    const matchesSearch = truck.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      truck.cuisine?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const popularTrucks = filteredTrucks.filter(t => t.featured || t.rating >= 4.7);
  const nearbyTrucks = filteredTrucks.filter(t => t.isOpen);

  const scrollSection = (ref, direction) => {
    if (ref.current) {
      const scrollAmount = direction === 'left' ? -320 : 320;
      ref.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const userName = profile?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || 'Guest';

  return (
    <div className="home-page">
      {/* Header */}
      <header className="home-header">
        <div className="header-left">
          <div className="logo" onClick={() => navigate('/')}>
            <img src="/logo/cravvr-logo.png" alt="Cravrr" className="logo-image" />
          </div>
        </div>

        <div className="header-center">
          <div className="search-bar">
            <span className="search-icon">{Icons.search}</span>
            <input
              type="text"
              placeholder="Search food trucks, cuisines..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="header-right">
          <div className="location-picker">
            <span className="location-icon">{Icons.mapPin}</span>
            <span className="location-text">Portland, OR</span>
          </div>

          <div className="order-type-toggle">
            <button className="type-btn active">Pickup</button>
            <button className="type-btn" disabled title="Coming soon">Delivery</button>
          </div>

          <button className="icon-btn notification-btn">
            {Icons.bell}
          </button>

          <button className="cart-btn" onClick={openCart}>
            {Icons.shoppingBag}
            {itemCount > 0 && <span className="cart-count">{itemCount}</span>}
          </button>
        </div>
      </header>

      <div className="home-layout">
        {/* Sidebar */}
        <aside className={`home-sidebar ${sidebarOpen ? 'open' : ''}`}>
          <nav className="sidebar-nav">
            <button className="nav-item active" onClick={() => navigate('/')}>
              {Icons.home}
              <span>Home</span>
            </button>
            <button className="nav-item" onClick={() => navigate('/map')}>
              {Icons.map}
              <span>Map</span>
            </button>
            <button className="nav-item" onClick={() => navigate('/discover')}>
              {Icons.compass}
              <span>Discover</span>
            </button>
            <button className="nav-item bolt-nav" onClick={() => navigate('/bolt')}>
              {Icons.bolt}
              <span>Bolt</span>
            </button>
          </nav>

          <div className="sidebar-divider" />

          <nav className="sidebar-nav">
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
                {isOwner && (
                  <button className="nav-item" onClick={() => navigate('/owner')}>
                    {Icons.truck}
                    <span>My Trucks</span>
                  </button>
                )}
                {isAdmin && (
                  <button className="nav-item" onClick={() => navigate('/admin')}>
                    {Icons.settings}
                    <span>Admin</span>
                  </button>
                )}
                <button className="nav-item signout" onClick={signOut}>
                  {Icons.logOut}
                  <span>Sign Out</span>
                </button>
              </>
            ) : (
              <button className="nav-item signin" onClick={() => openAuth('login')}>
                {Icons.user}
                <span>Sign In</span>
              </button>
            )}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="home-main">
          {/* Welcome Section */}
          <section className="welcome-section">
            <h1>Welcome back, {userName}!</h1>
          </section>

          {/* Category Pills */}
          <section className="categories-section">
            <div className="categories-scroll">
              {categories.map(cat => (
                <button
                  key={cat.id}
                  className={`category-pill ${selectedCategory === cat.id ? 'active' : ''}`}
                  onClick={() => setSelectedCategory(cat.id)}
                >
                  <span className="cat-emoji">{cat.emoji}</span>
                  <span className="cat-name">{cat.name}</span>
                </button>
              ))}
            </div>
          </section>

          {/* Promo Banner */}
          <section className="promo-section">
            <div className="promo-card primary">
              <div className="promo-content">
                <h3>New to Cravvr?</h3>
                <p>Get $5 off your first order of $15+</p>
                <button className="promo-btn" onClick={() => navigate('/eat')}>
                  Sign Up Now
                </button>
              </div>
              <div className="promo-image">
                <span className="promo-emoji">🌮🍔🍕</span>
              </div>
            </div>
            <div className="promo-card secondary">
              <div className="promo-content">
                <h3>Cravvr Rewards</h3>
                <p>Earn points on every order. Free food awaits!</p>
                <button className="promo-btn outline" onClick={() => navigate('/rewards')}>
                  Learn More
                </button>
              </div>
              <div className="promo-badge">
                <span className="badge-icon">{Icons.fire}</span>
                <span>Hot Deals</span>
              </div>
            </div>
          </section>

          {/* Popular Food Trucks */}
          <section className="trucks-section">
            <div className="section-header">
              <h2>Most Popular Food Trucks</h2>
              <div className="section-controls">
                <button className="see-all" onClick={scrollToAllTrucks}>See All</button>
                <div className="scroll-btns">
                  <button onClick={() => scrollSection(popularScrollRef, 'left')}>{Icons.chevronLeft}</button>
                  <button onClick={() => scrollSection(popularScrollRef, 'right')}>{Icons.chevronRight}</button>
                </div>
              </div>
            </div>
            <div className="trucks-scroll" ref={popularScrollRef}>
              {loading ? (
                [...Array(4)].map((_, i) => (
                  <div key={i} className="truck-card skeleton">
                    <div className="truck-image-skeleton" />
                    <div className="truck-info-skeleton" />
                  </div>
                ))
              ) : (
                popularTrucks.map(truck => (
                  <TruckCard
                    key={truck.id}
                    truck={truck}
                    isFavorite={favorites.includes(truck.id)}
                    onFavorite={() => handleToggleFavorite(truck.id)}
                    onClick={() => handleTruckClick(truck)}
                  />
                ))
              )}
            </div>
          </section>

          {/* Nearby Open Now */}
          <section className="trucks-section">
            <div className="section-header">
              <h2>Open Now Near You</h2>
              <div className="section-controls">
                <button className="see-all" onClick={scrollToAllTrucks}>See All</button>
                <div className="scroll-btns">
                  <button onClick={() => scrollSection(nearbyScrollRef, 'left')}>{Icons.chevronLeft}</button>
                  <button onClick={() => scrollSection(nearbyScrollRef, 'right')}>{Icons.chevronRight}</button>
                </div>
              </div>
            </div>
            <div className="trucks-scroll" ref={nearbyScrollRef}>
              {loading ? (
                [...Array(4)].map((_, i) => (
                  <div key={i} className="truck-card skeleton">
                    <div className="truck-image-skeleton" />
                    <div className="truck-info-skeleton" />
                  </div>
                ))
              ) : (
                nearbyTrucks.map(truck => (
                  <TruckCard
                    key={truck.id}
                    truck={truck}
                    isFavorite={favorites.includes(truck.id)}
                    onFavorite={() => handleToggleFavorite(truck.id)}
                    onClick={() => handleTruckClick(truck)}
                  />
                ))
              )}
            </div>
          </section>

          {/* All Trucks Grid */}
          {filteredTrucks.length > 0 && (
            <section className="trucks-grid-section" ref={allTrucksRef}>
              <div className="section-header">
                <h2>All Food Trucks</h2>
                <span className="truck-count">{filteredTrucks.length} trucks</span>
              </div>
              <div className="trucks-grid">
                {filteredTrucks.map(truck => (
                  <TruckCard
                    key={truck.id}
                    truck={truck}
                    isFavorite={favorites.includes(truck.id)}
                    onFavorite={() => handleToggleFavorite(truck.id)}
                    onClick={() => handleTruckClick(truck)}
                  />
                ))}
              </div>
            </section>
          )}

          {filteredTrucks.length === 0 && !loading && (
            <div className="no-results">
              <span className="no-results-emoji">🔍</span>
              <h3>No food trucks found</h3>
              <p>Try adjusting your search or category filters</p>
              <button className="clear-filters" onClick={() => { setSelectedCategory('all'); setSearchQuery(''); }}>
                Clear Filters
              </button>
            </div>
          )}
        </main>
      </div>

      {/* Footer - hidden when embedded in TabContainer */}
      {!embedded && (
        <footer className="home-footer">
          <div className="footer-content">
            <div className="footer-brand">
              <img src="/logo/cravrr-logo-transparent.png" alt="Cravrr" className="footer-logo-image" />
            </div>
            <div className="footer-links">
              <a href="/eat">About</a>
              <a href="/eat#features">Features</a>
              <a href="/eat#pricing">Pricing</a>
              <a href="/eat#faq">FAQ</a>
            </div>
            <p className="footer-copy">© 2025 Cravvr. All rights reserved.</p>
          </div>
        </footer>
      )}

      {/* Mobile Bottom Navigation */}
      {!embedded && (
        <nav className="mobile-nav">
          <div className="mobile-nav-items">
            <button className="mobile-nav-item active" onClick={() => navigate('/')}>
              {Icons.home}
              <span>Home</span>
            </button>
            <button className="mobile-nav-item" onClick={() => navigate('/map')}>
              {Icons.map}
              <span>Map</span>
            </button>
            <button className="mobile-nav-item" onClick={() => navigate('/discover')}>
              {Icons.compass}
              <span>Discover</span>
            </button>
            <button className="mobile-nav-item bolt-nav" onClick={() => navigate('/bolt')}>
              {Icons.bolt}
              <span>Bolt</span>
            </button>
            <button className="mobile-nav-item cart-nav" onClick={openCart}>
              {Icons.shoppingBag}
              <span>Cart</span>
              {itemCount > 0 && <span className="mobile-nav-badge">{itemCount}</span>}
            </button>
            <button className="mobile-nav-item" onClick={() => user ? navigate('/profile') : navigate('/eat')}>
              {Icons.user}
              <span>{user ? 'Account' : 'Sign In'}</span>
            </button>
          </div>
        </nav>
      )}
    </div>
  );
};

// Truck Card Component
const TruckCard = ({ truck, isFavorite, onFavorite, onClick }) => {
  return (
    <div className="truck-card" onClick={onClick}>
      <div className="truck-image-container">
        <img src={truck.image} alt={truck.name} className="truck-image" />
        <button
          className={`favorite-btn ${isFavorite ? 'active' : ''}`}
          onClick={(e) => { e.stopPropagation(); onFavorite(); }}
        >
          {isFavorite ? Icons.heartFilled : Icons.heart}
        </button>
        {!truck.isOpen && <div className="closed-overlay">Closed</div>}
        {truck.featured && <span className="featured-badge">Featured</span>}
      </div>
      <div className="truck-info">
        <div className="truck-header">
          <h3 className="truck-name">{truck.name}</h3>
        </div>
        <div className="truck-meta">
          <span className="truck-rating">
            {Icons.star}
            <span>{truck.rating}</span>
            <span className="review-count">({truck.reviewCount}+)</span>
          </span>
          <span className="meta-dot">•</span>
          <span className="truck-distance">{truck.distance}</span>
          <span className="meta-dot">•</span>
          <span className="truck-time">{truck.deliveryTime}</span>
        </div>
        <div className="truck-cuisine">{truck.cuisine}</div>
        <div className="truck-tags">
          <span className="tag open-tag">{truck.isOpen ? 'Open' : 'Closed'}</span>
          <span className="tag">Free pickup</span>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
