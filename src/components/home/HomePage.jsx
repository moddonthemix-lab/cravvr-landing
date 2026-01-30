import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { useCart } from '../../contexts/CartContext';
import { supabase } from '../../lib/supabase';
import './HomePage.css';

// Icons
const Icons = {
  logo: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>,
  search: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  mapPin: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>,
  home: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
  heart: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>,
  heartFilled: <svg viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>,
  clock: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  star: <svg viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
  orders: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>,
  user: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  shoppingBag: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>,
  truck: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>,
  bell: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>,
  chevronLeft: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>,
  chevronRight: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>,
  grid: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>,
  fire: <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 23c-3.9 0-7-3.1-7-7 0-2.1.8-4.1 2.3-5.6.3-.3.7-.3 1 0 .3.3.3.7 0 1-.7.8-1.3 1.7-1.7 2.7-.4 1-.6 2-.6 3 0 3.3 2.7 6 6 6s6-2.7 6-6c0-3.3-3-6.5-6-9.5-1.3 1.5-2.6 3-3.5 4.5-.2.3-.6.4-.9.2-.3-.2-.4-.6-.2-.9 1.5-2.5 3.5-4.8 5.3-6.8.3-.3.7-.3 1 0C16.2 6.6 21 11.3 21 16c0 3.9-3.1 7-7 7h-2z"/></svg>,
};

// Food Categories with emojis
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

// Mock data for initial render (will be replaced by real data)
const mockTrucks = [
  {
    id: 1,
    name: "Taco Loco",
    image: "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?auto=format&fit=crop&w=800&q=80",
    cuisine: "Mexican",
    location: "Downtown Portland",
    distance: "0.5 mi",
    rating: 4.8,
    reviewCount: 328,
    isOpen: true,
    deliveryTime: "15-25 min",
    featured: true,
  },
  {
    id: 2,
    name: "Burger Joint",
    image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80",
    cuisine: "American",
    location: "Pearl District",
    distance: "1.2 mi",
    rating: 4.6,
    reviewCount: 195,
    isOpen: true,
    deliveryTime: "20-30 min",
    featured: false,
  },
  {
    id: 3,
    name: "Thai Street",
    image: "https://images.unsplash.com/photo-1559314809-0d155014e29e?auto=format&fit=crop&w=800&q=80",
    cuisine: "Thai",
    location: "Southeast Portland",
    distance: "2.1 mi",
    rating: 4.9,
    reviewCount: 456,
    isOpen: false,
    deliveryTime: "25-40 min",
    featured: true,
  },
  {
    id: 4,
    name: "Slice Mobile",
    image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=800&q=80",
    cuisine: "Italian",
    location: "Northwest Portland",
    distance: "1.8 mi",
    rating: 4.7,
    reviewCount: 312,
    isOpen: true,
    deliveryTime: "20-35 min",
    featured: true,
  },
  {
    id: 5,
    name: "Morning Brew",
    image: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=800&q=80",
    cuisine: "Coffee & Breakfast",
    location: "Downtown Portland",
    distance: "0.3 mi",
    rating: 4.5,
    reviewCount: 187,
    isOpen: true,
    deliveryTime: "10-20 min",
    featured: false,
  },
  {
    id: 6,
    name: "Catch of the Day",
    image: "https://images.unsplash.com/photo-1579631542720-3a87824fff86?auto=format&fit=crop&w=800&q=80",
    cuisine: "Seafood",
    location: "Waterfront",
    distance: "3.2 mi",
    rating: 4.9,
    reviewCount: 267,
    isOpen: true,
    deliveryTime: "30-45 min",
    featured: false,
  },
];

const HomePage = () => {
  const navigate = useNavigate();
  const { user, profile, signOut } = useAuth();
  const { itemCount, openCart } = useCart();

  const [trucks, setTrucks] = useState(mockTrucks);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [favorites, setFavorites] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const popularScrollRef = useRef(null);
  const nearbyScrollRef = useRef(null);

  // Fetch real food trucks from Supabase
  useEffect(() => {
    const fetchTrucks = async () => {
      try {
        const { data, error } = await supabase
          .from('food_trucks')
          .select('*')
          .eq('is_active', true);

        if (error) throw error;

        if (data && data.length > 0) {
          // Map Supabase data to our format
          const mappedTrucks = data.map(truck => ({
            id: truck.id,
            name: truck.name,
            image: truck.image_url || 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?auto=format&fit=crop&w=800&q=80',
            cuisine: truck.cuisine_type || 'Food Truck',
            location: truck.current_location || 'Portland, OR',
            distance: '1.0 mi', // Would calculate from user location
            rating: truck.rating || 4.5,
            reviewCount: truck.review_count || 0,
            isOpen: truck.is_open !== false,
            deliveryTime: '15-30 min',
            featured: truck.featured || false,
            description: truck.description,
          }));
          setTrucks(mappedTrucks);
        }
      } catch (err) {
        console.error('Error fetching trucks:', err);
        // Keep mock data on error
      } finally {
        setLoading(false);
      }
    };

    fetchTrucks();
  }, []);

  // Fetch user favorites
  useEffect(() => {
    if (user) {
      const fetchFavorites = async () => {
        const { data } = await supabase
          .from('favorites')
          .select('truck_id')
          .eq('customer_id', user.id);

        if (data) {
          setFavorites(data.map(f => f.truck_id));
        }
      };
      fetchFavorites();
    }
  }, [user]);

  const toggleFavorite = async (truckId) => {
    if (!user) {
      navigate('/eat'); // Redirect to sign up
      return;
    }

    const isFavorite = favorites.includes(truckId);

    if (isFavorite) {
      setFavorites(prev => prev.filter(id => id !== truckId));
      await supabase.from('favorites').delete().eq('customer_id', user.id).eq('truck_id', truckId);
    } else {
      setFavorites(prev => [...prev, truckId]);
      await supabase.from('favorites').insert({ customer_id: user.id, truck_id: truckId });
    }
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
            {Icons.logo}
            <span className="logo-text">Cravvr</span>
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
                <button className="see-all" onClick={() => navigate('/browse')}>See All</button>
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
                    onFavorite={() => toggleFavorite(truck.id)}
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
                <button className="see-all" onClick={() => navigate('/browse')}>See All</button>
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
                    onFavorite={() => toggleFavorite(truck.id)}
                    onClick={() => handleTruckClick(truck)}
                  />
                ))
              )}
            </div>
          </section>

          {/* All Trucks Grid */}
          {filteredTrucks.length > 0 && (
            <section className="trucks-grid-section">
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
                    onFavorite={() => toggleFavorite(truck.id)}
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

      {/* Footer */}
      <footer className="home-footer">
        <div className="footer-content">
          <div className="footer-brand">
            <span className="footer-logo">{Icons.logo}</span>
            <span className="footer-name">Cravvr</span>
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
