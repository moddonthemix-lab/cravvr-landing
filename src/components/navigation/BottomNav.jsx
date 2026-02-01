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
      >
        <span className="bottom-nav-icon">{Icons.calendar}</span>
        <span className="bottom-nav-label">Events</span>
      </button>
    </nav>
  );
};

export default BottomNav;
