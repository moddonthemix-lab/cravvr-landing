import React, { useState } from 'react';
import { Icons } from '../common/Icons';
import { useAuth } from '../auth/AuthContext';
import AuthModal from '../auth/AuthModal';
import UserMenu from '../auth/UserMenu';

const Header = ({ mobileMenuOpen, setMobileMenuOpen, setCurrentView }) => {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState('login');
  const { isAuthenticated, loading } = useAuth();

  const openLogin = () => {
    setAuthMode('login');
    setShowAuthModal(true);
    setMobileMenuOpen(false);
  };

  const openSignup = () => {
    setAuthMode('signup');
    setShowAuthModal(true);
    setMobileMenuOpen(false);
  };

  const handleNavigate = (destination) => {
    // Handle navigation from user menu
    if (destination === 'profile') {
      setCurrentView('profile');
    } else if (destination === 'owner-dashboard') {
      setCurrentView('owner-dashboard');
    } else if (destination === 'settings') {
      setCurrentView('settings');
    }
  };

  return (
    <>
      <header className="site-header">
        <a href="#main" className="skip-link">Skip to main content</a>
        <div className="header-container">
          <a href="/" className="logo" onClick={(e) => { e.preventDefault(); setCurrentView('landing'); }}>
            <span className="logo-icon">{Icons.truck}</span>
            <span className="logo-text">Cravrr</span>
          </a>

          <nav className="desktop-nav">
            <a href="#features">Features</a>
            <a href="#how-it-works">How it Works</a>
            <a href="#pricing">Pricing</a>
            <a href="#faq">FAQ</a>
            <button onClick={() => setCurrentView('app')} className="nav-app-link">Try Demo</button>
          </nav>

          <div className="header-actions">
            {!loading && (
              <>
                {isAuthenticated ? (
                  <UserMenu onNavigate={handleNavigate} />
                ) : (
                  <div className="auth-buttons">
                    <button className="auth-btn-login" onClick={openLogin}>
                      Log In
                    </button>
                    <button className="auth-btn-signup" onClick={openSignup}>
                      Sign Up
                    </button>
                  </div>
                )}
              </>
            )}
          </div>

          <button
            className="mobile-menu-btn"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? Icons.x : Icons.menu}
          </button>
        </div>

        <div className={`mobile-nav ${mobileMenuOpen ? 'open' : ''}`}>
          <nav>
            <a href="#features" onClick={() => setMobileMenuOpen(false)}>Features</a>
            <a href="#how-it-works" onClick={() => setMobileMenuOpen(false)}>How it Works</a>
            <a href="#pricing" onClick={() => setMobileMenuOpen(false)}>Pricing</a>
            <a href="#faq" onClick={() => setMobileMenuOpen(false)}>FAQ</a>
            <button onClick={() => { setCurrentView('app'); setMobileMenuOpen(false); }} className="nav-app-link">Try Demo</button>
          </nav>

          {!loading && (
            <div className="mobile-auth-section">
              {isAuthenticated ? (
                <div className="mobile-user-info">
                  <UserMenu onNavigate={(dest) => { handleNavigate(dest); setMobileMenuOpen(false); }} />
                </div>
              ) : (
                <div className="auth-buttons">
                  <button className="auth-btn-login" onClick={openLogin}>
                    Log In
                  </button>
                  <button className="auth-btn-signup" onClick={openSignup}>
                    Sign Up
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </header>

      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        initialMode={authMode}
      />
    </>
  );
};

export default Header;
