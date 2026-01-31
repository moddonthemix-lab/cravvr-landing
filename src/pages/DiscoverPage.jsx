import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTrucks } from '../contexts/TruckContext';
import { useFavorites } from '../contexts/FavoritesContext';
import PageWrapper from '../components/app/PageWrapper';
import DiscoverView from '../components/discover/DiscoverView';

const DiscoverPage = () => {
  const navigate = useNavigate();
  const { trucks, loading } = useTrucks();
  const { favorites, toggleFavorite } = useFavorites();

  const handleToggleFavorite = (truckId) => {
    toggleFavorite(truckId, navigate);
  };

  const handleTruckClick = (truck) => {
    navigate(`/truck/${truck.id}`, { state: { truck } });
  };

  return (
    <PageWrapper activeNav="/discover">
      <DiscoverView
        trucks={trucks}
        loading={loading}
        favorites={favorites}
        toggleFavorite={handleToggleFavorite}
        onTruckClick={handleTruckClick}
      />
    </PageWrapper>
  );
};

export default DiscoverPage;
