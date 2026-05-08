import React, { useEffect, useImperativeHandle, useRef, useState, forwardRef } from 'react';
import { initSquarePayments } from '../../lib/square';

/**
 * SquarePaymentForm
 *
 * Mounts the Square Web Payments SDK card element and exposes a `tokenize()`
 * method via ref. Parent calls `tokenize()` when the user clicks "Pay" — we
 * return `{ token, verificationToken? }` for the parent to send to the
 * `square-create-payment` edge function.
 *
 * Props:
 *   applicationId  — Square OAuth application id (Cravvr's, public)
 *   locationId     — truck's Square location id
 *   environment    — 'sandbox' | 'production'
 *   amount         — final total in dollars (for SCA verification buyer details)
 *   onReady        — called once card UI is mounted
 *   onError        — called with Error if init fails
 */
const SquarePaymentForm = forwardRef(function SquarePaymentForm(
  { applicationId, locationId, environment = 'sandbox', amount, onReady, onError },
  ref,
) {
  const containerRef = useRef(null);
  const cardRef = useRef(null);
  const paymentsRef = useRef(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const payments = await initSquarePayments({ applicationId, locationId, environment });
        if (cancelled) return;
        paymentsRef.current = payments;
        const card = await payments.card();
        if (cancelled) return;
        await card.attach(containerRef.current);
        cardRef.current = card;
        setLoading(false);
        onReady?.();
      } catch (err) {
        console.error('Square init error:', err);
        onError?.(err);
      }
    })();
    return () => {
      cancelled = true;
      try { cardRef.current?.destroy?.(); } catch (_) {}
      cardRef.current = null;
      paymentsRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [applicationId, locationId, environment]);

  useImperativeHandle(ref, () => ({
    async tokenize(buyerDetails) {
      if (!cardRef.current) throw new Error('Card form not ready');
      const result = await cardRef.current.tokenize();
      if (result.status !== 'OK') {
        const detail = result.errors?.[0]?.message || 'Card tokenization failed';
        throw new Error(detail);
      }
      // Optional Strong Customer Authentication step. Skipping for now —
      // Square handles 3DS automatically for cards that need it during
      // tokenize() in most cases.
      return { token: result.token, verificationToken: undefined };
    },
  }), []);

  return (
    <div className="square-card-mount-wrap">
      <div ref={containerRef} className="square-card-mount" style={{ minHeight: 100 }} />
      {loading && <p className="payment-note">Loading secure payment form…</p>}
    </div>
  );
});

export default SquarePaymentForm;
