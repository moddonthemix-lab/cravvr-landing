# Email Confirmation Setup Guide

This guide explains how to set up email confirmation for new user signups using Supabase and SendGrid.

## Overview

When users sign up, they receive an email with a confirmation link. This guide sets up:
1. ✅ A confirmation page (`/auth/confirm`) to handle the email link
2. ✅ SendGrid email template for beautiful confirmation emails
3. ✅ Supabase configuration for proper URL redirects

---

## Step 1: Configure Supabase Site URL

1. Go to **Supabase Dashboard** → Your Project
2. Navigate to **Authentication** (left sidebar)
3. Click on **URL Configuration**
4. Set the following values:

   **Site URL:**
   ```
   https://cravvr.com
   ```

   **Redirect URLs** (add each one):
   ```
   https://cravvr.com
   https://cravvr.com/**
   http://localhost:5173/**
   ```

5. Click **Save**

---

## Step 2: Create SendGrid Email Template

### Option A: Using SendGrid Dynamic Templates (Recommended)

1. Go to **SendGrid Dashboard** → **Email API** → **Dynamic Templates**
2. Click **Create a Dynamic Template**
3. Name it: `Cravvr Email Confirmation`
4. Click on the template to edit it
5. Click **Add Version**
6. Choose **Code Editor**
7. Copy the contents of `sendgrid-email-confirmation-template.html`
8. Paste into the editor
9. Click **Save**
10. **Copy the Template ID** (you'll need this for Supabase)

### Option B: Using SendGrid Legacy Templates

1. Go to **SendGrid Dashboard** → **Email API** → **Transactional Templates**
2. Create a new template
3. Use the HTML from `sendgrid-email-confirmation-template.html`
4. Save and activate

---

## Step 3: Configure Supabase Email Template

### For Custom SMTP (SendGrid Integration):

1. Go to **Supabase Dashboard** → **Project Settings** → **Authentication**
2. Scroll to **SMTP Settings**
3. Configure your SendGrid SMTP (if not already done):
   - **Host:** `smtp.sendgrid.net`
   - **Port:** `587`
   - **Username:** `apikey`
   - **Password:** Your SendGrid API Key
   - **Sender email:** `noreply@cravvr.com`
   - **Sender name:** `Cravvr`

4. Go to **Authentication** → **Email Templates**
5. Click on **Confirm signup** template
6. Update the template:

```html
<h2>Welcome to Cravvr!</h2>

<p>Thanks for signing up! Please confirm your email address by clicking the link below:</p>

<p>
  <a href="{{ .ConfirmationURL }}" style="
    display: inline-block;
    background: #e11d48;
    color: #ffffff;
    text-decoration: none;
    padding: 12px 32px;
    border-radius: 8px;
    font-weight: 600;
  ">Confirm Email Address</a>
</p>

<p style="margin-top: 32px; font-size: 14px; color: #666;">
  Or copy and paste this link into your browser:<br>
  {{ .ConfirmationURL }}
</p>

<p style="margin-top: 32px; font-size: 12px; color: #999;">
  If you didn't create a Cravvr account, you can safely ignore this email.
</p>

<p>Thanks,<br>The Cravvr Team</p>
```

7. Make sure the **Confirmation URL** is set to:
   ```
   {{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email
   ```

8. Click **Save**

---

## Step 4: Test the Email Confirmation Flow

1. **Sign up** as a new customer at https://cravvr.com
2. **Check your email** - you should receive a confirmation email from `noreply@cravvr.com`
3. **Click the confirmation link** - it should take you to `https://cravvr.com/auth/confirm?token_hash=...`
4. You should see a **success message** and be redirected to the home page
5. Try logging in - your account should now be confirmed

---

## Troubleshooting

### Email not received
- Check your spam/junk folder
- Verify SendGrid API key is valid
- Check SendGrid activity logs in SendGrid dashboard
- Verify sender email is verified in SendGrid

### Confirmation link not working
- Check that Site URL is set correctly in Supabase
- Verify `/auth/confirm` route exists in App.jsx
- Check browser console for errors
- Make sure the confirmation page code is deployed

### "Invalid confirmation link" error
- The link may have expired (default 24 hours)
- User may have already confirmed their email
- Token may be malformed - check the URL

### User can login without confirming
- Check Supabase → Authentication → Settings
- Look for "Enable email confirmations"
- Make sure it's enabled

---

## Files Modified

1. `src/pages/AuthConfirmPage.jsx` - Confirmation page component
2. `src/pages/AuthConfirmPage.css` - Confirmation page styles
3. `src/App.jsx` - Added `/auth/confirm` route
4. `sendgrid-email-confirmation-template.html` - SendGrid template
5. This setup guide

---

## Email Template Variables

These Supabase variables are available in email templates:

- `{{ .ConfirmationURL }}` - Full confirmation link with token
- `{{ .SiteURL }}` - Your site URL (cravvr.com)
- `{{ .TokenHash }}` - The confirmation token
- `{{ .Email }}` - User's email address
- `{{ .Token }}` - Legacy token (use TokenHash instead)

---

## Next Steps

After email confirmation is working:

1. Consider adding a "Resend confirmation email" feature
2. Set up email notifications for:
   - Password resets
   - Order confirmations
   - Promotional emails
3. Create additional SendGrid templates for other transactional emails

---

## Support

If you encounter issues:
- Check Supabase logs: Dashboard → Logs → Auth
- Check SendGrid activity: Dashboard → Activity
- Review browser console for JavaScript errors
