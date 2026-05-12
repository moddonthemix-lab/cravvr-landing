// supabase/functions/square-connect-init/index.ts
// Owner clicks "Connect Square" → frontend POSTs here → we return a Square
// authorization URL the frontend redirects to. Square hands the user back to
// `square-oauth-callback` with an OAuth code we then exchange.

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import {
  getSquareAppId,
  getSquareEnv,
  signOAuthState,
  squareBaseUrl,
} from '../_shared/square.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { requireClerkUser } from '../_shared/clerk-auth.ts';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const SCOPES = [
  'PAYMENTS_WRITE',
  'PAYMENTS_READ',
  'MERCHANT_PROFILE_READ',
  'ITEMS_READ',
  'ORDERS_WRITE',
  'ORDERS_READ',
];

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders(req) });

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const userId = await requireClerkUser(req);

    const { truck_id } = await req.json();
    if (!truck_id) throw new Error('truck_id is required');

    // Verify ownership
    const { data: truck, error: truckError } = await supabase
      .from('food_trucks')
      .select('id, name')
      .eq('id', truck_id)
      .eq('owner_id', userId)
      .single();
    if (truckError || !truck) throw new Error('Truck not found or not owned by user');

    const env = getSquareEnv();
    const state = await signOAuthState({
      truck_id,
      user_id: userId,
      exp: Math.floor(Date.now() / 1000) + 60 * 15, // 15 min
    });

    const callbackUrl = `${supabaseUrl}/functions/v1/square-oauth-callback`;
    const url = new URL(`${squareBaseUrl(env)}/oauth2/authorize`);
    url.searchParams.set('client_id', getSquareAppId());
    url.searchParams.set('scope', SCOPES.join(' '));
    url.searchParams.set('session', 'false');
    url.searchParams.set('state', state);
    url.searchParams.set('redirect_uri', callbackUrl);

    return new Response(
      JSON.stringify({ url: url.toString(), environment: env }),
      { headers: { ...corsHeaders(req), 'Content-Type': 'application/json' } },
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 400, headers: { ...corsHeaders(req), 'Content-Type': 'application/json' } },
    );
  }
});
