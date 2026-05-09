import React, { useState, useEffect, useRef, useMemo } from 'react';
import TinderCard from 'react-tinder-card';
import { fetchMenuItems } from '../../services/menu';
import { Icons } from '../common/Icons';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
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
          const items = await fetchMenuItems(truck.id, { limit: 2 });
          if (items.length > 0) {
            setPopularItemsMap(prev => ({
              ...prev,
              [truck.id]: items.map(item => ({
                id: item.id,
                name: item.name,
                price: item.priceFormatted,
                emoji: item.emoji,
              })),
            }));
          } else {
            setPopularItemsMap(prev => ({
              ...prev,
              [truck.id]: [
                { id: 1, name: 'Popular Special', price: '$12.99', emoji: '🌟' },
                { id: 2, name: 'House Favorite', price: '$10.99', emoji: '❤️' },
              ],
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
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center px-6">
          <div className="h-10 w-10 rounded-full border-[3px] border-muted border-t-primary animate-spin" />
          <p className="text-sm text-muted-foreground">Finding trucks to discover…</p>
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
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-2xl font-bold tracking-tight">Discover</h1>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-sm font-semibold text-primary">
            <span className="h-4 w-4">{Icons.heartFilled}</span>
            <span className="tabular-nums">{likedCount}</span>
          </span>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          Swipe right to save, left to skip
        </p>
      </div>

      {/* Card + Actions Container */}
      <div className="discover-content">
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
                  <div className="card-badges flex items-center gap-1.5">
                    {truck.featured && (
                      <Badge variant="warning" className="shadow-sm gap-1">
                        <span className="h-3 w-3">{Icons.star}</span>
                        Featured
                      </Badge>
                    )}
                    <Badge
                      variant={truck.isOpen ? 'positive' : 'secondary'}
                      className="shadow-sm"
                    >
                      {truck.isOpen ? 'Open Now' : 'Closed'}
                    </Badge>
                  </div>

                  {/* Prep Time */}
                  {truck.prepTime && (
                    <div className="card-prep-info">
                      <span className="prep-time">
                        {Icons.clock}
                        {truck.prepTime}
                      </span>
                    </div>
                  )}
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
            <div className="discover-empty flex flex-col items-center justify-center text-center px-6 py-12 gap-3">
              <div className="text-5xl">🎉</div>
              <h3 className="text-xl font-bold tracking-tight">
                You've seen them all!
              </h3>
              <p className="text-sm text-muted-foreground">
                Check back later for more food trucks
              </p>
              <Button
                onClick={() => {
                  setCurrentIndex(trucks.length - 1);
                  setLikedCount(favorites?.length || 0);
                }}
                className="mt-2"
              >
                Start Over
              </Button>
            </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="discover-actions flex items-center justify-center gap-5 py-4">
          <button
            type="button"
            onClick={() => swipe('left')}
            disabled={!canSwipe}
            aria-label="Skip"
            className={cn(
              'flex h-14 w-14 items-center justify-center rounded-full border-2 border-destructive/40 bg-white text-destructive shadow-md transition-all hover:scale-110 hover:bg-destructive/5 active:scale-95',
              !canSwipe && 'opacity-40 cursor-not-allowed hover:scale-100 hover:bg-white'
            )}
          >
            <span className="h-6 w-6">{Icons.xBold}</span>
          </button>
          <button
            type="button"
            onClick={() => currentIndex >= 0 && onTruckClick(trucks[currentIndex])}
            disabled={currentIndex < 0}
            aria-label="More info"
            className={cn(
              'flex h-12 w-12 items-center justify-center rounded-full border-2 border-info/40 bg-white text-info shadow-md transition-all hover:scale-110 hover:bg-info/5 active:scale-95',
              currentIndex < 0 && 'opacity-40 cursor-not-allowed hover:scale-100 hover:bg-white'
            )}
          >
            <span className="h-5 w-5">{Icons.infoBold}</span>
          </button>
          <button
            type="button"
            onClick={() => swipe('right')}
            disabled={!canSwipe}
            aria-label="Like"
            className={cn(
              'flex h-14 w-14 items-center justify-center rounded-full border-2 border-positive/40 bg-white text-positive shadow-md transition-all hover:scale-110 hover:bg-positive/5 active:scale-95',
              !canSwipe && 'opacity-40 cursor-not-allowed hover:scale-100 hover:bg-white'
            )}
          >
            <span className="h-6 w-6">{Icons.heartFilled}</span>
          </button>
        </div>
      </div>

      {/* Progress Indicator */}
      <div className="discover-progress flex flex-col items-center gap-2 pb-4">
        <div className="flex items-center gap-1.5">
          {currentIndex >= 0 && trucks.slice(Math.max(0, currentIndex - 2), Math.min(trucks.length, currentIndex + 3)).map((truck, i) => {
            const actualIndex = Math.max(0, currentIndex - 2) + i;
            const isActive = actualIndex === currentIndex;
            const isUpcoming = actualIndex > currentIndex;
            return (
              <span
                key={truck.id}
                className={cn(
                  'h-1.5 rounded-full transition-all',
                  isActive ? 'w-6 bg-primary' : 'w-1.5',
                  !isActive && (isUpcoming ? 'bg-muted' : 'bg-primary/30')
                )}
              />
            );
          })}
        </div>
        <span className="text-xs text-muted-foreground tabular-nums">
          {Math.max(0, trucks.length - currentIndex - 1)} of {trucks.length} explored
        </span>
      </div>
    </div>
  );
};

export default DiscoverView;
