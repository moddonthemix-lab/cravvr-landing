import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { useCart } from '../../contexts/CartContext';
import './PageWrapper.css';

// Icons
const Icons = {
  home: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
  map: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/><line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/></svg>,
  compass: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/></svg>,
  bolt: <svg viewBox="0 0 24 24" fill="currentColor"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>,
  heart: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>,
  orders: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>,
  user: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  search: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  mapPin: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>,
  shoppingBag: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>,
  bell: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>,
};

const PageWrapper = ({ children, activeNav }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signOut } = useAuth();
  const { itemCount, openCart } = useCart();

  const isActive = (path) => {
    if (activeNav) return activeNav === path;
    return location.pathname === path;
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
              <span>Adventure</span>
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
                <button className="nav-item signout" onClick={signOut}>
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
    </div>
  );
};

export default PageWrapper;
