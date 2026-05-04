# SendGrid Dynamic Template Setup Guide

This guide shows you how to use your SendGrid Template ID for beautiful confirmation emails.

## Overview

We'll set up Supabase to send confirmation emails using SendGrid's Dynamic Templates. This gives you full control over email design using SendGrid's template editor.

---

## Step 1: Get Your SendGrid Template ID

1. Go to **SendGrid Dashboard** → **Email API** → **Dynamic Templates**
2. Find your **Cravvr Email Confirmation** template
3. Copy the **Template ID** (format: `d-xxxxxxxxxxxxxxx`)
4. Save this - you'll need it for Step 3

---

## Step 2: Deploy the Edge Function

### A. Install Supabase CLI (if not already installed)

```bash
npm install -g supabase
```

### B. Login to Supabase

```bash
supabase login
```

### C. Link to Your Project

```bash
cd /path/to/cravvr-landing
supabase link --project-ref YOUR_PROJECT_ID
```

**To find your Project ID:**
- Go to Supabase Dashboard → Project Settings → General
- Copy the "Reference ID"

### D. Deploy the Edge Function

```bash
supabase functions deploy send-confirmation-email
```

---

## Step 3: Set Edge Function Environment Variables

1. Go to **Supabase Dashboard** → **Edge Functions**
2. Click on **send-confirmation-email**
3. Go to **Settings** tab
4. Add these **Environment Variables**:

   **SENDGRID_API_KEY**
   ```
   YOUR_SENDGRID_API_KEY
   ```

   **SENDGRID_CONFIRMATION_TEMPLATE_ID**
   ```
   d-xxxxxxxxxxxxxxx  (your template ID from Step 1)
   ```

   **SITE_URL**
   ```
   https://cravvr.com
   ```

5. Click **Save**

---

## Step 4: Update Your SendGrid Template

Make sure your SendGrid template includes these **dynamic template variables**:

- `{{ ConfirmationURL }}` - The confirmation link
- `{{ SiteURL }}` - Your site URL (cravvr.com)
- `{{ Email }}` - User's email address

**Example in your template:**

```html
<a href="{{ ConfirmationURL }}">Confirm Email Address</a>
```

---

## Step 5: Configure Supabase Auth Settings

### A. Disable Default Confirmation Emails

1. Go to **Supabase Dashboard** → **Authentication** → **Email Templates**
2. Click on **Confirm signup** template
3. **Disable** the template (or clear the content)

This prevents Supabase from sending its default email.

### B. Set Site URL

1. Go to **Authentication** → **URL Configuration**
2. Set **Site URL**: `https://cravvr.com`
3. Add **Redirect URLs**:
   ```
   https://cravvr.com/**
   http://localhost:5173/**
   ```

---

## Step 6: Update AuthContext to Call Edge Function

We need to modify the signup process to call our Edge Function.

In `src/components/auth/AuthContext.jsx`, update the `signUp` function:

```javascript
const signUp = async ({ email, password, name, role = 'customer' }) => {
  setError(null);
  try {
    // Sign up the user
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
          role,
        },
        emailRedirectTo: `${window.location.origin}/auth/confirm`,
      },
    });

    if (error) throw error;

    // If signup successful and we have a session, send custom confirmation email
    if (data.user && !data.session) {
      // User needs to confirm email
      // Generate confirmation URL
      const confirmationUrl = `${window.location.origin}/auth/confirm?token_hash=${data.user.confirmation_token}&type=email`;

      // Call Edge Function to send SendGrid email
      const { error: emailError } = await supabase.functions.invoke('send-confirmation-email', {
        body: {
          email: data.user.email,
          confirmationUrl: confirmationUrl,
        },
      });

      if (emailError) {
        console.error('Failed to send confirmation email:', emailError);
        // Don't throw - user is still created, they just won't get email
      }
    }

    return { data, error: null };
  } catch (err) {
    setError(err.message);
    return { data: null, error: err };
  }
};
```

---

## Alternative: Use Database Trigger (Advanced)

If you prefer automatic emails without modifying the signup code, you can use the SQL trigger in `supabase-sendgrid-confirmation-setup.sql`.

**Steps:**

1. Enable the pg_net extension in Supabase:
   ```sql
   CREATE EXTENSION IF NOT EXISTS pg_net;
   ```

2. Run the SQL in `supabase-sendgrid-confirmation-setup.sql`

3. Update the configuration settings

**Note:** This approach is more complex and requires configuring Supabase settings.

---

## Step 7: Test the Email Flow

1. **Sign up** as a new customer at https://cravvr.com
2. **Check your email** - you should receive the beautiful SendGrid template
3. **Click the confirmation link**
4. Should redirect to `/auth/confirm` page
5. Email should be verified successfully

---

## Troubleshooting

### Email not received

**Check SendGrid Activity:**
1. Go to SendGrid Dashboard → Activity
2. Look for your email
3. Check if it was delivered, bounced, or deferred

**Check Edge Function Logs:**
1. Go to Supabase Dashboard → Edge Functions
2. Click on **send-confirmation-email**
3. Go to **Logs** tab
4. Look for errors

**Verify Environment Variables:**
1. Make sure all 3 env vars are set correctly
2. Check that Template ID matches exactly

### Edge Function errors

**"Missing email or confirmationUrl"**
- The function isn't receiving the correct payload
- Check the `signUp` function is calling it correctly

**"SendGrid API error: 401"**
- Invalid SendGrid API key
- Double-check the SENDGRID_API_KEY env variable

**"SendGrid API error: 400"**
- Template ID is wrong or template is invalid
- Verify SENDGRID_CONFIRMATION_TEMPLATE_ID is correct

### Confirmation link not working

- Make sure `/auth/confirm` route exists in App.jsx ✅
- Check that Site URL is set correctly in Supabase
- Verify the token_hash is being passed correctly

---

## Files Created

1. `supabase/functions/send-confirmation-email/index.ts` - Edge Function
2. `supabase-sendgrid-confirmation-setup.sql` - Optional database trigger
3. This setup guide

---

## Next Steps

Once this is working:

1. Create additional SendGrid templates for:
   - Password reset emails
   - Order confirmations
   - Welcome emails
   - Promotional campaigns

2. Add template IDs for each email type

3. Create more Edge Functions for different email types

---

## Support

If you need help:
- Check Supabase Edge Function logs
- Check SendGrid Activity dashboard
- Review browser console for errors
- Test the Edge Function directly using curl

**Test Edge Function manually:**

```bash
curl -X POST https://YOUR_PROJECT_ID.supabase.co/functions/v1/send-confirmation-email \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","confirmationUrl":"https://cravvr.com/auth/confirm?token=test"}'
```
