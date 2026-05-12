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
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

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

  const [truckOnlineEnabled, setTruckOnlineEnabled] = useState(false);
  const [truckProcessor, setTruckProcessor] = useState('pickup');
  const [squareConfig, setSquareConfig] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('pickup');
  const [paymentStep, setPaymentStep] = useState('details');
  const [clientSecret, setClientSecret] = useState(null);
  const [pendingOrderId, setPendingOrderId] = useState(null);
  const stripeRef = useRef(null);
  const elementsRef = useRef(null);
  const cardElementRef = useRef(null);
  const cardMountRef = useRef(null);
  const squareFormRef = useRef(null);

  const tipOptions = [0, 15, 18, 20, 25];

  // Flat Cravvr service fee charged on top of every paid order. Routed to
  // Cravvr's Stripe / Square account server-side via application_fee_amount
  // (Stripe) or app_fee_money (Square). The truck still receives exactly the
  // cart total — this is purely a customer-paid fee on top.
  const CRAVVR_FEE = 1.00;

  const calculateTip = () => {
    if (customTip) return parseFloat(customTip) || 0;
    return subtotal * (tip / 100);
  };

  const finalTotal = total + calculateTip() + CRAVVR_FEE;

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
        if (cardMountRef.current) paymentEl.mount(cardMountRef.current);
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
      // orders.total is the truck's revenue portion (subtotal + tax + tip).
      // The Cravvr fee is NOT included here — payment edge functions add
      // CRAVVR_FEE_CENTS on top when computing what the customer actually
      // gets charged, and the fee routes to Cravvr via application_fee_amount.
      total: total + calculateTip(),
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
    if (!user.emailVerified) {
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
        } else if (truckProcessor !== 'square') {
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

  // Order complete screen
  if (orderComplete) {
    return (
      <div className="mx-auto max-w-md px-4 sm:px-6 py-10">
        <Card className="shadow-xl">
          <CardContent className="p-8 text-center space-y-5">
            <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-positive/10 text-positive">
              <span className="h-8 w-8">{Icons.check}</span>
            </span>
            <div className="space-y-2">
              <h1 className="text-2xl font-bold tracking-tight">Order Placed!</h1>
              <p className="text-base font-bold text-primary tabular-nums">Order #{orderNumber}</p>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Your order has been sent to <strong className="text-foreground">{currentTruckName}</strong>.
              You'll receive updates as they prepare your food.
            </p>
            <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-2 text-left">
              <div className="flex items-center gap-2 text-sm">
                <span className="h-4 w-4 text-muted-foreground">{Icons.shoppingBag}</span>
                <span>{items.length} items</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="h-4 w-4 text-muted-foreground">{Icons.clock}</span>
                <span>Estimated: 15-25 min</span>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-border text-base font-bold">
                <span>Total</span>
                <span className="tabular-nums">${finalTotal.toFixed(2)}</span>
              </div>
            </div>
            <Button
              size="lg"
              className="w-full"
              onClick={() => {
                if (orderId) navigate(`/order/${orderId}`);
                else if (onOrderComplete) onOrderComplete();
                else onBack();
              }}
            >
              Track Your Order
            </Button>
            <Button variant="outline" size="lg" className="w-full" onClick={onBack}>
              Back to Browsing
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Payment card step
  if (paymentStep === 'card') {
    return (
      <div className="mx-auto max-w-md px-4 sm:px-6 py-6 space-y-6">
        <header className="flex items-center gap-3">
          <button
            type="button"
            onClick={cancelPaymentAndOrder}
            disabled={submitting}
            aria-label="Back"
            className="flex h-10 w-10 items-center justify-center rounded-full text-foreground transition-colors hover:bg-muted disabled:opacity-50"
          >
            <span className="h-5 w-5">{Icons.chevronLeft}</span>
          </button>
          <h1 className="flex-1 text-center text-xl font-bold tracking-tight">Payment</h1>
          <div className="w-10" />
        </header>

        <Card>
          <CardContent className="p-4 flex items-center gap-2.5">
            <span className="h-5 w-5 text-primary">{Icons.creditCard}</span>
            <span className="text-sm">
              Pay <strong className="tabular-nums">${finalTotal.toFixed(2)}</strong> to {currentTruckName}
            </span>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5 space-y-3">
            <h3 className="font-bold text-base">Card Details</h3>
            {truckProcessor === 'stripe' && (
              <>
                <div ref={cardMountRef} className="min-h-[240px]" />
                <p className="text-xs text-muted-foreground">
                  Your card is processed securely by Stripe. You won't be charged until the truck confirms your order.
                </p>
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
                <p className="text-xs text-muted-foreground">
                  Your card is processed securely by Square. Funds go directly to the truck.
                </p>
              </>
            )}
          </CardContent>
        </Card>

        {error && (
          <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            <span className="h-4 w-4 shrink-0 mt-0.5">{Icons.alertCircle}</span>
            {error}
          </div>
        )}

        <Button
          size="lg"
          onClick={handleConfirmCardPayment}
          disabled={submitting}
          className="w-full gap-2"
        >
          {submitting ? (
            <>
              <span className="h-4 w-4 animate-spin">{Icons.loader}</span>
              Processing…
            </>
          ) : (
            <>Pay ${finalTotal.toFixed(2)}</>
          )}
        </Button>
      </div>
    );
  }

  // Default checkout details step
  return (
    <div className="mx-auto max-w-md px-4 sm:px-6 py-6 space-y-5">
      <header className="flex items-center gap-3">
        <button
          type="button"
          onClick={onBack}
          aria-label="Back"
          className="flex h-10 w-10 items-center justify-center rounded-full text-foreground transition-colors hover:bg-muted"
        >
          <span className="h-5 w-5">{Icons.chevronLeft}</span>
        </button>
        <h1 className="flex-1 text-center text-xl font-bold tracking-tight">Checkout</h1>
        <div className="w-10" />
      </header>

      <Card>
        <CardContent className="p-4 flex items-center gap-2.5">
          <span className="h-5 w-5 text-primary">{Icons.truck}</span>
          <span className="text-sm">
            Ordering from <strong>{currentTruckName}</strong>
          </span>
        </CardContent>
      </Card>

      <div className="flex items-center gap-2 rounded-lg border border-info/30 bg-info/10 px-4 py-2.5 text-sm text-info">
        <span className="h-4 w-4">{Icons.mapPin}</span>
        Pickup Order
      </div>

      {/* Items */}
      <Card>
        <CardContent className="p-5 space-y-3">
          <h3 className="font-bold text-base">Your Order ({items.length} items)</h3>
          <div className="divide-y divide-border">
            {items.map(item => (
              <div key={item.id} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0 text-sm">
                <span className="font-bold text-primary tabular-nums min-w-[2rem]">
                  {item.quantity}×
                </span>
                <span className="flex-1 truncate">{item.name}</span>
                <span className="font-semibold tabular-nums">
                  ${(parseFloat(item.price) * item.quantity).toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Notes */}
      <Card>
        <CardContent className="p-5 space-y-2">
          <h3 className="font-bold text-base">Special Instructions</h3>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Any allergies or special requests?"
            rows={3}
          />
        </CardContent>
      </Card>

      {/* Tip */}
      <Card>
        <CardContent className="p-5 space-y-3">
          <h3 className="font-bold text-base">Add a Tip</h3>
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
            {tipOptions.map(pct => {
              const isActive = tip === pct && !customTip;
              return (
                <button
                  key={pct}
                  type="button"
                  onClick={() => { setTip(pct); setCustomTip(''); }}
                  className={cn(
                    'flex flex-col items-center justify-center gap-0.5 rounded-xl border-2 px-3 py-2 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                    isActive
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border bg-background text-foreground hover:border-primary/40'
                  )}
                >
                  <span>{pct === 0 ? 'No tip' : `${pct}%`}</span>
                  {pct > 0 && (
                    <span className="text-[10px] font-normal text-muted-foreground tabular-nums">
                      ${(subtotal * pct / 100).toFixed(2)}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
              $
            </span>
            <input
              type="number"
              placeholder="Custom"
              value={customTip}
              onChange={(e) => { setCustomTip(e.target.value); setTip(0); }}
              min="0"
              step="0.50"
              className="h-10 w-full rounded-md border border-input bg-background pl-7 pr-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 tabular-nums"
            />
          </div>
        </CardContent>
      </Card>

      {/* Payment method */}
      <Card>
        <CardContent className="p-5 space-y-3">
          <h3 className="font-bold text-base">Payment Method</h3>
          {truckOnlineEnabled && (
            <button
              type="button"
              onClick={() => setPaymentMethod('online')}
              className={cn(
                'w-full flex items-center gap-3 rounded-xl border-2 p-4 text-left transition-colors',
                paymentMethod === 'online'
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/40'
              )}
            >
              <span className="h-5 w-5 text-primary">{Icons.creditCard}</span>
              <span className="flex-1 text-sm font-medium">
                Pay Online (Card)
                {truckProcessor === 'square' && (
                  <span className="ml-2 text-xs font-normal text-muted-foreground">via Square</span>
                )}
                {truckProcessor === 'stripe' && (
                  <span className="ml-2 text-xs font-normal text-muted-foreground">via Stripe</span>
                )}
              </span>
              {paymentMethod === 'online' && (
                <span className="h-5 w-5 text-primary">{Icons.check}</span>
              )}
            </button>
          )}
          <button
            type="button"
            onClick={() => setPaymentMethod('pickup')}
            className={cn(
              'w-full flex items-center gap-3 rounded-xl border-2 p-4 text-left transition-colors',
              paymentMethod === 'pickup'
                ? 'border-primary bg-primary/5'
                : 'border-border hover:border-primary/40'
            )}
          >
            <span className="h-5 w-5 text-primary">{Icons.shoppingBag}</span>
            <span className="flex-1 text-sm font-medium">
              Pay at Pickup (Cash/Card at truck)
            </span>
            {paymentMethod === 'pickup' && (
              <span className="h-5 w-5 text-primary">{Icons.check}</span>
            )}
          </button>
          {!truckOnlineEnabled && (
            <p className="text-xs text-muted-foreground">
              This truck has not enabled online payment yet.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Summary */}
      <Card>
        <CardContent className="p-5 space-y-1.5">
          <h3 className="font-bold text-base mb-2">Order Summary</h3>
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>Subtotal</span>
            <span className="tabular-nums">${subtotal.toFixed(2)}</span>
          </div>
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>Tax (8%)</span>
            <span className="tabular-nums">${tax.toFixed(2)}</span>
          </div>
          {calculateTip() > 0 && (
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>Tip</span>
              <span className="tabular-nums">${calculateTip().toFixed(2)}</span>
            </div>
          )}
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span title="Goes to Cravvr — never a cut of your truck's sales.">Cravvr fee</span>
            <span className="tabular-nums">${CRAVVR_FEE.toFixed(2)}</span>
          </div>
          <div className="flex items-center justify-between text-base font-bold pt-2 border-t border-border">
            <span>Total</span>
            <span className="tabular-nums">${finalTotal.toFixed(2)}</span>
          </div>
        </CardContent>
      </Card>

      {error && (
        <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <span className="h-4 w-4 shrink-0 mt-0.5">{Icons.alertCircle}</span>
          {error}
        </div>
      )}

      <Button
        size="lg"
        onClick={handleSubmitOrder}
        disabled={submitting || items.length === 0}
        className="w-full gap-2"
      >
        {submitting ? (
          <>
            <span className="h-4 w-4 animate-spin">{Icons.loader}</span>
            {paymentMethod === 'online' ? 'Preparing payment…' : 'Placing Order…'}
          </>
        ) : paymentMethod === 'online' ? (
          `Continue to Payment — $${finalTotal.toFixed(2)}`
        ) : (
          `Place Order — $${finalTotal.toFixed(2)}`
        )}
      </Button>
    </div>
  );
};

export default Checkout;
