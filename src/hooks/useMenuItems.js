import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

// Transform raw Supabase menu item to app format
const transformMenuItem = (item) => ({
  id: item.id,
  name: item.name,
  description: item.description || 'A delicious menu item.',
  price: item.price,
  priceFormatted: `$${item.price?.toFixed(2) || '0.00'}`,
  image: item.image_url || 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?auto=format&fit=crop&w=400&q=80',
  popular: item.popular || false,
  featured: item.featured || false,
  emoji: item.emoji || '🍽️',
  category: item.category || 'Other',
  truckId: item.truck_id,
  // Preserve raw data for cases that need additional fields
  _raw: item,
});

/**
 * Hook for fetching menu items from Supabase
 * @param {string} truckId - The truck ID to fetch menu items for
 * @param {Object} options - Optional configuration
 * @param {boolean} options.enabled - Whether to fetch automatically (default: true)
 * @param {Array} options.fallback - Fallback items if fetch fails
 */
export const useMenuItems = (truckId, options = {}) => {
  const { enabled = true, fallback = [] } = options;

  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchMenuItems = useCallback(async (id = truckId) => {
    if (!id) return [];

    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('menu_items')
        .select('*')
        .eq('truck_id', id);

      if (fetchError) throw fetchError;

      if (data && data.length > 0) {
        const items = data.map(transformMenuItem);
        setMenuItems(items);
        return items;
      } else {
        setMenuItems(fallback);
        return fallback;
      }
    } catch (err) {
      console.error('Error fetching menu items:', err);
      setError(err.message || 'Failed to fetch menu items');
      setMenuItems(fallback);
      return fallback;
    } finally {
      setLoading(false);
    }
  }, [truckId, fallback]);

  // Auto-fetch when truckId changes (if enabled)
  useEffect(() => {
    if (enabled && truckId) {
      fetchMenuItems();
    }
  }, [enabled, truckId, fetchMenuItems]);

  // Get items by category
  const getByCategory = useCallback((category) => {
    if (!category || category === 'all') return menuItems;
    return menuItems.filter(item =>
      item.category.toLowerCase() === category.toLowerCase()
    );
  }, [menuItems]);

  // Get popular items
  const getPopular = useCallback(() => {
    return menuItems.filter(item => item.popular);
  }, [menuItems]);

  // Get featured items
  const getFeatured = useCallback(() => {
    return menuItems.filter(item => item.featured);
  }, [menuItems]);

  // Get unique categories
  const categories = useCallback(() => {
    const cats = new Set(menuItems.map(item => item.category));
    return ['All', ...Array.from(cats)];
  }, [menuItems]);

  return {
    menuItems,
    loading,
    error,
    fetchMenuItems,
    refetch: fetchMenuItems,
    getByCategory,
    getPopular,
    getFeatured,
    categories: categories(),
  };
};

/**
 * Standalone function to fetch menu items for a truck
 * Useful for one-off fetches without the hook lifecycle
 */
export const fetchMenuItemsForTruck = async (truckId) => {
  if (!truckId) return [];

  try {
    const { data, error } = await supabase
      .from('menu_items')
      .select('*')
      .eq('truck_id', truckId);

    if (error) throw error;

    if (data && data.length > 0) {
      return data.map(transformMenuItem);
    }
    return [];
  } catch (err) {
    console.error('Error fetching menu items:', err);
    return [];
  }
};

export default useMenuItems;
