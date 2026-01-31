import { supabase } from '../lib/supabase';

/**
 * Order status types
 */
export const ORDER_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  PREPARING: 'preparing',
  READY: 'ready',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
};

/**
 * Transform raw order data to app format
 */
export const transformOrder = (order) => ({
  id: order.id,
  customerId: order.customer_id,
  truckId: order.truck_id,
  truckName: order.food_trucks?.name || 'Food Truck',
  truckImage: order.food_trucks?.image_url,
  items: order.items || [],
  subtotal: order.subtotal,
  tax: order.tax,
  total: order.total,
  status: order.status,
  pickupTime: order.pickup_time,
  specialInstructions: order.special_instructions,
  createdAt: order.created_at,
  updatedAt: order.updated_at,
  _raw: order,
});

/**
 * Fetch orders for a customer
 */
export const fetchCustomerOrders = async (customerId) => {
  const { data, error } = await supabase
    .from('orders')
    .select(`
      *,
      food_trucks (name, image_url)
    `)
    .eq('customer_id', customerId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data?.map(transformOrder) || [];
};

/**
 * Fetch orders for a truck (owner view)
 */
export const fetchTruckOrders = async (truckId, status = null) => {
  let query = supabase
    .from('orders')
    .select(`
      *,
      profiles:customer_id (full_name, phone)
    `)
    .eq('truck_id', truckId)
    .order('created_at', { ascending: false });

  if (status) {
    query = query.eq('status', status);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data?.map(transformOrder) || [];
};

/**
 * Create a new order
 */
export const createOrder = async ({
  customerId,
  truckId,
  items,
  subtotal,
  tax,
  total,
  pickupTime,
  specialInstructions
}) => {
  const { data, error } = await supabase
    .from('orders')
    .insert({
      customer_id: customerId,
      truck_id: truckId,
      items,
      subtotal,
      tax,
      total,
      pickup_time: pickupTime,
      special_instructions: specialInstructions,
      status: ORDER_STATUS.PENDING
    })
    .select()
    .single();

  if (error) throw error;
  return data ? transformOrder(data) : null;
};

/**
 * Update order status
 */
export const updateOrderStatus = async (orderId, status) => {
  const { error } = await supabase
    .from('orders')
    .update({
      status,
      updated_at: new Date().toISOString()
    })
    .eq('id', orderId);

  if (error) throw error;
};

/**
 * Get order by ID
 */
export const fetchOrderById = async (orderId) => {
  const { data, error } = await supabase
    .from('orders')
    .select(`
      *,
      food_trucks (name, image_url, current_location)
    `)
    .eq('id', orderId)
    .single();

  if (error) throw error;
  return data ? transformOrder(data) : null;
};

/**
 * Cancel an order
 */
export const cancelOrder = async (orderId) => {
  await updateOrderStatus(orderId, ORDER_STATUS.CANCELLED);
};

/**
 * Get active orders for a customer (pending, confirmed, preparing, ready)
 */
export const fetchActiveOrders = async (customerId) => {
  const { data, error } = await supabase
    .from('orders')
    .select(`
      *,
      food_trucks (name, image_url)
    `)
    .eq('customer_id', customerId)
    .in('status', [ORDER_STATUS.PENDING, ORDER_STATUS.CONFIRMED, ORDER_STATUS.PREPARING, ORDER_STATUS.READY])
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data?.map(transformOrder) || [];
};
