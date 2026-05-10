import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { useCart } from '../../contexts/CartContext';
import { Icons } from '../common/Icons';
import useUserLocation from '../../hooks/useUserLocation';
import { cn } from '@/lib/utils';

// Shared customer-facing app chrome: header (logo + search + city + bell + cart),
// desktop left sidebar (Home/Map/Discover/Bolt + Favorites/Orders + Account/role
// nav), and mobile bottom nav. Used to wrap Home, Map, Discover, and Bolt so all
// four routes share identical chrome.
//
// Visual language matches the previous HomePage chrome (Tailwind + rose primary)
// so the user sees no UI drift when switching between these routes.

const sidebarItem =
  'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground';
const sidebarItemActive =
  'bg-primary/10 text-primary hover:bg-primary/15 hover:text-primary';

const BottomNavItem = ({ icon, label, active, onClick, badge }) => (
  <button
    type="button"
    onClick={onClick}
    className={cn(
      'relative flex flex-col items-center justify-center gap-0.5 py-2 text-[11px] font-medium transition-colors',
      active ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
    )}
  >
    <span className="h-5 w-5">{icon}</span>
    <span>{label}</span>
    {badge != null && badge > 0 && (
      <span className="absolute top-1 right-2 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-primary px-1 text-[9px] font-semibold text-primary-foreground tabular-nums">
        {badge}
      </span>
    )}
  </button>
);

