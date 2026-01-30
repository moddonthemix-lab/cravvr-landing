import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import PageWrapper from '../components/app/PageWrapper';
import BoltView from '../components/bolt/BoltView';

const BoltPage = () => {
  const navigate = useNavigate();
  const [trucks, setTrucks] = useState([]);
  const [loading, setLoading] = useState(true);

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
