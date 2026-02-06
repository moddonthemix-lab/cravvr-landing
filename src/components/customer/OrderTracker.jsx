import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Icons } from '../common/Icons';
import { subscribeToOrder } from '../../services/orderTracking';
import { fetchOrderTransitions } from '../../services/orders';
import './OrderTracker.css';

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

  // Fetch initial order data
  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const { data, error: fetchError } = await supabase
          .from('orders')
          .select('*, food_trucks(name, image_url, location, estimated_prep_time)')
          .eq('id', orderId)
          .single();

        if (fetchError) throw fetchError;
        setOrder(data);

        // Also fetch transitions
        const trans = await fetchOrderTransitions(orderId);
        setTransitions(trans);
      } catch (err) {
        setError('Order not found');
      } finally {
        setLoading(false);
      }
    };

    if (orderId) fetchOrder();
  }, [orderId]);

  // Subscribe to real-time updates
  useEffect(() => {
    if (!orderId) return;

    const subscription = subscribeToOrder(orderId, (updated) => {
      setOrder(prev => prev ? { ...prev, ...updated } : updated);
      // Refetch transitions on status change
      fetchOrderTransitions(orderId).then(setTransitions);
    });

    return () => subscription.unsubscribe();
  }, [orderId]);

  // Determine which step is active
  const getCurrentStepIndex = () => {
    if (!order) return -1;
    if (order.status === 'completed') return ORDER_STEPS.length; // past all steps
    if (order.status === 'cancelled' || order.status === 'rejected') return -1;
    return ORDER_STEPS.findIndex(s => s.key === order.status);
  };

  const currentStep = getCurrentStepIndex();
  const isCancelled = order?.status === 'cancelled';
  const isRejected = order?.status === 'rejected';
  const isCompleted = order?.status === 'completed';

  if (loading) {
    return (
      <div className="order-tracker">
        <div className="tracker-loading">
          <div className="loading-spinner" />
          <p>Loading order...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="order-tracker">
        <div className="tracker-error">
          <h2>Order Not Found</h2>
          <p>{error || 'This order could not be found.'}</p>
          <button className="btn-primary" onClick={() => navigate('/')}>Back to Home</button>
        </div>
      </div>
    );
  }

  return (
    <div className="order-tracker">
      <header className="tracker-header">
        <button className="back-btn" onClick={() => navigate(-1)}>
          {Icons.chevronLeft}
        </button>
        <h1>Order #{order.order_number}</h1>
        <div className="header-spacer" />
      </header>

      {/* Truck Info */}
      <div className="tracker-truck-info">
        {order.food_trucks?.image_url && (
          <img src={order.food_trucks.image_url} alt={order.food_trucks?.name} className="truck-thumb" />
        )}
        <div>
          <h3>{order.food_trucks?.name || 'Food Truck'}</h3>
          {order.food_trucks?.location && <p className="truck-location">{Icons.mapPin} {order.food_trucks.location}</p>}
          {order.food_trucks?.estimated_prep_time && (
            <p className="truck-prep-time">{Icons.clock} Est. {order.food_trucks.estimated_prep_time}</p>
          )}
        </div>
      </div>

      {/* Status Banner for cancelled/rejected */}
      {(isCancelled || isRejected) && (
        <div className={`tracker-banner ${isCancelled ? 'cancelled' : 'rejected'}`}>
          {Icons.alertCircle}
          <div>
            <strong>{isCancelled ? 'Order Cancelled' : 'Order Rejected'}</strong>
            {isRejected && order.rejected_reason && <p>{order.rejected_reason}</p>}
          </div>
        </div>
      )}

      {/* Completed Banner */}
      {isCompleted && (
        <div className="tracker-banner completed">
          {Icons.check}
          <div>
            <strong>Order Complete!</strong>
            <p>Thank you for your order. Enjoy your food!</p>
          </div>
        </div>
      )}

      {/* Progress Timeline */}
      {!isCancelled && !isRejected && (
        <div className="tracker-timeline">
          {ORDER_STEPS.map((step, index) => {
            const isActive = index === currentStep;
            const isDone = index < currentStep || isCompleted;

            return (
              <div key={step.key} className={`timeline-step ${isDone ? 'done' : ''} ${isActive ? 'active' : ''}`}>
                <div className="step-indicator">
                  <div className="step-circle">
                    {isDone ? Icons.check : (index + 1)}
                  </div>
                  {index < ORDER_STEPS.length - 1 && <div className="step-line" />}
                </div>
                <div className="step-content">
                  <h4>{step.label}</h4>
                  <p>{step.description}</p>
                  {isActive && <span className="active-pulse" />}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Order Details */}
      <div className="tracker-details">
        <h3>Order Summary</h3>
        {order.items && order.items.length > 0 && (
          <div className="tracker-items">
            {order.items.map((item, i) => (
              <div key={i} className="tracker-item">
                <span className="item-qty">{item.quantity}x</span>
                <span className="item-name">{item.name}</span>
                <span className="item-price">${(parseFloat(item.price) * item.quantity).toFixed(2)}</span>
              </div>
            ))}
          </div>
        )}
        <div className="tracker-totals">
          <div className="total-row">
            <span>Subtotal</span>
            <span>${parseFloat(order.subtotal || 0).toFixed(2)}</span>
          </div>
          <div className="total-row">
            <span>Tax</span>
            <span>${parseFloat(order.tax || 0).toFixed(2)}</span>
          </div>
          <div className="total-row total">
            <span>Total</span>
            <span>${parseFloat(order.total || 0).toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Activity Log */}
      {transitions.length > 0 && (
        <div className="tracker-activity">
          <h3>Activity</h3>
          <div className="activity-list">
            {transitions.map((t, i) => (
              <div key={i} className="activity-item">
                <span className="activity-dot" />
                <div>
                  <span className="activity-status">{t.from_status} → {t.to_status}</span>
                  <span className="activity-time">{new Date(t.created_at).toLocaleTimeString()}</span>
                  {t.note && <p className="activity-note">{t.note}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="tracker-actions">
        {order.status === 'pending' && (
          <button className="btn-secondary cancel-btn" onClick={async () => {
            try {
              await supabase.rpc('update_order_status', { p_order_id: orderId, p_new_status: 'cancelled' });
            } catch (err) {
              console.error('Failed to cancel:', err);
            }
          }}>
            Cancel Order
          </button>
        )}
        <button className="btn-primary" onClick={() => navigate('/')}>
          Back to Browsing
        </button>
      </div>
    </div>
  );
};

export default OrderTracker;
