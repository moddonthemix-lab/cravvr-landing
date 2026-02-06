import React, { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../auth/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { Icons } from '../common/Icons';
import RejectOrderModal from './RejectOrderModal';
import './KitchenDisplay.css';

const STATUS_COLUMNS = [
  { key: 'incoming', statuses: ['pending'], label: 'Incoming', color: '#f97316' },
  { key: 'in_progress', statuses: ['confirmed', 'preparing'], label: 'In Progress', color: '#3b82f6' },
  { key: 'ready', statuses: ['ready'], label: 'Ready', color: '#22c55e' },
];

const formatElapsed = (createdAt) => {
  const diff = Math.floor((Date.now() - new Date(createdAt).getTime()) / 1000);
  if (diff < 60) return `${diff}s`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  return `${Math.floor(diff / 3600)}h ${Math.floor((diff % 3600) / 60)}m`;
};

const OrderCard = ({ order, onAction, onReject }) => {
  const [elapsed, setElapsed] = useState(formatElapsed(order.created_at));

  useEffect(() => {
    const timer = setInterval(() => {
      setElapsed(formatElapsed(order.created_at));
    }, 10000);
    return () => clearInterval(timer);
  }, [order.created_at]);

  const getActions = () => {
    switch (order.status) {
      case 'pending':
        return [
          { label: 'Confirm', status: 'confirmed', className: 'btn-confirm' },
          { label: 'Reject', status: 'reject', className: 'btn-reject' },
        ];
      case 'confirmed':
        return [{ label: 'Start Preparing', status: 'preparing', className: 'btn-prepare' }];
      case 'preparing':
        return [{ label: 'Mark Ready', status: 'ready', className: 'btn-ready' }];
      case 'ready':
        return [{ label: 'Complete', status: 'completed', className: 'btn-complete' }];
      default:
        return [];
    }
  };

  const items = order.items || order.order_items || [];

  return (
    <div className={`kds-order-card ${order.status} ${order._isNew ? 'new-order' : ''}`}>
      <div className="kds-card-header">
        <span className="kds-order-number">#{order.order_number}</span>
        <span className="kds-elapsed">{Icons.clock} {elapsed}</span>
      </div>

      <div className="kds-customer">
        {order.customer_name || 'Customer'}
      </div>

      <div className="kds-items">
        {items.map((item, i) => (
          <div key={i} className="kds-item">
            <span className="kds-item-qty">{item.quantity || 1}x</span>
            <span className="kds-item-name">{item.name}</span>
          </div>
        ))}
      </div>

      {order.notes && (
        <div className="kds-notes">
          {Icons.edit} {order.notes}
        </div>
      )}

      <div className="kds-card-footer">
        <span className="kds-total">${parseFloat(order.total || 0).toFixed(2)}</span>
        <div className="kds-actions">
          {getActions().map((action) => (
            <button
              key={action.status}
              className={`kds-action-btn ${action.className}`}
              onClick={() => action.status === 'reject' ? onReject(order) : onAction(order.id, action.status)}
            >
              {action.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

const KitchenDisplay = ({ orders: initialOrders, trucks }) => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [orders, setOrders] = useState(initialOrders || []);
  const [rejectingOrder, setRejectingOrder] = useState(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [selectedTruck, setSelectedTruck] = useState(trucks?.[0]?.id || null);
  const audioContextRef = useRef(null);
  const prevOrderCountRef = useRef(0);

  // Sync with parent orders
  useEffect(() => {
    setOrders(initialOrders || []);
  }, [initialOrders]);

  // Play notification sound for new orders
  const playNewOrderSound = useCallback(() => {
    if (!soundEnabled) return;
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      }
      const ctx = audioContextRef.current;
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      oscillator.frequency.setValueAtTime(800, ctx.currentTime);
      oscillator.frequency.setValueAtTime(1000, ctx.currentTime + 0.1);
      oscillator.frequency.setValueAtTime(800, ctx.currentTime + 0.2);
      gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.4);
    } catch (err) {
      console.warn('Sound notification failed:', err);
    }
  }, [soundEnabled]);

  // Detect new incoming orders
  useEffect(() => {
    const pendingCount = orders.filter(o => o.status === 'pending').length;
    if (pendingCount > prevOrderCountRef.current && prevOrderCountRef.current > 0) {
      playNewOrderSound();
    }
    prevOrderCountRef.current = pendingCount;
  }, [orders, playNewOrderSound]);

  // Real-time subscription
  useEffect(() => {
    if (!selectedTruck) return;

    const subscription = supabase
      .channel(`kds-orders-${selectedTruck}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders', filter: `truck_id=eq.${selectedTruck}` },
        async (payload) => {
          if (payload.eventType === 'INSERT') {
            const { data: newOrder } = await supabase
              .from('orders')
              .select('*, customers!customer_id(profiles(name))')
              .eq('id', payload.new.id)
              .single();

            if (newOrder) {
              const formatted = {
                ...newOrder,
                customer_name: newOrder.customers?.profiles?.name || 'Customer',
                _isNew: true,
              };
              setOrders(prev => [formatted, ...prev]);
              playNewOrderSound();
              showToast(`New order #${formatted.order_number}!`, 'success');
              // Remove new animation after 3s
              setTimeout(() => {
                setOrders(prev => prev.map(o => o.id === formatted.id ? { ...o, _isNew: false } : o));
              }, 3000);
            }
          } else if (payload.eventType === 'UPDATE') {
            setOrders(prev => prev.map(o => o.id === payload.new.id ? { ...o, ...payload.new } : o));
          }
        }
      )
      .subscribe();

    return () => subscription.unsubscribe();
  }, [selectedTruck, playNewOrderSound, showToast]);

  const handleStatusUpdate = async (orderId, newStatus) => {
    try {
      const { data, error } = await supabase.rpc('update_order_status', {
        p_order_id: orderId,
        p_new_status: newStatus,
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
      showToast(`Order updated to ${newStatus}`, 'success');
    } catch (err) {
      showToast(err.message || 'Failed to update order', 'error');
    }
  };

  const handleReject = async (orderId, reason) => {
    try {
      const { data, error } = await supabase.rpc('update_order_status', {
        p_order_id: orderId,
        p_new_status: 'rejected',
        p_note: reason,
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'rejected', rejected_reason: reason } : o));
      showToast('Order rejected', 'success');
    } catch (err) {
      showToast(err.message || 'Failed to reject order', 'error');
    }
  };

  // Filter orders for selected truck and active statuses only
  const truckOrders = orders.filter(o => {
    if (selectedTruck && o.truck_id !== selectedTruck) return false;
    return ['pending', 'confirmed', 'preparing', 'ready'].includes(o.status);
  });

  return (
    <div className="kitchen-display">
      <div className="kds-header">
        <div className="kds-title">
          <h2>Kitchen Display</h2>
          <span className="kds-order-count">{truckOrders.length} active orders</span>
        </div>
        <div className="kds-controls">
          {trucks && trucks.length > 1 && (
            <select
              className="kds-truck-select"
              value={selectedTruck || ''}
              onChange={(e) => setSelectedTruck(e.target.value)}
            >
              {trucks.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          )}
          <button
            className={`kds-sound-btn ${soundEnabled ? 'active' : ''}`}
            onClick={() => setSoundEnabled(!soundEnabled)}
            title={soundEnabled ? 'Mute notifications' : 'Enable notifications'}
          >
            {soundEnabled ? '\uD83D\uDD14' : '\uD83D\uDD15'}
          </button>
        </div>
      </div>

      <div className="kds-columns">
        {STATUS_COLUMNS.map(col => {
          const columnOrders = truckOrders.filter(o => col.statuses.includes(o.status));
          return (
            <div key={col.key} className="kds-column">
              <div className="kds-column-header" style={{ borderColor: col.color }}>
                <h3>{col.label}</h3>
                <span className="kds-column-count" style={{ background: col.color }}>
                  {columnOrders.length}
                </span>
              </div>
              <div className="kds-column-body">
                {columnOrders.length === 0 ? (
                  <div className="kds-empty">No orders</div>
                ) : (
                  columnOrders.map(order => (
                    <OrderCard
                      key={order.id}
                      order={order}
                      onAction={handleStatusUpdate}
                      onReject={setRejectingOrder}
                    />
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {rejectingOrder && (
        <RejectOrderModal
          order={rejectingOrder}
          onReject={handleReject}
          onClose={() => setRejectingOrder(null)}
        />
      )}
    </div>
  );
};

export default KitchenDisplay;
