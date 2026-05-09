import React, { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../auth/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { fetchOrderForOwner, updateOrderStatus } from '../../services/orders';
import { Icons } from '../common/Icons';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import RejectOrderModal from './RejectOrderModal';

const STATUS_COLUMNS = [
  {
    key: 'incoming',
    statuses: ['pending'],
    label: 'Incoming',
    headerClass: 'border-t-warning bg-warning/5',
    countClass: 'bg-warning text-warning-foreground',
    cardAccent: 'border-l-warning',
  },
  {
    key: 'in_progress',
    statuses: ['confirmed', 'preparing'],
    label: 'In Progress',
    headerClass: 'border-t-info bg-info/5',
    countClass: 'bg-info text-info-foreground',
    cardAccent: 'border-l-info',
  },
  {
    key: 'ready',
    statuses: ['ready'],
    label: 'Ready',
    headerClass: 'border-t-positive bg-positive/5',
    countClass: 'bg-positive text-positive-foreground',
    cardAccent: 'border-l-positive',
  },
];

const STATUS_TO_ACCENT = {
  pending: 'border-l-warning',
  confirmed: 'border-l-info',
  preparing: 'border-l-info',
  ready: 'border-l-positive',
};

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
          { label: 'Confirm', status: 'confirmed', tone: 'positive' },
          { label: 'Reject', status: 'reject', tone: 'destructive' },
        ];
      case 'confirmed':
        return [{ label: 'Start preparing', status: 'preparing', tone: 'primary' }];
      case 'preparing':
        return [{ label: 'Mark ready', status: 'ready', tone: 'positive' }];
      case 'ready':
        return [{ label: 'Complete', status: 'completed', tone: 'primary' }];
      default:
        return [];
    }
  };

  const items = order.items || order.order_items || [];
  const accent = STATUS_TO_ACCENT[order.status] || 'border-l-border';

  return (
    <div
      className={cn(
        'rounded-xl border border-l-4 bg-card shadow-sm transition-all',
        accent,
        order._isNew && 'animate-in zoom-in-95 fade-in shadow-md ring-2 ring-primary/40'
      )}
    >
      <div className="p-3.5 space-y-2.5">
        <div className="flex items-center justify-between gap-2">
          <span className="font-bold text-sm tabular-nums">#{order.order_number}</span>
          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground tabular-nums">
            <span className="h-3 w-3 shrink-0">{Icons.clock}</span>
            {elapsed}
          </span>
        </div>

        <div className="text-xs text-muted-foreground truncate">
          {order.customer_name || 'Customer'}
        </div>

        <div className="flex flex-col gap-1">
          {items.map((item, i) => (
            <div key={i} className="flex gap-2 text-sm">
              <span className="font-semibold text-primary min-w-[1.5rem] tabular-nums">
                {item.quantity || 1}×
              </span>
              <span className="flex-1 leading-snug">{item.name}</span>
            </div>
          ))}
        </div>

        {order.notes && (
          <div className="flex items-start gap-2 rounded-md bg-primary/10 px-2.5 py-2 text-xs text-foreground">
            <span className="h-3.5 w-3.5 shrink-0 mt-0.5 text-primary">{Icons.edit}</span>
            <span className="leading-snug">{order.notes}</span>
          </div>
        )}

        <div className="flex items-center justify-between gap-2 pt-2 border-t border-border">
          <span className="font-bold text-sm tabular-nums">
            ${parseFloat(order.total || 0).toFixed(2)}
          </span>
          <div className="flex items-center gap-1.5">
            {getActions().map((action) => {
              const isReject = action.status === 'reject';
              return (
                <Button
                  key={action.status}
                  size="sm"
                  variant={
                    isReject
                      ? 'outline'
                      : action.tone === 'positive'
                        ? 'default'
                        : 'default'
                  }
                  className={cn(
                    'h-8 px-3 text-xs',
                    action.tone === 'positive' && 'bg-positive text-positive-foreground hover:bg-positive/90',
                    isReject && 'text-destructive hover:bg-destructive/10 hover:text-destructive border-destructive/30'
                  )}
                  onClick={() =>
                    isReject ? onReject(order) : onAction(order.id, action.status)
                  }
                >
                  {action.label}
                </Button>
              );
            })}
          </div>
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
            const newOrder = await fetchOrderForOwner(payload.new.id).catch(() => null);

            if (newOrder) {
              const formatted = { ...newOrder, _isNew: true };
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
      await updateOrderStatus(orderId, newStatus);
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
      showToast(`Order updated to ${newStatus}`, 'success');
    } catch (err) {
      showToast(err.message || 'Failed to update order', 'error');
    }
  };

  const handleReject = async (orderId, reason) => {
    try {
      await updateOrderStatus(orderId, 'rejected', reason);
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
    <div className="tab-content">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Kitchen display</h1>
          <p className="text-sm text-muted-foreground">
            <span className="font-semibold text-foreground tabular-nums">{truckOrders.length}</span>{' '}
            active {truckOrders.length === 1 ? 'order' : 'orders'} across all stations.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {trucks && trucks.length > 1 && (
            <select
              className="h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              value={selectedTruck || ''}
              onChange={(e) => setSelectedTruck(e.target.value)}
            >
              {trucks.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          )}
          <Button
            variant={soundEnabled ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSoundEnabled(!soundEnabled)}
            title={soundEnabled ? 'Mute notifications' : 'Enable notifications'}
            className="gap-1.5"
          >
            <span className="text-base leading-none">{soundEnabled ? '🔔' : '🔕'}</span>
            <span className="text-xs">{soundEnabled ? 'Sound on' : 'Muted'}</span>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {STATUS_COLUMNS.map(col => {
          const columnOrders = truckOrders.filter(o => col.statuses.includes(o.status));
          return (
            <Card key={col.key} className="overflow-hidden flex flex-col">
              <div
                className={cn(
                  'flex items-center justify-between px-4 py-3 border-t-[3px]',
                  col.headerClass
                )}
              >
                <h3 className="font-semibold text-sm">{col.label}</h3>
                <Badge
                  className={cn(
                    'min-w-[24px] justify-center tabular-nums',
                    col.countClass
                  )}
                >
                  {columnOrders.length}
                </Badge>
              </div>
              <div className="flex flex-col gap-3 p-3 bg-muted/30 flex-1 max-h-[70vh] overflow-y-auto">
                {columnOrders.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center text-sm text-muted-foreground">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted mb-2">
                      <span className="h-5 w-5">{Icons.orders}</span>
                    </div>
                    No orders
                  </div>
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
            </Card>
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
