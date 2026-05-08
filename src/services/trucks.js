import { supabase } from '../lib/supabase';
import { formatTruckHours } from '../utils/formatters';

/**
 * Canonical URL path for a truck. Prefers slug when available so links are
 * shareable and SEO-friendly; falls back to UUID otherwise. Both shapes
 * resolve to the same TruckDetailPage component.
 */
export const truckPath = (truck) => {
  if (!truck) return '/';
  const slug = truck.slug || truck._raw?.slug;
  if (slug) return `/t/${slug}`;
  return `/truck/${truck.id}`;
};

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
    slug: truck.slug || null,
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
    verified: truck.verified || false,
    features: truck.features || [],
    promotions: truck.promotions || null,
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
 * Resolve a current OR historical slug to the live truck. Wraps the
 * `resolve_truck_slug` RPC (migration 035_slug_history). Returns null when no
 * truck is found.
 *
 * Callers that received a non-canonical slug (i.e. an old slug that has since
 * been renamed) should redirect to `truck.slug` to canonicalize the URL.
 */
export const resolveTruckBySlug = async (slug) => {
  if (!slug) return null;
  const { data, error } = await supabase
    .rpc('resolve_truck_slug', { p_slug: slug });
  if (error) throw error;
  if (!data || !data.id) return null;
  return transformTruck(data);
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
 * Fetch the payment-related fields used by the customer checkout flow.
 * Intentionally narrow — does not select the full row — so RLS column policies
 * (e.g. revoked square_access_token) stay enforced and the wire payload is small.
 */
export const fetchTruckPaymentInfo = async (truckId) => {
  const { data, error } = await supabase
    .from('food_trucks')
    .select('payment_processor, online_payment_enabled, square_location_id, square_environment')
    .eq('id', truckId)
    .single();
  if (error) throw error;
  return data;
};

/**
 * Fetch all trucks for an owner with aggregated rating + order stats.
 *
 * Replaces a 1+3N query pattern (one query per truck, three sub-queries each)
 * in OwnerDashboard with three total queries: trucks, ratings, orders. The
 * aggregation runs client-side. For dozens of trucks this is fine; if an
 * owner ever ends up with hundreds of trucks, move this to a Postgres view
 * or RPC.
 *
 * Returns raw food_trucks rows augmented with: average_rating, review_count,
 * today_orders, today_revenue, total_orders, total_revenue.
 */
export const fetchOwnerTrucksWithStats = async (ownerId) => {
  if (!ownerId) return [];

  const { data: trucks, error: trucksError } = await supabase
    .from('food_trucks')
    .select('*')
    .eq('owner_id', ownerId)
    .order('created_at', { ascending: false });
  if (trucksError) throw trucksError;
  if (!trucks?.length) return [];

  const truckIds = trucks.map((t) => t.id);

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const [ratingsRes, ordersRes] = await Promise.all([
    supabase
      .from('truck_ratings_summary')
      .select('truck_id, average_rating, review_count')
      .in('truck_id', truckIds),
    supabase
      .from('orders')
      .select('truck_id, total, status, created_at')
      .in('truck_id', truckIds)
      .neq('status', 'cancelled'),
  ]);
  if (ratingsRes.error) throw ratingsRes.error;
  if (ordersRes.error) throw ordersRes.error;

  const ratingByTruck = new Map(
    (ratingsRes.data || []).map((r) => [r.truck_id, r])
  );

  // Bucket orders per truck once.
  const statsByTruck = new Map();
  for (const id of truckIds) {
    statsByTruck.set(id, {
      today_orders: 0,
      today_revenue: 0,
      total_orders: 0,
      total_revenue: 0,
    });
  }
  const startMs = startOfDay.getTime();
  for (const o of ordersRes.data || []) {
    const bucket = statsByTruck.get(o.truck_id);
    if (!bucket) continue;
    const totalNum = parseFloat(o.total || 0);
    bucket.total_orders += 1;
    bucket.total_revenue += totalNum;
    if (o.created_at && new Date(o.created_at).getTime() >= startMs) {
      bucket.today_orders += 1;
      bucket.today_revenue += totalNum;
    }
  }

  return trucks.map((truck) => {
    const rating = ratingByTruck.get(truck.id);
    const stats = statsByTruck.get(truck.id) || {};
    return {
      ...truck,
      average_rating: rating?.average_rating || null,
      review_count: rating?.review_count || 0,
      today_orders: stats.today_orders || 0,
      today_revenue: stats.today_revenue || 0,
      total_orders: stats.total_orders || 0,
      total_revenue: stats.total_revenue || 0,
    };
  });
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
