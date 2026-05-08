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
  REJECTED: 'rejected',
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
      customers!customer_id(
        phone,
        profiles(name)
      )
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
 * Create an order plus its order_items rows in two writes (Supabase has no
 * single transactional API from the client). Returns the inserted order row
 * (raw, with order_number assigned by the trigger).
 *
 * The two writes are not atomic — if order_items fails the order will be
 * orphaned. That has been the existing behavior; if this becomes an issue,
 * promote to a Postgres function.
 */
export const createOrderWithItems = async ({
  customerId,
  truckId,
  subtotal,
  tax,
  tip,
  total,
  notes,
  paymentStatus,
  paymentProcessor,
  items,
}) => {
  const { data: orderData, error: orderError } = await supabase
    .from('orders')
    .insert([{
      customer_id: customerId,
      truck_id: truckId,
      status: 'pending',
      order_type: 'pickup',
      subtotal,
      tax,
      tip,
      total,
      notes: notes || null,
      payment_status: paymentStatus,
      payment_processor: paymentProcessor,
    }])
    .select()
    .single();
  if (orderError) throw orderError;

  if (items?.length) {
    const orderItems = items.map((item) => ({
      order_id: orderData.id,
      menu_item_id: item.id,
      name: item.name,
      price: parseFloat(item.price),
      quantity: item.quantity,
    }));
    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems);
    if (itemsError) throw itemsError;
  }

  return orderData;
};

/**
 * Mark a still-pending order as cancelled when the customer aborts the
 * payment step. Goes around the order state-machine RPC because we also
 * need to set payment_status='failed' atomically. The order will only be
 * in 'pending' here — the state machine would allow this transition anyway.
 */
export const cancelPendingOrder = async (orderId) => {
  if (!orderId) return;
  await supabase
    .from('orders')
    .update({ status: 'cancelled', payment_status: 'failed' })
    .eq('id', orderId);
};

/**
 * Update order status
 */
export const updateOrderStatus = async (orderId, newStatus, note = null) => {
  const { data, error } = await supabase.rpc('update_order_status', {
    p_order_id: orderId,
    p_new_status: newStatus,
    p_note: note,
  });
  if (error) throw error;
  if (data?.error) throw new Error(data.error);
  return data;
};

/**
 * Fetch the raw order row + selected truck columns, for the customer-side
 * order tracker. Returns the raw row (no transformOrder) because the tracker
 * UI consumes a number of fields not exposed by the canonical shape
 * (payment_status, rejected_reason, food_trucks.location, etc.).
 *
 * Returns `{ order, errorCode }` so the caller can distinguish 404 from a
 * permission denial without re-implementing PostgREST error parsing.
 */
export const fetchOrderForCustomer = async (orderId) => {
  const { data, error } = await supabase
    .from('orders')
    .select('*, food_trucks(name, image_url, location, estimated_prep_time)')
    .eq('id', orderId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return { order: null, errorCode: 'not_found' };
    }
    return { order: null, errorCode: 'forbidden', rawError: error };
  }
  return { order: data, errorCode: null };
};

/**
 * Fetch a single order with the customer name attached, for owner-side
 * surfaces (Kitchen Display, etc.). Joins through customers→profiles using
 * the `customers_select_via_order` and `profiles_select_via_order` RLS
 * policies introduced in 041_lock_down_pii.
 */
export const fetchOrderForOwner = async (orderId) => {
  const { data, error } = await supabase
    .from('orders')
    .select(`
      *,
      customers!customer_id(
        phone,
        profiles(name)
      )
    `)
    .eq('id', orderId)
    .single();
  if (error) throw error;
  if (!data) return null;
  return {
    ...data,
    customer_name: data.customers?.profiles?.name || 'Customer',
    customer_phone: data.customers?.phone || null,
  };
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

/**
 * Fetch order status transition audit trail
 */
export const fetchOrderTransitions = async (orderId) => {
  const { data, error } = await supabase
    .from('order_status_transitions')
    .select('*')
    .eq('order_id', orderId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data || [];
};
