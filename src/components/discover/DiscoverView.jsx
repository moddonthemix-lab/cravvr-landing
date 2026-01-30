import React, { useState } from 'react';
import './DiscoverView.css';

// Icons
const Icons = {
  heart: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>,
  heartFilled: <svg viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>,
  x: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  info: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>,
  star: <svg viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
  clock: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
};

const DiscoverView = ({ trucks, loading, favorites, toggleFavorite, onTruckClick }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [swipeDirection, setSwipeDirection] = useState(null);
  const [likedCount, setLikedCount] = useState(favorites?.length || 0);

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
