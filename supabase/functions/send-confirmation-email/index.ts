import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const SENDGRID_API_KEY = Deno.env.get('SENDGRID_API_KEY')
const SENDGRID_TEMPLATE_ID = Deno.env.get('SENDGRID_CONFIRMATION_TEMPLATE_ID')
const SITE_URL = Deno.env.get('SITE_URL') || 'https://cravvr.com'

interface EmailRequest {
  email: string
  confirmationUrl: string
}

serve(async (req) => {
  try {
    const { email, confirmationUrl }: EmailRequest = await req.json()

    if (!email || !confirmationUrl) {
      return new Response(
        JSON.stringify({ error: 'Missing email or confirmationUrl' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Send email via SendGrid API
    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SENDGRID_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        personalizations: [
          {
            to: [{ email }],
            dynamic_template_data: {
              ConfirmationURL: confirmationUrl,
              SiteURL: SITE_URL,
              Email: email,
            },
          },
        ],
        from: {
          email: 'noreply@cravvr.com',
          name: 'Cravvr',
        },
        template_id: SENDGRID_TEMPLATE_ID,
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('SendGrid error:', error)
      throw new Error(`SendGrid API error: ${response.status}`)
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Email sent successfully' }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error sending email:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})
