import React from 'react';
import './BottomNav.css';

// Icons for navigation
const Icons = {
  compass: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"></circle>
      <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"></polygon>
    </svg>
  ),
  map: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"></polygon>
      <line x1="8" y1="2" x2="8" y2="18"></line>
      <line x1="16" y1="6" x2="16" y2="22"></line>
    </svg>
  ),
  bolt: (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"></path>
    </svg>
  ),
  heart: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
    </svg>
  ),
  calendar: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
      <line x1="16" y1="2" x2="16" y2="6"></line>
      <line x1="8" y1="2" x2="8" y2="6"></line>
      <line x1="3" y1="10" x2="21" y2="10"></line>
    </svg>
  ),
};

const BottomNav = ({ activeTab, setActiveTab }) => {
  return (
    <nav className="bottom-nav">
      <button
        className={`bottom-nav-item ${activeTab === 'explore' ? 'active' : ''}`}
        onClick={() => setActiveTab('explore')}
      >
        <span className="bottom-nav-icon">{Icons.compass}</span>
        <span className="bottom-nav-label">Explore</span>
      </button>

      <button
        className={`bottom-nav-item ${activeTab === 'map' ? 'active' : ''}`}
        onClick={() => setActiveTab('map')}
      >
        <span className="bottom-nav-icon">{Icons.map}</span>
        <span className="bottom-nav-label">Map</span>
      </button>

      <button
        className={`bottom-nav-item bolt ${activeTab === 'bolt' ? 'active' : ''}`}
        onClick={() => setActiveTab('bolt')}
      >
        <span className="bottom-nav-icon bolt-icon">{Icons.bolt}</span>
      </button>

      <button
        className={`bottom-nav-item ${activeTab === 'discover' ? 'active' : ''}`}
        onClick={() => setActiveTab('discover')}
      >
        <span className="bottom-nav-icon">{Icons.heart}</span>
        <span className="bottom-nav-label">Discover</span>
      </button>

      <button
        className={`bottom-nav-item ${activeTab === 'events' ? 'active' : ''}`}
        onClick={() => setActiveTab('events')}
        disabled
      >
        <span className="bottom-nav-icon">{Icons.calendar}</span>
        <span className="bottom-nav-label">Events</span>
      </button>
    </nav>
  );
};

export default BottomNav;
