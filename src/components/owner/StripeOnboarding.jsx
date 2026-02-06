import React, { useState } from 'react';
import { Icons } from '../common/Icons';
import { useToast } from '../../contexts/ToastContext';
import { callStripeFunction } from '../../lib/stripe';

const StripeOnboarding = ({ truck, onUpdate }) => {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);

  const isConnected = truck.stripe_onboarding_complete && truck.stripe_charges_enabled;
  const isPending = truck.stripe_account_id && !truck.stripe_onboarding_complete;

  const handleConnect = async () => {
    setLoading(true);
    try {
      const result = await callStripeFunction('stripe-connect-onboard', {
        truck_id: truck.id,
      });

      if (result.url) {
        window.location.href = result.url;
      }
    } catch (err) {
      showToast(err.message || 'Failed to start Stripe onboarding', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="stripe-onboarding">
      <div className="stripe-card">
        <div className="stripe-icon">
          {Icons.creditCard}
        </div>
        <div className="stripe-info">
          <h4>Online Payments</h4>
          {isConnected ? (
            <>
              <p className="stripe-status connected">
                {Icons.check} Connected to Stripe
              </p>
              <p className="stripe-note">
                You're accepting online payments. Funds are deposited to your Stripe account automatically.
              </p>
            </>
          ) : isPending ? (
            <>
              <p className="stripe-status pending">
                {Icons.clock} Onboarding in progress
              </p>
              <p className="stripe-note">
                Complete your Stripe account setup to start accepting online payments.
              </p>
              <button className="stripe-btn" onClick={handleConnect} disabled={loading}>
                {loading ? 'Loading...' : 'Continue Setup'}
              </button>
            </>
          ) : (
            <>
              <p className="stripe-note">
                Connect with Stripe to accept credit card payments directly from customers.
                A 5% platform fee applies to each transaction.
              </p>
              <button className="stripe-btn" onClick={handleConnect} disabled={loading}>
                {loading ? 'Loading...' : 'Connect with Stripe'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default StripeOnboarding;
