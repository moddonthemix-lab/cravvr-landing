/**
 * Square Web Payments SDK loader.
 *
 * Mirror of src/lib/stripe.js — loads the Square SDK from their CDN once,
 * exposes a `getSquare()` factory, and an `initSquarePayments()` helper that
 * returns a Payments instance scoped to a (applicationId, locationId) pair.
 */

import { supabase } from './supabase';

let sdkPromise = null;

const SDK_URLS = {
  sandbox: 'https://sandbox.web.squarecdn.com/v1/square.js',
  production: 'https://web.squarecdn.com/v1/square.js',
};

export const loadSquareSdk = async (environment = 'sandbox') => {
  if (sdkPromise) return sdkPromise;

  if (window.Square) {
    sdkPromise = Promise.resolve(window.Square);
    return sdkPromise;
  }

  sdkPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = SDK_URLS[environment] || SDK_URLS.sandbox;
    script.onload = () => resolve(window.Square);
    script.onerror = () => reject(new Error('Failed to load Square Web Payments SDK'));
    document.head.appendChild(script);
  });
  return sdkPromise;
};

/**
 * Initialize a Square Payments instance for a specific merchant location.
 * The truck's location_id is fetched from the food_trucks row at checkout time.
 */
export const initSquarePayments = async ({ applicationId, locationId, environment }) => {
  const Square = await loadSquareSdk(environment);
  if (!Square) throw new Error('Square SDK unavailable');
  if (!applicationId || !locationId) throw new Error('Square applicationId and locationId required');
  return Square.payments(applicationId, locationId);
};

/**
 * Generic edge-function caller for any square-* function. Mirrors
 * callStripeFunction so callers can swap based on truck.payment_processor.
 */
export const callSquareFunction = async (functionName, body) => {
  const { data: { session } } = await supabase.auth.getSession();
  const response = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/${functionName}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session?.access_token}`,
      },
      body: JSON.stringify(body),
    },
  );
  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(err.error || err.message || 'Square operation failed');
  }
  return response.json();
};
