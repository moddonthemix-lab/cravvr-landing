import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Icons } from '../common/Icons';
import './DiscoverView.css';

const DiscoverView = ({ trucks, loading, favorites, toggleFavorite, onTruckClick }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [swipeDirection, setSwipeDirection] = useState(null);
  const [likedCount, setLikedCount] = useState(favorites?.length || 0);
  const [popularItems, setPopularItems] = useState([]);

  // Fetch popular items for current truck
  useEffect(() => {
    const fetchPopularItems = async () => {
      if (!trucks.length) return;
      const currentTruck = trucks[currentIndex];
      if (!currentTruck) return;

      try {
        const { data, error } = await supabase
          .from('menu_items')
          .select('*')
          .eq('truck_id', currentTruck.id)
          .limit(2);

        if (!error && data && data.length > 0) {
          setPopularItems(data.map(item => ({
            id: item.id,
            name: item.name,
            price: `$${item.price?.toFixed(2) || '0.00'}`,
            emoji: item.emoji || '🍽️',
          })));
        } else {
          // Fallback items if no menu items found
          setPopularItems([
            { id: 1, name: 'Popular Special', price: '$12.99', emoji: '🌟' },
            { id: 2, name: 'House Favorite', price: '$10.99', emoji: '❤️' },
          ]);
        }
      } catch (err) {
        console.error('Error fetching menu items:', err);
        setPopularItems([]);
      }
    };

    fetchPopularItems();
  }, [currentIndex, trucks]);

  if (loading || trucks.length === 0) {
    return (
      <div className="discover-view">
        <div className="discover-loading">
          <div className="loading-spinner"></div>
          <p>Finding trucks to discover...</p>
        </div>
      </div>
    );
  }

  const currentTruck = trucks[currentIndex];
  const nextTruck = trucks[(currentIndex + 1) % trucks.length];

  const handleSwipe = (direction) => {
    setSwipeDirection(direction);

    setTimeout(() => {
      if (direction === 'right') {
        toggleFavorite(currentTruck.id);
        setLikedCount(prev => prev + 1);
      }
      setSwipeDirection(null);
      setCurrentIndex((prev) => (prev + 1) % trucks.length);
    }, 400);
  };

  const progressPercent = ((currentIndex + 1) / trucks.length) * 100;

  return (
    <div className="discover-view">
      {/* Header */}
      <div className="discover-header">
        <div className="discover-title">
          <h1>Discover</h1>
          <span className="liked-badge">
            {Icons.heartFilled}
            {likedCount}
          </span>
        </div>
        <p>Swipe right to save your favorites</p>
      </div>

      {/* Card Stack */}
      <div className="discover-stack">
        {/* Next Card (behind) */}
        {nextTruck && (
          <div className="discover-card next-card">
            <div className="card-image-container">
              <img src={nextTruck.image} alt={nextTruck.name} />
            </div>
          </div>
        )}

        {/* Current Card */}
        <div className={`discover-card ${swipeDirection ? `swipe-${swipeDirection}` : ''}`}>
          {/* Swipe Indicators */}
          <div className={`swipe-indicator like ${swipeDirection === 'right' ? 'show' : ''}`}>
            <span className="indicator-icon">{Icons.heartFilled}</span>
            <span>LIKE</span>
          </div>
          <div className={`swipe-indicator nope ${swipeDirection === 'left' ? 'show' : ''}`}>
            <span className="indicator-icon">{Icons.x}</span>
            <span>NOPE</span>
          </div>

          {/* Card Image */}
          <div className="card-image-container">
            <img src={currentTruck.image} alt={currentTruck.name} />
            <div className="card-image-overlay"></div>

            {/* Status Badges */}
            <div className="card-badges">
              {currentTruck.featured && (
                <span className="badge featured">
                  {Icons.star} Featured
                </span>
              )}
              <span className={`badge status ${currentTruck.isOpen ? 'open' : 'closed'}`}>
                {currentTruck.isOpen ? 'Open Now' : 'Closed'}
              </span>
            </div>

            {/* Delivery Info */}
            <div className="card-delivery-info">
              <span className="delivery-time">
                {Icons.clock}
                {currentTruck.deliveryTime}
              </span>
              <span className="delivery-fee">${currentTruck.deliveryFee} fee</span>
            </div>
          </div>

          {/* Card Info */}
          <div className="card-info">
            <div className="card-header">
              <div>
                <h2>{currentTruck.name}</h2>
                <p className="card-cuisine">{currentTruck.cuisine} • {currentTruck.priceRange}</p>
              </div>
              <div className="card-rating">
                {Icons.star}
                <span>{currentTruck.rating}</span>
              </div>
            </div>

            <p className="card-description">
              {currentTruck.description || `Delicious ${currentTruck.cuisine} food made fresh daily.`}
            </p>

            <div className="card-location">
              <span className="distance">{currentTruck.distance}</span>
              <span className="location">{currentTruck.location}</span>
            </div>

            {/* Popular Items */}
            {popularItems.length > 0 && (
              <div className="card-popular-items">
                <span className="popular-label">Popular</span>
                <div className="popular-items-list">
                  {popularItems.map(item => (
                    <div key={item.id} className="popular-item">
                      <span className="popular-emoji">{item.emoji}</span>
                      <span className="popular-name">{item.name}</span>
                      <span className="popular-price">{item.price}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="discover-actions">
        <button className="action-btn nope" onClick={() => handleSwipe('left')}>
          {Icons.x}
        </button>
        <button className="action-btn info" onClick={() => onTruckClick(currentTruck)}>
          {Icons.info}
        </button>
        <button className="action-btn like" onClick={() => handleSwipe('right')}>
          {Icons.heart}
        </button>
      </div>

      {/* Progress Bar */}
      <div className="discover-progress">
        <span className="progress-text">{currentIndex + 1} / {trucks.length}</span>
        <div className="progress-track">
          <div className="progress-fill" style={{ width: `${progressPercent}%` }}></div>
        </div>
      </div>
    </div>
  );
};

export default DiscoverView;
