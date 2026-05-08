// supabase/functions/resend-email/index.ts
//
// Email send function — backed by **Resend** (not SendGrid).
//
// Templates are React Email components in ../_shared/emails/. Each template
// exports a default React component plus a `subject(props)` function.
//
// Two call shapes are accepted:
//
//   1. Direct API:
//        POST { to, template, data, subject?: override }
//      Used by src/services/email.js and lifecycle-email-runner.
//
//   2. Supabase Auth Hook:
//        POST { user, email_data }   (Supabase's standard payload)
//      Routed to the right template based on email_data.email_action_type.
//
// Required env vars (set via `supabase secrets set ...`):
//   RESEND_API_KEY=re_...
//   RESEND_FROM_EMAIL=noreply@cravvr.com
//   RESEND_FROM_NAME=Cravvr
//   SITE_URL=https://cravvr.com
//   SUPABASE_URL (auto-injected)

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import * as React from 'https://esm.sh/react@18.3.1';
import { render } from 'https://esm.sh/@react-email/render@0.0.16?deps=react@18.3.1';
import { corsHeaders } from '../_shared/cors.ts';

import Welcome, { subject as welcomeSubject } from '../_shared/emails/welcome.tsx';
import PasswordReset, { subject as passwordResetSubject } from '../_shared/emails/password-reset.tsx';
import ConfirmSignup, { subject as confirmSignupSubject } from '../_shared/emails/confirm-signup.tsx';
import MagicLink, { subject as magicLinkSubject } from '../_shared/emails/magic-link.tsx';
import OrderConfirmation, { subject as orderConfirmationSubject } from '../_shared/emails/order-confirmation.tsx';
import OrderStatus, { subject as orderStatusSubject } from '../_shared/emails/order-status.tsx';
import TruckApproved, { subject as truckApprovedSubject } from '../_shared/emails/truck-approved.tsx';
import AbandonedCart, { subject as abandonedCartSubject } from '../_shared/emails/abandoned-cart.tsx';
import FirstReorderNudge, { subject as firstReorderSubject } from '../_shared/emails/first-reorder-nudge.tsx';
import WinBack, { subject as winBackSubject } from '../_shared/emails/win-back.tsx';
import AdminActionNotification, { subject as adminActionSubject } from '../_shared/emails/admin-action-notification.tsx';

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
const RESEND_FROM_EMAIL = Deno.env.get('RESEND_FROM_EMAIL') || 'noreply@cravvr.com';
const RESEND_FROM_NAME = Deno.env.get('RESEND_FROM_NAME') || 'Cravvr';
const SITE_URL = Deno.env.get('SITE_URL') || 'https://cravvr.com';
const SUPABASE_URL_VAL = Deno.env.get('SUPABASE_URL') || 'https://coqwihsmmigktqqdnmis.supabase.co';
const FROM_HEADER = `${RESEND_FROM_NAME} <${RESEND_FROM_EMAIL}>`;

// Template registry — name → (component, subject fn).
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const TEMPLATES: Record<string, { Component: any; subject: (p: any) => string }> = {
  'welcome': { Component: Welcome, subject: welcomeSubject },
  'password-reset': { Component: PasswordReset, subject: passwordResetSubject },
  'confirm-signup': { Component: ConfirmSignup, subject: confirmSignupSubject },
  'magic-link': { Component: MagicLink, subject: magicLinkSubject },
  'order-confirmation': { Component: OrderConfirmation, subject: orderConfirmationSubject },
  'order-status': { Component: OrderStatus, subject: orderStatusSubject },
  'truck-approved': { Component: TruckApproved, subject: truckApprovedSubject },
  'abandoned-cart': { Component: AbandonedCart, subject: abandonedCartSubject },
  'first-reorder-nudge': { Component: FirstReorderNudge, subject: firstReorderSubject },
  'win-back': { Component: WinBack, subject: winBackSubject },
  'admin-action-notification': { Component: AdminActionNotification, subject: adminActionSubject },
};

