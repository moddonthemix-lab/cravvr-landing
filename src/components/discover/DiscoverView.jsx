import React, { useState, useEffect, useRef, useMemo } from 'react';
import TinderCard from 'react-tinder-card';
import { fetchMenuItems } from '../../services/menu';
import { Icons } from '../common/Icons';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const DiscoverView = ({ trucks = [], loading, favorites, toggleFavorite, onTruckClick }) => {
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [lastDirection, setLastDirection] = useState(null);
  const [likedCount, setLikedCount] = useState(favorites?.length || 0);
  const [popularItemsMap, setPopularItemsMap] = useState({});
  const [swipeProgress, setSwipeProgress] = useState({ direction: null, progress: 0 });

  const currentIndexRef = useRef(currentIndex);
  const childRefs = useMemo(
    () => trucks.length > 0 ? Array(trucks.length).fill(0).map(() => React.createRef()) : [],
    [trucks.length]
  );

  useEffect(() => {
    currentIndexRef.current = currentIndex;
  }, [currentIndex]);

  useEffect(() => {
    if (trucks.length > 0) {
      setCurrentIndex(trucks.length - 1);
    }
  }, [trucks.length]);

  useEffect(() => {
    const fetchPopularItems = async () => {
      if (!trucks.length) return;
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
    if (currentIndexRef.current >= idx && childRefs[idx].current) {
      childRefs[idx].current.restoreCard();
    }
  };

  const swipe = async (dir) => {
    if (canSwipe && currentIndex < trucks.length && childRefs[currentIndex]?.current) {
      await childRefs[currentIndex].current.swipe(dir);
    }
  };

  if (loading || trucks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center px-6">
        <div className="h-10 w-10 rounded-full border-[3px] border-muted border-t-primary animate-spin" />
        <p className="text-sm text-muted-foreground">Finding trucks to discover…</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen px-4 sm:px-6 pb-6">
      {/* Header */}
      <div className="pt-5 pb-3">
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

      {/* Card stack */}
      <div className="flex-1 flex flex-col items-center justify-center">
        <div className="relative h-[520px] w-full max-w-sm mx-auto">
          {trucks.map((truck, index) => (
            <TinderCard
              ref={childRefs[index]}
              key={truck.id}
              className="absolute inset-0"
              onSwipe={(dir) => swiped(dir, truck, index)}
              onCardLeftScreen={() => outOfFrame(truck.name, index)}
              preventSwipe={['up', 'down']}
              swipeRequirementType="position"
              swipeThreshold={100}
            >
              <div
                className="absolute inset-0 overflow-hidden rounded-3xl bg-card shadow-xl ring-1 ring-black/10"
                style={{
                  zIndex: trucks.length - index,
                  transform: index < currentIndex
                    ? `scale(${1 - (currentIndex - index) * 0.05}) translateY(${(currentIndex - index) * 8}px)`
                    : 'none',
                  opacity: index < currentIndex - 2 ? 0 : 1,
                }}
              >
                {/* Image */}
                <div className="relative h-2/3 overflow-hidden bg-muted">
                  <img
                    src={truck.image}
                    alt={truck.name}
                    draggable={false}
                    className="h-full w-full object-cover select-none"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />

                  <div className="absolute top-3 left-3 flex items-center gap-1.5">
                    {truck.featured && (
                      <Badge variant="warning" className="shadow-sm gap-1">
                        <span className="h-3 w-3">{Icons.star}</span>
                        Featured
                      </Badge>
                    )}
                    <Badge variant={truck.isOpen ? 'positive' : 'secondary'} className="shadow-sm">
                      {truck.isOpen ? 'Open Now' : 'Closed'}
                    </Badge>
                  </div>

                  {truck.prepTime && (
                    <div className="absolute top-3 right-3 inline-flex items-center gap-1 rounded-full bg-black/60 backdrop-blur px-2.5 py-1 text-xs font-semibold text-white">
                      <span className="h-3 w-3">{Icons.clock}</span>
                      {truck.prepTime}
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="h-1/3 overflow-y-auto p-4 space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <h2 className="text-lg font-bold leading-tight truncate">{truck.name}</h2>
                      <p className="text-xs text-muted-foreground">
                        {truck.cuisine} • {truck.priceRange}
                      </p>
                    </div>
                    <div className="inline-flex items-center gap-1 rounded-full bg-warning/10 px-2.5 py-1 text-xs font-semibold text-warning">
                      <span className="h-3.5 w-3.5">{Icons.star}</span>
                      <span className="tabular-nums">{truck.rating}</span>
                    </div>
                  </div>

                  <p className="text-xs text-muted-foreground line-clamp-2 leading-snug">
                    {truck.description || `Delicious ${truck.cuisine} food made fresh daily.`}
                  </p>

                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="font-semibold text-foreground">{truck.distance}</span>
                    <span aria-hidden>•</span>
                    <span className="truncate">{truck.location}</span>
                  </div>

                  {popularItemsMap[truck.id]?.length > 0 && (
                    <div className="pt-1">
                      <span className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                        Popular
                      </span>
                      <div className="space-y-1">
                        {popularItemsMap[truck.id].map(item => (
                          <div
                            key={item.id}
                            className="flex items-center gap-2 rounded-lg bg-muted/40 px-2 py-1.5 text-xs"
                          >
                            <span className="text-base">{item.emoji}</span>
                            <span className="flex-1 truncate font-medium">{item.name}</span>
                            <span className="font-bold tabular-nums text-primary">{item.price}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Like / Nope overlays — only on top card */}
                {index === currentIndex && swipeProgress.direction && (
                  <>
                    <div
                      className="absolute top-8 left-6 -rotate-12 rounded-xl border-4 border-positive bg-positive/10 px-4 py-2 text-2xl font-extrabold uppercase tracking-wider text-positive pointer-events-none"
                      style={{
                        opacity: swipeProgress.direction === 'right' ? swipeProgress.progress : 0,
                      }}
                    >
                      Like
                    </div>
                    <div
                      className="absolute top-8 right-6 rotate-12 rounded-xl border-4 border-destructive bg-destructive/10 px-4 py-2 text-2xl font-extrabold uppercase tracking-wider text-destructive pointer-events-none"
                      style={{
                        opacity: swipeProgress.direction === 'left' ? swipeProgress.progress : 0,
                      }}
                    >
                      Nope
                    </div>
                  </>
                )}
              </div>
            </TinderCard>
          ))}

          {currentIndex < 0 && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6 py-12 gap-3">
              <div className="text-5xl">🎉</div>
              <h3 className="text-xl font-bold tracking-tight">You've seen them all!</h3>
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

        {/* Action Buttons */}
        <div className="flex items-center justify-center gap-5 py-6">
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
            <span className="h-6 w-6">{Icons.xBold || Icons.x}</span>
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
            <span className="h-5 w-5">{Icons.infoBold || Icons.info}</span>
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

      {/* Progress */}
      <div className="flex flex-col items-center gap-2 pb-2">
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
