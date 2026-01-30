import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../components/auth/AuthContext';
import { supabase } from '../lib/supabase';
import PageWrapper from '../components/app/PageWrapper';
import DiscoverView from '../components/discover/DiscoverView';

const DiscoverPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [trucks, setTrucks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [favorites, setFavorites] = useState([]);

  useEffect(() => {
    const fetchTrucks = async () => {
      try {
        const { data, error } = await supabase.from('food_trucks').select('*');
        if (error) throw error;

        if (data) {
          const mappedTrucks = data.map(truck => ({
            id: truck.id,
            name: truck.name,
            image: truck.image_url || 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?auto=format&fit=crop&w=800&q=80',
            cuisine: truck.cuisine_type || 'Food Truck',
            priceRange: truck.price_range || '$$',
            description: truck.description || 'Delicious food made fresh daily.',
            location: truck.current_location || 'Portland, OR',
            distance: '1.0 mi',
            rating: truck.rating || 4.5,
            isOpen: truck.is_open !== false,
            deliveryTime: truck.delivery_time || '15-25 min',
            deliveryFee: truck.delivery_fee || 2.99,
            featured: truck.featured || false,
          }));
          setTrucks(mappedTrucks);
        }
      } catch (err) {
        console.error('Error fetching trucks:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchTrucks();
  }, []);

  useEffect(() => {
    const fetchFavorites = async () => {
      if (!user) return;
      const { data } = await supabase
        .from('favorites')
        .select('truck_id')
        .eq('customer_id', user.id);
      if (data) setFavorites(data.map(f => f.truck_id));
    };
    fetchFavorites();
  }, [user]);

  const toggleFavorite = async (truckId) => {
    if (!user) {
      navigate('/eat');
      return;
    }
    const isFavorite = favorites.includes(truckId);
    if (isFavorite) {
      setFavorites(prev => prev.filter(id => id !== truckId));
      await supabase.from('favorites').delete().eq('customer_id', user.id).eq('truck_id', truckId);
    } else {
      setFavorites(prev => [...prev, truckId]);
      await supabase.from('favorites').insert({ customer_id: user.id, truck_id: truckId });
    }
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
        toggleFavorite={toggleFavorite}
        onTruckClick={handleTruckClick}
      />
    </PageWrapper>
  );
};

export default DiscoverPage;
