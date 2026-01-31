import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../contexts/CartContext';
import { useTrucks } from '../../contexts/TruckContext';
import { useFavorites } from '../../contexts/FavoritesContext';
import BottomNav from '../navigation/BottomNav';
import MapView from '../map/MapView';
import DiscoverView from '../discover/DiscoverView';
import BoltView from '../bolt/BoltView';
import HomePage from '../home/HomePage';
import './TabContainer.css';

const TabContainer = () => {
  const navigate = useNavigate();
  const { openCart, itemCount } = useCart();
  const { trucks, loading } = useTrucks();
  const { favorites, toggleFavorite } = useFavorites();
  const [activeTab, setActiveTab] = useState('explore');

  const handleToggleFavorite = (truckId) => {
    toggleFavorite(truckId, navigate);
  };

  const handleTruckClick = (truck) => {
    navigate(`/truck/${truck.id}`, { state: { truck } });
  };

  // Render active tab content
  const renderContent = () => {
    switch (activeTab) {
      case 'explore':
        return <HomePage embedded />;
      case 'map':
        return (
          <MapView
            trucks={trucks}
            loading={loading}
            onTruckClick={handleTruckClick}
            favorites={favorites}
            toggleFavorite={handleToggleFavorite}
          />
        );
      case 'discover':
        return (
          <DiscoverView
            trucks={trucks}
            loading={loading}
            favorites={favorites}
            toggleFavorite={handleToggleFavorite}
            onTruckClick={handleTruckClick}
          />
        );
      case 'bolt':
        return (
          <BoltView
            trucks={trucks}
            loading={loading}
            onTruckClick={handleTruckClick}
          />
        );
      case 'events':
        return (
          <div className="coming-soon-view">
            <div className="coming-soon-content">
              <span className="coming-soon-emoji">🎉</span>
              <h2>Events Coming Soon</h2>
              <p>Discover food truck festivals and gatherings near you.</p>
            </div>
          </div>
        );
      default:
        return <HomePage embedded />;
    }
  };

  return (
    <div className="tab-container">
      <div className="tab-content">
        {renderContent()}
      </div>
      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
};

export default TabContainer;
