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
 * Fetch user's favorite trucks with the favorite row id and aggregated
 * average rating attached. Used by CustomerProfile's favorites tab.
 *
 * Issues 1 + N queries (one for favorites, one rating lookup per truck).
 * Acceptable for a customer's favorites list; collapse to two queries if
 * favorite counts grow into the hundreds.
 */
export const fetchFavoriteTrucksWithRatings = async (userId) => {
  const { data, error } = await supabase
    .from('favorites')
    .select(`*, food_trucks:truck_id(*)`)
    .eq('customer_id', userId);
  if (error) throw error;

  const rows = await Promise.all((data || []).map(async (fav) => {
    const truck = fav.food_trucks;
    if (!truck) return null;
    const { data: ratingData } = await supabase
      .from('truck_ratings_summary')
      .select('average_rating')
      .eq('truck_id', truck.id)
      .single();
    return {
      ...truck,
      favorite_id: fav.id,
      average_rating: ratingData?.average_rating || null,
    };
  }));
  return rows.filter(Boolean);
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
