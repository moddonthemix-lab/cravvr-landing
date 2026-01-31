import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

const TruckContext = createContext({});

// Transform raw Supabase truck data to app format
const transformTruck = (truck) => ({
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
  lat: truck.latitude,
  lng: truck.longitude,
  // Preserve raw data for cases that need additional fields
  _raw: truck,
});

export const TruckProvider = ({ children }) => {
  const [trucks, setTrucks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastFetched, setLastFetched] = useState(null);

  // Fetch trucks from Supabase
  const fetchTrucks = useCallback(async (forceRefresh = false) => {
    // Use cache if data was fetched within last 5 minutes and not forcing refresh
    const cacheTimeout = 5 * 60 * 1000; // 5 minutes
    if (!forceRefresh && lastFetched && Date.now() - lastFetched < cacheTimeout && trucks.length > 0) {
      return trucks;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('food_trucks')
        .select('*');

      if (fetchError) throw fetchError;

      if (data) {
        const mappedTrucks = data.map(transformTruck);
        setTrucks(mappedTrucks);
        setLastFetched(Date.now());
        return mappedTrucks;
      }
      return [];
    } catch (err) {
      console.error('Error fetching trucks:', err);
      setError(err.message || 'Failed to fetch trucks');
      return [];
    } finally {
      setLoading(false);
    }
  }, [lastFetched, trucks]);

  // Initial fetch on mount
  useEffect(() => {
    fetchTrucks();
  }, []);

  // Get a single truck by ID
  const getTruckById = useCallback((id) => {
    return trucks.find(t => t.id === id) || null;
  }, [trucks]);

  // Get trucks filtered by criteria
  const getFilteredTrucks = useCallback((filters = {}) => {
    let result = [...trucks];

    if (filters.isOpen !== undefined) {
      result = result.filter(t => t.isOpen === filters.isOpen);
    }

    if (filters.cuisine) {
      result = result.filter(t =>
        t.cuisine.toLowerCase().includes(filters.cuisine.toLowerCase())
      );
    }

    if (filters.featured !== undefined) {
      result = result.filter(t => t.featured === filters.featured);
    }

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      result = result.filter(t =>
        t.name.toLowerCase().includes(searchLower) ||
        t.cuisine.toLowerCase().includes(searchLower) ||
        t.description.toLowerCase().includes(searchLower)
      );
    }

    return result;
  }, [trucks]);

  // Force refresh trucks data
  const refresh = useCallback(() => {
    return fetchTrucks(true);
  }, [fetchTrucks]);

  const value = {
    trucks,
    loading,
    error,
    fetchTrucks,
    refresh,
    getTruckById,
    getFilteredTrucks,
  };

  return (
    <TruckContext.Provider value={value}>
      {children}
    </TruckContext.Provider>
  );
};

export const useTrucks = () => {
  const context = useContext(TruckContext);
  if (context === undefined) {
    throw new Error('useTrucks must be used within a TruckProvider');
  }
  return context;
};

export default TruckContext;
