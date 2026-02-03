import React, { useState, useEffect, useRef, useMemo } from 'react';
import TinderCard from 'react-tinder-card';
import { supabase } from '../../lib/supabase';
import { Icons } from '../common/Icons';
import './DiscoverView.css';

const DiscoverView = ({ trucks = [], loading, favorites, toggleFavorite, onTruckClick }) => {
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [lastDirection, setLastDirection] = useState(null);
  const [likedCount, setLikedCount] = useState(favorites?.length || 0);
  const [popularItemsMap, setPopularItemsMap] = useState({});
  const [swipeProgress, setSwipeProgress] = useState({ direction: null, progress: 0 });

  // Create refs for each card to enable programmatic swiping
  const currentIndexRef = useRef(currentIndex);
  const childRefs = useMemo(
    () => trucks.length > 0 ? Array(trucks.length).fill(0).map(() => React.createRef()) : [],
    [trucks.length]
  );

  // Keep ref in sync with state
  useEffect(() => {
    currentIndexRef.current = currentIndex;
  }, [currentIndex]);

  // Reset index when trucks change
  useEffect(() => {
    if (trucks.length > 0) {
      setCurrentIndex(trucks.length - 1);
    }
  }, [trucks.length]);

  // Fetch popular items for visible trucks (current and a few behind)
  useEffect(() => {
    const fetchPopularItems = async () => {
      if (!trucks.length) return;

      // Get items for current and next few trucks
      const indicesToFetch = [];
      for (let i = currentIndex; i >= Math.max(0, currentIndex - 3); i--) {
        if (trucks[i] && !popularItemsMap[trucks[i].id]) {
          indicesToFetch.push(i);
        }
      }

      for (const idx of indicesToFetch) {
        const truck = trucks[idx];
        try {
          const { data, error } = await supabase
            .from('menu_items')
            .select('*')
            .eq('truck_id', truck.id)
            .limit(2);

          if (!error && data && data.length > 0) {
            setPopularItemsMap(prev => ({
              ...prev,
              [truck.id]: data.map(item => ({
                id: item.id,
                name: item.name,
                price: `$${item.price?.toFixed(2) || '0.00'}`,
                emoji: item.emoji || '🍽️',
              }))
            }));
          } else {
            setPopularItemsMap(prev => ({
              ...prev,
              [truck.id]: [
                { id: 1, name: 'Popular Special', price: '$12.99', emoji: '🌟' },
                { id: 2, name: 'House Favorite', price: '$10.99', emoji: '❤️' },
              ]
            }));
          }
        } catch (err) {
          console.error('Error fetching menu items:', err);
        }
      }
    };

    fetchPopularItems();
  }, [currentIndex, trucks]);

  const updateCurrentIndex = (val) => {
    setCurrentIndex(val);
    currentIndexRef.current = val;
  };

  const canSwipe = currentIndex >= 0;

  const swiped = (direction, truck, index) => {
    setLastDirection(direction);
    setSwipeProgress({ direction: null, progress: 0 });

    if (direction === 'right') {
      toggleFavorite(truck.id);
      setLikedCount(prev => prev + 1);
    }

    updateCurrentIndex(index - 1);
  };

  const outOfFrame = (name, idx) => {
    // Card has left the screen
    if (currentIndexRef.current >= idx && childRefs[idx].current) {
      childRefs[idx].current.restoreCard();
    }
  };

  const swipe = async (dir) => {
    if (canSwipe && currentIndex < trucks.length && childRefs[currentIndex]?.current) {
      await childRefs[currentIndex].current.swipe(dir);
    }
  };

  // Handle card drag for visual feedback
  const handleCardDrag = (direction, xMovement) => {
    const progress = Math.min(Math.abs(xMovement) / 100, 1);
    setSwipeProgress({
      direction: xMovement > 0 ? 'right' : 'left',
      progress
    });
  };

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

  const canGoBack = currentIndex < trucks.length - 1;
  const progressPercent = ((trucks.length - currentIndex) / trucks.length) * 100;

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
        <p>Swipe right to save, left to skip</p>
      </div>

      {/* Card Stack */}
      <div className="discover-stack">
        <div className="card-container">
          {trucks.length > 0 && trucks.map((truck, index) => (
            <TinderCard
              ref={childRefs[index]}
              key={truck.id}
              className="swipe-card"
              onSwipe={(dir) => swiped(dir, truck, index)}
              onCardLeftScreen={() => outOfFrame(truck.name, index)}
              preventSwipe={['up', 'down']}
              swipeRequirementType="position"
              swipeThreshold={100}
            >
              <div
                className={`discover-card ${index === currentIndex ? 'active' : ''}`}
                style={{
                  zIndex: trucks.length - index,
                  transform: index < currentIndex
                    ? `scale(${1 - (currentIndex - index) * 0.05}) translateY(${(currentIndex - index) * 8}px)`
                    : 'none',
                  opacity: index < currentIndex - 2 ? 0 : 1
                }}
              >
                {/* Swipe Indicators - Show based on drag progress */}
                {index === currentIndex && (
                  <>
                    <div
                      className={`swipe-indicator like ${swipeProgress.direction === 'right' ? 'show' : ''}`}
                      style={{
                        opacity: swipeProgress.direction === 'right' ? swipeProgress.progress : 0,
                        transform: `scale(${0.8 + (swipeProgress.direction === 'right' ? swipeProgress.progress * 0.4 : 0)}) rotate(-15deg)`
                      }}
                    >
                      <span className="indicator-icon">{Icons.heartFilled}</span>
                      <span>LIKE</span>
                    </div>
                    <div
                      className={`swipe-indicator nope ${swipeProgress.direction === 'left' ? 'show' : ''}`}
                      style={{
                        opacity: swipeProgress.direction === 'left' ? swipeProgress.progress : 0,
                        transform: `scale(${0.8 + (swipeProgress.direction === 'left' ? swipeProgress.progress * 0.4 : 0)}) rotate(15deg)`
                      }}
                    >
                      <span className="indicator-icon">{Icons.x}</span>
                      <span>NOPE</span>
                    </div>
                  </>
                )}

                {/* Card Image */}
                <div className="card-image-container">
                  <img src={truck.image} alt={truck.name} draggable={false} />
                  <div className="card-image-overlay"></div>

                  {/* Status Badges */}
                  <div className="card-badges">
                    {truck.featured && (
                      <span className="badge featured">
                        {Icons.star} Featured
                      </span>
                    )}
                    <span className={`badge status ${truck.isOpen ? 'open' : 'closed'}`}>
                      {truck.isOpen ? 'Open Now' : 'Closed'}
                    </span>
                  </div>

                  {/* Delivery Info */}
                  <div className="card-delivery-info">
                    <span className="delivery-time">
                      {Icons.clock}
                      {truck.deliveryTime}
                    </span>
                    <span className="delivery-fee">${truck.deliveryFee} fee</span>
                  </div>
                </div>

                {/* Card Info */}
                <div className="card-info">
                  <div className="card-header">
                    <div>
                      <h2>{truck.name}</h2>
                      <p className="card-cuisine">{truck.cuisine} • {truck.priceRange}</p>
                    </div>
                    <div className="card-rating">
                      {Icons.star}
                      <span>{truck.rating}</span>
                    </div>
                  </div>

                  <p className="card-description">
                    {truck.description || `Delicious ${truck.cuisine} food made fresh daily.`}
                  </p>

                  <div className="card-location">
                    <span className="distance">{truck.distance}</span>
                    <span className="location">{truck.location}</span>
                  </div>

                  {/* Popular Items */}
                  {popularItemsMap[truck.id]?.length > 0 && (
                    <div className="card-popular-items">
                      <span className="popular-label">Popular</span>
                      <div className="popular-items-list">
                        {popularItemsMap[truck.id].map(item => (
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
            </TinderCard>
          ))}

          {/* Empty state when all cards swiped */}
          {currentIndex < 0 && (
            <div className="discover-empty">
              <div className="empty-icon">🎉</div>
              <h3>You've seen them all!</h3>
              <p>Check back later for more food trucks</p>
              <button
                className="reset-btn"
                onClick={() => {
                  setCurrentIndex(trucks.length - 1);
                  setLikedCount(favorites?.length || 0);
                }}
              >
                Start Over
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="discover-actions">
        <button
          className={`action-btn nope ${!canSwipe ? 'disabled' : ''}`}
          onClick={() => swipe('left')}
          disabled={!canSwipe}
        >
          {Icons.x}
        </button>
        <button
          className="action-btn info"
          onClick={() => currentIndex >= 0 && onTruckClick(trucks[currentIndex])}
          disabled={currentIndex < 0}
        >
          {Icons.info}
        </button>
        <button
          className={`action-btn like ${!canSwipe ? 'disabled' : ''}`}
          onClick={() => swipe('right')}
          disabled={!canSwipe}
        >
          {Icons.heart}
        </button>
      </div>

      {/* Progress Indicator */}
      <div className="discover-progress">
        <div className="progress-dots">
          {currentIndex >= 0 && trucks.slice(Math.max(0, currentIndex - 2), Math.min(trucks.length, currentIndex + 3)).map((truck, i) => {
            const actualIndex = Math.max(0, currentIndex - 2) + i;
            return (
              <span
                key={truck.id}
                className={`progress-dot ${actualIndex === currentIndex ? 'active' : ''} ${actualIndex > currentIndex ? 'upcoming' : 'passed'}`}
              />
            );
          })}
        </div>
        <span className="progress-text">
          {Math.max(0, trucks.length - currentIndex - 1)} of {trucks.length} explored
        </span>
      </div>
    </div>
  );
};

export default DiscoverView;
