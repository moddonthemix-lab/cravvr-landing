import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { transformTruck, fetchNearbyTrucks } from '../services/trucks';

const TruckContext = createContext({});

export const TruckProvider = ({ children }) => {
  const [trucks, setTrucks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastFetched, setLastFetched] = useState(null);
  const [nearbyTrucks, setNearbyTrucks] = useState([]);
  const [userCoords, setUserCoords] = useState(null);

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
        const mappedTrucks = data.map(t => transformTruck(t, userCoords));
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
  }, [lastFetched, trucks, userCoords]);

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

  // Load nearby trucks using PostGIS spatial query
  const loadNearbyTrucks = useCallback(async (lat, lng, radiusMiles = 10) => {
    try {
      const result = await fetchNearbyTrucks(lat, lng, radiusMiles);
      setNearbyTrucks(result);
      return result;
    } catch (err) {
      console.error('Error loading nearby trucks:', err);
      return [];
    }
  }, []);

  // Set user location and fetch nearby trucks as the primary truck list
  const setLocationAndFetch = useCallback(async (lat, lng, radiusMiles = 15) => {
    setUserCoords({ lat, lng });
    setLoading(true);
    setError(null);
    try {
      const result = await fetchNearbyTrucks(lat, lng, radiusMiles);
      setTrucks(result);
      setNearbyTrucks(result);
      setLastFetched(Date.now());
      return result;
    } catch (err) {
      console.error('Nearby fetch failed, falling back:', err);
      // Fallback to all trucks with distance calculation
      try {
        const { data, error: fetchError } = await supabase
          .from('food_trucks')
          .select('*');
        if (fetchError) throw fetchError;
        const mapped = data?.map(t => transformTruck(t, { lat, lng })) || [];
        setTrucks(mapped);
        setLastFetched(Date.now());
        return mapped;
      } catch (fallbackErr) {
        setError(fallbackErr.message || 'Failed to fetch trucks');
        return [];
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const value = {
    trucks,
    loading,
    error,
    fetchTrucks,
    refresh,
    getTruckById,
    getFilteredTrucks,
    nearbyTrucks,
    loadNearbyTrucks,
    setLocationAndFetch,
    userCoords,
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
