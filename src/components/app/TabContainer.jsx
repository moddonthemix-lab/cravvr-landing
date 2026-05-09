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

const TabContainer = () => {
  const navigate = useNavigate();
  const { openCart, itemCount } = useCart();
  const { trucks, loading } = useTrucks();
  const { favorites, toggleFavorite } = useFavorites();
  const [activeTab, setActiveTab] = useState('explore');

  const handleToggleFavorite = (truckId) => toggleFavorite(truckId);

  const handleTruckClick = (truck) => {
    navigate(truck.slug ? `/t/${truck.slug}` : `/truck/${truck.id}`, { state: { truck } });
  };

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
          <BoltView trucks={trucks} loading={loading} onTruckClick={handleTruckClick} />
        );
      case 'events':
        return (
          <div className="flex min-h-[60vh] items-center justify-center px-6">
            <div className="text-center max-w-md space-y-3">
              <span className="text-5xl">🎉</span>
              <h2 className="text-2xl font-bold tracking-tight">Events Coming Soon</h2>
              <p className="text-sm text-muted-foreground">
                Discover food truck festivals and gatherings near you.
              </p>
            </div>
          </div>
        );
      default:
        return <HomePage embedded />;
    }
  };

  return (
    <div className="flex min-h-screen flex-col pb-16">
      <div className="flex-1">
        {renderContent()}
      </div>
      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
};

export default TabContainer;
