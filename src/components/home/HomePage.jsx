import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { useCart } from '../../contexts/CartContext';
import { useTrucks } from '../../contexts/TruckContext';
import { useFavorites } from '../../contexts/FavoritesContext';
import { Icons } from '../common/Icons';
import useUserLocation from '../../hooks/useUserLocation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

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

const sidebarItem = "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground";
const sidebarItemActive = "bg-primary/10 text-primary hover:bg-primary/15 hover:text-primary";

const HomePage = ({ embedded = false }) => {
  const navigate = useNavigate();
  const { user, profile, signOut, openAuth, isOwner, isAdmin } = useAuth();
  const { itemCount, openCart } = useCart();
  const { trucks: contextTrucks, loading, setLocationAndFetch } = useTrucks();
  const { favorites, toggleFavorite } = useFavorites();
  const location = useUserLocation();
  const userCity = typeof location.city === 'string' ? location.city : (location.city?.city || 'Your Location');
  const coords = location.coords;

  useEffect(() => {
    if (coords?.latitude && coords?.longitude) {
      setLocationAndFetch(coords.latitude, coords.longitude, 15);
    }
  }, [coords?.latitude, coords?.longitude, setLocationAndFetch]);

  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const popularScrollRef = useRef(null);
  const nearbyScrollRef = useRef(null);
  const allTrucksRef = useRef(null);

  const trucks = contextTrucks;

  const scrollToAllTrucks = () => {
    allTrucksRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleToggleFavorite = (truckId) => toggleFavorite(truckId);

  const handleTruckClick = (truck) => {
    navigate(truck.slug ? `/t/${truck.slug}` : `/truck/${truck.id}`, { state: { truck } });
  };

  const handleSignOut = async () => {
    try {
      navigate('/', { replace: true });
      await signOut();
    } catch (err) {
      console.error('Sign out failed:', err);
    }
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
    <div className="flex min-h-screen flex-col bg-background pb-20 lg:pb-0">
      {/* Header */}
      <header className="sticky top-0 z-40 flex items-center gap-3 border-b border-border bg-background/85 backdrop-blur px-4 py-3 sm:px-6">
        <div
          className="cursor-pointer shrink-0"
          onClick={() => navigate('/')}
        >
          <img src="/logo/cravvr-logo.png" alt="Cravrr" className="h-9 w-auto" />
        </div>

        <div className="hidden md:flex flex-1 max-w-xl mx-auto">
          <div className="relative w-full">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground">
              {Icons.search}
            </span>
            <input
              type="search"
              placeholder="Search food trucks, cuisines…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-10 w-full rounded-full border border-input bg-muted/50 pl-10 pr-4 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 ml-auto">
          <div className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1.5 text-xs">
            <span className="h-3.5 w-3.5 text-primary">{Icons.mapPin}</span>
            <span className="font-medium truncate max-w-[10rem]">{userCity}</span>
          </div>

          <button
            type="button"
            aria-label="Notifications"
            className="hidden sm:flex h-10 w-10 items-center justify-center rounded-full text-foreground transition-colors hover:bg-muted"
          >
            <span className="h-5 w-5">{Icons.bell}</span>
          </button>

          <button
            type="button"
            onClick={openCart}
            aria-label="Open cart"
            className="relative flex h-10 w-10 items-center justify-center rounded-full text-foreground transition-colors hover:bg-muted"
          >
            <span className="h-5 w-5">{Icons.shoppingBag}</span>
            {itemCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[11px] font-semibold text-primary-foreground tabular-nums">
                {itemCount}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* Mobile search */}
      <div className="md:hidden sticky top-[64px] z-30 border-b border-border bg-background/85 backdrop-blur px-4 py-2">
        <div className="relative w-full">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground">
            {Icons.search}
          </span>
          <input
            type="search"
            placeholder="Search food trucks, cuisines…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-10 w-full rounded-full border border-input bg-muted/50 pl-10 pr-4 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          />
        </div>
      </div>

      <div className="flex flex-1 min-h-0">
        {/* Sidebar (desktop only) */}
        <aside className="hidden lg:flex lg:flex-col lg:w-60 lg:shrink-0 lg:sticky lg:top-[65px] lg:h-[calc(100vh-65px)] lg:overflow-y-auto lg:border-r lg:border-border lg:bg-card">
          <nav className="flex flex-col gap-1 p-3">
            <button className={cn(sidebarItem, sidebarItemActive)} onClick={() => navigate('/')}>
              <span className="h-5 w-5 shrink-0">{Icons.home}</span>
              <span>Home</span>
            </button>
            <button className={sidebarItem} onClick={() => navigate('/map')}>
              <span className="h-5 w-5 shrink-0">{Icons.map}</span>
              <span>Map</span>
            </button>
            <button className={sidebarItem} onClick={() => navigate('/discover')}>
              <span className="h-5 w-5 shrink-0">{Icons.compass}</span>
              <span>Discover</span>
            </button>
            <button className={sidebarItem} onClick={() => navigate('/bolt')}>
              <span className="h-5 w-5 shrink-0">{Icons.bolt}</span>
              <span>Bolt</span>
            </button>
          </nav>

          <div className="mx-3 my-2 border-t border-border" />

          <nav className="flex flex-col gap-1 p-3">
            <button className={sidebarItem} onClick={() => navigate('/favorites')}>
              <span className="h-5 w-5 shrink-0">{Icons.heart}</span>
              <span>Favorites</span>
            </button>
            <button className={sidebarItem} onClick={() => navigate('/orders')}>
              <span className="h-5 w-5 shrink-0">{Icons.orders}</span>
              <span>Orders</span>
            </button>
          </nav>

          <div className="mx-3 my-2 border-t border-border" />

          <nav className="flex flex-col gap-1 p-3">
            {user ? (
              <>
                <button className={sidebarItem} onClick={() => navigate('/profile')}>
                  <span className="h-5 w-5 shrink-0">{Icons.user}</span>
                  <span>Account</span>
                </button>
                {isOwner && (
                  <button className={sidebarItem} onClick={() => navigate('/owner')}>
                    <span className="h-5 w-5 shrink-0">{Icons.truck}</span>
                    <span>My Trucks</span>
                  </button>
                )}
                {isAdmin && (
                  <button className={sidebarItem} onClick={() => navigate('/admin')}>
                    <span className="h-5 w-5 shrink-0">{Icons.settings}</span>
                    <span>Admin</span>
                  </button>
                )}
                <button
                  className={cn(sidebarItem, 'text-destructive hover:bg-destructive/10 hover:text-destructive')}
                  onClick={handleSignOut}
                >
                  <span className="h-5 w-5 shrink-0">{Icons.logOut}</span>
                  <span>Sign Out</span>
                </button>
              </>
            ) : (
              <button className={cn(sidebarItem, 'text-primary')} onClick={() => openAuth('login')}>
                <span className="h-5 w-5 shrink-0">{Icons.user}</span>
                <span>Sign In</span>
              </button>
            )}
          </nav>
        </aside>

        {/* Main */}
        <main className="flex-1 min-w-0 px-4 sm:px-6 lg:px-10 py-6">
          {/* Welcome */}
          <section className="mb-6">
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Welcome back, {userName}!
            </h1>
          </section>

          {/* Category Pills */}
          <section className="-mx-4 sm:-mx-6 lg:-mx-10 px-4 sm:px-6 lg:px-10 mb-6">
            <div className="flex gap-2 overflow-x-auto pb-2">
              {categories.map(cat => {
                const isActive = selectedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={cn(
                      'shrink-0 inline-flex items-center gap-2 rounded-full border px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                      isActive
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-border bg-background text-foreground hover:border-primary/40'
                    )}
                  >
                    <span
                      className={cn(
                        'flex h-7 w-7 items-center justify-center rounded-full text-base',
                        isActive ? 'bg-white/20' : 'bg-muted'
                      )}
                    >
                      {cat.emoji}
                    </span>
                    {cat.name}
                  </button>
                );
              })}
            </div>
          </section>

          {/* Promo Banners */}
          <section className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="overflow-hidden bg-gradient-to-br from-primary to-rose-700 text-primary-foreground border-0">
              <CardContent className="flex items-center gap-4 p-5">
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-bold">New to Cravvr?</h3>
                  <p className="text-sm opacity-90">Get $5 off your first order of $15+</p>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => navigate('/eat')}
                    className="mt-3 bg-white text-primary hover:bg-white/90"
                  >
                    Sign Up Now
                  </Button>
                </div>
                <span className="text-4xl shrink-0 select-none">🌮🍔🍕</span>
              </CardContent>
            </Card>

            <Card className="overflow-hidden border-warning/30 bg-warning/5">
              <CardContent className="flex items-center gap-4 p-5">
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-bold">Cravvr Rewards</h3>
                  <p className="text-sm text-muted-foreground">Earn points on every order. Free food awaits!</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate('/rewards')}
                    className="mt-3"
                  >
                    Learn More
                  </Button>
                </div>
                <div className="inline-flex items-center gap-1.5 rounded-full bg-warning/15 px-3 py-1.5 text-xs font-bold text-warning shrink-0">
                  <span className="h-3.5 w-3.5">{Icons.fire}</span>
                  Hot Deals
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Popular Trucks */}
          <TruckSection
            title="Most Popular Food Trucks"
            scrollRef={popularScrollRef}
            onScroll={scrollSection}
            onSeeAll={scrollToAllTrucks}
            loading={loading}
            trucks={popularTrucks}
            favorites={favorites}
            onFavorite={handleToggleFavorite}
            onClick={handleTruckClick}
          />

          {/* Nearby Open */}
          <TruckSection
            title="Open Now Near You"
            scrollRef={nearbyScrollRef}
            onScroll={scrollSection}
            onSeeAll={scrollToAllTrucks}
            loading={loading}
            trucks={nearbyTrucks}
            favorites={favorites}
            onFavorite={handleToggleFavorite}
            onClick={handleTruckClick}
          />

          {/* All Trucks Grid */}
          {filteredTrucks.length > 0 && (
            <section ref={allTrucksRef} className="mb-8">
              <div className="flex items-center justify-between gap-3 mb-4">
                <h2 className="text-xl font-bold tracking-tight">All Food Trucks</h2>
                <span className="text-sm text-muted-foreground">
                  {filteredTrucks.length} {filteredTrucks.length === 1 ? 'truck' : 'trucks'}
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
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
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
              <span className="text-4xl">🔍</span>
              <h3 className="text-lg font-bold">No food trucks found</h3>
              <p className="text-sm text-muted-foreground">
                Try adjusting your search or category filters
              </p>
              <Button
                variant="outline"
                onClick={() => { setSelectedCategory('all'); setSearchQuery(''); }}
              >
                Clear Filters
              </Button>
            </div>
          )}
        </main>
      </div>

      {/* Footer (desktop) */}
      {!embedded && (
        <footer className="hidden lg:block border-t border-border bg-card/40">
          <div className="mx-auto max-w-6xl flex flex-col items-center gap-4 px-6 py-8 sm:flex-row sm:justify-between">
            <img src="/logo/cravrr-logo-transparent.png" alt="Cravrr" className="h-8 w-auto" />
            <nav className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
              <a href="/eat" className="hover:text-foreground transition-colors">About</a>
              <a href="/eat#features" className="hover:text-foreground transition-colors">Features</a>
              <a href="/eat#pricing" className="hover:text-foreground transition-colors">Pricing</a>
              <a href="/eat#faq" className="hover:text-foreground transition-colors">FAQ</a>
            </nav>
            <p className="text-xs text-muted-foreground">© 2025 Cravvr. All rights reserved.</p>
          </div>
        </footer>
      )}

      {/* Mobile Bottom Nav */}
      {!embedded && (
        <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-background/95 backdrop-blur lg:hidden">
          <div className="grid grid-cols-6 items-center">
            <BottomNavItem icon={Icons.home} label="Home" active onClick={() => navigate('/')} />
            <BottomNavItem icon={Icons.map} label="Map" onClick={() => navigate('/map')} />
            <BottomNavItem icon={Icons.compass} label="Discover" onClick={() => navigate('/discover')} />
            <BottomNavItem icon={Icons.bolt} label="Bolt" onClick={() => navigate('/bolt')} />
            <BottomNavItem
              icon={Icons.shoppingBag}
              label="Cart"
              badge={itemCount}
              onClick={openCart}
            />
            <BottomNavItem
              icon={Icons.user}
              label={user ? 'Account' : 'Sign In'}
              onClick={() => user ? navigate('/profile') : navigate('/eat')}
            />
          </div>
        </nav>
      )}
    </div>
  );
};

