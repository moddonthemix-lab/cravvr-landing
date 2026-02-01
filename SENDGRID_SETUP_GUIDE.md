# SendGrid Email Integration Setup Guide for Cravvr

This guide will walk you through setting up SendGrid email integration for Cravvr, including password reset, welcome emails, order confirmations, and more.

---

## 📋 Overview

**What SendGrid Will Handle:**
- ✅ Password reset emails
- ✅ Welcome/opt-in emails
- ✅ Order confirmations
- ✅ Order status updates (preparing, ready, completed)
- ✅ Truck approval notifications
- ✅ Any other important customer/truck communications

**Email Templates Created:**
1. `password-reset.html` - Password reset with branded styling
2. `welcome.html` - Welcome email for new users
3. `order-confirmation.html` - Order confirmation with items breakdown
4. `order-status-update.html` - Dynamic order status updates
5. `truck-approved.html` - Truck approval notification for owners

---

## 🚀 Step 1: SendGrid Account Setup

### 1.1 Create SendGrid Account
1. Go to [SendGrid.com](https://sendgrid.com)
2. Sign up for a free account (or use existing account)
3. Verify your email address

### 1.2 Domain Authentication (Highly Recommended)
1. In SendGrid dashboard, go to **Settings** → **Sender Authentication**
2. Click **Authenticate Your Domain**
3. Follow the wizard to add DNS records for `cravvr.com`
4. Add these DNS records to your domain provider:
   - CNAME record for email authentication
   - CNAME records for link tracking (optional)
5. Wait for verification (can take up to 48 hours)

### 1.3 Create API Key
1. Go to **Settings** → **API Keys**
2. Click **Create API Key**
3. Name it: `Cravvr Production`
4. Select **Full Access** (or **Restricted Access** with mail send permissions)
5. **Copy the API key immediately** - you won't be able to see it again!
6. Save it securely (you'll need it for Step 3)

### 1.4 Set Up Sender Identity
1. Go to **Settings** → **Sender Authentication**
2. Click **Single Sender Verification** (if domain auth isn't complete yet)
3. Add sender email: `noreply@cravvr.com`
4. Fill in the form with your details
5. Verify the email address

---

## 📧 Step 2: Upload Email Templates to SendGrid

### 2.1 Access Dynamic Templates
1. In SendGrid dashboard, go to **Email API** → **Dynamic Templates**
2. Click **Create Dynamic Template**

### 2.2 Create Each Template

**Password Reset Template:**
1. Click **Create Dynamic Template**
2. Name: `Cravvr - Password Reset`
3. Click **Add Version** → **Code Editor**
4. Copy the entire content from `/email-templates/password-reset.html`
5. Paste into the code editor
6. Click **Save**
7. **Copy the Template ID** (e.g., `d-xxxxxxxxxxxxxxxx`)

**Welcome Email Template:**
1. Create new template: `Cravvr - Welcome`
2. Add version, paste content from `/email-templates/welcome.html`
3. Save and copy Template ID

**Order Confirmation Template:**
1. Create new template: `Cravvr - Order Confirmation`
2. Add version, paste content from `/email-templates/order-confirmation.html`
3. Save and copy Template ID

**Order Status Update Template:**
1. Create new template: `Cravvr - Order Status Update`
2. Add version, paste content from `/email-templates/order-status-update.html`
3. Save and copy Template ID

**Truck Approved Template:**
1. Create new template: `Cravvr - Truck Approved`
2. Add version, paste content from `/email-templates/truck-approved.html`
3. Save and copy Template ID

### 2.3 Test Your Templates
1. Click **Send Test** in each template
2. Enter your email address
3. Add sample data for dynamic fields (see Template Variables section below)
4. Verify emails look correct

---

## 🔧 Step 3: Configure Environment Variables

### 3.1 Supabase Environment Variables

1. Go to your [Supabase Dashboard](https://app.supabase.com)
2. Select your Cravvr project
3. Go to **Settings** → **Edge Functions** → **Secrets**
4. Add the following environment variables:

```bash
# SendGrid Configuration
SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
SENDGRID_FROM_EMAIL=noreply@cravvr.com
SENDGRID_FROM_NAME=Cravvr

# SendGrid Template IDs (from Step 2.2)
SENDGRID_TEMPLATE_PASSWORD_RESET=d-xxxxxxxxxxxxxxxx
SENDGRID_TEMPLATE_WELCOME=d-xxxxxxxxxxxxxxxx
SENDGRID_TEMPLATE_ORDER_CONFIRMATION=d-xxxxxxxxxxxxxxxx
SENDGRID_TEMPLATE_ORDER_STATUS=d-xxxxxxxxxxxxxxxx
SENDGRID_TEMPLATE_TRUCK_APPROVED=d-xxxxxxxxxxxxxxxx

# App URLs for email links
APP_URL=https://cravvr.com
```

### 3.2 Local Development (.env.local)

Create a `.env.local` file in your project root:

```bash
# Supabase
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-anon-key

# SendGrid (for local testing - optional)
SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
SENDGRID_FROM_EMAIL=noreply@cravvr.com
```

---

## 🔐 Step 4: Configure Supabase Custom SMTP (Password Reset)

### Option A: Use SendGrid SMTP (Recommended)

1. Go to **Authentication** → **Email Templates** in Supabase
2. Scroll to **SMTP Settings**
3. Enable **Use custom SMTP server**
4. Fill in SendGrid SMTP settings:
   ```
   Host: smtp.sendgrid.net
   Port: 587
   Sender email: noreply@cravvr.com
   Sender name: Cravvr
   Username: apikey
   Password: [Your SendGrid API Key from Step 1.3]
   ```
5. Click **Save**

### Option B: Use SendGrid API via Edge Function (More Control)

If you want full control over password reset emails:

1. Go to **Authentication** → **Email Templates** → **Reset Password**
2. **Note:** You'll need to use SendGrid's API via the edge function instead
3. We'll handle this in Step 6 by creating a custom auth hook

---

## 🛠️ Step 5: Deploy Supabase Edge Functions

### 5.1 Install Supabase CLI

```bash
npm install -g supabase
```

### 5.2 Link to Your Project

```bash
# In your project root
supabase login
supabase link --project-ref your-project-ref
```

### 5.3 Deploy the Email Function

```bash
supabase functions deploy send-email
```

### 5.4 Verify Deployment

```bash
supabase functions list
```

You should see `send-email` in the list.

---

## 📝 Step 6: Update Authentication to Use SendGrid

### 6.1 Create Email Helper Service

Create `/src/services/email.js`:

```javascript
import { supabase } from '../lib/supabase'

const SUPABASE_FUNCTION_URL = import.meta.env.VITE_SUPABASE_URL
const SEND_EMAIL_FUNCTION = `${SUPABASE_FUNCTION_URL}/functions/v1/send-email`

// Template IDs from SendGrid
const TEMPLATES = {
  PASSWORD_RESET: 'd-xxxxxxxxxxxxxxxx', // Replace with your template ID
  WELCOME: 'd-xxxxxxxxxxxxxxxx',
  ORDER_CONFIRMATION: 'd-xxxxxxxxxxxxxxxx',
  ORDER_STATUS: 'd-xxxxxxxxxxxxxxxx',
  TRUCK_APPROVED: 'd-xxxxxxxxxxxxxxxx',
}

export const sendPasswordResetEmail = async (email, resetLink, userName) => {
  const { data: { session } } = await supabase.auth.getSession()

  const response = await fetch(SEND_EMAIL_FUNCTION, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session?.access_token || ''}`,
    },
    body: JSON.stringify({
      to: email,
      templateId: TEMPLATES.PASSWORD_RESET,
      dynamicData: {
        name: userName || 'User',
        resetLink: resetLink,
        year: new Date().getFullYear(),
      },
    }),
  })

  if (!response.ok) {
    throw new Error('Failed to send password reset email')
  }

  return response.json()
}

