import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Icons } from '../common/Icons';
import { subscribeToOrder } from '../../services/orderTracking';
import LoadingSplash from '../common/LoadingSplash';
import {
  fetchOrderForCustomer,
  fetchOrderTransitions,
  updateOrderStatus,
} from '../../services/orders';
import { callStripeFunction } from '../../lib/stripe';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

const ORDER_STEPS = [
  { key: 'pending', label: 'Order Placed', icon: Icons.check, description: 'Your order has been received' },
  { key: 'confirmed', label: 'Confirmed', icon: Icons.check, description: 'The truck has accepted your order' },
  { key: 'preparing', label: 'Preparing', icon: Icons.clock, description: 'Your food is being prepared' },
  { key: 'ready', label: 'Ready for Pickup', icon: Icons.shoppingBag, description: 'Head to the truck to pick up!' },
];

const OrderTracker = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [transitions, setTransitions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [errorCode, setErrorCode] = useState(null);
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState(null);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const { order: data, errorCode: code } = await fetchOrderForCustomer(orderId);
        if (!data) {
          if (code === 'not_found') {
            setError('Order not found');
            setErrorCode('not_found');
          } else {
            setError("You don't have permission to view this order.");
            setErrorCode('forbidden');
          }
          return;
        }
        setOrder(data);
        const trans = await fetchOrderTransitions(orderId);
        setTransitions(trans);
      } catch (err) {
        console.error('Order fetch exception:', err);
        setError('Could not load order. Please try again.');
        setErrorCode('unknown');
      } finally {
        setLoading(false);
      }
    };

    if (orderId) fetchOrder();
  }, [orderId]);

  useEffect(() => {
    if (!orderId) return;
    const subscription = subscribeToOrder(orderId, (updated) => {
      setOrder(prev => prev ? { ...prev, ...updated } : updated);
      fetchOrderTransitions(orderId).then(setTransitions);
    });
    return () => subscription.unsubscribe();
  }, [orderId]);

  const getCurrentStepIndex = () => {
    if (!order) return -1;
    if (order.status === 'completed') return ORDER_STEPS.length;
    if (order.status === 'cancelled' || order.status === 'rejected') return -1;
    return ORDER_STEPS.findIndex(s => s.key === order.status);
  };

  const currentStep = getCurrentStepIndex();
  const isCancelled = order?.status === 'cancelled';
  const isRejected = order?.status === 'rejected';
  const isCompleted = order?.status === 'completed';

  if (loading) {
    return <LoadingSplash tagline="LOADING ORDER" />;
  }

  if (error || !order) {
    const heading = errorCode === 'forbidden'
      ? 'Access Denied'
      : errorCode === 'not_found'
        ? 'Order Not Found'
        : 'Could Not Load Order';
    return (
      <div className="flex min-h-screen items-center justify-center px-6">
        <div className="text-center max-w-md">
          <h2 className="text-2xl font-bold tracking-tight">{heading}</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {error || 'This order could not be found.'}
          </p>
          <Button onClick={() => navigate('/')} className="mt-6">
            Back to Home
          </Button>
        </div>
      </div>
    );
  }

  const handleCancel = async () => {
    const wasPaid = order.payment_status === 'paid' || order.payment_status === 'succeeded';
    const confirmMsg = wasPaid
      ? 'Cancel this order? You will be refunded automatically. This cannot be undone.'
      : 'Cancel this order? This cannot be undone.';
    if (!window.confirm(confirmMsg)) return;
    setCancelling(true);
    setCancelError(null);
    try {
      await updateOrderStatus(orderId, 'cancelled');
      if (wasPaid) {
        try {
          await callStripeFunction('stripe-refund', {
            order_id: orderId,
            reason: 'Cancelled by customer',
          });
        } catch (refundErr) {
          console.error('Refund failed:', refundErr);
          setCancelError('Order cancelled, but refund could not be processed automatically. Please contact support.');
          return;
        }
      }
      setOrder(prev => prev ? { ...prev, status: 'cancelled' } : prev);
    } catch (err) {
      console.error('Failed to cancel:', err);
      setCancelError(err.message || 'Could not cancel this order.');
    } finally {
      setCancelling(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-4 sm:px-6 py-6 space-y-6">
      <header className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate(-1)}
          aria-label="Back"
          className="flex h-10 w-10 items-center justify-center rounded-full text-foreground transition-colors hover:bg-muted"
        >
          <span className="h-5 w-5">{Icons.chevronLeft}</span>
        </button>
        <h1 className="text-xl font-bold tracking-tight tabular-nums">
          Order #{order.order_number}
        </h1>
      </header>

      {/* Truck info */}
      <Card>
        <CardContent className="flex items-center gap-4 p-4">
          {order.food_trucks?.image_url && (
            <img
              src={order.food_trucks.image_url}
              alt={order.food_trucks?.name}
              className="h-16 w-16 rounded-xl object-cover ring-1 ring-black/5"
            />
          )}
          <div className="flex-1 min-w-0 space-y-1">
            <h3 className="font-bold text-base truncate">
              {order.food_trucks?.name || 'Food Truck'}
            </h3>
            {order.food_trucks?.location && (
              <p className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className="h-3.5 w-3.5">{Icons.mapPin}</span>
                {order.food_trucks.location}
              </p>
            )}
            {order.food_trucks?.estimated_prep_time && (
              <p className="inline-flex items-center gap-1.5 text-xs text-muted-foreground ml-3">
                <span className="h-3.5 w-3.5">{Icons.clock}</span>
                Est. {order.food_trucks.estimated_prep_time}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Status banner */}
      {(isCancelled || isRejected) && (
        <div className={cn(
          'flex items-start gap-3 rounded-lg border px-4 py-3 text-sm',
          isCancelled
            ? 'border-warning/30 bg-warning/10 text-warning'
            : 'border-destructive/30 bg-destructive/10 text-destructive'
        )}>
          <span className="h-5 w-5 shrink-0 mt-0.5">{Icons.alertCircle}</span>
          <div>
            <strong className="font-semibold">
              {isCancelled ? 'Order Cancelled' : 'Order Rejected'}
            </strong>
            {isRejected && order.rejected_reason && (
              <p className="mt-1 text-xs">{order.rejected_reason}</p>
            )}
          </div>
        </div>
      )}

      {isCompleted && (
        <div className="flex items-start gap-3 rounded-lg border border-positive/30 bg-positive/10 px-4 py-3 text-sm text-positive">
          <span className="h-5 w-5 shrink-0 mt-0.5">{Icons.check}</span>
          <div>
            <strong className="font-semibold">Order Complete!</strong>
            <p className="mt-1 text-xs">Thank you for your order. Enjoy your food!</p>
          </div>
        </div>
      )}

      {/* Timeline */}
      {!isCancelled && !isRejected && (
        <Card>
          <CardContent className="p-5 space-y-5">
            {ORDER_STEPS.map((step, index) => {
              const isActive = index === currentStep;
              const isDone = index < currentStep || isCompleted;
              const isLast = index === ORDER_STEPS.length - 1;

              return (
                <div key={step.key} className="flex gap-4">
                  <div className="relative flex flex-col items-center shrink-0">
                    <div
                      className={cn(
                        'flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold tabular-nums transition-colors',
                        isDone
                          ? 'bg-positive text-positive-foreground'
                          : isActive
                            ? 'bg-primary text-primary-foreground ring-4 ring-primary/20'
                            : 'bg-muted text-muted-foreground'
                      )}
                    >
                      {isDone ? <span className="h-4 w-4">{Icons.check}</span> : index + 1}
                    </div>
                    {!isLast && (
                      <div
                        className={cn(
                          'mt-1 h-8 w-0.5 transition-colors',
                          isDone ? 'bg-positive' : 'bg-border'
                        )}
                      />
                    )}
                  </div>
                  <div className="flex-1 min-w-0 pt-1.5">
                    <h4 className={cn(
                      'font-semibold text-sm',
                      isActive ? 'text-primary' : isDone ? 'text-foreground' : 'text-muted-foreground'
                    )}>
                      {step.label}
                      {isActive && (
                        <span className="ml-2 inline-block h-2 w-2 rounded-full bg-primary animate-pulse" />
                      )}
                    </h4>
                    <p className="text-xs text-muted-foreground mt-0.5">{step.description}</p>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Order summary */}
      <Card>
        <CardContent className="p-5 space-y-4">
          <h3 className="font-bold text-base">Order Summary</h3>
          {order.items && order.items.length > 0 && (
            <div className="divide-y divide-border">
              {order.items.map((item, i) => (
                <div key={i} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0 text-sm">
                  <span className="font-semibold tabular-nums text-primary min-w-[2rem]">
                    {item.quantity}×
                  </span>
                  <span className="flex-1 truncate">{item.name}</span>
                  <span className="font-semibold tabular-nums">
                    ${(parseFloat(item.price) * item.quantity).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          )}
          <div className="space-y-1.5 border-t border-border pt-4">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>Subtotal</span>
              <span className="tabular-nums">${parseFloat(order.subtotal || 0).toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>Tax</span>
              <span className="tabular-nums">${parseFloat(order.tax || 0).toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between text-base font-bold pt-1.5 border-t border-border">
              <span>Total</span>
              <span className="tabular-nums">${parseFloat(order.total || 0).toFixed(2)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Activity log */}
      {transitions.length > 0 && (
        <Card>
          <CardContent className="p-5 space-y-3">
            <h3 className="font-bold text-base">Activity</h3>
            <ul className="space-y-3">
              {transitions.map((t, i) => (
                <li key={i} className="flex items-start gap-3 text-sm">
                  <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium capitalize">
                        {t.from_status} → {t.to_status}
                      </span>
                      <span className="text-xs text-muted-foreground tabular-nums shrink-0">
                        {new Date(t.created_at).toLocaleTimeString()}
                      </span>
                    </div>
                    {t.note && <p className="text-xs text-muted-foreground mt-0.5">{t.note}</p>}
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <div className="flex flex-col-reverse sm:flex-row gap-2">
        {(order.status === 'pending' || order.status === 'confirmed') && (
          <Button
            variant="outline"
            disabled={cancelling}
            onClick={handleCancel}
            className="flex-1 text-destructive hover:bg-destructive/10 hover:text-destructive border-destructive/30"
          >
            {cancelling ? 'Cancelling…' : 'Cancel Order'}
          </Button>
        )}
        <Button onClick={() => navigate('/')} className="flex-1">
          Back to Browsing
        </Button>
      </div>

      {cancelError && (
        <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <span className="h-4 w-4 shrink-0 mt-0.5">{Icons.alertCircle}</span>
          {cancelError}
        </div>
      )}
    </div>
  );
};

export default OrderTracker;
