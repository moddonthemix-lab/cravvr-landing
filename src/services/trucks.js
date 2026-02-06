import { supabase } from '../lib/supabase';
import { formatTruckHours } from '../utils/formatters';

/**
 * Transform raw Supabase truck data to app format
 */
export const transformTruck = (truck) => ({
  id: truck.id,
  name: truck.name,
  image: truck.image_url || 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?auto=format&fit=crop&w=800&q=80',
  coverImage: truck.cover_image_url || truck.image_url,
  cuisine: truck.cuisine || truck.cuisine_type || 'Food Truck',
  priceRange: truck.price_range || '$$',
  description: truck.description || 'Delicious food made fresh daily.',
  location: truck.location || truck.current_location || 'Portland, OR',
  hours: formatTruckHours(truck.hours),
  distance: '1.0 mi',
  rating: truck.rating || 4.5,
  reviewCount: truck.review_count || 0,
  isOpen: truck.is_open !== false,
  deliveryTime: truck.delivery_time || '15-25 min',
  deliveryFee: truck.delivery_fee || 2.99,
  featured: truck.featured || false,
  lat: truck.coordinates?.lat || truck.latitude,
  lng: truck.coordinates?.lng || truck.longitude,
  ownerId: truck.owner_id,
  _raw: truck,
});

/**
 * Fetch all food trucks
 */
export const fetchTrucks = async () => {
  const { data, error } = await supabase
    .from('food_trucks')
    .select('*');

  if (error) throw error;
  return data?.map(transformTruck) || [];
};

/**
 * Fetch a single truck by ID
 */
export const fetchTruckById = async (id) => {
  const { data, error } = await supabase
    .from('food_trucks')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data ? transformTruck(data) : null;
};

/**
 * Fetch trucks by owner ID
 */
export const fetchTrucksByOwner = async (ownerId) => {
  const { data, error } = await supabase
    .from('food_trucks')
    .select('*')
    .eq('owner_id', ownerId);

  if (error) throw error;
  return data?.map(transformTruck) || [];
};

/**
 * Update truck data
 */
export const updateTruck = async (id, updates) => {
  const { data, error } = await supabase
    .from('food_trucks')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data ? transformTruck(data) : null;
};

/**
 * Update truck rating (recalculate from reviews)
 */
export const updateTruckRating = async (truckId) => {
  const { data: reviews } = await supabase
    .from('reviews')
    .select('rating')
    .eq('truck_id', truckId);

  if (reviews && reviews.length > 0) {
    const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;

    await supabase
      .from('food_trucks')
      .update({
        rating: Math.round(avgRating * 10) / 10,
        review_count: reviews.length
      })
      .eq('id', truckId);
  }
};

/**
 * Toggle truck open/closed status
 */
export const toggleTruckStatus = async (id, isOpen) => {
  const { error } = await supabase
    .from('food_trucks')
    .update({ is_open: isOpen })
    .eq('id', id);

  if (error) throw error;
};
