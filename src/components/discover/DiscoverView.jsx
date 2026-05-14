import React, { useState, useEffect, useRef, useMemo } from 'react';
import TinderCard from 'react-tinder-card';
import { fetchMenuItems } from '../../services/menu';
import { Icons } from '../common/Icons';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const DiscoverView = ({ trucks = [], loading, favorites, toggleFavorite, onTruckClick }) => {
  const [openNowOnly, setOpenNowOnly] = useState(false);
  const [selectedCuisine, setSelectedCuisine] = useState(null);

  const cuisines = useMemo(() => {
    const counts = {};
    trucks.forEach((t) => {
      if (t.cuisine) counts[t.cuisine] = (counts[t.cuisine] || 0) + 1;
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([c]) => c);
  }, [trucks]);

  const filteredTrucks = useMemo(() => {
    return trucks.filter((t) => {
      if (openNowOnly && !t.isOpen) return false;
      if (
        selectedCuisine &&
        !t.cuisine?.toLowerCase().includes(selectedCuisine.toLowerCase())
      ) {
        return false;
      }
      return true;
    });
  }, [trucks, openNowOnly, selectedCuisine]);

  const [currentIndex, setCurrentIndex] = useState(-1);
  const [likedCount, setLikedCount] = useState(favorites?.length || 0);
  const [recentLikes, setRecentLikes] = useState([]);
  const [popularItemsMap, setPopularItemsMap] = useState({});

  const currentIndexRef = useRef(currentIndex);
  const childRefs = useMemo(
    () =>
      filteredTrucks.length > 0
        ? Array(filteredTrucks.length).fill(0).map(() => React.createRef())
        : [],
    [filteredTrucks.length, filteredTrucks]
  );

  useEffect(() => {
    currentIndexRef.current = currentIndex;
  }, [currentIndex]);

  useEffect(() => {
    if (filteredTrucks.length > 0) {
      setCurrentIndex(filteredTrucks.length - 1);
    } else {
      setCurrentIndex(-1);
    }
  }, [filteredTrucks]);

  useEffect(() => {
    const fetchPopularItems = async () => {
      if (!filteredTrucks.length) return;
      const indicesToFetch = [];
      for (let i = currentIndex; i >= Math.max(0, currentIndex - 3); i--) {
        if (filteredTrucks[i] && !popularItemsMap[filteredTrucks[i].id]) {
          indicesToFetch.push(i);
        }
      }
      for (const idx of indicesToFetch) {
        const truck = filteredTrucks[idx];
        try {
          const items = await fetchMenuItems(truck.id, { limit: 2 });
          if (items.length > 0) {
            setPopularItemsMap((prev) => ({
              ...prev,
              [truck.id]: items.map((item) => ({
                id: item.id,
                name: item.name,
                price: item.priceFormatted,
                emoji: item.emoji,
              })),
            }));
          } else {
            setPopularItemsMap((prev) => ({
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
  }, [currentIndex, filteredTrucks]);

  const updateCurrentIndex = (val) => {
    setCurrentIndex(val);
    currentIndexRef.current = val;
  };

  const canSwipe = currentIndex >= 0;

  const swiped = (direction, truck, index) => {
    if (direction === 'right') {
      toggleFavorite(truck.id);
      setLikedCount((prev) => prev + 1);
      setRecentLikes((prev) => [truck, ...prev].slice(0, 4));
    }
    updateCurrentIndex(index - 1);
  };

  const outOfFrame = (idx) => {
    if (currentIndexRef.current >= idx && childRefs[idx]?.current) {
      childRefs[idx].current.restoreCard();
    }
  };

  const swipe = async (dir) => {
    if (
      canSwipe &&
      currentIndex < filteredTrucks.length &&
      childRefs[currentIndex]?.current
    ) {
      await childRefs[currentIndex].current.swipe(dir);
    }
  };

  const clearFilters = () => {
    setOpenNowOnly(false);
    setSelectedCuisine(null);
  };

  const filtersActive = openNowOnly || !!selectedCuisine;
  const currentTruck = currentIndex >= 0 ? filteredTrucks[currentIndex] : null;
  const upNext = currentIndex > 0
    ? filteredTrucks.slice(Math.max(0, currentIndex - 4), currentIndex).reverse()
    : [];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center px-6">
        <div className="h-10 w-10 rounded-full border-[3px] border-muted border-t-primary animate-spin" />
        <p className="text-sm text-muted-foreground">Finding trucks to discover…</p>
      </div>
    );
  }

  return (
    <div className="relative flex flex-col min-h-screen px-4 sm:px-6 pb-6 w-full">
      <div
        aria-hidden
        className="hidden lg:block absolute inset-0 -z-10 opacity-70"
        style={{
          backgroundImage:
            'radial-gradient(circle at 15% 20%, rgba(225, 29, 72, 0.08) 0px, transparent 50%), radial-gradient(circle at 85% 80%, rgba(225, 29, 72, 0.06) 0px, transparent 45%)',
        }}
      />
      <div className="relative flex flex-col flex-1 max-w-7xl mx-auto w-full">
      {/* Header */}
      <div className="pt-5 pb-3 flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Discover</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Swipe right to save, left to skip
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-sm font-semibold text-primary shrink-0">
          <span className="h-4 w-4">{Icons.heartFilled}</span>
          <span className="tabular-nums">{likedCount}</span>
        </span>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 overflow-x-auto pb-3 -mx-1 px-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <button
          type="button"
          onClick={() => setOpenNowOnly((v) => !v)}
          className={cn(
            'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-colors shrink-0',
            openNowOnly
              ? 'border-positive bg-positive text-white'
              : 'border-border bg-background text-muted-foreground hover:border-positive/40 hover:text-foreground'
          )}
        >
          <span
            className={cn(
              'h-1.5 w-1.5 rounded-full',
              openNowOnly ? 'bg-white' : 'bg-positive'
            )}
          />
          Open now
        </button>
        {cuisines.map((c) => {
          const isActive = selectedCuisine === c;
          return (
            <button
              key={c}
              type="button"
              onClick={() => setSelectedCuisine(isActive ? null : c)}
              className={cn(
                'inline-flex items-center rounded-full border px-3 py-1.5 text-xs font-medium capitalize whitespace-nowrap transition-colors shrink-0',
                isActive
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground'
              )}
            >
              {c}
            </button>
          );
        })}
        {filtersActive && (
          <button
            type="button"
            onClick={clearFilters}
            className="inline-flex items-center gap-1 rounded-full px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground whitespace-nowrap shrink-0"
          >
            <span className="h-3 w-3">{Icons.x}</span>
            Clear
          </button>
        )}
      </div>

      {/* Empty filtered state */}
      {filteredTrucks.length === 0 ? (
        <div className="flex flex-col items-center justify-center flex-1 gap-3 text-center px-6 py-16">
          <div className="text-5xl">🔍</div>
          <h3 className="text-xl font-bold tracking-tight">No trucks match these filters</h3>
          <p className="text-sm text-muted-foreground">
            Try clearing filters or pick a different cuisine.
          </p>
          {filtersActive && (
            <Button variant="outline" onClick={clearFilters} className="mt-2">
              Clear filters
            </Button>
          )}
        </div>
      ) : (
        <div className="grid lg:grid-cols-[minmax(0,440px)_minmax(0,1fr)] lg:gap-10 lg:items-start flex-1">
          {/* Card column */}
          <div className="flex flex-col items-center justify-start">
            <div className="relative w-full max-w-sm mx-auto aspect-[5/7] max-h-[calc(100dvh-22rem)] lg:max-h-[640px] lg:aspect-[5/7]">
              {filteredTrucks.map((truck, index) => {
                const stackOffset = index < currentIndex ? currentIndex - index : 0;
                const isStacked = stackOffset > 0;
                return (
                <TinderCard
                  ref={childRefs[index]}
                  key={truck.id}
                  className="absolute inset-0"
                  onSwipe={(dir) => swiped(dir, truck, index)}
                  onCardLeftScreen={() => outOfFrame(index)}
                  preventSwipe={['up', 'down']}
                  swipeRequirementType="position"
                  swipeThreshold={100}
                >
                  <div
                    className="absolute inset-0 overflow-hidden rounded-3xl bg-card shadow-xl ring-1 ring-black/5 flex flex-col"
                    style={{
                      zIndex: filteredTrucks.length - index,
                      transform: isStacked
                        ? `translate3d(0, ${stackOffset * 12}px, 0) scale(${1 - stackOffset * 0.035})`
                        : 'translate3d(0, 0, 0)',
                      transformOrigin: 'center top',
                      opacity: index < currentIndex - 2 ? 0 : 1,
                      willChange: 'transform',
                      backfaceVisibility: 'hidden',
                      WebkitBackfaceVisibility: 'hidden',
                      WebkitFontSmoothing: 'antialiased',
                    }}
                  >
                    {/* Image */}
                    <div className="relative h-[60%] overflow-hidden bg-muted shrink-0">
                      <img
                        src={truck.image}
                        alt={truck.name}
                        draggable={false}
                        className="h-full w-full object-cover select-none"
                      />
                      <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />

                      <div className="absolute top-3 left-3 flex items-center gap-1.5">
                        {truck.featured && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-warning px-2.5 py-1 text-[11px] font-semibold text-white shadow-sm">
                            <span className="h-3 w-3">{Icons.star}</span>
                            Featured
                          </span>
                        )}
                        <span
                          className={cn(
                            'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold shadow-sm',
                            truck.isOpen
                              ? 'bg-positive text-white'
                              : 'bg-black/70 text-white backdrop-blur'
                          )}
                        >
                          <span
                            className={cn(
                              'h-1.5 w-1.5 rounded-full',
                              truck.isOpen ? 'bg-white' : 'bg-white/60'
                            )}
                          />
                          {truck.isOpen ? 'Open Now' : 'Closed'}
                        </span>
                      </div>

                      {truck.prepTime && (
                        <div className="absolute top-3 right-3 inline-flex items-center gap-1 rounded-full bg-black/70 backdrop-blur px-2.5 py-1 text-[11px] font-semibold text-white shadow-sm">
                          <span className="h-3 w-3">{Icons.clock}</span>
                          {truck.prepTime}
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 p-4 flex flex-col gap-2 overflow-hidden">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <h2 className="text-lg font-bold leading-tight truncate">
                            {truck.name}
                          </h2>
                          <p className="text-xs text-muted-foreground truncate">
                            {[truck.cuisine, truck.priceRange].filter(Boolean).join(' • ')}
                          </p>
                        </div>
                        {truck.rating && (
                          <div className="inline-flex items-center gap-1 rounded-full bg-warning/10 px-2.5 py-1 text-xs font-semibold text-warning shrink-0">
                            <span className="h-3.5 w-3.5">{Icons.star}</span>
                            <span className="tabular-nums">{truck.rating}</span>
                          </div>
                        )}
                      </div>

                      {(truck.description ||
                        (truck.distance && truck.distance !== '--') ||
                        truck.location) && (
                        <p className="text-xs text-muted-foreground line-clamp-2 leading-snug">
                          {truck.description ||
                            `Delicious ${truck.cuisine || ''} food made fresh daily.`}
                        </p>
                      )}

                      {(truck.distance && truck.distance !== '--' || truck.location) && (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground min-w-0">
                          {truck.distance && truck.distance !== '--' && (
                            <span className="font-semibold text-foreground shrink-0">
                              {truck.distance}
                            </span>
                          )}
                          {truck.distance && truck.distance !== '--' && truck.location && (
                            <span aria-hidden>•</span>
                          )}
                          {truck.location && (
                            <span className="truncate">{truck.location}</span>
                          )}
                        </div>
                      )}

                      {popularItemsMap[truck.id]?.length > 0 && (
                        <div className="pt-1 min-h-0">
                          <span className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                            Popular
                          </span>
                          <div className="space-y-1">
                            {popularItemsMap[truck.id].slice(0, 2).map((item) => (
                              <div
                                key={item.id}
                                className="flex items-center gap-2 rounded-lg bg-muted/40 px-2 py-1.5 text-xs"
                              >
                                <span className="text-base">{item.emoji}</span>
                                <span className="flex-1 truncate font-medium">
                                  {item.name}
                                </span>
                                <span className="font-bold tabular-nums text-primary">
                                  {item.price}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </TinderCard>
                );
              })}

              {currentIndex < 0 && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6 py-12 gap-3 rounded-3xl bg-card ring-1 ring-border">
                  <div className="text-5xl">🎉</div>
                  <h3 className="text-xl font-bold tracking-tight">
                    You've seen them all!
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {recentLikes.length > 0
                      ? `You saved ${recentLikes.length} truck${recentLikes.length === 1 ? '' : 's'} this session.`
                      : 'Check back later for more food trucks.'}
                  </p>
                  <Button
                    onClick={() => {
                      setCurrentIndex(filteredTrucks.length - 1);
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
                onClick={() => currentTruck && onTruckClick(currentTruck)}
                disabled={!currentTruck}
                aria-label="More info"
                className={cn(
                  'flex h-12 w-12 items-center justify-center rounded-full border-2 border-info/40 bg-white text-info shadow-md transition-all hover:scale-110 hover:bg-info/5 active:scale-95',
                  !currentTruck && 'opacity-40 cursor-not-allowed hover:scale-100 hover:bg-white'
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

            {/* Progress */}
            <div className="flex flex-col items-center gap-2 pb-2">
              <span className="text-xs text-muted-foreground tabular-nums">
                {Math.max(0, filteredTrucks.length - currentIndex - 1)} of{' '}
                {filteredTrucks.length} explored
              </span>
              <div className="h-1.5 w-40 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full bg-primary transition-all"
                  style={{
                    width: `${
                      filteredTrucks.length > 0
                        ? Math.min(
                            100,
                            ((filteredTrucks.length - Math.max(0, currentIndex + 1)) /
                              filteredTrucks.length) *
                              100
                          )
                        : 0
                    }%`,
                  }}
                />
              </div>
            </div>
          </div>

          {/* Side panel (desktop only) */}
          <aside className="hidden lg:flex flex-col gap-6 pt-2">
            {currentTruck && (
              <section className="rounded-2xl border border-border bg-card p-5">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="min-w-0">
                    <h2 className="text-xl font-bold tracking-tight truncate">
                      {currentTruck.name}
                    </h2>
                    <p className="text-sm text-muted-foreground truncate">
                      {[currentTruck.cuisine, currentTruck.priceRange]
                        .filter(Boolean)
                        .join(' • ')}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onTruckClick(currentTruck)}
                  >
                    View truck
                  </Button>
                </div>

                {currentTruck.description && (
                  <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                    {currentTruck.description}
                  </p>
                )}

                <div className="grid grid-cols-2 gap-3 text-sm">
                  {currentTruck.rating && (
                    <div className="rounded-lg bg-muted/40 px-3 py-2">
                      <div className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
                        Rating
                      </div>
                      <div className="font-semibold tabular-nums">
                        {currentTruck.rating} ★
                      </div>
                    </div>
                  )}
                  {currentTruck.prepTime && (
                    <div className="rounded-lg bg-muted/40 px-3 py-2">
                      <div className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
                        Prep time
                      </div>
                      <div className="font-semibold">{currentTruck.prepTime}</div>
                    </div>
                  )}
                  {currentTruck.distance && currentTruck.distance !== '--' && (
                    <div className="rounded-lg bg-muted/40 px-3 py-2">
                      <div className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
                        Distance
                      </div>
                      <div className="font-semibold">{currentTruck.distance}</div>
                    </div>
                  )}
                  <div className="rounded-lg bg-muted/40 px-3 py-2">
                    <div className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
                      Status
                    </div>
                    <div
                      className={cn(
                        'font-semibold',
                        currentTruck.isOpen ? 'text-positive' : 'text-muted-foreground'
                      )}
                    >
                      {currentTruck.isOpen ? 'Open now' : 'Closed'}
                    </div>
                  </div>
                </div>

                {currentTruck.location && (
                  <div className="mt-4 flex items-start gap-2 text-sm">
                    <span className="h-4 w-4 mt-0.5 text-muted-foreground">
                      {Icons.mapPin}
                    </span>
                    <span className="text-muted-foreground">{currentTruck.location}</span>
                  </div>
                )}

                {popularItemsMap[currentTruck.id]?.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-border">
                    <span className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">
                      Popular items
                    </span>
                    <div className="space-y-2">
                      {popularItemsMap[currentTruck.id].map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center gap-3 rounded-lg bg-muted/30 px-3 py-2 text-sm"
                        >
                          <span className="text-lg">{item.emoji}</span>
                          <span className="flex-1 truncate font-medium">{item.name}</span>
                          <span className="font-bold tabular-nums text-primary">
                            {item.price}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </section>
            )}

            {upNext.length > 0 && (
              <section>
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
                  Up next
                </h3>
                <div className="space-y-2">
                  {upNext.map((t) => (
                    <div
                      key={t.id}
                      className="flex items-center gap-3 rounded-xl border border-border bg-card p-2 pr-3"
                    >
                      <div className="h-12 w-12 rounded-lg overflow-hidden bg-muted shrink-0">
                        {t.image && (
                          <img
                            src={t.image}
                            alt={t.name}
                            className="h-full w-full object-cover"
                          />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-semibold text-sm truncate">{t.name}</div>
                        <div className="text-xs text-muted-foreground truncate">
                          {t.cuisine || '—'}
                        </div>
                      </div>
                      {t.isOpen && (
                        <span className="inline-flex h-2 w-2 rounded-full bg-positive shrink-0" />
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {recentLikes.length > 0 && (
              <section>
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
                  Just liked
                </h3>
                <div className="space-y-2">
                  {recentLikes.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => onTruckClick(t)}
                      className="w-full flex items-center gap-3 rounded-xl border border-border bg-card p-2 pr-3 text-left hover:border-primary/40 transition-colors"
                    >
                      <div className="h-12 w-12 rounded-lg overflow-hidden bg-muted shrink-0">
                        {t.image && (
                          <img
                            src={t.image}
                            alt={t.name}
                            className="h-full w-full object-cover"
                          />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-semibold text-sm truncate">{t.name}</div>
                        <div className="text-xs text-muted-foreground truncate">
                          Saved · {t.cuisine || ''}
                        </div>
                      </div>
                      <span className="h-4 w-4 text-primary">{Icons.heartFilled}</span>
                    </button>
                  ))}
                </div>
              </section>
            )}
          </aside>
        </div>
      )}
      </div>
    </div>
  );
};

export default DiscoverView;
