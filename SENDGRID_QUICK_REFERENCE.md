# SendGrid Quick Reference for Cravvr

## 🚀 Quick Start Checklist

### Your Todo List:
1. **Create SendGrid Account** → Get API Key
2. **Set Up Domain** → Add DNS records for cravvr.com
3. **Upload 5 Email Templates** → Copy Template IDs
4. **Configure Supabase** → Add environment variables
5. **Update Template IDs** → In `/src/services/email.js`
6. **Deploy Edge Function** → `supabase functions deploy send-email`
7. **Test Emails** → Try password reset and welcome email

---

## 📧 SendGrid Template IDs You Need

After creating templates in SendGrid, update these in `/src/services/email.js`:

```javascript
const TEMPLATES = {
  PASSWORD_RESET: 'd-xxxxxxxxxxxxxxxx',  // ← Copy from SendGrid
  WELCOME: 'd-xxxxxxxxxxxxxxxx',          // ← Copy from SendGrid
  ORDER_CONFIRMATION: 'd-xxxxxxxxxxxxxxxx', // ← Copy from SendGrid
  ORDER_STATUS: 'd-xxxxxxxxxxxxxxxx',     // ← Copy from SendGrid
  TRUCK_APPROVED: 'd-xxxxxxxxxxxxxxxx',   // ← Copy from SendGrid
}
```

---

## 🔑 Environment Variables for Supabase

Add these in **Supabase Dashboard → Settings → Edge Functions → Secrets**:

```bash
SENDGRID_API_KEY=SG.your-api-key-here
SENDGRID_FROM_EMAIL=noreply@cravvr.com
SENDGRID_FROM_NAME=Cravvr

# App URL
APP_URL=https://cravvr.com
```

---

## 🛠️ How to Use in Code

### Send Password Reset Email
```javascript
import { sendPasswordResetEmail } from '../services/email'

const resetLink = `https://cravvr.com/reset-password?token=${token}`
await sendPasswordResetEmail(userEmail, resetLink, userName)
```

### Send Welcome Email (After Signup)
```javascript
import { sendWelcomeEmail } from '../services/email'

await sendWelcomeEmail(newUser.email, newUser.name)
```

### Send Order Confirmation
```javascript
import { sendOrderConfirmationEmail } from '../services/email'

await sendOrderConfirmationEmail(customer.email, {
  customerName: customer.name,
  truckName: truck.name,
  orderNumber: order.id.slice(0, 8),
  orderTime: new Date().toLocaleTimeString(),
  estimatedTime: '15-20 minutes',
  items: [
    { quantity: 2, name: 'Street Tacos', price: 12.00 },
    { quantity: 1, name: 'Burrito', price: 10.00 }
  ],
  total: 22.00,
  orderId: order.id,
})
```

### Send Order Status Update
```javascript
import { sendOrderStatusEmail, getStatusEmailData } from '../services/email'

const statusData = getStatusEmailData('ready') // or 'confirmed', 'preparing', etc.

await sendOrderStatusEmail(customer.email, {
  customerName: customer.name,
  orderNumber: order.id.slice(0, 8),
  truckName: truck.name,
  orderId: order.id,
  ...statusData, // Includes statusTitle, statusMessage, status
})
```

### Send Truck Approved Email
```javascript
import { sendTruckApprovedEmail } from '../services/email'

await sendTruckApprovedEmail(owner.email, {
  ownerName: owner.name,
  truckName: truck.name,
})
```

---

## 🎨 Email Template Files

All templates are in `/email-templates/`:
- `password-reset.html`
- `welcome.html`
- `order-confirmation.html`
- `order-status-update.html`
- `truck-approved.html`

**To upload to SendGrid:**
1. Copy entire HTML from template file
2. Go to SendGrid → Email API → Dynamic Templates
3. Create template → Add Version → Code Editor
4. Paste HTML → Save
5. Copy Template ID → Update in `/src/services/email.js`

---

## 🔍 Testing Your Emails

### Test in SendGrid Dashboard
1. Go to your template in SendGrid
2. Click "Send Test"
3. Add sample data:
   ```json
   {
     "name": "John Doe",
     "resetLink": "https://cravvr.com/reset-password?token=test"
   }
   ```
4. Enter your email and send

### Test in Your App
```javascript
// Password Reset Test
await sendPasswordResetEmail(
  'your-email@example.com',
  'https://cravvr.com/reset-password?token=test',
  'Test User'
)

// Welcome Email Test
await sendWelcomeEmail('your-email@example.com', 'Test User')
```

---

## 📊 Monitor Email Delivery

### SendGrid Dashboard
- **Activity** → See all sent emails
- **Statistics** → Email Activity → Delivery rates, opens, clicks
- **Suppressions** → View bounces and spam reports

### Supabase Edge Function Logs
```bash
supabase functions logs send-email --follow
```

---

## ⚠️ Common Issues

| Issue | Solution |
|-------|----------|
| Emails not sending | Check API key in Supabase secrets |
| Emails in spam | Complete domain authentication in SendGrid |
| Template not rendering | Verify Template ID and dynamic data match |
| 401 Unauthorized | Check Edge Function is deployed and session is valid |

---

## 🔗 Important Links

- **SendGrid Dashboard**: https://app.sendgrid.com
- **Supabase Dashboard**: https://app.supabase.com
- **Full Setup Guide**: `/SENDGRID_SETUP_GUIDE.md`
- **Email Service Code**: `/src/services/email.js`

---

## 📞 Need Help?

1. Check the full setup guide: `SENDGRID_SETUP_GUIDE.md`
2. Review SendGrid docs: https://docs.sendgrid.com
3. Check Supabase docs: https://supabase.com/docs/guides/functions
