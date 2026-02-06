import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from '../components/auth/AuthContext';
import { useToast } from './ToastContext';
import { supabase } from '../lib/supabase';

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
        const { data, error: fetchError } = await supabase
          .from('favorites')
          .select('truck_id')
          .eq('customer_id', user.id);

        if (fetchError) throw fetchError;

        if (data) {
          setFavorites(data.map(f => f.truck_id));
        }
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
        const { error: deleteError } = await supabase
          .from('favorites')
          .delete()
          .eq('customer_id', user.id)
          .eq('truck_id', truckId);

        if (deleteError) throw deleteError;
        showToast('Removed from favorites', 'info');
      } else {
        const { error: insertError } = await supabase
          .from('favorites')
          .insert({ customer_id: user.id, truck_id: truckId });

        if (insertError) {
          // Auto-fix: if FK constraint fails, ensure customer row exists and retry
          if (insertError.message?.includes('foreign key constraint') || insertError.code === '23503') {
            const { error: fixError } = await supabase
              .from('customers')
              .upsert({ id: user.id }, { onConflict: 'id' });

            if (!fixError) {
              // Retry the favorite insert
              const { error: retryError } = await supabase
                .from('favorites')
                .insert({ customer_id: user.id, truck_id: truckId });

              if (retryError) throw retryError;
              showToast('Added to favorites', 'success');
              return true;
            }
          }
          throw insertError;
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
      const { data, error: fetchError } = await supabase
        .from('favorites')
        .select('truck_id')
        .eq('customer_id', user.id);

      if (fetchError) throw fetchError;

      if (data) {
        setFavorites(data.map(f => f.truck_id));
      }
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
