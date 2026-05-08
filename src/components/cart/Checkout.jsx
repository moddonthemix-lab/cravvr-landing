import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { useCart } from '../../contexts/CartContext';
import { useToast } from '../../contexts/ToastContext';
import { useAnalytics } from '../../contexts/AnalyticsContext';
import { getStripe, callStripeFunction } from '../../lib/stripe';
import { callSquareFunction } from '../../lib/square';
import SquarePaymentForm from './SquarePaymentForm';
import { checkTruckAcceptingOrders } from '../../services/throttle';
import { fetchTruckPaymentInfo } from '../../services/trucks';
import { createOrderWithItems, cancelPendingOrder } from '../../services/orders';
import { Icons } from '../common/Icons';
import './Checkout.css';

const Checkout = ({ onBack, onOrderComplete }) => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { items, subtotal, tax, total, currentTruckId, currentTruckName, clearCart } = useCart();
  const { showToast } = useToast();
  const { track } = useAnalytics();

  const beganCheckoutRef = useRef(false);
  useEffect(() => {
    if (beganCheckoutRef.current || items.length === 0) return;
    beganCheckoutRef.current = true;
    track('begin_checkout', {
      truck_id: currentTruckId,
      truck_name: currentTruckName,
      item_count: items.reduce((s, i) => s + i.quantity, 0),
      subtotal,
    });
  }, [items.length, currentTruckId, currentTruckName, subtotal, track]);

  const [notes, setNotes] = useState('');
  const [tip, setTip] = useState(0);
  const [customTip, setCustomTip] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [orderComplete, setOrderComplete] = useState(false);
  const [orderNumber, setOrderNumber] = useState('');
  const [orderId, setOrderId] = useState(null);
  const [error, setError] = useState('');

  // Truck capability + payment method selection
  const [truckOnlineEnabled, setTruckOnlineEnabled] = useState(false);
  const [truckProcessor, setTruckProcessor] = useState('pickup'); // 'stripe' | 'square' | 'pickup'
  const [squareConfig, setSquareConfig] = useState(null); // { applicationId, locationId, environment }
  const [paymentMethod, setPaymentMethod] = useState('pickup'); // 'online' | 'pickup'
  const [paymentStep, setPaymentStep] = useState('details'); // 'details' | 'card' | 'processing'
  const [clientSecret, setClientSecret] = useState(null); // Stripe only
  const [pendingOrderId, setPendingOrderId] = useState(null);
  const stripeRef = useRef(null);
  const elementsRef = useRef(null);
  const cardElementRef = useRef(null);
  const cardMountRef = useRef(null);
  const squareFormRef = useRef(null);

  const tipOptions = [0, 15, 18, 20, 25];

  const calculateTip = () => {
    if (customTip) return parseFloat(customTip) || 0;
    return subtotal * (tip / 100);
  };

  const finalTotal = total + calculateTip();

  // Fetch truck payment capability — works for any processor
  useEffect(() => {
    if (!currentTruckId) return;
    let cancelled = false;
    (async () => {
      try {
        const data = await fetchTruckPaymentInfo(currentTruckId);
        if (cancelled) return;
        const processor = data?.payment_processor || 'pickup';
        const enabled = !!data?.online_payment_enabled;
        setTruckProcessor(processor);
        setTruckOnlineEnabled(enabled);
        setPaymentMethod(enabled ? 'online' : 'pickup');
        if (processor === 'square' && enabled) {
          setSquareConfig({
            applicationId: import.meta.env.VITE_SQUARE_APPLICATION_ID,
            locationId: data.square_location_id,
            environment: data.square_environment === 'production' ? 'production' : 'sandbox',
          });
        } else {
          setSquareConfig(null);
        }
      } catch (err) {
        if (!cancelled) console.error('Failed to load truck payment info:', err);
      }
    })();
    return () => { cancelled = true; };
  }, [currentTruckId]);

  // Mount Stripe card element when entering card step (Stripe path only —
  // Square card mounts inside SquarePaymentForm via its own effect)
  useEffect(() => {
    if (paymentStep !== 'card' || truckProcessor !== 'stripe' || !clientSecret) return;
    let mounted = true;
    (async () => {
      try {
        const stripe = await getStripe();
        if (!stripe) {
          setError('Online payments are not configured. Please refresh and try again.');
          setPaymentStep('details');
          return;
        }
        if (!mounted) return;
        stripeRef.current = stripe;
        const elements = stripe.elements({ clientSecret, appearance: { theme: 'stripe' } });
        elementsRef.current = elements;
        const paymentEl = elements.create('payment', { layout: 'tabs' });
        cardElementRef.current = paymentEl;
        if (cardMountRef.current) {
          paymentEl.mount(cardMountRef.current);
        }
      } catch (err) {
        console.error('Failed to load Stripe:', err);
        setError('Could not load payment form. Please try again.');
        setPaymentStep('details');
      }
    })();
    return () => {
      mounted = false;
      try { cardElementRef.current?.unmount(); } catch (_) {}
      cardElementRef.current = null;
      elementsRef.current = null;
    };
  }, [paymentStep, clientSecret]);

  const createOrderAndItems = () =>
    createOrderWithItems({
      customerId: user.id,
      truckId: currentTruckId,
      subtotal,
      tax,
      tip: calculateTip(),
      total: finalTotal,
      notes,
      paymentStatus: paymentMethod === 'online' ? 'pending' : 'unpaid',
      paymentProcessor: paymentMethod === 'online' ? truckProcessor : 'pickup',
      items,
    });

  const finalizeSuccess = (orderData) => {
    setOrderId(orderData.id);
    setOrderNumber(orderData.order_number);
    setOrderComplete(true);
    clearCart(true);
    showToast(`Order #${orderData.order_number} placed successfully!`, 'success');
    track('order_created', {
      order_id: orderData.id,
      order_number: orderData.order_number,
      truck_id: currentTruckId,
      truck_name: currentTruckName,
      value: finalTotal,
      currency: 'USD',
      item_count: items.reduce((s, i) => s + i.quantity, 0),
      payment_method: paymentMethod,
    });
  };

  const handleSubmitOrder = async () => {
    if (!user) {
      setError('Please sign in to place an order');
      return;
    }
    if (!user.email_confirmed_at && !user.confirmed_at) {
      setError('Please confirm your email before placing an order. Check your inbox for a verification link.');
      return;
    }
    if (items.length === 0) {
      setError('Your cart is empty');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const throttleCheck = await checkTruckAcceptingOrders(currentTruckId);
      if (!throttleCheck?.accepting) {
        setError(throttleCheck?.reason || 'This truck is not accepting orders right now.');
        setSubmitting(false);
        return;
      }

      const orderData = await createOrderAndItems();

      if (paymentMethod === 'online') {
        const amountCents = Math.round(finalTotal * 100);

        if (truckProcessor === 'stripe') {
          const piResp = await callStripeFunction('stripe-create-payment-intent', {
            order_id: orderData.id,
            truck_id: currentTruckId,
            amount_cents: amountCents,
          });
          if (!piResp?.client_secret) throw new Error('Failed to initialize payment');
          setClientSecret(piResp.client_secret);
        } else if (truckProcessor === 'square') {
          // No payment intent needed up front — Square tokenizes on submit.
          // We just transition to the card form.
        } else {
          throw new Error('Online payment is not supported for this truck');
        }

        setPendingOrderId(orderData.id);
        setOrderNumber(orderData.order_number);
        setPaymentStep('card');
      } else {
        finalizeSuccess(orderData);
      }
    } catch (err) {
      console.error('Order submission error:', err);
      const errorMsg = err.message || 'Failed to submit order. Please try again.';
      setError(errorMsg);
      showToast(errorMsg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmCardPayment = async () => {
    setSubmitting(true);
    setError('');
    try {
      if (truckProcessor === 'stripe') {
        if (!stripeRef.current || !elementsRef.current) {
          setError('Payment form not ready. Please wait a moment.');
          setSubmitting(false);
          return;
        }
        const result = await stripeRef.current.confirmPayment({
          elements: elementsRef.current,
          confirmParams: { return_url: `${window.location.origin}/order/${pendingOrderId}` },
          redirect: 'if_required',
        });
        if (result.error) {
          setError(result.error.message || 'Payment failed. Please try again.');
          setSubmitting(false);
          return;
        }
        const piStatus = result.paymentIntent?.status;
        if (piStatus === 'succeeded' || piStatus === 'processing' || piStatus === 'requires_capture') {
          finalizeSuccess({ id: pendingOrderId, order_number: orderNumber });
        } else {
          setError(`Payment status: ${piStatus}. Please try again.`);
        }
      } else if (truckProcessor === 'square') {
        if (!squareFormRef.current) {
          setError('Payment form not ready. Please wait a moment.');
          setSubmitting(false);
          return;
        }
        const { token, verificationToken } = await squareFormRef.current.tokenize();
        const amountCents = Math.round(finalTotal * 100);
        const resp = await callSquareFunction('square-create-payment', {
          order_id: pendingOrderId,
          truck_id: currentTruckId,
          amount_cents: amountCents,
          source_id: token,
          verification_token: verificationToken,
          idempotency_key: `${pendingOrderId}-${Date.now()}`,
        });
        if (resp?.status === 'succeeded' || resp?.status === 'processing') {
          finalizeSuccess({ id: pendingOrderId, order_number: orderNumber });
        } else {
          throw new Error('Payment did not complete');
        }
      }
    } catch (err) {
      console.error('Payment confirmation error:', err);
      setError(err.message || 'Payment failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const cancelPaymentAndOrder = async () => {
    if (pendingOrderId) {
      try { await cancelPendingOrder(pendingOrderId); } catch (_) {}
    }
    setPaymentStep('details');
    setClientSecret(null);
    setPendingOrderId(null);
    setError('');
  };

  if (orderComplete) {
    return (
      <div className="checkout-page">
        <div className="order-success">
          <div className="success-icon">
            {Icons.check}
          </div>
          <h1>Order Placed!</h1>
          <p className="order-number">Order #{orderNumber}</p>
          <p className="success-message">
            Your order has been sent to <strong>{currentTruckName}</strong>.
            You'll receive updates as they prepare your food.
          </p>
          <div className="success-details">
            <div className="detail-row">
              <span>{Icons.shoppingBag}</span>
              <span>{items.length} items</span>
            </div>
            <div className="detail-row">
              <span>{Icons.clock}</span>
              <span>Estimated: 15-25 min</span>
            </div>
            <div className="detail-row total">
              <span>Total</span>
              <span>${finalTotal.toFixed(2)}</span>
            </div>
          </div>
          <button className="btn-primary" onClick={() => {
            if (orderId) {
              navigate(`/order/${orderId}`);
            } else if (onOrderComplete) {
              onOrderComplete();
            } else {
              onBack();
            }
          }}>
            Track Your Order
          </button>
          <button className="btn-secondary" onClick={onBack}>
            Back to Browsing
          </button>
        </div>
      </div>
    );
  }

  // Card collection step
  if (paymentStep === 'card') {
    return (
      <div className="checkout-page">
        <header className="checkout-header">
          <button className="back-btn" onClick={cancelPaymentAndOrder} disabled={submitting}>
            {Icons.chevronLeft}
          </button>
          <h1>Payment</h1>
          <div className="header-spacer" />
        </header>
        <div className="checkout-content">
          <section className="checkout-section">
            <div className="truck-banner">
              {Icons.creditCard}
              <span>Pay <strong>${finalTotal.toFixed(2)}</strong> to {currentTruckName}</span>
            </div>
          </section>
          <section className="checkout-section">
            <h3>Card Details</h3>
            {truckProcessor === 'stripe' && (
              <>
                <div ref={cardMountRef} className="stripe-card-mount" style={{ minHeight: 240 }} />
                <p className="payment-note">Your card is processed securely by Stripe. You won't be charged until the truck confirms your order.</p>
              </>
            )}
            {truckProcessor === 'square' && squareConfig && (
              <>
                <SquarePaymentForm
                  ref={squareFormRef}
                  applicationId={squareConfig.applicationId}
                  locationId={squareConfig.locationId}
                  environment={squareConfig.environment}
                  amount={finalTotal}
                  onError={(e) => setError(e.message || 'Could not load payment form')}
                />
                <p className="payment-note">Your card is processed securely by Square. Funds go directly to the truck.</p>
              </>
            )}
          </section>
          {error && <div className="checkout-error">{error}</div>}
        </div>
        <div className="checkout-footer">
          <button
            className="place-order-btn"
            onClick={handleConfirmCardPayment}
            disabled={submitting}
          >
            {submitting ? (
              <>{Icons.loader} Processing...</>
            ) : (
              <>Pay ${finalTotal.toFixed(2)}</>
            )}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="checkout-page">
      <header className="checkout-header">
        <button className="back-btn" onClick={onBack}>
          {Icons.chevronLeft}
        </button>
        <h1>Checkout</h1>
        <div className="header-spacer" />
      </header>

      <div className="checkout-content">
        {/* Truck Info */}
        <section className="checkout-section">
          <div className="truck-banner">
            {Icons.truck}
            <span>Ordering from <strong>{currentTruckName}</strong></span>
          </div>
        </section>

        {/* Order Type */}
        <section className="checkout-section">
          <div className="order-type-info-banner">
            {Icons.mapPin}
            <span>Pickup Order</span>
          </div>
        </section>

        {/* Order Items */}
        <section className="checkout-section">
          <h3>Your Order ({items.length} items)</h3>
          <div className="checkout-items">
            {items.map(item => (
              <div className="checkout-item" key={item.id}>
                <div className="item-qty">{item.quantity}x</div>
                <div className="item-details">
                  <span className="item-name">{item.name}</span>
                  <span className="item-price">${(parseFloat(item.price) * item.quantity).toFixed(2)}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Special Instructions */}
        <section className="checkout-section">
          <h3>Special Instructions</h3>
          <textarea
            className="notes-input"
            placeholder="Any allergies or special requests?"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
          />
        </section>

        {/* Tip */}
        <section className="checkout-section">
          <h3>Add a Tip</h3>
          <div className="tip-options">
            {tipOptions.map(pct => (
              <button
                key={pct}
                className={`tip-btn ${tip === pct && !customTip ? 'active' : ''}`}
                onClick={() => { setTip(pct); setCustomTip(''); }}
              >
                {pct === 0 ? 'No tip' : `${pct}%`}
                {pct > 0 && <span className="tip-amount">${(subtotal * pct / 100).toFixed(2)}</span>}
              </button>
            ))}
            <div className="custom-tip">
              <span>$</span>
              <input
                type="number"
                placeholder="Custom"
                value={customTip}
                onChange={(e) => { setCustomTip(e.target.value); setTip(0); }}
                min="0"
                step="0.50"
              />
            </div>
          </div>
        </section>

        {/* Payment Method */}
        <section className="checkout-section">
          <h3>Payment Method</h3>
          {truckOnlineEnabled && (
            <div
              className={`payment-option ${paymentMethod === 'online' ? 'selected' : ''}`}
              onClick={() => setPaymentMethod('online')}
              role="button"
              tabIndex={0}
            >
              {Icons.creditCard}
              <span>
                Pay Online (Card)
                {truckProcessor === 'square' && <span className="payment-processor-badge"> via Square</span>}
                {truckProcessor === 'stripe' && <span className="payment-processor-badge"> via Stripe</span>}
              </span>
              {paymentMethod === 'online' && <span className="check-icon">{Icons.check}</span>}
            </div>
          )}
          <div
            className={`payment-option ${paymentMethod === 'pickup' ? 'selected' : ''}`}
            onClick={() => setPaymentMethod('pickup')}
            role="button"
            tabIndex={0}
          >
            {Icons.shoppingBag}
            <span>Pay at Pickup (Cash/Card at truck)</span>
            {paymentMethod === 'pickup' && <span className="check-icon">{Icons.check}</span>}
          </div>
          {!truckOnlineEnabled && (
            <p className="payment-note">This truck has not enabled online payment yet.</p>
          )}
        </section>

        {/* Order Summary */}
        <section className="checkout-section summary-section">
          <h3>Order Summary</h3>
          <div className="summary-rows">
            <div className="summary-row">
              <span>Subtotal</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            <div className="summary-row">
              <span>Tax (8%)</span>
              <span>${tax.toFixed(2)}</span>
            </div>
            {calculateTip() > 0 && (
              <div className="summary-row">
                <span>Tip</span>
                <span>${calculateTip().toFixed(2)}</span>
              </div>
            )}
            <div className="summary-row total">
              <span>Total</span>
              <span>${finalTotal.toFixed(2)}</span>
            </div>
          </div>
        </section>

        {error && (
          <div className="checkout-error">
            {error}
          </div>
        )}
      </div>

      <div className="checkout-footer">
        <button
          className="place-order-btn"
          onClick={handleSubmitOrder}
          disabled={submitting || items.length === 0}
        >
          {submitting ? (
            <>
              {Icons.loader}
              {paymentMethod === 'online' ? 'Preparing payment...' : 'Placing Order...'}
            </>
          ) : (
            <>
              {paymentMethod === 'online' ? `Continue to Payment - $${finalTotal.toFixed(2)}` : `Place Order - $${finalTotal.toFixed(2)}`}
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default Checkout;
