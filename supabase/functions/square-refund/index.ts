// supabase/functions/square-refund/index.ts
// Refund a Square payment for an order. Owner-only: only the truck owner can
// issue a refund (matches stripe-refund). Customers cancel orders via the
// order RPC; refunds are an owner-side action.

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { squareBaseUrl, type SquareEnvironment } from '../_shared/square.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { requireClerkUser } from '../_shared/clerk-auth.ts';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders(req) });

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const userId = await requireClerkUser(req);

    const { order_id, reason } = await req.json();
    if (!order_id) throw new Error('order_id is required');

    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .select('*')
      .eq('order_id', order_id)
      .eq('processor', 'square')
      .eq('status', 'succeeded')
      .single();
    if (paymentError || !payment) throw new Error('No successful Square payment found for this order');

    // Authorization: owner of the truck only (matches stripe-refund)
    const { data: truck } = await supabase
      .from('food_trucks')
      .select('owner_id, square_access_token, square_environment')
      .eq('id', payment.truck_id)
      .single();
    if (!truck) throw new Error('Truck not found');
    if (truck.owner_id !== userId) {
      throw new Error('Unauthorized: not the truck owner');
    }
    if (!truck.square_access_token) throw new Error('Square access token missing on truck');

    const env: SquareEnvironment = truck.square_environment === 'production' ? 'production' : 'sandbox';
    const refundBody = {
      idempotency_key: crypto.randomUUID(),
      payment_id: payment.square_payment_id,
      amount_money: { amount: payment.amount, currency: 'USD' },
      reason: reason || 'Order cancelled',
    };

    const resp = await fetch(`${squareBaseUrl(env)}/v2/refunds`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${truck.square_access_token}`,
        'Content-Type': 'application/json',
        'Square-Version': '2024-12-18',
      },
      body: JSON.stringify(refundBody),
    });

    const result = await resp.json();
    if (!resp.ok || !result.refund) {
      const msg = result?.errors?.[0]?.detail || result?.errors?.[0]?.code || 'Square refund failed';
      throw new Error(msg);
    }

    await supabase
      .from('payments')
      .update({
        status: 'refunded',
        refund_amount: payment.amount,
        refund_reason: reason || 'Order cancelled',
        square_refund_id: result.refund.id,
      })
      .eq('id', payment.id);

    await supabase
      .from('orders')
      .update({ payment_status: 'refunded' })
      .eq('id', order_id);

    return new Response(
      JSON.stringify({ refund_id: result.refund.id, status: 'refunded' }),
      { headers: { ...corsHeaders(req), 'Content-Type': 'application/json' } },
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 400, headers: { ...corsHeaders(req), 'Content-Type': 'application/json' } },
    );
  }
});
