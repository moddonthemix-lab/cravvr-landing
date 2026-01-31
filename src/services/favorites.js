import { supabase } from '../lib/supabase';

/**
 * Fetch user's favorite truck IDs
 */
export const fetchFavorites = async (userId) => {
  const { data, error } = await supabase
    .from('favorites')
    .select('truck_id')
    .eq('customer_id', userId);

  if (error) throw error;
  return data?.map(f => f.truck_id) || [];
};

/**
 * Fetch user's favorite trucks with full data
 */
export const fetchFavoriteTrucks = async (userId) => {
  const { data, error } = await supabase
    .from('favorites')
    .select(`
      truck_id,
      food_trucks (*)
    `)
    .eq('customer_id', userId);

  if (error) throw error;
  return data?.map(f => f.food_trucks).filter(Boolean) || [];
};

/**
 * Add a truck to favorites
 */
export const addFavorite = async (userId, truckId) => {
  const { error } = await supabase
    .from('favorites')
    .insert({
      customer_id: userId,
      truck_id: truckId
    });

  if (error) throw error;
};

/**
 * Remove a truck from favorites
 */
export const removeFavorite = async (userId, truckId) => {
  const { error } = await supabase
    .from('favorites')
    .delete()
    .eq('customer_id', userId)
    .eq('truck_id', truckId);

  if (error) throw error;
};

/**
 * Toggle favorite status
 */
export const toggleFavorite = async (userId, truckId, isFavorite) => {
  if (isFavorite) {
    await removeFavorite(userId, truckId);
  } else {
    await addFavorite(userId, truckId);
  }
};

/**
 * Check if a truck is favorited by user
 */
export const isFavorite = async (userId, truckId) => {
  const { data, error } = await supabase
    .from('favorites')
    .select('id')
    .eq('customer_id', userId)
    .eq('truck_id', truckId)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return !!data;
};
