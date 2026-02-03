// Supabase Edge Function for SendGrid Email Integration
// Handles both direct API calls and Supabase Auth Hooks
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { corsHeaders } from "../_shared/cors.ts"

const SENDGRID_API_KEY = Deno.env.get('SENDGRID_API_KEY')
const SENDGRID_FROM_EMAIL = Deno.env.get('SENDGRID_FROM_EMAIL') || 'noreply@cravvr.com'
const SENDGRID_FROM_NAME = Deno.env.get('SENDGRID_FROM_NAME') || 'Cravvr'
const SITE_URL = Deno.env.get('SITE_URL') || 'https://cravvr.com'

// SendGrid Template IDs - Update these with your template IDs
const TEMPLATES = {
  PASSWORD_RESET: Deno.env.get('SENDGRID_TEMPLATE_PASSWORD_RESET') || 'd-96a2dce832614b8ba32791f5fc7caae2',
  WELCOME: Deno.env.get('SENDGRID_TEMPLATE_WELCOME') || 'd-0c6102cbf62c455790db0cffceb98aed',
  MAGIC_LINK: Deno.env.get('SENDGRID_TEMPLATE_MAGIC_LINK') || 'd-96a2dce832614b8ba32791f5fc7caae2',
  CONFIRM_SIGNUP: Deno.env.get('SENDGRID_TEMPLATE_CONFIRM') || 'd-0c6102cbf62c455790db0cffceb98aed',
}

interface EmailRequest {
  to: string
  templateId: string
  dynamicData: Record<string, any>
  subject?: string
}

// Supabase Auth Hook payload
interface AuthHookPayload {
  user: {
    id: string
    email: string
    user_metadata?: {
      name?: string
    }
  }
  email_data: {
    token: string
    token_hash: string
    redirect_to: string
    email_action_type: 'recovery' | 'signup' | 'magiclink' | 'invite' | 'email_change'
  }
}

// Check if payload is from Supabase Auth Hook
function isAuthHookPayload(payload: any): payload is AuthHookPayload {
  return payload?.user?.email && payload?.email_data?.email_action_type
}

// Supabase project URL for auth verification
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || 'https://coqwihsmmigktqqdnmis.supabase.co'

// Build confirmation/reset URL from auth hook data
// This goes through Supabase's auth verification endpoint
function buildActionUrl(emailData: AuthHookPayload['email_data']): string {
  const { token_hash, redirect_to, email_action_type } = emailData

  // The URL must go through Supabase's verification endpoint
  // Format: {SUPABASE_URL}/auth/v1/verify?token={token_hash}&type={type}&redirect_to={redirect}
  const finalRedirect = redirect_to || SITE_URL
  const encodedRedirect = encodeURIComponent(finalRedirect)

  return `${SUPABASE_URL}/auth/v1/verify?token=${token_hash}&type=${email_action_type}&redirect_to=${encodedRedirect}`
}

// Send email via SendGrid
async function sendEmail(to: string, templateId: string, dynamicData: Record<string, any>) {
  if (!SENDGRID_API_KEY) {
    throw new Error('SENDGRID_API_KEY environment variable is not set')
  }

  const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SENDGRID_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: {
        email: SENDGRID_FROM_EMAIL,
        name: SENDGRID_FROM_NAME,
      },
      personalizations: [
        {
          to: [{ email: to }],
          dynamic_template_data: {
            ...dynamicData,
            year: new Date().getFullYear(),
          },
        },
      ],
      template_id: templateId,
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    console.error('SendGrid error:', error)
    throw new Error(`SendGrid API error: ${response.status} ${error}`)
  }

  return { success: true }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const data = await req.json()

    // Check if this is a Supabase Auth Hook call
    if (isAuthHookPayload(data)) {
      console.log('Processing Auth Hook:', data.email_data.email_action_type)

      // If SendGrid is not configured, return success anyway to not block auth
      if (!SENDGRID_API_KEY) {
        console.warn('SENDGRID_API_KEY not set - skipping email, allowing auth to proceed')
        return new Response(
          JSON.stringify({ success: true, warning: 'Email skipped - SendGrid not configured' }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          }
        )
      }

      const { user, email_data } = data
      const userName = user.user_metadata?.name || user.email.split('@')[0]
      const actionUrl = buildActionUrl(email_data)

      // Select template based on action type
      let templateId: string
      let dynamicData: Record<string, any>

      switch (email_data.email_action_type) {
        case 'recovery':
          templateId = TEMPLATES.PASSWORD_RESET
          dynamicData = {
            name: userName,
            resetLink: actionUrl,
            actionUrl: actionUrl,
            link: actionUrl,
          }
          break

        case 'signup':
        case 'email':
          templateId = TEMPLATES.CONFIRM_SIGNUP
          dynamicData = {
            name: userName,
            confirmLink: actionUrl,
            actionUrl: actionUrl,
            link: actionUrl,
          }
          break

        case 'magiclink':
          templateId = TEMPLATES.MAGIC_LINK
          dynamicData = {
            name: userName,
            magicLink: actionUrl,
            actionUrl: actionUrl,
            link: actionUrl,
          }
          break

        case 'invite':
          templateId = TEMPLATES.WELCOME
          dynamicData = {
            name: userName,
            inviteLink: actionUrl,
            actionUrl: actionUrl,
            link: actionUrl,
          }
          break

        case 'email_change':
          templateId = TEMPLATES.CONFIRM_SIGNUP
          dynamicData = {
            name: userName,
            confirmLink: actionUrl,
            actionUrl: actionUrl,
            link: actionUrl,
          }
          break

        default:
          console.log('Unknown email_action_type:', email_data.email_action_type)
          templateId = TEMPLATES.WELCOME
          dynamicData = {
            name: userName,
            actionUrl: actionUrl,
            link: actionUrl,
          }
      }

      console.log('Sending email:', {
        to: user.email,
        templateId,
        actionType: email_data.email_action_type
      })

      try {
        await sendEmail(user.email, templateId, dynamicData)
        console.log('Email sent successfully to:', user.email)
      } catch (emailError) {
        // Log error details but don't block auth
        console.error('Failed to send email:', {
          error: emailError.message,
          to: user.email,
          templateId,
          actionType: email_data.email_action_type
        })
      }

      return new Response(
        JSON.stringify({ success: true }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      )
    }

    // Handle direct API calls (existing behavior)
    const { to, templateId, dynamicData, subject }: EmailRequest = data

    if (!to || !templateId) {
      throw new Error('Missing required fields: to, templateId')
    }

    await sendEmail(to, templateId, dynamicData || {})

    return new Response(
      JSON.stringify({ success: true, message: 'Email sent successfully' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Error sending email:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})
