// supabase/functions/square-create-payment/index.ts
// Charges a Square payment using a token (nonce) the customer's browser got
// from the Square Web Payments SDK. Funds settle directly to the truck's
// Square account; Cravvr does not take a per-tx fee on Square trucks.

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { squareBaseUrl, type SquareEnvironment } from '../_shared/square.ts';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('Unauthorized');
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', ''),
    );
    if (authError || !user) throw new Error('Unauthorized');

    const { order_id, truck_id, amount_cents, source_id, verification_token, idempotency_key } = await req.json();
    if (!order_id || !truck_id || !amount_cents || !source_id) {
      throw new Error('order_id, truck_id, amount_cents, and source_id are required');
    }

    // Look up truck's Square credentials (service role bypasses RLS so we can
    // read the access_token column).
    const { data: truck, error: truckError } = await supabase
      .from('food_trucks')
      .select('square_access_token, square_location_id, square_charges_enabled, square_environment, name, payment_processor')
      .eq('id', truck_id)
      .single();
    if (truckError || !truck) throw new Error('Truck not found');
    if (truck.payment_processor !== 'square') throw new Error('Truck is not configured for Square');
    if (!truck.square_access_token || !truck.square_location_id || !truck.square_charges_enabled) {
      throw new Error('This truck has not finished Square setup');
    }

    const env: SquareEnvironment = truck.square_environment === 'production' ? 'production' : 'sandbox';
    const paymentBody = {
      source_id,
      idempotency_key: idempotency_key || crypto.randomUUID(),
      amount_money: { amount: amount_cents, currency: 'USD' },
      location_id: truck.square_location_id,
      reference_id: order_id,
      note: `Cravvr order ${order_id}`,
      ...(verification_token ? { verification_token } : {}),
    };

    const resp = await fetch(`${squareBaseUrl(env)}/v2/payments`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${truck.square_access_token}`,
        'Content-Type': 'application/json',
        'Square-Version': '2024-12-18',
      },
      body: JSON.stringify(paymentBody),
    });

    const result = await resp.json();
    if (!resp.ok || !result.payment) {
      const msg = result?.errors?.[0]?.detail || result?.errors?.[0]?.code || 'Square payment failed';
      throw new Error(msg);
    }

    const payment = result.payment;
    const status: string = payment.status; // APPROVED, COMPLETED, PENDING, FAILED, CANCELED
    const dbStatus = status === 'COMPLETED' || status === 'APPROVED' ? 'succeeded'
      : status === 'PENDING' ? 'processing'
      : 'failed';

    // Record payment row
    await supabase.from('payments').insert({
      order_id,
      truck_id,
      customer_id: user.id,
      amount: amount_cents,
      platform_fee: 0,
      currency: 'usd',
      status: dbStatus === 'succeeded' ? 'succeeded' : dbStatus === 'processing' ? 'processing' : 'failed',
      processor: 'square',
      square_payment_id: payment.id,
      square_order_id: payment.order_id || null,
      metadata: { square_status: status, receipt_url: payment.receipt_url },
    });

    // Update the order's payment_status
    const orderPaymentStatus = dbStatus === 'succeeded' ? 'paid'
      : dbStatus === 'processing' ? 'pending'
      : 'failed';
    await supabase
      .from('orders')
      .update({ payment_status: orderPaymentStatus, payment_processor: 'square' })
      .eq('id', order_id);

    return new Response(
      JSON.stringify({
        payment_id: payment.id,
        status: dbStatus,
        receipt_url: payment.receipt_url || null,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
