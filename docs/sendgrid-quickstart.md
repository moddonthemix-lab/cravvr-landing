# SendGrid Template ID - Quick Setup

Follow these steps to use your SendGrid Template ID for confirmation emails.

## Prerequisites

- ✅ SendGrid Dynamic Template created
- ✅ Template ID copied (format: `d-xxxxxxxxxxxxx`)
- ✅ SendGrid API Key ready

---

## Quick Setup (5 Steps)

### 1. Deploy the Edge Function

```bash
# Install Supabase CLI (if needed)
npm install -g supabase

# Login
supabase login

# Link to your project (find Project ID in Supabase Dashboard → Settings)
supabase link --project-ref YOUR_PROJECT_ID

# Deploy the function
supabase functions deploy send-confirmation-email
```

### 2. Set Environment Variables in Supabase

Go to **Supabase Dashboard** → **Edge Functions** → **send-confirmation-email** → **Settings**

Add these variables:

```
SENDGRID_API_KEY = your_sendgrid_api_key
SENDGRID_CONFIRMATION_TEMPLATE_ID = d-xxxxxxxxxxxxx
SITE_URL = https://cravvr.com
```

### 3. Update Your SendGrid Template

Make sure your template uses these variables:

```html
<a href="{{ ConfirmationURL }}">Confirm Email</a>
```

Available variables:
- `{{ ConfirmationURL }}` - The confirmation link
- `{{ SiteURL }}` - cravvr.com
- `{{ Email }}` - User's email

### 4. Disable Supabase Default Email

**Supabase Dashboard** → **Authentication** → **Email Templates** → **Confirm signup**

Either:
- Delete the template content, OR
- Disable the template

This prevents double emails.

### 5. Set Site URL

**Supabase Dashboard** → **Authentication** → **URL Configuration**

```
Site URL: https://cravvr.com

Redirect URLs:
https://cravvr.com/**
http://localhost:5173/**
```

---

## Test It!

1. Sign up as a new customer
2. Check your email (from SendGrid with your template)
3. Click the confirmation link
4. Should redirect to the confirmation page

---

## Troubleshooting

**No email received?**
- Check SendGrid Dashboard → Activity
- Check Supabase → Edge Functions → Logs
- Verify env variables are set

**Email received but wrong format?**
- Check Template ID is correct
- Verify template uses `{{ ConfirmationURL }}`

**Confirmation link doesn't work?**
- Check Site URL is set correctly
- Verify `/auth/confirm` route exists (already added ✅)

---

## Files

- `supabase/functions/send-confirmation-email/index.ts` - Edge Function
- `src/components/auth/AuthContext.jsx` - Updated to call function
- `src/pages/AuthConfirmPage.jsx` - Confirmation page

Full docs: See `SENDGRID-TEMPLATE-SETUP.md`
