// supabase/functions/square-oauth-callback/index.ts
// Square redirects the merchant here after they authorize Cravvr. We exchange
// the OAuth code for an access token and persist it on the food_truck row,
// then 302 the user back to /owner with a status flag.

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import {
  exchangeOAuthCode,
  fetchCatalogItems,
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

    // One-shot Square Catalog import — pull the merchant's existing menu so
    // the truck lands on /owner with their items, prices, and photos already
    // populated. Failures here never block the redirect; trucks can re-run.
    try {
      const { items, imagesById } = await fetchCatalogItems(tokens.access_token, env);
      const rows = items
        .filter(it => it.item_data?.variations?.[0]?.item_variation_data?.price_money?.amount != null)
        .map(it => {
          const v0 = it.item_data!.variations![0].item_variation_data!;
          const imageId = it.item_data!.image_ids?.[0];
          const imageUrl = imageId ? imagesById[imageId]?.image_data?.url ?? null : null;
          return {
            truck_id: payload.truck_id,
            name: it.item_data!.name ?? 'Untitled',
            description: it.item_data!.description ?? '',
            price: Number(v0.price_money!.amount!) / 100,
            image_url: imageUrl,
            emoji: '🍴',
            is_available: !it.is_deleted,
            square_catalog_object_id: it.id,
          };
        });
      if (rows.length) {
        const { error: importError } = await supabase
          .from('menu_items')
          .upsert(rows, { onConflict: 'truck_id,square_catalog_object_id' });
        if (importError) console.error('Square catalog import upsert error:', importError);
      }
    } catch (err) {
      console.error('Square catalog import failed:', err);
    }

    return returnTo('success');
  } catch (error) {
    console.error('Square OAuth callback error:', error);
    return returnTo('error', (error as Error).message || 'unknown');
  }
});
