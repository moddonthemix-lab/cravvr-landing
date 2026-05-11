// supabase/functions/clerk-webhook/index.ts
//
// ╔══════════════════════════════════════════════════════════════════════════╗
// ║  DRAFT — Phase 3 of the Clerk migration.                                ║
// ║  Receives user lifecycle events from Clerk and syncs them to the        ║
// ║  Supabase user tables (replaces the dropped on_auth_user_created        ║
// ║  trigger).                                                               ║
// ║                                                                          ║
// ║  Required env vars (set via supabase secrets set):                      ║
// ║   CLERK_WEBHOOK_SECRET=whsec_…   (from Clerk Dashboard → Webhooks)      ║
// ║   SUPABASE_URL                   (auto-injected)                        ║
// ║   SUPABASE_SERVICE_ROLE_KEY      (auto-injected)                        ║
// ║                                                                          ║
// ║  Configure in Clerk Dashboard → Webhooks:                                ║
// ║   URL: https://<project-ref>.supabase.co/functions/v1/clerk-webhook     ║
// ║   Events: user.created, user.updated, user.deleted                      ║
// ║                                                                          ║
// ║  Signup metadata convention:                                             ║
// ║   role/phone/birthday are passed through Clerk's `unsafeMetadata` at    ║
// ║   sign-up time, then read here. (Once Phase 4 ships, decide whether to  ║
// ║   move sensitive fields to a server-side custom signup flow instead.)   ║
// ╚══════════════════════════════════════════════════════════════════════════╝

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { Webhook } from 'https://esm.sh/svix@1.42.0';
import { corsHeaders } from '../_shared/cors.ts';

const CLERK_WEBHOOK_SECRET = Deno.env.get('CLERK_WEBHOOK_SECRET')!;
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

type ClerkEmail = { id: string; email_address: string };
type ClerkUser = {
  id: string;
  email_addresses: ClerkEmail[];
  primary_email_address_id: string | null;
  first_name: string | null;
  last_name: string | null;
  unsafe_metadata: Record<string, unknown> | null;
  public_metadata: Record<string, unknown> | null;
};

type ClerkEvent =
  | { type: 'user.created'; data: ClerkUser }
  | { type: 'user.updated'; data: ClerkUser }
  | { type: 'user.deleted'; data: { id: string; deleted: boolean } };

function primaryEmail(u: ClerkUser): string {
  const primary = u.email_addresses.find((e) => e.id === u.primary_email_address_id);
  return (primary ?? u.email_addresses[0])?.email_address ?? '';
}

function displayName(u: ClerkUser): string {
  const parts = [u.first_name, u.last_name].filter(Boolean) as string[];
  if (parts.length) return parts.join(' ');
  const email = primaryEmail(u);
  return email ? email.split('@')[0] : 'User';
}

function pickRole(u: ClerkUser): 'customer' | 'owner' | 'admin' {
  // Prefer publicMetadata.role (set by trusted code); fall back to unsafeMetadata
  // (settable from the browser at signup). Default customer.
  const metaRole =
    (u.public_metadata?.role as string | undefined) ??
    (u.unsafe_metadata?.role as string | undefined);
  if (metaRole === 'owner' || metaRole === 'admin' || metaRole === 'customer') {
    return metaRole;
  }
  return 'customer';
}

async function upsertUser(
  supabase: ReturnType<typeof createClient>,
  u: ClerkUser
) {
  const role = pickRole(u);
  const email = primaryEmail(u);
  const name = displayName(u);
  const phone = (u.unsafe_metadata?.phone as string | undefined) ?? null;
  const birthday = (u.unsafe_metadata?.birthday as string | undefined) ?? null;

  // profiles — every user gets one
  const { error: profileError } = await supabase
    .from('profiles')
    .upsert(
      {
        id: u.id,
        email,
        name,
        role,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'id' }
    );
  if (profileError) throw new Error(`profiles upsert: ${profileError.message}`);

  // customers — every user gets one (favorites/rewards depend on it)
  const { error: customerError } = await supabase
    .from('customers')
    .upsert(
      {
        id: u.id,
        ...(phone ? { phone } : {}),
        ...(birthday ? { birthday } : {}),
      },
      { onConflict: 'id', ignoreDuplicates: false }
    );
  if (customerError) throw new Error(`customers upsert: ${customerError.message}`);

  // owners — only for owner role
  if (role === 'owner') {
    const { error: ownerError } = await supabase
      .from('owners')
      .upsert({ id: u.id }, { onConflict: 'id', ignoreDuplicates: true });
    if (ownerError) throw new Error(`owners upsert: ${ownerError.message}`);
  }

  // admins — only for admin role; default to superadmin permission
  if (role === 'admin') {
    const { error: adminError } = await supabase
      .from('admins')
      .upsert(
        { id: u.id, permissions: ['*'] },
        { onConflict: 'id', ignoreDuplicates: true }
      );
    if (adminError) throw new Error(`admins upsert: ${adminError.message}`);
  }
}

async function deleteUser(
  supabase: ReturnType<typeof createClient>,
  userId: string
) {
  // ON DELETE CASCADE on customers/owners/admins handles role rows.
  const { error } = await supabase.from('profiles').delete().eq('id', userId);
  if (error) throw new Error(`profiles delete: ${error.message}`);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders(req) });
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', {
      status: 405,
      headers: corsHeaders(req),
    });
  }

  // Verify Svix signature — Clerk uses Svix to sign webhooks.
  const svixId = req.headers.get('svix-id');
  const svixTimestamp = req.headers.get('svix-timestamp');
  const svixSignature = req.headers.get('svix-signature');
  if (!svixId || !svixTimestamp || !svixSignature) {
    return new Response('Missing Svix headers', {
      status: 400,
      headers: corsHeaders(req),
    });
  }

  const payload = await req.text();
  let event: ClerkEvent;
  try {
    const wh = new Webhook(CLERK_WEBHOOK_SECRET);
    event = wh.verify(payload, {
      'svix-id': svixId,
      'svix-timestamp': svixTimestamp,
      'svix-signature': svixSignature,
    }) as ClerkEvent;
  } catch (err) {
    console.error('Svix verify failed:', err);
    return new Response('Invalid signature', {
      status: 401,
      headers: corsHeaders(req),
    });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    switch (event.type) {
      case 'user.created':
      case 'user.updated':
        await upsertUser(supabase, event.data);
        break;
      case 'user.deleted':
        await deleteUser(supabase, event.data.id);
        break;
      default:
        // Unhandled event type — ack so Clerk doesn't retry forever.
        console.log('Ignoring event type:', (event as { type: string }).type);
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders(req), 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Webhook handler error:', err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : String(err) }),
      {
        status: 500,
        headers: { ...corsHeaders(req), 'Content-Type': 'application/json' },
      }
    );
  }
});