const PageWrapper = ({ children, activeNav }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signOut, openAuth, isOwner, isAdmin } = useAuth();
  const { itemCount, openCart } = useCart();
  const { city: rawCity } = useUserLocation();
  const userCity = typeof rawCity === 'string' ? rawCity : (rawCity?.city || 'Your Location');
  const [searchQuery, setSearchQuery] = useState('');

  const isActive = (path) => {
    if (activeNav) return activeNav === path;
    return location.pathname === path;
  };

  const handleSignOut = async () => {
    try {
      navigate('/', { replace: true });
      await signOut();
    } catch (err) {
      console.error('Sign out failed:', err);
    }
  };

  const onSearchSubmit = (e) => {
    e.preventDefault();
    if (location.pathname !== '/') navigate('/');
  };

  return (
    <div className="flex min-h-screen flex-col bg-background pb-20 lg:pb-0">
      {/* Header */}
      <header className="sticky top-0 z-40 flex items-center gap-3 border-b border-border bg-background/85 backdrop-blur px-4 py-3 sm:px-6">
        <div
          className="cursor-pointer shrink-0"
          onClick={() => navigate('/')}
        >
          <img src="/logo/cravvr-logo.png" alt="Cravvr" className="h-9 w-auto" />
        </div>

        <form onSubmit={onSearchSubmit} className="hidden md:flex flex-1 max-w-xl mx-auto">
          <div className="relative w-full">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground">
              {Icons.search}
            </span>
            <input
              type="search"
              placeholder="Search food trucks, cuisines…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onClick={() => location.pathname !== '/' && navigate('/')}
              className="h-10 w-full rounded-full border border-input bg-muted/50 pl-10 pr-4 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            />
          </div>
        </form>

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

      <div className="flex flex-1 min-h-0">
        {/* Sidebar (desktop only) */}
        <aside className="hidden lg:flex lg:flex-col lg:w-60 lg:shrink-0 lg:sticky lg:top-[65px] lg:h-[calc(100vh-65px)] lg:overflow-y-auto lg:border-r lg:border-border lg:bg-card">
          <nav className="flex flex-col gap-1 p-3">
            <button
              className={cn(sidebarItem, isActive('/') && sidebarItemActive)}
              onClick={() => navigate('/')}
            >
              <span className="h-5 w-5 shrink-0">{Icons.home}</span>
              <span>Home</span>
            </button>
            <button
              className={cn(sidebarItem, isActive('/map') && sidebarItemActive)}
              onClick={() => navigate('/map')}
            >
              <span className="h-5 w-5 shrink-0">{Icons.map}</span>
              <span>Map</span>
            </button>
            <button
              className={cn(sidebarItem, isActive('/discover') && sidebarItemActive)}
              onClick={() => navigate('/discover')}
            >
              <span className="h-5 w-5 shrink-0">{Icons.compass}</span>
              <span>Discover</span>
            </button>
            <button
              className={cn(sidebarItem, isActive('/bolt') && sidebarItemActive)}
              onClick={() => navigate('/bolt')}
            >
              <span className="h-5 w-5 shrink-0">{Icons.bolt}</span>
              <span>Bolt</span>
            </button>
          </nav>

          <div className="mx-3 my-2 border-t border-border" />

          <nav className="flex flex-col gap-1 p-3">
            <button
              className={cn(sidebarItem, isActive('/favorites') && sidebarItemActive)}
              onClick={() => navigate('/profile?tab=favorites')}
            >
              <span className="h-5 w-5 shrink-0">{Icons.heart}</span>
              <span>Favorites</span>
            </button>
            <button
              className={cn(sidebarItem, isActive('/orders') && sidebarItemActive)}
              onClick={() => navigate('/profile?tab=orders')}
            >
              <span className="h-5 w-5 shrink-0">{Icons.orders}</span>
              <span>Orders</span>
            </button>
          </nav>

          <div className="mx-3 my-2 border-t border-border" />

          <nav className="flex flex-col gap-1 p-3">
            {user ? (
              <>
                <button
                  className={cn(sidebarItem, isActive('/profile') && sidebarItemActive)}
                  onClick={() => navigate('/profile')}
                >
                  <span className="h-5 w-5 shrink-0">{Icons.user}</span>
                  <span>Account</span>
                </button>
                {isOwner && (
                  <button
                    className={cn(sidebarItem, isActive('/owner') && sidebarItemActive)}
                    onClick={() => navigate('/owner')}
                  >
                    <span className="h-5 w-5 shrink-0">{Icons.truck}</span>
                    <span>My Trucks</span>
                  </button>
                )}
                {isAdmin && (
                  <button
                    className={cn(sidebarItem, isActive('/admin') && sidebarItemActive)}
                    onClick={() => navigate('/admin')}
                  >
                    <span className="h-5 w-5 shrink-0">{Icons.settings}</span>
                    <span>Admin</span>
                  </button>
                )}
                <button
                  className={cn(
                    sidebarItem,
                    'text-destructive hover:bg-destructive/10 hover:text-destructive'
                  )}
                  onClick={handleSignOut}
                >
                  <span className="h-5 w-5 shrink-0">{Icons.logOut}</span>
                  <span>Sign Out</span>
                </button>
              </>
            ) : (
              <button
                className={cn(sidebarItem, 'text-primary')}
                onClick={() => openAuth('login')}
              >
                <span className="h-5 w-5 shrink-0">{Icons.user}</span>
                <span>Sign In</span>
              </button>
            )}
          </nav>
        </aside>

        {/* Main */}
        <main className="flex-1 min-w-0">{children}</main>
      </div>

      {/* Mobile Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-background/95 backdrop-blur lg:hidden">
        <div className="grid grid-cols-6 items-center">
          <BottomNavItem
            icon={Icons.home}
            label="Home"
            active={isActive('/')}
            onClick={() => navigate('/')}
          />
          <BottomNavItem
            icon={Icons.map}
            label="Map"
            active={isActive('/map')}
            onClick={() => navigate('/map')}
          />
          <BottomNavItem
            icon={Icons.compass}
            label="Discover"
            active={isActive('/discover')}
            onClick={() => navigate('/discover')}
          />
          <BottomNavItem
            icon={Icons.bolt}
            label="Bolt"
            active={isActive('/bolt')}
            onClick={() => navigate('/bolt')}
          />
          <BottomNavItem
            icon={Icons.shoppingBag}
            label="Cart"
            badge={itemCount}
            onClick={openCart}
          />
          <BottomNavItem
            icon={Icons.user}
            label={user ? 'Account' : 'Sign In'}
            active={isActive('/profile')}
            onClick={() => (user ? navigate('/profile') : navigate('/eat'))}
          />
        </div>
      </nav>
    </div>
  );
};

export default PageWrapper;
