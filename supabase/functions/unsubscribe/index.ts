// supabase/functions/unsubscribe/index.ts
// Edge Function: token-based marketing email opt-out.
//
// Public endpoint — no auth. Takes a token, finds the matching customer,
// flips email_marketing_opt_out = true. Idempotent.

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { token } = await req.json();
    if (!token || typeof token !== 'string') {
      throw new Error('Missing token');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { data, error } = await supabase
      .from('customers')
      .update({ email_marketing_opt_out: true })
      .eq('unsubscribe_token', token)
      .select('id')
      .maybeSingle();

    if (error) throw error;

    return new Response(
      JSON.stringify({ ok: true, found: !!data }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('unsubscribe error:', err);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
