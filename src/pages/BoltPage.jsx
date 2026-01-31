import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTrucks } from '../contexts/TruckContext';
import PageWrapper from '../components/app/PageWrapper';
import BoltView from '../components/bolt/BoltView';

const BoltPage = () => {
  const navigate = useNavigate();
  const { trucks, loading } = useTrucks();

  const handleTruckClick = (truck) => {
    navigate(`/truck/${truck.id}`, { state: { truck } });
  };

  return (
    <PageWrapper activeNav="/bolt">
      <BoltView
        trucks={trucks}
        loading={loading}
        onTruckClick={handleTruckClick}
      />
    </PageWrapper>
  );
};

export default BoltPage;
