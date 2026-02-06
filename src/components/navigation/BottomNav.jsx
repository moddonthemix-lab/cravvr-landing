import React from 'react';
import { Icons } from '../common/Icons';
import './BottomNav.css';

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
        title="Coming Soon"
      >
        <span className="bottom-nav-icon">{Icons.calendar}</span>
        <span className="bottom-nav-label">Events</span>
        <span className="coming-soon-dot" style={{ position: 'absolute', top: 4, right: '50%', transform: 'translateX(12px)', width: 6, height: 6, borderRadius: '50%', background: '#f59e0b' }}></span>
      </button>
    </nav>
  );
};

export default BottomNav;
