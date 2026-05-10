import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { Icons } from '../common/Icons';
import { cn } from '@/lib/utils';

const sidebarItem =
  'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground';
const sidebarItemActive =
  'bg-primary/10 text-primary hover:bg-primary/15 hover:text-primary';

// Mobile-only hamburger button + slide-in drawer with the full app nav.
// Used by PageWrapper (route-based mobile) and TabContainer (tab-state mobile)
// so a hamburger menu is reachable from every authenticated surface.
export const MobileNavTrigger = ({ onClick }) => (
  <button
    type="button"
    aria-label="Open menu"
    onClick={onClick}
    className="flex h-10 w-10 items-center justify-center rounded-full text-foreground transition-colors hover:bg-muted lg:hidden"
  >
    <span className="h-5 w-5">{Icons.menu}</span>
  </button>
);

const MobileNavDrawer = ({ open, onClose }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signOut, openAuth, isOwner, isAdmin } = useAuth();

  const isActive = (path) => location.pathname === path;
  const goto = (path) => {
    navigate(path);
    onClose();
  };
  const handleSignOut = async () => {
    onClose();
    try {
      navigate('/', { replace: true });
      await signOut();
    } catch (err) {
      console.error('Sign out failed:', err);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-background/60 backdrop-blur-sm" onClick={onClose} />
      <aside className="absolute left-0 top-0 bottom-0 flex w-72 max-w-[85vw] flex-col border-r border-border bg-card shadow-xl">
        <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
          <img src="/logo/cravvr-logo.png" alt="Cravvr" className="h-8 w-auto" />
          <button
            type="button"
            aria-label="Close menu"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full text-foreground transition-colors hover:bg-muted"
          >
            <span className="h-5 w-5">{Icons.x}</span>
          </button>
        </div>
        <nav className="flex flex-col gap-1 p-3 overflow-y-auto">
          <button className={cn(sidebarItem, isActive('/') && sidebarItemActive)} onClick={() => goto('/')}>
            <span className="h-5 w-5 shrink-0">{Icons.home}</span>
            <span>Home</span>
          </button>
          <button className={cn(sidebarItem, isActive('/map') && sidebarItemActive)} onClick={() => goto('/map')}>
            <span className="h-5 w-5 shrink-0">{Icons.map}</span>
            <span>Map</span>
          </button>
          <button className={cn(sidebarItem, isActive('/discover') && sidebarItemActive)} onClick={() => goto('/discover')}>
            <span className="h-5 w-5 shrink-0">{Icons.compass}</span>
            <span>Discover</span>
          </button>
          <button className={cn(sidebarItem, isActive('/bolt') && sidebarItemActive)} onClick={() => goto('/bolt')}>
            <span className="h-5 w-5 shrink-0">{Icons.bolt}</span>
            <span>Bolt</span>
          </button>

          <div className="my-2 border-t border-border" />

          <button className={sidebarItem} onClick={() => goto('/profile?tab=favorites')}>
            <span className="h-5 w-5 shrink-0">{Icons.heart}</span>
            <span>Favorites</span>
          </button>
          <button className={sidebarItem} onClick={() => goto('/profile?tab=orders')}>
            <span className="h-5 w-5 shrink-0">{Icons.orders}</span>
            <span>Orders</span>
          </button>

          <div className="my-2 border-t border-border" />

          {user ? (
            <>
              <button className={cn(sidebarItem, isActive('/profile') && sidebarItemActive)} onClick={() => goto('/profile')}>
                <span className="h-5 w-5 shrink-0">{Icons.user}</span>
                <span>Account</span>
              </button>
              {isOwner && (
                <button className={cn(sidebarItem, isActive('/owner') && sidebarItemActive)} onClick={() => goto('/owner')}>
                  <span className="h-5 w-5 shrink-0">{Icons.truck}</span>
                  <span>My Trucks</span>
                </button>
              )}
              {isAdmin && (
                <button className={cn(sidebarItem, isActive('/admin') && sidebarItemActive)} onClick={() => goto('/admin')}>
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
            <button
              className={cn(sidebarItem, 'text-primary')}
              onClick={() => { onClose(); openAuth('login'); }}
            >
              <span className="h-5 w-5 shrink-0">{Icons.user}</span>
              <span>Sign In</span>
            </button>
          )}
        </nav>
      </aside>
    </div>
  );
};

// Convenience: hook returns [trigger element, drawer element] sharing state.
export const useMobileNav = () => {
  const [open, setOpen] = useState(false);
  return {
    open,
    trigger: <MobileNavTrigger onClick={() => setOpen(true)} />,
    drawer: <MobileNavDrawer open={open} onClose={() => setOpen(false)} />,
  };
};

export default MobileNavDrawer;
