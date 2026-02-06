/**
 * Stripe client-side initialization
 * The publishable key should be set as an environment variable
 */

import { supabase } from './supabase';

let stripePromise = null;

/**
 * Load Stripe.js from CDN and initialize with publishable key
 * This avoids needing @stripe/stripe-js as an npm dependency
 */
export const getStripe = async () => {
  if (stripePromise) return stripePromise;

  const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
  if (!publishableKey) {
    console.warn('Stripe publishable key not configured. Set VITE_STRIPE_PUBLISHABLE_KEY in .env');
    return null;
  }

  // Load Stripe.js from CDN if not already present
  if (!window.Stripe) {
    await new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://js.stripe.com/v3/';
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  stripePromise = window.Stripe(publishableKey);
  return stripePromise;
};

/**
 * Call a Supabase Edge Function for Stripe operations
 */
export const callStripeFunction = async (functionName, body) => {
  const { data: { session } } = await supabase.auth.getSession();

  const response = await fetch(
    `https://coqwihsmmigktqqdnmis.supabase.co/functions/v1/${functionName}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session?.access_token}`,
      },
      body: JSON.stringify(body),
    }
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || error.message || 'Stripe operation failed');
  }

  return response.json();
};
