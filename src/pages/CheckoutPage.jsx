import React from 'react';
import { useNavigate } from 'react-router-dom';
import Checkout from '../components/cart/Checkout';
import ErrorBoundary from '../components/common/ErrorBoundary';
import { useCart } from '../contexts/CartContext';

const CheckoutPage = () => {
  const navigate = useNavigate();
  const { items } = useCart();

  // If user lands on /checkout with empty cart, send them home.
  if (items.length === 0) {
    return (
      <div className="checkout-page">
        <div className="order-success">
          <h1>Your cart is empty</h1>
          <p className="success-message">Add some items before heading to checkout.</p>
          <button className="btn-primary" onClick={() => navigate('/')}>Browse Trucks</button>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <Checkout
        onBack={() => navigate(-1)}
        onOrderComplete={() => navigate('/')}
      />
    </ErrorBoundary>
  );
};

export default CheckoutPage;
