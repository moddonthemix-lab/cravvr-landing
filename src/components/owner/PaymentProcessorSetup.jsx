import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../contexts/ToastContext';
import StripeOnboarding from './StripeOnboarding';
import SquareOnboarding from './SquareOnboarding';

/**
 * PaymentProcessorSetup
 *
 * Owner-facing block that lets the owner pick their POS (Stripe, Square,
 * or pickup-only) and renders the matching onboarding panel inline.
 * Clover slot is reserved but not yet wired.
 */
const PaymentProcessorSetup = ({ truck, onUpdate }) => {
  const { showToast } = useToast();
  const [updating, setUpdating] = useState(false);
  const processor = truck.payment_processor || 'pickup';

  const setProcessor = async (next) => {
    if (next === processor) return;
    setUpdating(true);
    try {
      const { error } = await supabase
        .from('food_trucks')
        .update({ payment_processor: next })
        .eq('id', truck.id);
      if (error) throw error;
      showToast(`Payment processor set to ${next}`, 'success');
      onUpdate?.();
    } catch (err) {
      showToast(err.message || 'Could not update processor', 'error');
    } finally {
      setUpdating(false);
    }
  };

  const Choice = ({ value, label, sub }) => (
    <button
      type="button"
      className={`payment-option ${processor === value ? 'selected' : ''}`}
      disabled={updating}
      onClick={() => setProcessor(value)}
    >
      <span style={{ display: 'flex', flexDirection: 'column' }}>
        <strong>{label}</strong>
        {sub && <span className="payment-note" style={{ marginTop: 4 }}>{sub}</span>}
      </span>
    </button>
  );

  return (
    <div className="payment-processor-setup">
      <h3>Customer Payments</h3>
      <p className="payment-note">
        Pick how customers pay you. You can change this later. Funds always go directly to you — Cravvr only charges your Cravvr Plus subscription.
      </p>

      <div className="payment-processor-choices" style={{ display: 'grid', gap: 8, margin: '12px 0' }}>
        <Choice value="stripe" label="Stripe" sub="Connect a Stripe account (best for new businesses)" />
        <Choice value="square" label="Square" sub="Use your existing Square account and POS" />
        <Choice value="clover" label="Clover" sub="Coming soon" />
        <Choice value="pickup" label="Pay at Pickup only" sub="No online checkout — collect in person" />
      </div>

      {processor === 'stripe' && <StripeOnboarding truck={truck} onUpdate={onUpdate} />}
      {processor === 'square' && <SquareOnboarding truck={truck} onUpdate={onUpdate} />}
      {processor === 'clover' && (
        <p className="payment-note">Clover support is on the roadmap. Pick Stripe or Square for now.</p>
      )}
      {processor === 'pickup' && (
        <p className="payment-note">Customers will see "Pay at Pickup" only.</p>
      )}
    </div>
  );
};

export default PaymentProcessorSetup;
