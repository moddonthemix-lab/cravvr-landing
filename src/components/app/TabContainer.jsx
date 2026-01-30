import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { useCart } from '../../contexts/CartContext';
import { supabase } from '../../lib/supabase';
import BottomNav from '../navigation/BottomNav';
import MapView from '../map/MapView';
import DiscoverView from '../discover/DiscoverView';
import BoltView from '../bolt/BoltView';
import HomePage from '../home/HomePage';
import './TabContainer.css';

const TabContainer = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { openCart, itemCount } = useCart();
  const [activeTab, setActiveTab] = useState('explore');
  const [trucks, setTrucks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [favorites, setFavorites] = useState([]);

  // Fetch trucks from Supabase
  useEffect(() => {
    const fetchTrucks = async () => {
      try {
        const { data, error } = await supabase
          .from('food_trucks')
          .select('*');

        if (error) throw error;

        if (data && data.length > 0) {
          const mappedTrucks = data.map(truck => ({
            id: truck.id,
            name: truck.name,
            image: truck.image_url || 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?auto=format&fit=crop&w=800&q=80',
            coverImage: truck.cover_image_url || truck.image_url,
            cuisine: truck.cuisine_type || 'Food Truck',
            priceRange: truck.price_range || '$$',
            description: truck.description || 'Delicious food made fresh daily.',
            location: truck.current_location || 'Portland, OR',
            hours: truck.hours || '11am - 9pm',
            distance: '1.0 mi',
            rating: truck.rating || 4.5,
            reviewCount: truck.review_count || 0,
            isOpen: truck.is_open !== false,
            deliveryTime: truck.delivery_time || '15-25 min',
            deliveryFee: truck.delivery_fee || 2.99,
            featured: truck.featured || false,
            lat: truck.latitude || null,
            lng: truck.longitude || null,
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

  // Fetch user favorites
  useEffect(() => {
    const fetchFavorites = async () => {
      if (!user) return;

      const { data } = await supabase
        .from('favorites')
        .select('truck_id')
        .eq('customer_id', user.id);

      if (data) {
        setFavorites(data.map(f => f.truck_id));
      }
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
      await supabase.from('favorites').delete()
        .eq('customer_id', user.id)
        .eq('truck_id', truckId);
    } else {
      setFavorites(prev => [...prev, truckId]);
      await supabase.from('favorites').insert({
        customer_id: user.id,
        truck_id: truckId,
      });
    }
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
            toggleFavorite={toggleFavorite}
          />
        );
      case 'discover':
        return (
          <DiscoverView
            trucks={trucks}
            loading={loading}
            favorites={favorites}
            toggleFavorite={toggleFavorite}
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
