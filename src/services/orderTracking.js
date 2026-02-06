import { supabase } from '../lib/supabase';

/**
 * Subscribe to real-time updates for a specific order
 * @param {string} orderId
 * @param {function} onUpdate - callback receiving the updated order row
 * @returns {object} subscription - call subscription.unsubscribe() to clean up
 */
export const subscribeToOrder = (orderId, onUpdate) => {
  const subscription = supabase
    .channel(`order-${orderId}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'orders',
        filter: `id=eq.${orderId}`,
      },
      (payload) => {
        onUpdate(payload.new);
      }
    )
    .subscribe();

  return subscription;
};

/**
 * Subscribe to menu item availability changes for a truck
 * (for "86" / sold-out feature)
 */
export const subscribeToMenuAvailability = (truckId, onUpdate) => {
  const subscription = supabase
    .channel(`menu-availability-${truckId}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'menu_items',
        filter: `truck_id=eq.${truckId}`,
      },
      (payload) => {
        onUpdate(payload.new);
      }
    )
    .subscribe();

  return subscription;
};

/**
 * Subscribe to all active orders for a customer
 */
export const subscribeToCustomerOrders = (customerId, onInsert, onUpdate) => {
  const subscription = supabase
    .channel(`customer-orders-${customerId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'orders',
        filter: `customer_id=eq.${customerId}`,
      },
      (payload) => onInsert(payload.new)
    )
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'orders',
        filter: `customer_id=eq.${customerId}`,
      },
      (payload) => onUpdate(payload.new)
    )
    .subscribe();

  return subscription;
};
