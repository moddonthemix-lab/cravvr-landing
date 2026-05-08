import React, { useState } from 'react';
import { Icons } from '../common/Icons';
import { useToast } from '../../contexts/ToastContext';
import { callSquareFunction } from '../../lib/square';

const SquareOnboarding = ({ truck }) => {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);

  const isConnected = truck.payment_processor === 'square'
    && truck.square_charges_enabled
    && truck.square_location_id;
  const isPartial = truck.square_merchant_id && !truck.square_charges_enabled;

  const handleConnect = async () => {
    setLoading(true);
    try {
      const result = await callSquareFunction('square-connect-init', { truck_id: truck.id });
      if (result.url) {
        window.location.href = result.url;
      } else {
        throw new Error('No authorization URL returned');
      }
    } catch (err) {
      showToast(err.message || 'Failed to start Square onboarding', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="stripe-onboarding">
      <div className="stripe-card">
        <div className="stripe-icon">{Icons.creditCard}</div>
        <div className="stripe-info">
          <h4>Square — Online Payments</h4>
          {isConnected ? (
            <>
              <p className="stripe-status connected">
                {Icons.check} Connected to Square
              </p>
              <p className="stripe-note">
                Customers can pay online with card. Funds settle directly to your Square account.
              </p>
              <button className="stripe-btn" onClick={handleConnect} disabled={loading}>
                {loading ? 'Loading...' : 'Reconnect'}
              </button>
            </>
          ) : isPartial ? (
            <>
              <p className="stripe-status pending">{Icons.clock} Onboarding incomplete</p>
              <p className="stripe-note">
                We connected to your Square account but couldn't find an active location. Reconnect to retry.
              </p>
              <button className="stripe-btn" onClick={handleConnect} disabled={loading}>
                {loading ? 'Loading...' : 'Reconnect with Square'}
              </button>
            </>
          ) : (
            <>
              <p className="stripe-note">
                Connect your existing Square account to accept card payments. Funds go directly to your Square — Cravvr does not take a per-transaction fee on Square trucks.
              </p>
              <button className="stripe-btn" onClick={handleConnect} disabled={loading}>
                {loading ? 'Loading...' : 'Connect with Square'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default SquareOnboarding;
