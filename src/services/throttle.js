import { supabase } from '../lib/supabase';

export const checkTruckAcceptingOrders = async (truckId) => {
  const { data, error } = await supabase.rpc('check_truck_accepting_orders', {
    p_truck_id: truckId,
  });
  if (error) throw error;
  return data;
};

export const toggleAcceptingOrders = async (truckId, accepting) => {
  const { error } = await supabase
    .from('food_trucks')
    .update({ accepting_orders: accepting })
    .eq('id', truckId);
  if (error) throw error;
};

export const updateQueueSettings = async (truckId, { maxQueueSize, autoPauseEnabled }) => {
  const updates = {};
  if (maxQueueSize !== undefined) updates.max_queue_size = maxQueueSize;
  if (autoPauseEnabled !== undefined) updates.auto_pause_enabled = autoPauseEnabled;

  const { error } = await supabase
    .from('food_trucks')
    .update(updates)
    .eq('id', truckId);
  if (error) throw error;
};