export const sendWelcomeEmail = async (email, userName) => {
  const { data: { session } } = await supabase.auth.getSession()

  const response = await fetch(SEND_EMAIL_FUNCTION, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session?.access_token || ''}`,
    },
    body: JSON.stringify({
      to: email,
      templateId: TEMPLATES.WELCOME,
      dynamicData: {
        name: userName,
        appLink: 'https://cravvr.com',
        helpLink: 'https://cravvr.com/help',
        year: new Date().getFullYear(),
      },
    }),
  })

  return response.json()
}

export const sendOrderConfirmationEmail = async (email, orderData) => {
  const { data: { session } } = await supabase.auth.getSession()

  const response = await fetch(SEND_EMAIL_FUNCTION, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session?.access_token || ''}`,
    },
    body: JSON.stringify({
      to: email,
      templateId: TEMPLATES.ORDER_CONFIRMATION,
      dynamicData: {
        customerName: orderData.customerName,
        truckName: orderData.truckName,
        orderNumber: orderData.orderNumber,
        orderTime: orderData.orderTime,
        estimatedTime: orderData.estimatedTime,
        items: orderData.items,
        total: orderData.total,
        trackOrderLink: `https://cravvr.com/orders/${orderData.orderId}`,
        year: new Date().getFullYear(),
      },
    }),
  })

  return response.json()
}

