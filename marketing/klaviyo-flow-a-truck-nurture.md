# Klaviyo Flow A — Truck Operator Nurture

Branded HTML sequence triggered when a truck operator submits the form
on `/for-trucks/*`. Goal: take a lead → 10-min call → live on the map.

**Target conversion: 50% of leads book a call within 7 days.**

---

## ✅ What's already done

| Done by automation | Status |
|---|---|
| `Submitted Truck Application` metric firing in Klaviyo | ✅ verified with E2E test |
| Profile properties populated (city, truck_name, cuisine, utm_source, utm_campaign) | ✅ |
| 4 branded HTML email templates created in your Klaviyo account | ✅ see IDs below |
| `Truck Operator Leads` list created (ID: `SFiX8y`) | ✅ |
| KLAVIYO_API_KEY set as Supabase secret | ✅ |

**Optional:** add `KLAVIYO_LEADS_LIST_ID=SFiX8y` as a Supabase secret + redeploy
`truck-lead` function. This auto-subscribes new leads to the list. The flow
trigger is on the **metric** (`Submitted Truck Application`), not list
membership — so this is purely for analytics/segmentation later.

**Templates in your Klaviyo account → Content → Email Templates:**

| Email | Klaviyo Template ID | Name |
|---|---|---|
| 1 | `XcKi8X` | Flow A · Email 1 · Confirmation (5 min) |
| 2 | `RcsAYT` | Flow A · Email 2 · Social proof (+1 day) |
| 3 | `SYSuvn` | Flow A · Email 3 · Quick question (+4 days) |
| 4 | `UMimZR` | Flow A · Email 4 · Break-up (+8 days) |

---

## 🎯 What you do in the Klaviyo UI (~5 min)

### Step 1: Create the flow
1. **Klaviyo → Flows → Create Flow → Create from scratch**
2. **Name**: `Truck Operator Nurture (Flow A)`
3. Click **Create Flow**

### Step 2: Set the trigger
1. **Trigger type**: Metric
2. **Metric**: `Submitted Truck Application` (will appear in the dropdown — we verified it's firing)
3. **Trigger filters**: leave empty
4. Click **Save**

### Step 3: Add flow filters (prevents spamming)
At the top of the flow editor, click **Flow Filters → Add filter**:

- **Filter 1**: `What someone has done (or not done) → has not Submitted Truck Application → since starting this flow → at least 1 time`
  *(Prevents same person re-entering)*
- **Filter 2**: `Properties about someone → email → is set`
  *(Skip leads who only gave phone — we have nothing to email)*

### Step 4: Drop in the 4 emails

For **each email below**, drag an **Email** action onto the canvas, then:

1. Click the email block → **Edit Email**
2. **Template**: choose from the template ID listed
3. **Subject** + **Preview text**: paste from the table below
4. **Sender name**: `Nolan from Cravvr` (or your name)
5. **Sender email**: your founder email (e.g. `nolan@cravvr.com`)
6. **Reply-to email**: same as sender
7. **Smart Sending**: leave ON (Klaviyo's default 16hr cooldown)
8. Save → **Set to LIVE** (toggle in top right of the email config)

Set the **time delay before each email** as specified.

| # | Time delay | Template ID | Subject | Preview |
|---|---|---|---|---|
| 1 | **5 minutes** after trigger | `XcKi8X` | `You're in, {{ first_name|default:"there" }} 🚚` | Here's what happens in the next 24 hours. |
| 2 | **1 day** after Email 1 | `RcsAYT` | `How {{ event.city|default:"your neighbor" }}'s first Cravvr truck books 30+ extra orders a weekend` | A short story about why being early matters. |
| 3 | **3 days** after Email 2 | `SYSuvn` | `Quick question, {{ first_name|default:"there" }}` | What's holding you back? |
| 4 | **4 days** after Email 3 | `UMimZR` | `Should I close your spot?` | I'll save it for someone else if you're not ready. |

### Step 5: Turn the flow LIVE

Top-right of the flow editor, toggle the **Status** from `Draft` → `Live`.

---

## ⚠️ Before going live — do these or you'll regret it

### 1. Verify sender domain is authenticated
Klaviyo → **Account → Settings → Domains and Hosting**
- Add `cravvr.com` (or whatever domain you send from)
- Add the DNS records they give you (TXT, CNAME) to your DNS provider
- Wait ~30 min, then **Verify**
- Without this, emails go to spam

### 2. Set up a dedicated sender profile
Klaviyo → **Account → Settings → Email → Sender Profiles**
- Create a profile with:
  - From name: `Nolan from Cravvr`
  - From email: `nolan@cravvr.com` (or whatever you control)
  - Company address: your physical address (CAN-SPAM required — can be a P.O. box)

### 3. Send yourself a test
For each email in the flow editor: **Preview & Send Test → enter your email → Send Test**
- Check it renders correctly on Gmail + Apple Mail (iPhone)
- Check the unsubscribe link works
- Check the CTA button goes to the right URL

### 4. Add manual exit conditions
The flow runs on auto-pilot. Add these so you can manually stop a lead's sequence:

In flow filters, add:
- `Properties about someone → onboarded → equals → true → exit flow`
- `Properties about someone → flow_a_stop → equals → true → exit flow`

Then when you onboard a lead (or they reply asking to stop), update the profile property in Klaviyo (or via the API from your admin tool — we can wire that later).

---

## 📊 Metrics to watch (Week 1+)

Klaviyo → **Flows → Truck Operator Nurture → Analytics tab**:

| Metric | Target | If below → action |
|---|---|---|
| Open rate (Email 1) | 70%+ | A/B test subject line |
| Open rate (Emails 2–4) | 50%+ | Sender reputation / subject lines |
| Click rate (Email 1) | 25%+ | CTA copy + button placement |
| Reply rate (Email 3) | 15%+ | Body copy A/B |
| Unsubscribe per email | <2% | Cadence too aggressive — extend delays |
| End-to-end booking rate | 50%+ | Full funnel review |

---

## 🔄 Updating templates later

The templates above were created via API. To edit:
- **Klaviyo → Content → Email Templates** → search "Flow A"
- Click any template → **Edit** (they were created in CODE editor mode for full HTML control — Klaviyo's drag-and-drop won't be available unless you re-create)

If you want drag-and-drop versions, just delete and recreate via the UI from scratch using the copy in this doc.

---

## What's next after Flow A goes live

- **Flow B** — Post-onboarding (welcome → first-week guide → NPS at day 7) — built once first truck onboards
- **AI features** to turn on after 50+ leads:
  - **Subject line assistant** — predicts open rate, gives 3 alternatives
  - **Brand voice** — train on these 4 emails so future generations match
  - **Predictive analytics** — kicks in around 500 profiles, segments leads by likelihood to convert
