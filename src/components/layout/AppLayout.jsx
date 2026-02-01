import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { useCart } from '../../contexts/CartContext';
import { useToast } from '../../contexts/ToastContext';
import { Icons } from '../common/Icons';
import NotificationBell from '../common/NotificationBell';
import './AppLayout.css';

/**
 * Unified app layout that provides:
 * - Desktop: Sidebar navigation + header
 * - Mobile: Bottom navigation bar
 *
 * @param {Object} props
 * @param {React.ReactNode} props.children - Page content
 * @param {string} props.activeNav - Override for active nav item
 * @param {boolean} props.hideNav - Hide navigation (for full-screen pages)
 */
const AppLayout = ({ children, activeNav, hideNav = false }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signOut, openAuth, isOwner, isAdmin } = useAuth();
  const { itemCount, openCart } = useCart();
  const { showToast } = useToast();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isActive = (path) => {
    if (activeNav) return activeNav === path;
    return location.pathname === path;
  };

  // Handle sign out with navigation to home
  const handleSignOut = async () => {
    try {
      // Navigate first to prevent ProtectedRoute from reopening auth modal
      navigate('/', { replace: true });
      await signOut();
      showToast('You have been signed out', 'info');
    } catch (err) {
      console.error('Sign out failed:', err);
      showToast('Sign out failed', 'error');
    }
  };

  if (hideNav) {
    return <div className="app-layout no-nav">{children}</div>;
  }

  // Mobile layout with bottom nav
  if (isMobile) {
    return (
      <div className="app-layout mobile">
        <main className="app-main">{children}</main>
        <nav className="mobile-nav">
          <button
            className={`mobile-nav-item ${isActive('/') ? 'active' : ''}`}
            onClick={() => navigate('/')}
          >
            <span className="nav-icon">{Icons.compass}</span>
            <span className="nav-label">Explore</span>
          </button>
          <button
            className={`mobile-nav-item ${isActive('/map') ? 'active' : ''}`}
            onClick={() => navigate('/map')}
          >
            <span className="nav-icon">{Icons.map}</span>
            <span className="nav-label">Map</span>
          </button>
          <button
            className={`mobile-nav-item bolt ${isActive('/bolt') ? 'active' : ''}`}
            onClick={() => navigate('/bolt')}
          >
            <span className="nav-icon bolt-icon">{Icons.bolt}</span>
          </button>
          <button
            className={`mobile-nav-item ${isActive('/discover') ? 'active' : ''}`}
            onClick={() => navigate('/discover')}
          >
            <span className="nav-icon">{Icons.heart}</span>
            <span className="nav-label">Discover</span>
          </button>
          {isOwner ? (
            <button
              className={`mobile-nav-item ${isActive('/owner') ? 'active' : ''}`}
              onClick={() => navigate('/owner')}
            >
              <span className="nav-icon">{Icons.truck}</span>
              <span className="nav-label">My Trucks</span>
            </button>
          ) : (
            <button
              className={`mobile-nav-item ${isActive('/profile') ? 'active' : ''}`}
              onClick={() => navigate('/profile')}
            >
              <span className="nav-icon">{Icons.user}</span>
              <span className="nav-label">Account</span>
            </button>
          )}
        </nav>
      </div>
    );
  }

  // Desktop layout with sidebar
  return (
    <div className="app-layout desktop">
      {/* Header */}
      <header className="app-header">
        <div className="header-left">
          <div className="logo" onClick={() => navigate('/')}>
            <img src="/logo/cravvr-logo.png" alt="Cravrr" className="logo-image" />
          </div>
        </div>

        <div className="header-center">
          <div className="search-bar">
            <span className="search-icon">{Icons.search}</span>
            <input
              type="text"
              placeholder="Search food trucks, cuisines..."
              readOnly
              onClick={() => navigate('/')}
            />
          </div>
        </div>

        <div className="header-right">
          <div className="location-picker">
            <span className="location-icon">{Icons.mapPin}</span>
            <span className="location-text">Portland, OR</span>
          </div>
          <NotificationBell />
          <button className="cart-btn" onClick={openCart} aria-label="Cart">
            {Icons.shoppingBag}
            {itemCount > 0 && <span className="cart-count">{itemCount}</span>}
          </button>
        </div>
      </header>

      <div className="app-body">
        {/* Sidebar */}
        <aside className="app-sidebar">
          <nav className="sidebar-nav">
            <button className={`nav-item ${isActive('/') ? 'active' : ''}`} onClick={() => navigate('/')}>
              {Icons.home}
              <span>Home</span>
            </button>
            <button className={`nav-item ${isActive('/map') ? 'active' : ''}`} onClick={() => navigate('/map')}>
              {Icons.map}
              <span>Map</span>
            </button>
            <button className={`nav-item ${isActive('/discover') ? 'active' : ''}`} onClick={() => navigate('/discover')}>
              {Icons.compass}
              <span>Discover</span>
            </button>
            <button className={`nav-item bolt-nav ${isActive('/bolt') ? 'active' : ''}`} onClick={() => navigate('/bolt')}>
              {Icons.bolt}
              <span>Bolt</span>
            </button>
          </nav>

          <div className="sidebar-divider" />

          <nav className="sidebar-nav">
            <button className={`nav-item ${isActive('/favorites') || isActive('/profile?tab=favorites') ? 'active' : ''}`} onClick={() => navigate('/profile?tab=favorites')}>
              {Icons.heart}
              <span>Favorites</span>
            </button>
            <button className={`nav-item ${isActive('/orders') || isActive('/profile?tab=orders') ? 'active' : ''}`} onClick={() => navigate('/profile?tab=orders')}>
              {Icons.orders}
              <span>Orders</span>
            </button>
          </nav>

          <div className="sidebar-divider" />

          <nav className="sidebar-nav">
            {user ? (
              <>
                <button className={`nav-item ${isActive('/profile') ? 'active' : ''}`} onClick={() => navigate('/profile')}>
                  {Icons.user}
                  <span>Account</span>
                </button>
                {isOwner && (
                  <button className={`nav-item ${isActive('/owner') ? 'active' : ''}`} onClick={() => navigate('/owner')}>
                    {Icons.truck}
                    <span>My Trucks</span>
                  </button>
                )}
                {isAdmin && (
                  <button className={`nav-item ${isActive('/admin') ? 'active' : ''}`} onClick={() => navigate('/admin')}>
                    {Icons.settings}
                    <span>Admin</span>
                  </button>
                )}
                <button className="nav-item signout" onClick={handleSignOut}>
                  {Icons.logOut}
                  <span>Sign Out</span>
                </button>
              </>
            ) : (
              <button className="nav-item signin" onClick={() => openAuth('login')}>
                {Icons.user}
                <span>Sign In</span>
              </button>
            )}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="app-main">{children}</main>
      </div>
    </div>
  );
};

export default AppLayout;