const TruckSection = ({ title, scrollRef, onScroll, onSeeAll, loading, trucks, favorites, onFavorite, onClick }) => (
  <section className="mb-8">
    <div className="flex items-center justify-between gap-3 mb-3">
      <h2 className="text-xl font-bold tracking-tight">{title}</h2>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onSeeAll}
          className="text-sm font-medium text-primary hover:underline"
        >
          See All
        </button>
        <div className="flex items-center gap-1 ml-2">
          <button
            type="button"
            onClick={() => onScroll(scrollRef, 'left')}
            aria-label="Scroll left"
            className="flex h-8 w-8 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <span className="h-4 w-4">{Icons.chevronLeft}</span>
          </button>
          <button
            type="button"
            onClick={() => onScroll(scrollRef, 'right')}
            aria-label="Scroll right"
            className="flex h-8 w-8 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <span className="h-4 w-4">{Icons.chevronRight}</span>
          </button>
        </div>
      </div>
    </div>
    <div
      ref={scrollRef}
      className="-mx-4 sm:-mx-6 lg:-mx-10 px-4 sm:px-6 lg:px-10 flex gap-4 overflow-x-auto pb-2"
    >
      {loading
        ? [...Array(4)].map((_, i) => (
            <div key={i} className="shrink-0 w-72">
              <div className="aspect-[4/3] rounded-2xl bg-muted animate-pulse" />
              <div className="mt-3 h-4 w-3/4 rounded bg-muted animate-pulse" />
              <div className="mt-2 h-3 w-1/2 rounded bg-muted animate-pulse" />
            </div>
          ))
        : trucks.map(truck => (
            <div key={truck.id} className="shrink-0 w-72">
              <TruckCard
                truck={truck}
                isFavorite={favorites.includes(truck.id)}
                onFavorite={() => onFavorite(truck.id)}
                onClick={() => onClick(truck)}
              />
            </div>
          ))}
    </div>
  </section>
);

