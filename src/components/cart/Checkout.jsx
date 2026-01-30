import React, { useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { useCart } from '../../contexts/CartContext';
import { supabase } from '../../lib/supabase';
import './Checkout.css';

// Icons
const Icons = {
  chevronLeft: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>,
  mapPin: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>,
  clock: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  creditCard: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>,
  check: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>,
  loader: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="animate-spin"><circle cx="12" cy="12" r="10" strokeOpacity="0.25"/><path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round"/></svg>,
  truck: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>,
  shoppingBag: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>,
};

const Checkout = ({ onBack, onOrderComplete }) => {
  const { user, profile } = useAuth();
  const { items, subtotal, tax, total, currentTruckId, currentTruckName, clearCart } = useCart();

  const [orderType, setOrderType] = useState('pickup');
  const [notes, setNotes] = useState('');
  const [tip, setTip] = useState(0);
  const [customTip, setCustomTip] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [orderComplete, setOrderComplete] = useState(false);
  const [orderNumber, setOrderNumber] = useState('');
  const [error, setError] = useState('');

  const tipOptions = [0, 15, 18, 20, 25];

  const calculateTip = () => {
    if (customTip) return parseFloat(customTip) || 0;
    return subtotal * (tip / 100);
  };

  const finalTotal = total + calculateTip();

  const handleSubmitOrder = async () => {
    if (!user) {
      setError('Please sign in to place an order');
      return;
    }

    if (items.length === 0) {
      setError('Your cart is empty');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      // Create the order
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert([{
          customer_id: user.id,
          truck_id: currentTruckId,
          status: 'pending',
          order_type: orderType,
          subtotal: subtotal,
          tax: tax,
          tip: calculateTip(),
          total: finalTotal,
          notes: notes || null,
        }])
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order items
      const orderItems = items.map(item => ({
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

      // Success!
      setOrderNumber(orderData.order_number);
      setOrderComplete(true);
      clearCart();

    } catch (err) {
      console.error('Order submission error:', err);
      setError(err.message || 'Failed to submit order. Please try again.');
    } finally {
      setSubmitting(false);
    }
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
          <button className="btn-primary" onClick={onOrderComplete || onBack}>
            Track Your Order
          </button>
          <button className="btn-secondary" onClick={onBack}>
            Back to Browsing
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
          <h3>Order Type</h3>
          <div className="order-type-toggle">
            <button
              className={`type-btn ${orderType === 'pickup' ? 'active' : ''}`}
              onClick={() => setOrderType('pickup')}
            >
              {Icons.mapPin}
              Pickup
            </button>
            <button
              className={`type-btn ${orderType === 'delivery' ? 'active' : ''}`}
              onClick={() => setOrderType('delivery')}
              disabled
            >
              {Icons.truck}
              Delivery
              <span className="coming-soon">Soon</span>
            </button>
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
          <div className="payment-option selected">
            {Icons.creditCard}
            <span>Pay at Pickup</span>
            <span className="check-icon">{Icons.check}</span>
          </div>
          <p className="payment-note">Online payment coming soon!</p>
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
              Placing Order...
            </>
          ) : (
            <>
              Place Order - ${finalTotal.toFixed(2)}
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default Checkout;
