import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { useCart } from '../../contexts/CartContext';
import { supabase } from '../../lib/supabase';
import './TruckDetailPage.css';

// Icons (matching the existing app icons)
const Icons = {
  chevronLeft: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>,
  heart: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>,
  heartFilled: <svg viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>,
  star: <svg viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
  mapPin: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>,
  clock: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  target: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>,
  check: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>,
  plus: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  shoppingBag: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>,
};

const TruckDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { addItem, openCart, itemCount } = useCart();

  const [truck, setTruck] = useState(location.state?.truck || null);
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(!location.state?.truck);
  const [isFavorite, setIsFavorite] = useState(false);
  const [addedItem, setAddedItem] = useState(null);

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
            name: data.name,
            image: data.image_url || 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?auto=format&fit=crop&w=800&q=80',
            coverImage: data.cover_image_url || data.image_url,
            cuisine: data.cuisine_type || 'Food Truck',
            priceRange: data.price_range || '$$',
            description: data.description || 'Delicious food made fresh daily.',
            location: data.current_location || 'Portland, OR',
            hours: data.hours || '11am - 9pm',
            distance: '1.0 mi',
            rating: data.rating || 4.5,
            reviewCount: data.review_count || 0,
            isOpen: data.is_open !== false,
            deliveryTime: '15-30 min',
            featured: data.featured || false,
            features: data.features || ['Cash', 'Card', 'Mobile Pay'],
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
            description: item.description || '',
            price: `$${item.price?.toFixed(2) || '0.00'}`,
            image: item.image_url || 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?auto=format&fit=crop&w=400&q=80',
            popular: item.popular || false,
            emoji: item.emoji || '🍽️',
          })));
        } else {
          // Default menu items if none exist
          setMenuItems([
            { id: 1, name: 'Signature Dish', description: 'Our most popular item', price: '$12.99', image: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?auto=format&fit=crop&w=400&q=80', popular: true, emoji: '🌟' },
            { id: 2, name: 'Classic Favorite', description: 'A customer favorite', price: '$10.99', image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=400&q=80', popular: false, emoji: '🍽️' },
          ]);
        }
      } catch (err) {
        console.error('Error fetching menu items:', err);
        // Set default menu items on error
        setMenuItems([
          { id: 1, name: 'Signature Dish', description: 'Our most popular item', price: '$12.99', image: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?auto=format&fit=crop&w=400&q=80', popular: true, emoji: '🌟' },
        ]);
      }
    };

    if (id) {
      fetchMenuItems();
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
    if (!user) {
      navigate('/');
      return;
    }

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

  if (loading) {
    return (
      <div className="truck-detail-page loading">
        <div className="loading-spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  if (!truck) {
    return (
      <div className="truck-detail-page not-found">
        <h2>Truck not found</h2>
        <button onClick={() => navigate('/')}>Go Home</button>
      </div>
    );
  }

  const features = truck.features || ['Cash', 'Card', 'Mobile Pay'];

  return (
    <div className="truck-detail-page">
      {/* Header */}
      <header className="truck-detail-header">
        <button className="back-btn" onClick={handleBack}>
          {Icons.chevronLeft}
        </button>
        <div className="header-title">
          <span>{truck.name}</span>
        </div>
        <div className="header-actions">
          <button
            className={`favorite-btn ${isFavorite ? 'active' : ''}`}
            onClick={toggleFavorite}
          >
            {isFavorite ? Icons.heartFilled : Icons.heart}
          </button>
          <button className="cart-btn" onClick={openCart}>
            {Icons.shoppingBag}
            {itemCount > 0 && <span className="cart-count">{itemCount}</span>}
          </button>
        </div>
      </header>

      {/* Hero Image */}
      <div className="truck-hero">
        <img src={truck.coverImage || truck.image} alt={truck.name} />
        <div className="hero-overlay"></div>
        {truck.featured && (
          <div className="featured-badge">
            <span>{Icons.star}</span>
            Featured
          </div>
        )}
        <div className="delivery-badge">
          <span>{truck.deliveryTime || '15-25 min'}</span>
        </div>
      </div>

      {/* Content */}
      <div className="truck-content">
        {/* Title Section */}
        <div className="title-section">
          <div className="title-row">
            <h1>{truck.name}</h1>
            <div className="rating-pill">
              <span className="star">{Icons.star}</span>
              <span className="rating-num">{truck.rating}</span>
              <span className="review-text">({truck.reviewCount})</span>
            </div>
          </div>
          <p className="cuisine">{truck.cuisine} • {truck.priceRange || '$$'}</p>
          <p className="description">{truck.description}</p>
        </div>

        {/* Quick Info */}
        <div className="quick-info-grid">
          <div className="info-card">
            <span className="info-icon">{Icons.mapPin}</span>
            <div className="info-text">
              <span className="info-label">Location</span>
              <span className="info-value">{truck.location}</span>
            </div>
          </div>
          <div className="info-card">
            <span className="info-icon">{Icons.clock}</span>
            <div className="info-text">
              <span className="info-label">Hours</span>
              <span className="info-value">{truck.hours || '11am - 9pm'}</span>
            </div>
          </div>
          <div className="info-card">
            <span className="info-icon">{Icons.target}</span>
            <div className="info-text">
              <span className="info-label">Distance</span>
              <span className="info-value">{truck.distance}</span>
            </div>
          </div>
          <div className={`info-card status ${truck.isOpen ? 'open' : 'closed'}`}>
            <span className="status-dot"></span>
            <div className="info-text">
              <span className="info-label">Status</span>
              <span className="info-value">{truck.isOpen ? 'Open Now' : 'Closed'}</span>
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="section">
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

        {/* Menu */}
        <div className="section menu-section">
          <div className="section-header">
            <h3>Menu</h3>
            <span className="menu-count">{menuItems.length} items</span>
          </div>
          <div className="menu-grid">
            {menuItems.map(item => (
              <div key={item.id} className="menu-item-card">
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
                    disabled={addedItem === item.id}
                  >
                    {addedItem === item.id ? (
                      <>
                        <span className="check-icon">{Icons.check}</span>
                        Added
                      </>
                    ) : (
                      <>
                        <span className="plus-icon">{Icons.plus}</span>
                        Add to Cart
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TruckDetailPage;