const TruckCard = ({ truck, isFavorite, onFavorite, onClick }) => (
  <div
    onClick={onClick}
    className="group cursor-pointer"
  >
    <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-muted ring-1 ring-black/5 shadow-sm transition-shadow group-hover:shadow-md">
      <img
        src={truck.image}
        alt={truck.name}
        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
      />
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); onFavorite(); }}
        aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
        className={cn(
          'absolute top-2 right-2 flex h-9 w-9 items-center justify-center rounded-full bg-white/95 backdrop-blur shadow-md transition-all hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
          isFavorite ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
        )}
      >
        <span className="h-5 w-5">{isFavorite ? Icons.heartFilled : Icons.heart}</span>
      </button>
      {!truck.isOpen && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/55 text-sm font-bold uppercase tracking-wide text-white">
          Closed
        </div>
      )}
      {truck.featured && (
        <span className="absolute top-2 left-2 inline-flex items-center rounded-full bg-warning px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-warning-foreground shadow">
          Featured
        </span>
      )}
    </div>
    <div className="mt-3 px-1 space-y-1">
      <h3 className="flex items-center gap-1.5 font-bold text-base leading-tight truncate">
        {truck.name}
        {truck.verified && (
          <span className="h-4 w-4 text-info shrink-0" title="Verified">
            {Icons.checkCircle || Icons.check}
          </span>
        )}
      </h3>
      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <span className="inline-flex items-center gap-1">
          <span className="h-3.5 w-3.5 text-warning">{Icons.star}</span>
          <span className="font-semibold text-foreground">{truck.rating}</span>
          <span className="text-xs">({truck.reviewCount}+)</span>
        </span>
        <span aria-hidden>·</span>
        <span>{truck.distance}</span>
        {truck.prepTime && (
          <>
            <span aria-hidden>·</span>
            <span>{truck.prepTime}</span>
          </>
        )}
      </div>
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>Free pickup</span>
        {truck.cuisine && <span className="truncate">{truck.cuisine}</span>}
      </div>
    </div>
  </div>
);

const BottomNavItem = ({ icon, label, active, badge, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className={cn(
      'relative flex flex-col items-center justify-center gap-0.5 py-2.5 text-[10px] font-medium transition-colors',
      active ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
    )}
  >
    <span className="h-5 w-5">{icon}</span>
    <span>{label}</span>
    {badge > 0 && (
      <span className="absolute top-1 right-[calc(50%-1.5rem)] flex h-4 min-w-[16px] items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground tabular-nums">
        {badge}
      </span>
    )}
  </button>
);

export default HomePage;
