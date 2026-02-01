import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { useCart } from '../../contexts/CartContext';
import { Icons } from '../common/Icons';
import './PageWrapper.css';

const PageWrapper = ({ children, activeNav }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signOut } = useAuth();
  const { itemCount, openCart } = useCart();

  const isActive = (path) => {
    if (activeNav) return activeNav === path;
    return location.pathname === path;
  };

  // Handle sign out with navigation
  const handleSignOut = async () => {
    try {
      navigate('/', { replace: true });
      await signOut();
    } catch (err) {
      console.error('Sign out failed:', err);
    }
  };

  return (
    <div className="page-wrapper">
      {/* Header */}
      <header className="page-header">
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
          <button className="icon-btn">
            {Icons.bell}
          </button>
          <button className="cart-btn" onClick={openCart}>
            {Icons.shoppingBag}
            {itemCount > 0 && <span className="cart-count">{itemCount}</span>}
          </button>
        </div>
      </header>

      <div className="page-layout">
        {/* Sidebar */}
        <aside className="page-sidebar">
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
            <button className={`nav-item ${isActive('/favorites') ? 'active' : ''}`} onClick={() => navigate('/favorites')}>
              {Icons.heart}
              <span>Favorites</span>
            </button>
            <button className={`nav-item ${isActive('/orders') ? 'active' : ''}`} onClick={() => navigate('/orders')}>
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
                <button className="nav-item signout" onClick={handleSignOut}>
                  {Icons.logOut}
                  <span>Sign Out</span>
                </button>
              </>
            ) : (
              <button className="nav-item signin" onClick={() => navigate('/eat')}>
                {Icons.user}
                <span>Sign In</span>
              </button>
            )}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="page-main">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <nav className="mobile-nav">
        <div className="mobile-nav-items">
          <button
            className={`mobile-nav-item ${isActive('/') ? 'active' : ''}`}
            onClick={() => navigate('/')}
          >
            {Icons.home}
            <span>Home</span>
          </button>
          <button
            className={`mobile-nav-item ${isActive('/map') ? 'active' : ''}`}
            onClick={() => navigate('/map')}
          >
            {Icons.map}
            <span>Map</span>
          </button>
          <button
            className={`mobile-nav-item ${isActive('/discover') ? 'active' : ''}`}
            onClick={() => navigate('/discover')}
          >
            {Icons.compass}
            <span>Discover</span>
          </button>
          <button
            className={`mobile-nav-item bolt-nav ${isActive('/bolt') ? 'active' : ''}`}
            onClick={() => navigate('/bolt')}
          >
            {Icons.bolt}
            <span>Bolt</span>
          </button>
          <button
            className="mobile-nav-item cart-nav"
            onClick={openCart}
          >
            {Icons.shoppingBag}
            <span>Cart</span>
            {itemCount > 0 && <span className="mobile-nav-badge">{itemCount}</span>}
          </button>
          <button
            className={`mobile-nav-item ${isActive('/profile') ? 'active' : ''}`}
            onClick={() => user ? navigate('/profile') : navigate('/eat')}
          >
            {Icons.user}
            <span>{user ? 'Account' : 'Sign In'}</span>
          </button>
        </div>
      </nav>
    </div>
  );
};

export default PageWrapper;
