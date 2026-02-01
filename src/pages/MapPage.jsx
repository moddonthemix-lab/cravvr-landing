import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTrucks } from '../contexts/TruckContext';
import { useFavorites } from '../contexts/FavoritesContext';
import PageWrapper from '../components/app/PageWrapper';
import MapView from '../components/map/MapView';

const MapPage = () => {
  const navigate = useNavigate();
  const { trucks, loading } = useTrucks();
  const { favorites, toggleFavorite } = useFavorites();

  const handleToggleFavorite = (truckId) => {
    toggleFavorite(truckId);
  };

  const handleTruckClick = (truck) => {
    navigate(`/truck/${truck.id}`, { state: { truck } });
  };

  return (
    <PageWrapper activeNav="/map">
      <MapView
        trucks={trucks}
        loading={loading}
        onTruckClick={handleTruckClick}
        favorites={favorites}
        toggleFavorite={handleToggleFavorite}
      />
    </PageWrapper>
  );
};

export default MapPage;
