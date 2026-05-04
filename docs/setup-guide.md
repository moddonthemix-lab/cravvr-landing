# CravvR Database Setup Guide

## 🎯 Quick Setup (30 Minutes)

### Step 1: Create Supabase Account (5 min)

1. Go to **https://supabase.com**
2. Click "Start your project"
3. Sign in with GitHub
4. Click "New Project"
5. Fill in:
   - **Name:** `cravvr-production`
   - **Database Password:** Create a strong password (save it!)
   - **Region:** US West (closest to your users)
6. Click "Create new project"
7. Wait 2-3 minutes for project to initialize

### Step 2: Get Your API Credentials (2 min)

1. In your Supabase dashboard, click "Settings" (gear icon)
2. Click "API" in the sidebar
3. Copy these two values:
   - **Project URL** (looks like: `https://xxxxx.supabase.co`)
   - **anon public** key (under "Project API keys")

### Step 3: Configure Your App (3 min)

1. Open `/home/user/cravvr-landing/src/lib/supabase.js`
2. Replace `YOUR_SUPABASE_PROJECT_URL` with your Project URL
3. Replace `YOUR_SUPABASE_ANON_KEY` with your anon key
4. Save the file

### Step 4: Create Database Schema (10 min)

1. In Supabase dashboard, click "SQL Editor" in the sidebar
2. Click "New query"
3. Open `/home/user/cravvr-landing/supabase-schema.sql`
4. Copy the entire contents
5. Paste into Supabase SQL Editor
6. Click "Run" button
7. You should see: "Success. No rows returned"
8. Click "Table Editor" to verify tables were created

### Step 5: Add Supabase to Your HTML (5 min)

1. Open `/home/user/cravvr-landing/index.html`
2. Add this line in the `<head>` section BEFORE your other scripts:

```html
<!-- Add this line -->
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>

<!-- Add this line after React/Babel -->
<script src="src/lib/supabase.js"></script>
```

### Step 6: Test Connection (5 min)

1. Open your browser console (F12)
2. Open `index.html` in browser
3. In console, type:
```javascript
window.supabaseClient.from('food_trucks').select('*').then(console.log)
```
4. You should see: `{ data: [], error: null }` (empty array is success!)

---

## ✅ You're Ready!

Your database is now set up. Next steps:

1. **Add seed data** - Insert your current food trucks into the database
2. **Update login views** - Connect signup/login to Supabase Auth
3. **Replace mock data** - Swap `mockTrucks` with real database queries

---

## 🆘 Troubleshooting

**"Invalid API key" error:**
- Double-check you copied the **anon** key (not the service_role key)
- Make sure there are no extra spaces in the key

**"Failed to fetch" error:**
- Check your Project URL is correct
- Make sure you have internet connection
- Verify Supabase project is active (not paused)

**Tables not showing up:**
- Make sure entire SQL script ran successfully
- Check for error messages in SQL Editor
- Try running script in smaller chunks if needed

**Authentication not working:**
- In Supabase dashboard, go to Authentication → Providers
- Make sure "Email" is enabled
- Check "Confirm email" setting (disable for testing)

---

## 📚 Next: Migrate Your Data

Once setup is complete, let me know and I'll help you:
1. Insert your current food trucks into the database
2. Create test user accounts
3. Update your app to fetch from Supabase instead of mock data

Just say "Database is set up, what's next?" and I'll guide you!
