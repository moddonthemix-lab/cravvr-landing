import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import {
  transformTruck,
  fetchTrucks as fetchTrucksFromService,
  fetchTruckById,
  fetchNearbyTrucks,
  resolveTruckBySlug,
} from '../services/trucks';

const TruckContext = createContext({});
const CACHE_TIMEOUT_MS = 5 * 60 * 1000;

export const TruckProvider = ({ children }) => {
  const [trucks, setTrucks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [nearbyTrucks, setNearbyTrucks] = useState([]);
  const [userCoords, setUserCoords] = useState(null);
  // useRef so cache timestamps don't trigger renders on update.
  const lastFetchedRef = useRef(null);
  // Per-id cache of trucks fetched outside the list (e.g. direct deep links).
  // Stays in sync with `trucks` for entries that exist there too.
  const detailCacheRef = useRef(new Map());

  // Fetch the full list. Cached for CACHE_TIMEOUT_MS unless forceRefresh.
  const fetchTrucks = useCallback(async (forceRefresh = false) => {
    const last = lastFetchedRef.current;
    if (!forceRefresh && last && Date.now() - last < CACHE_TIMEOUT_MS && trucks.length > 0) {
      return trucks;
    }

    setLoading(true);
    setError(null);

    try {
      const mapped = await fetchTrucksFromService(userCoords);
      setTrucks(mapped);
      lastFetchedRef.current = Date.now();
      mapped.forEach((t) => detailCacheRef.current.set(t.id, t));
      return mapped;
    } catch (err) {
      console.error('Error fetching trucks:', err);
      setError(err.message || 'Failed to fetch trucks');
      return [];
    } finally {
      setLoading(false);
    }
  }, [trucks, userCoords]);

  // Initial fetch on mount
  useEffect(() => {
    fetchTrucks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Synchronous lookup against in-memory cache. Does NOT trigger a fetch.
  const getTruckById = useCallback((id) => {
    if (!id) return null;
    return (
      trucks.find((t) => t.id === id) ||
      detailCacheRef.current.get(id) ||
      null
    );
  }, [trucks]);

  // Async loader: returns from cache if present, otherwise fetches by id and
  // caches. Use this for routes like /truck/:id and any deep link.
  const loadTruckById = useCallback(async (id) => {
    if (!id) return null;
    const cached = trucks.find((t) => t.id === id) || detailCacheRef.current.get(id);
    if (cached) return cached;
    const truck = await fetchTruckById(id);
    if (truck) detailCacheRef.current.set(truck.id, truck);
    return truck;
  }, [trucks]);

  // Async loader for slugs (current or historical). Returns the canonical
  // truck; callers can compare `slug` vs `truck.slug` to decide whether to
  // redirect to a canonical URL.
  const loadTruckBySlug = useCallback(async (slug) => {
    if (!slug) return null;
    const cached = trucks.find((t) => t.slug === slug);
    if (cached) return cached;
    const truck = await resolveTruckBySlug(slug);
    if (truck) detailCacheRef.current.set(truck.id, truck);
    return truck;
  }, [trucks]);

  // Drop a truck from the cache. Owner-side mutations should call this so
  // the next list/detail read re-fetches.
  const invalidateTruck = useCallback((id) => {
    if (!id) return;
    detailCacheRef.current.delete(id);
    setTrucks((prev) => prev.filter((t) => t.id !== id));
    lastFetchedRef.current = null;
  }, []);

  // Filtered list (in-memory).
  const getFilteredTrucks = useCallback((filters = {}) => {
    let result = [...trucks];

    if (filters.isOpen !== undefined) {
      result = result.filter((t) => t.isOpen === filters.isOpen);
    }
    if (filters.cuisine) {
      result = result.filter((t) =>
        t.cuisine.toLowerCase().includes(filters.cuisine.toLowerCase())
      );
    }
    if (filters.featured !== undefined) {
      result = result.filter((t) => t.featured === filters.featured);
    }
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      result = result.filter((t) =>
        t.name.toLowerCase().includes(searchLower) ||
        t.cuisine.toLowerCase().includes(searchLower) ||
        t.description.toLowerCase().includes(searchLower)
      );
    }
    return result;
  }, [trucks]);

  const refresh = useCallback(() => fetchTrucks(true), [fetchTrucks]);

  // PostGIS nearby (no list mutation).
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

  // Set user location and refresh the primary list using nearby+distance.
  const setLocationAndFetch = useCallback(async (lat, lng, radiusMiles = 15) => {
    setUserCoords({ lat, lng });
    setLoading(true);
    setError(null);
    try {
      const result = await fetchNearbyTrucks(lat, lng, radiusMiles);
      setTrucks(result);
      setNearbyTrucks(result);
      lastFetchedRef.current = Date.now();
      result.forEach((t) => detailCacheRef.current.set(t.id, t));
      return result;
    } catch (err) {
      console.error('Nearby fetch failed, falling back to fetchTrucks:', err);
      try {
        const mapped = await fetchTrucksFromService({ lat, lng });
        setTrucks(mapped);
        lastFetchedRef.current = Date.now();
        mapped.forEach((t) => detailCacheRef.current.set(t.id, t));
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
    loadTruckById,
    loadTruckBySlug,
    invalidateTruck,
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
