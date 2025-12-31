# Supabase Email Configuration Guide

## Quick Fix: Enable Confirmation Links

1. Go to Supabase Dashboard: https://app.supabase.com/project/coqwihsmmigktqqdnmis
2. Navigate to **Authentication** → **URL Configuration**
3. Set these values:

```
Site URL: https://cravvr.com

Redirect URLs (add these):
https://cravvr.com
https://cravvr.com/**
http://localhost:5173/**
```

4. Click **Save**

## Customize Email Templates

### Current Template Issues
- ❌ Sender shows: `Supabase Auth <noreply@mail.app.supabase.io>`
- ❌ Generic Supabase branding
- ❌ Confirmation link redirects to wrong URL

### Fix Email Templates
1. **Authentication** → **Email Templates** → **Confirm signup**
2. Customize the template:

```html
<h2>Welcome to Cravvr! 🍔</h2>
<p>Thanks for signing up! Click the button below to confirm your email address.</p>
<a href="{{ .ConfirmationURL }}">Confirm Your Email</a>
<p>If you didn't create an account, you can safely ignore this email.</p>
```

### Available Templates to Customize
- ✅ Confirm signup
- ✅ Magic Link
- ✅ Change Email Address
- ✅ Reset Password

## Custom Branded Email (Optional)

To send from `no-reply@cravvr.com` instead of Supabase:

### Recommended: Use Resend (Free Tier)

1. **Sign up**: https://resend.com
2. **Add domain**: cravvr.com
3. **Verify DNS**: Add the TXT and MX records they provide
4. **Get API key**: Create an API key
5. **Configure Supabase SMTP**:
   - Host: `smtp.resend.com`
   - Port: `465` or `587`
   - Username: `resend`
   - Password: Your API key
   - Sender: `no-reply@cravvr.com`

### Alternative: SendGrid

1. **Sign up**: https://sendgrid.com
2. **Create API Key**: Settings → API Keys
3. **Configure Supabase SMTP**:
   - Host: `smtp.sendgrid.net`
   - Port: `587`
   - Username: `apikey`
   - Password: Your SendGrid API key
   - Sender: `no-reply@cravvr.com`

## Disable Email Confirmation (NOT RECOMMENDED)

If you want users to sign in immediately without email confirmation:

1. **Authentication** → **Providers** → **Email**
2. Toggle **"Confirm email"** to OFF
3. ⚠️ Warning: Users can sign up with any email address

## Testing

After configuring:
1. Sign up with a test email
2. Check that confirmation email arrives
3. Click confirmation link
4. Should redirect to https://cravvr.com
5. User should be signed in automatically

## Current Status

✅ Authentication working
✅ Sign up creates accounts
✅ Emails being sent
❌ Confirmation links broken (need Site URL config)
❌ Using generic Supabase email sender