export const sendOrderStatusEmail = async (email, statusData) => {
  const { data: { session } } = await supabase.auth.getSession()

  const response = await fetch(SEND_EMAIL_FUNCTION, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session?.access_token || ''}`,
    },
    body: JSON.stringify({
      to: email,
      templateId: TEMPLATES.ORDER_STATUS,
      dynamicData: {
        customerName: statusData.customerName,
        statusTitle: statusData.statusTitle,
        statusMessage: statusData.statusMessage,
        status: statusData.status,
        orderNumber: statusData.orderNumber,
        truckName: statusData.truckName,
        estimatedTime: statusData.estimatedTime,
        estimatedTimeLabel: statusData.estimatedTimeLabel,
        trackOrderLink: `https://cravvr.com/orders/${statusData.orderId}`,
        year: new Date().getFullYear(),
      },
    }),
  })

  return response.json()
}

export const sendTruckApprovedEmail = async (email, truckData) => {
  const { data: { session } } = await supabase.auth.getSession()

  const response = await fetch(SEND_EMAIL_FUNCTION, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session?.access_token || ''}`,
    },
    body: JSON.stringify({
      to: email,
      templateId: TEMPLATES.TRUCK_APPROVED,
      dynamicData: {
        ownerName: truckData.ownerName,
        truckName: truckData.truckName,
        dashboardLink: 'https://cravvr.com/dashboard',
        ownerGuideLink: 'https://cravvr.com/owner-guide',
        year: new Date().getFullYear(),
      },
    }),
  })

  return response.json()
}
```

### 6.2 Update AuthContext to Send Welcome Emails

In `/src/components/auth/AuthContext.jsx`, update the `signUp` function:

```javascript
const signUp = async (email, password, name, role = 'customer') => {
  setError(null);
  setLoading(true);

  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name, role },
      },
    });

    if (error) throw error;

    // Send welcome email
    if (data.user) {
      import('../services/email').then(({ sendWelcomeEmail }) => {
        sendWelcomeEmail(email, name).catch(console.error);
      });
    }

    return { data, error: null };
  } catch (err) {
    setError(err.message);
    return { error: err };
  } finally {
    setLoading(false);
  }
};
```

---

## 📧 Template Variables Reference

### Password Reset Template
```javascript
{
  name: "John Doe",
  resetLink: "https://cravvr.com/reset-password?token=xxx",
  year: 2024
}
```

### Welcome Template
```javascript
{
  name: "John Doe",
  appLink: "https://cravvr.com",
  helpLink: "https://cravvr.com/help",
  year: 2024
}
```

### Order Confirmation Template
```javascript
{
  customerName: "John Doe",
  truckName: "Taco Truck",
  orderNumber: "ORD-12345",
  orderTime: "2:30 PM",
  estimatedTime: "15-20 minutes",
  items: [
    { quantity: 2, name: "Street Tacos", price: "12.00" },
    { quantity: 1, name: "Burrito", price: "10.00" }
  ],
  total: "22.00",
  trackOrderLink: "https://cravvr.com/orders/12345",
  year: 2024
}
```

### Order Status Update Template
```javascript
{
  customerName: "John Doe",
  statusTitle: "Your Order is Ready!",
  statusMessage: "Your order from Taco Truck is ready for pickup!",
  status: "Ready for Pickup",
  orderNumber: "ORD-12345",
  truckName: "Taco Truck",
  estimatedTime: "Now",
  estimatedTimeLabel: "Ready",
  trackOrderLink: "https://cravvr.com/orders/12345",
  year: 2024
}
```

### Truck Approved Template
```javascript
{
  ownerName: "Jane Smith",
  truckName: "Taco Truck",
  dashboardLink: "https://cravvr.com/dashboard",
  ownerGuideLink: "https://cravvr.com/owner-guide",
  year: 2024
}
```

---

## 🧪 Step 7: Testing Your Email Flow

### 7.1 Test Password Reset
1. Go to your app login page
2. Click "Forgot Password"
3. Enter your email
4. Check your inbox for the branded password reset email
5. Click the link and verify it works

### 7.2 Test Welcome Email
1. Create a new account
2. Check inbox for welcome email
3. Verify branding and links

### 7.3 Test Order Emails (When Order System is Built)
```javascript
import { sendOrderConfirmationEmail } from './services/email'

// After creating an order
await sendOrderConfirmationEmail(customerEmail, {
  customerName: customer.name,
  truckName: truck.name,
  orderNumber: order.id.slice(0, 8),
  orderTime: new Date().toLocaleTimeString(),
  estimatedTime: '15-20 minutes',
  items: order.items,
  total: order.total.toFixed(2),
  orderId: order.id,
})
```

---

## 📊 Step 8: Monitoring & Analytics

### 8.1 SendGrid Dashboard
1. Go to **Activity** in SendGrid dashboard
2. Monitor email deliveries, bounces, and opens
3. Check **Statistics** → **Email Activity** for detailed metrics

### 8.2 Email Deliverability Best Practices
- ✅ Always use authenticated domain
- ✅ Keep bounce rate < 5%
- ✅ Monitor spam complaints
- ✅ Use clear subject lines
- ✅ Include unsubscribe links (for marketing emails)
- ✅ Test emails before sending to large groups

---

## 🔒 Security Best Practices

1. **Never commit API keys** - Use environment variables only
2. **Restrict API key permissions** - Only grant what's needed
3. **Rotate API keys regularly** - Every 90 days
4. **Enable 2FA** on SendGrid account
5. **Monitor API usage** - Check for unusual activity
6. **Use HTTPS** for all email-related API calls

---

## 🚨 Troubleshooting

### Emails Not Sending
1. Check SendGrid API key is correct in Supabase secrets
2. Verify template IDs are correct in `/src/services/email.js`
3. Check Supabase Edge Function logs:
   ```bash
   supabase functions logs send-email
   ```
4. Verify sender email is authenticated

### Emails Going to Spam
1. Complete domain authentication in SendGrid
2. Add SPF, DKIM records to DNS
3. Use a professional from address
4. Avoid spam trigger words in subject/content

### Template Not Rendering
1. Check dynamic variables match template placeholders
2. Test template in SendGrid dashboard first
3. Verify JSON data structure

---

## 📞 Support

- **SendGrid Support**: [support.sendgrid.com](https://support.sendgrid.com)
- **SendGrid Docs**: [docs.sendgrid.com](https://docs.sendgrid.com)
- **Supabase Docs**: [supabase.com/docs](https://supabase.com/docs)

---

## ✅ Checklist

- [ ] SendGrid account created and verified
- [ ] Domain authenticated (DNS records added)
- [ ] API key created and saved
- [ ] All 5 email templates created in SendGrid
- [ ] Template IDs copied
- [ ] Environment variables set in Supabase
- [ ] Edge function deployed
- [ ] Email service created (`/src/services/email.js`)
- [ ] Welcome email integrated in signup
- [ ] Password reset tested
- [ ] Welcome email tested
- [ ] All emails display correctly on mobile and desktop

---

That's it! Your SendGrid integration is complete. All emails will now use your branded templates and be delivered reliably through SendGrid. 🎉
