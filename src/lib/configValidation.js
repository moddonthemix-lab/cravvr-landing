/**
 * Validate critical environment configuration on app boot.
 * Logs problems and returns a list of warnings to surface in the UI.
 */
export function validateConfig() {
  const warnings = [];
  const env = import.meta.env;

  if (!env.VITE_SUPABASE_URL || !env.VITE_SUPABASE_ANON_KEY) {
    warnings.push({
      level: 'error',
      key: 'supabase',
      message: 'Supabase is not configured (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY missing).',
    });
  }

  const stripeKey = env.VITE_STRIPE_PUBLISHABLE_KEY;
  if (!stripeKey) {
    warnings.push({
      level: 'warn',
      key: 'stripe',
      message: 'Stripe publishable key not set — online payments will be disabled.',
    });
  } else if (!stripeKey.startsWith('pk_')) {
    warnings.push({
      level: 'error',
      key: 'stripe',
      message: 'VITE_STRIPE_PUBLISHABLE_KEY looks invalid (should start with pk_test_ or pk_live_).',
    });
  } else if (stripeKey.startsWith('pk_test_') && env.PROD) {
    warnings.push({
      level: 'warn',
      key: 'stripe',
      message: 'Production build is using a Stripe TEST key. Real payments will not be charged.',
    });
  }

  for (const w of warnings) {
    if (w.level === 'error') console.error(`[config] ${w.message}`);
    else console.warn(`[config] ${w.message}`);
  }

  return warnings;
}