interface DirectRequest {
  to: string;
  template: string;
  data?: Record<string, unknown>;
  subject?: string;
}

interface AuthHookPayload {
  user: { id: string; email: string; user_metadata?: { name?: string } };
  email_data: {
    token: string;
    token_hash: string;
    redirect_to: string;
    email_action_type: 'recovery' | 'signup' | 'magiclink' | 'invite' | 'email_change' | 'email';
  };
}

function isAuthHook(p: unknown): p is AuthHookPayload {
  const x = p as AuthHookPayload | undefined;
  return !!(x?.user?.email && x?.email_data?.email_action_type);
}

function buildVerifyUrl(d: AuthHookPayload['email_data']): string {
  const redirect = d.redirect_to || SITE_URL;
  return `${SUPABASE_URL_VAL}/auth/v1/verify?token=${d.token_hash}&type=${d.email_action_type}&redirect_to=${encodeURIComponent(redirect)}`;
}

async function sendViaResend(to: string, subject: string, html: string, text: string) {
  if (!RESEND_API_KEY) {
    throw new Error('RESEND_API_KEY is not set');
  }
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: FROM_HEADER,
      to: [to],
      subject,
      html,
      text,
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Resend ${res.status}: ${err}`);
  }
  return res.json();
}

async function renderAndSend(
  to: string,
  template: string,
  data: Record<string, unknown>,
  subjectOverride?: string
) {
  const entry = TEMPLATES[template];
  if (!entry) throw new Error(`Unknown template: ${template}`);

  const element = React.createElement(entry.Component, data);
  const html = await render(element);
  const text = await render(element, { plainText: true });
  const subject = subjectOverride || entry.subject(data);

  return sendViaResend(to, subject, html, text);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders(req) });
  }

  try {
    const payload = await req.json();

    // ---- Auth Hook path ----
    if (isAuthHook(payload)) {
      const { user, email_data } = payload;
      const userName = user.user_metadata?.name || user.email.split('@')[0];
      const url = buildVerifyUrl(email_data);

      if (!RESEND_API_KEY) {
        // Don't block auth flow if email is misconfigured.
        console.warn('RESEND_API_KEY not set — skipping auth-hook email');
        return new Response(JSON.stringify({ success: true, warning: 'email skipped' }), {
          headers: { ...corsHeaders(req), 'Content-Type': 'application/json' },
        });
      }

      let template: string;
      let data: Record<string, unknown>;
      switch (email_data.email_action_type) {
        case 'recovery':
          template = 'password-reset';
          data = { name: userName, resetLink: url };
          break;
        case 'signup':
        case 'email':
        case 'email_change':
          template = 'confirm-signup';
          data = { name: userName, confirmLink: url };
          break;
        case 'magiclink':
          template = 'magic-link';
          data = { name: userName, magicLink: url };
          break;
        case 'invite':
          template = 'welcome';
          data = { name: userName, appLink: url };
          break;
        default:
          template = 'welcome';
          data = { name: userName, appLink: url };
      }

      try {
        await renderAndSend(user.email, template, data);
      } catch (e) {
        // Log, don't block auth.
        console.error('Auth-hook email failed:', e);
      }
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders(req), 'Content-Type': 'application/json' },
      });
    }

    // ---- Direct API path ----
    const { to, template, data, subject } = payload as DirectRequest;
    if (!to || !template) {
      throw new Error('Missing required fields: to, template');
    }
    const result = await renderAndSend(to, template, data || {}, subject);
    return new Response(JSON.stringify({ success: true, ...result }), {
      headers: { ...corsHeaders(req), 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Email send error:', error);
    return new Response(
      JSON.stringify({ error: error.message || String(error) }),
      { status: 400, headers: { ...corsHeaders(req), 'Content-Type': 'application/json' } }
    );
  }
});
