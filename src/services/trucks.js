import { supabase } from '../lib/supabase';
import { formatTruckHours } from '../utils/formatters';

/**
 * Calculate distance between two coordinates using Haversine formula
 * Returns distance in miles
 */
const haversineDistance = (lat1, lng1, lat2, lng2) => {
  const R = 3959; // Earth radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

/**
 * Transform raw Supabase truck data to app format
 * @param {Object} truck - Raw truck data from Supabase
 * @param {Object} [userCoords] - Optional user coordinates { lat, lng }
 */
export const transformTruck = (truck, userCoords = null) => {
  const tLat = truck.coordinates?.lat || truck.latitude;
  const tLng = truck.coordinates?.lng || truck.longitude;

  let distance = '-- mi';
  if (userCoords && tLat && tLng) {
    const d = haversineDistance(userCoords.lat, userCoords.lng, tLat, tLng);
    distance = d < 0.1 ? '< 0.1 mi' : `${d.toFixed(1)} mi`;
  }

  return {
    id: truck.id,
    name: truck.name,
    image: truck.image_url || 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?auto=format&fit=crop&w=800&q=80',
    coverImage: truck.cover_image_url || truck.image_url,
    cuisine: truck.cuisine || truck.cuisine_type || 'Food Truck',
    priceRange: truck.price_range || '$$',
    description: truck.description || 'Delicious food made fresh daily.',
    location: truck.location || truck.current_location || 'Portland, OR',
    hours: formatTruckHours(truck.hours),
    distance,
    rating: truck.rating || 4.5,
    reviewCount: truck.review_count || 0,
    isOpen: truck.is_open !== false,
    acceptingOrders: truck.accepting_orders !== false,
    prepTime: truck.estimated_prep_time || null,
    featured: truck.featured || false,
    lat: tLat,
    lng: tLng,
    ownerId: truck.owner_id,
    logoUrl: truck.logo_url,
    _raw: truck,
  };
};

/**
 * Fetch all food trucks
 */
export const fetchTrucks = async (userCoords = null) => {
  const { data, error } = await supabase
    .from('food_trucks')
    .select('*');

  if (error) throw error;
  return data?.map(t => transformTruck(t, userCoords)) || [];
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

/**
 * Fetch nearby trucks using PostGIS spatial query
 * Falls back to fetching all trucks if PostGIS is not available
 */
export const fetchNearbyTrucks = async (lat, lng, radiusMiles = 10) => {
  const userCoords = { lat, lng };
  try {
    const { data, error } = await supabase.rpc('find_nearby_trucks', {
      p_lat: lat,
      p_lng: lng,
      p_radius_miles: radiusMiles,
    });

    if (error) throw error;
    return data?.map(t => transformTruck(t, userCoords)) || [];
  } catch (err) {
    // Fallback: if PostGIS RPC doesn't exist yet, fetch all trucks
    console.warn('PostGIS query failed, falling back to fetch all:', err.message);
    return fetchTrucks(userCoords);
  }
};
