import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from '../components/auth/AuthContext';
import { useToast } from './ToastContext';
import {
  fetchFavorites as fetchFavoritesService,
  addFavorite,
  removeFavorite,
} from '../services/favorites';
import { ensureCustomerRow } from '../services/customers';

const FavoritesContext = createContext({});

export const FavoritesProvider = ({ children }) => {
  const { user, openAuth } = useAuth();
  const { showToast } = useToast();
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch favorites when user changes
  useEffect(() => {
    const fetchFavorites = async () => {
      if (!user) {
        setFavorites([]);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        setFavorites(await fetchFavoritesService(user.id));
      } catch (err) {
        console.error('Error fetching favorites:', err);
        setError(err.message || 'Failed to fetch favorites');
      } finally {
        setLoading(false);
      }
    };

    fetchFavorites();
  }, [user]);

  // Check if a truck is favorited
  const isFavorite = useCallback((truckId) => {
    return favorites.includes(truckId);
  }, [favorites]);

  // Toggle favorite status for a truck
  const toggleFavorite = useCallback(async (truckId) => {
    if (!user) {
      // Open auth modal if not authenticated
      openAuth('login');
      return false;
    }

    const wasFavorite = favorites.includes(truckId);

    // Optimistic update
    if (wasFavorite) {
      setFavorites(prev => prev.filter(id => id !== truckId));
    } else {
      setFavorites(prev => [...prev, truckId]);
    }

    try {
      if (wasFavorite) {
        await removeFavorite(user.id, truckId);
        showToast('Removed from favorites', 'info');
      } else {
        try {
          await addFavorite(user.id, truckId);
        } catch (insertError) {
          // Auto-fix: if FK constraint fails, ensure customer row exists and retry.
          // Caused by historical broken signup triggers (see migration 043).
          if (insertError.message?.includes('foreign key constraint') || insertError.code === '23503') {
            await ensureCustomerRow(user.id);
            await addFavorite(user.id, truckId);
          } else {
            throw insertError;
          }
        }
        showToast('Added to favorites', 'success');
      }
      return true;
    } catch (err) {
      console.error('Error toggling favorite:', err);
      // Revert optimistic update on error
      if (wasFavorite) {
        setFavorites(prev => [...prev, truckId]);
      } else {
        setFavorites(prev => prev.filter(id => id !== truckId));
      }
      setError('Failed to update favorite');
      showToast('Failed to update favorite. Please try again.', 'error');
      return false;
    }
  }, [user, favorites, openAuth, showToast]);

  // Refresh favorites from database
  const refresh = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    try {
      setFavorites(await fetchFavoritesService(user.id));
    } catch (err) {
      console.error('Error refreshing favorites:', err);
      setError(err.message || 'Failed to refresh favorites');
    } finally {
      setLoading(false);
    }
  }, [user]);

  const value = {
    favorites,
    loading,
    error,
    isFavorite,
    toggleFavorite,
    refresh,
  };

  return (
    <FavoritesContext.Provider value={value}>
      {children}
    </FavoritesContext.Provider>
  );
};

export const useFavorites = () => {
  const context = useContext(FavoritesContext);
  if (context === undefined) {
    throw new Error('useFavorites must be used within a FavoritesProvider');
  }
  return context;
};

export default FavoritesContext;
