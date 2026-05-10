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
import NotificationBell from '../common/NotificationBell';
import { Icons } from '../common/Icons';
import MobileNavDrawer from './MobileNavDrawer';

const TabContainer = () => {
  const navigate = useNavigate();
  const { openCart, itemCount } = useCart();
  const { trucks, loading } = useTrucks();
  const { favorites, toggleFavorite } = useFavorites();
  const [activeTab, setActiveTab] = useState('explore');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

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
      <header className="sticky top-0 z-40 flex items-center gap-3 border-b border-border bg-background/85 backdrop-blur px-4 py-3">
        <button
          type="button"
          aria-label="Open menu"
          onClick={() => setMobileNavOpen(true)}
          className="flex h-10 w-10 items-center justify-center rounded-full text-foreground transition-colors hover:bg-muted"
        >
          <span className="h-5 w-5">{Icons.menu}</span>
        </button>
        <div className="cursor-pointer shrink-0" onClick={() => navigate('/')}>
          <img src="/logo/cravvr-logo.png" alt="Cravvr" className="h-9 w-auto" />
        </div>
        <div className="ml-auto flex items-center gap-2">
          <NotificationBell />
          <button
            type="button"
            onClick={openCart}
            aria-label="Open cart"
            className="relative flex h-10 w-10 items-center justify-center rounded-full text-foreground transition-colors hover:bg-muted"
          >
            <span className="h-5 w-5">{Icons.shoppingBag}</span>
            {itemCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[11px] font-semibold text-primary-foreground tabular-nums">
                {itemCount}
              </span>
            )}
          </button>
        </div>
      </header>

      <MobileNavDrawer open={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />

      <div className="flex-1">
        {renderContent()}
      </div>
      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
};

export default TabContainer;
