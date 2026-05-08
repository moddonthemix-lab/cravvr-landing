// supabase/functions/square-oauth-callback/index.ts
// Square redirects the merchant here after they authorize Cravvr. We exchange
// the OAuth code for an access token and persist it on the food_truck row,
// then 302 the user back to /owner with a status flag.

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import {
  exchangeOAuthCode,
  fetchPrimaryLocation,
  getSquareEnv,
  verifyOAuthState,
} from '../_shared/square.ts';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const APP_RETURN_URL = Deno.env.get('SQUARE_RETURN_URL') || 'https://www.cravvr.com/owner';

function redirect(url: string): Response {
  return new Response(null, { status: 302, headers: { Location: url } });
}

function returnTo(status: 'success' | 'error', message?: string): Response {
  const u = new URL(APP_RETURN_URL);
  u.searchParams.set('square', status);
  if (message) u.searchParams.set('square_message', message);
  return redirect(u.toString());
}

serve(async (req) => {
  try {
    const url = new URL(req.url);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');
    const responseError = url.searchParams.get('error');

    if (responseError) {
      return returnTo('error', responseError);
    }
    if (!code || !state) {
      return returnTo('error', 'missing_code_or_state');
    }

    const payload = await verifyOAuthState(state).catch(() => null);
    if (!payload) {
      return returnTo('error', 'invalid_state');
    }

    const env = getSquareEnv();
    const callbackUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/square-oauth-callback`;
    const tokens = await exchangeOAuthCode(code, env, callbackUrl);
    const locationId = await fetchPrimaryLocation(tokens.access_token, env);

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Re-verify the truck still belongs to this user (defense in depth)
    const { data: truck, error: truckError } = await supabase
      .from('food_trucks')
      .select('id, owner_id')
      .eq('id', payload.truck_id)
      .single();
    if (truckError || !truck || truck.owner_id !== payload.user_id) {
      return returnTo('error', 'unauthorized');
    }

    const { error: updateError } = await supabase
      .from('food_trucks')
      .update({
        payment_processor: 'square',
        square_merchant_id: tokens.merchant_id,
        square_location_id: locationId,
        square_access_token: tokens.access_token,
        square_refresh_token: tokens.refresh_token,
        square_token_expires_at: tokens.expires_at,
        square_charges_enabled: !!locationId,
        square_environment: env,
      })
      .eq('id', payload.truck_id);

    if (updateError) {
      console.error('Square: failed to persist tokens', updateError);
      return returnTo('error', 'persist_failed');
    }

    return returnTo('success');
  } catch (error) {
    console.error('Square OAuth callback error:', error);
    return returnTo('error', (error as Error).message || 'unknown');
  }
});
