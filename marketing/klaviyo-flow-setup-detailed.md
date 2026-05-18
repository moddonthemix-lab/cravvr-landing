# Klaviyo Flow Setup — Front to Back (Detailed)

Step-by-step build for each of the 4 Cravvr flows using exact text you'll
see on Klaviyo's screens in 2026. Open Klaviyo in one window, this in
another. Total time: ~45 min for all 4 flows.

**You only need to learn the universal pattern once (Flow A).** Flows B, C,
D reuse the exact same UI flow — only the trigger, filters, templates,
delays, and sender differ.

---

## 0. Pre-flight (do once before any flow)

### 0.1 Confirm sender domain is authenticated
1. Left sidebar → click your **account name** (top-left initials chip)
2. Click **Account**
3. Left rail → **Settings → Domains and Hosting**
4. You should see `cravvr.com` with a green **Authenticated** badge
   - ❌ If it shows "Pending verification" → click **Verify** → wait 5 min → retry
   - ❌ If it shows "Failed" → re-check the DNS records you added

### 0.2 Create operator sender profile
1. Same Settings area → **Email → Sender Profiles**
2. Top right → **Create Sender Profile**
3. Fill exactly:
   - **From Name**: `Modd from Cravvr`
   - **From Email**: `nolan@cravvr.com` (or your actual founder email on cravvr.com)
   - **Reply-To Email**: (leave blank — defaults to From)
   - **Company Name**: `Cravvr`
   - **Street Address**, **City**, **State**, **ZIP**: your physical or P.O. box (CAN-SPAM legally requires this)
4. Click **Save**

### 0.3 Create eater sender profile
Repeat 0.2 with:
   - **From Name**: `Cravvr`
   - **From Email**: `hello@cravvr.com`

### 0.4 Turn on UTM tracking (one-time)
1. Settings → **UTM Tracking**
2. Toggle ON: **Add UTM tracking to all email and SMS links**
3. UTM defaults (paste exactly):
   - `utm_source` = `klaviyo`
   - `utm_medium` = `email`
   - `utm_campaign` = `{{ flow.name|default:'manual' }}`
   - `utm_content` = `{{ message.subject|default:'' }}`
4. **Save**

---

## 1. Flow A — Truck Operator Nurture

**Trigger is already firing in your code.** Templates already in your account.
You're just assembling the flow shell + dropping templates in.

### 1.1 Create the flow

1. Left sidebar → **Flows**
2. Top right → blue button **Create Flow**
3. You see two cards: **Start from a template** and **Create from scratch**
4. Click **Create from scratch**
5. Modal appears: **Name your flow**
   - **Flow Name**: type `Truck Operator Nurture (Flow A)`
   - **Tags**: skip (or type `operator` if you like organizing)
   - Click **Create Flow**

You land on the **flow editor canvas**. You'll see:
- A vertical lane down the middle
- A placeholder **Trigger** block at top labeled "When someone..."
- Status badge top-right (says **Draft** initially)

### 1.2 Configure the trigger

1. Click the **Trigger** block
2. Right panel slides in titled **"Trigger setup"** or **"When does this flow start?"**
3. Three card options appear:
   - **Metric** (a person does something)
   - **List** (joins a list)
   - **Date Property** (a date occurs)
4. Click **Metric**
5. Below it, dropdown labeled **"Choose metric..."**
6. Click the dropdown → start typing `Submitted Truck Application`
7. The option appears with a 🛠️ (API metric) icon → click it
8. **Trigger Filters** section appears below — leave **empty** for now
9. Click **Save** (top right of panel)

The trigger block now reads: **"Submitted Truck Application"** with the date "First trigger" below.

### 1.3 Add Profile Filters

1. In the canvas, look at the **left rail** of the flow editor (separate from the right panel)
2. Find the section labeled **Flow filters** or **Profile filters** → click it
   - If you don't see it, click the **gear icon** ⚙️ on the Trigger block → **Profile filters**
3. Right panel: **"Profile filters — Edit profile filters"**
4. You see the description: *"Limit the flow to trigger only when specific profile conditions are met."*

**Add Filter #1:**
1. Click **+ Add Filter** (or it may show an empty filter row already)
2. Top dropdown opens — pick **Properties about someone** (NOT "What someone has done")
3. New fields appear:
   - **Property**: type `email` → it autocompletes
   - **Condition** dropdown: pick **Is set**
   - (No value field needed for "is set")
4. Click **Save Filter**

**Add Filter #2:**
1. Click **+ AND** (button below your saved filter)
2. Top dropdown: **Properties about someone**
3. **Property**: type `onboarded` (this property doesn't exist yet on any profile — that's fine, just type it)
4. **Condition**: **Is not equal to**
5. **Value**: `true`
6. **Save Filter**

### 1.4 Add the 4 emails

Back on the canvas. Below the Trigger block, you'll see a faint **+** circle. Click it.

**Block picker** appears with these tiles:
- **Email**
- **SMS**
- **Push Notification**
- **Time Delay**
- **Conditional Split**
- **Trigger Split**
- **Update Profile Property**
- **Webhook**

#### Email 1 — Confirmation

1. Click **Time Delay** (we want a 5-min delay BEFORE Email 1)
2. Right panel: **Time Delay**
3. **Type of delay** dropdown: pick **Wait a specific period of time**
4. **Amount**: type `5`
5. **Unit**: dropdown → pick **Minutes**
6. **Adjust send time**: leave OFF
7. **Save**

8. Click **+** below the 5-min delay
9. Block picker → click **Email**
10. The email block is created and the right panel shows **Configure email**

11. **Email name** (internal label): `A1 - Confirmation`
12. **Subject line**: paste exactly:
    ```
    You're in, {{ first_name|default:"there" }} 🚚
    ```
13. **Preview text**: paste exactly:
    ```
    Here's what happens in the next 24 hours.
    ```
14. **From label** (sender profile dropdown): pick **Modd from Cravvr**
15. **From email**: auto-fills to `nolan@cravvr.com`
16. **Reply-to email**: leave blank
17. **Smart Sending**: toggle ON (default)
18. **UTM tracking**: should already be ON from your account-level setting

19. Click **Email content** section → **Use Saved Template**
20. Search: `Flow A · Email 1 · Confirmation (5 min)`
21. Click the template → **Continue** or **Select Template**
22. The template loads in the editor preview
23. Top-right corner of the email config → click **Save**

**Test it now (do not skip):**
24. Top-right of email block → click **Preview & Send Test**
25. Modal opens → type **your own email address**
26. Click **Send Test Email**
27. Open the test in Gmail web → verify logo loads, layout intact
28. Open in Gmail on your phone → verify it's not collapsed
29. Click the CTA button → confirms it goes to the right URL

#### Email 2 — Social Proof

1. Back on canvas → click **+** below Email 1
2. **Time Delay** → **Wait a specific period of time** → `1` Days → Save
3. Click **+** below the delay → **Email**
4. **Email name**: `A2 - Social Proof`
5. **Subject line**:
   ```
   How {{ event.city|default:"your neighbor" }}'s first Cravvr truck books 30+ extra orders a weekend
   ```
6. **Preview text**:
   ```
   A short story about why being early matters.
   ```
7. **Sender**: Modd from Cravvr
8. **Use Saved Template** → `Flow A · Email 2 · Social proof (+1 day)`
9. **Save**

#### Email 3 — Quick Question

1. **+** → **Time Delay** → `3` Days → Save
2. **+** → **Email**
3. **Email name**: `A3 - Quick Question`
4. **Subject line**:
   ```
   Quick question, {{ first_name|default:"there" }}
   ```
5. **Preview text**:
   ```
   What's holding you back?
   ```
6. **Sender**: Modd from Cravvr
7. **Use Saved Template** → `Flow A · Email 3 · Quick question (+4 days)`
8. **Save**

#### Email 4 — Break-up

1. **+** → **Time Delay** → `4` Days → Save
2. **+** → **Email**
3. **Email name**: `A4 - Break-up`
4. **Subject line**:
   ```
   Should I close your spot?
   ```
5. **Preview text**:
   ```
   I'll save it for someone else if you're not ready.
   ```
6. **Sender**: Modd from Cravvr
7. **Use Saved Template** → `Flow A · Email 4 · Break-up (+8 days)`
8. **Save**

### 1.5 Verify canvas layout

Your canvas should read top-to-bottom:

```
Trigger: Submitted Truck Application
   ↓
Time Delay: 5 minutes
   ↓
Email: A1 - Confirmation
   ↓
Time Delay: 1 day
   ↓
Email: A2 - Social Proof
   ↓
Time Delay: 3 days
   ↓
Email: A3 - Quick Question
   ↓
Time Delay: 4 days
   ↓
Email: A4 - Break-up
```

### 1.6 Set flow LIVE

1. Top-right of editor → **Status** badge currently reads **Draft**
2. Click it
3. Options appear: **Draft**, **Manual**, **Live**
4. Click **Live**
5. Confirmation modal: *"Are you sure you want to set this flow live?"*
6. Click **Yes, set live**

✅ Status badge now shows **Live** (green).

### 1.7 End-to-end test (5 min)

1. Open a **new incognito window**
2. Visit `https://www.cravvr.com/for-trucks/portland`
3. Fill out the form with:
   - Name: `Live Test`
   - Truck name: `DELETE LIVE TEST`
   - Phone: `5555550100`
   - **Email: a personal address you can check** (e.g., yourname+test@gmail.com)
   - Cuisine: any
4. Submit
5. Wait 5 min → check inbox → Email 1 should arrive

Verify in Klaviyo:
- **Flows → Truck Operator Nurture (Flow A) → Analytics** tab → "1 person entered, 1 email sent"
- **Profiles → search your test email** → profile exists with timeline showing entry

**Cleanup after:**
- Klaviyo → profile → ⋯ → **Delete profile** (also exits the flow)
- Supabase SQL editor → `DELETE FROM truck_leads WHERE truck_name = 'DELETE LIVE TEST';`

---

## 2. Flow B — Operator Post-Onboarding

**🟡 Status:** Templates ready. Trigger (`Truck Activated` event) **not yet wired in code**.
You can build the flow now and it'll sit idle until I wire the trigger.

Same UI pattern as Flow A. Only deltas listed below.

### 2.1 Create the flow shell
- **Flow Name**: `Truck Operator Post-Onboarding (Flow B)`
- Otherwise: Phase 1.1 identical

### 2.2 Trigger
- **Metric**: type `Truck Activated`
- ⚠️ This metric won't exist yet — Klaviyo lets you "Create new metric" inline at the bottom of the dropdown. Click **+ Create "Truck Activated"** to add it.
- **Trigger Filters**: empty
- Save

### 2.3 Profile Filters
| # | Top dropdown | Property | Condition | Value |
|---|---|---|---|---|
| 1 | Properties about someone | `email` | Is set | — |
| 2 | Properties about someone | `flow_b_stop` | Is not equal to | `true` |

### 2.4 Sequence (5 emails)

| # | Delay | Template ID + Name | Subject | Preview |
|---|---|---|---|---|
| 1 | **Immediate** (no delay before) | `RXc7GK` Flow B · Email 1 · Welcome live | `🎉 You're live, {{ event.truck_name\|default:"friend" }}` | `Your truck is live. Here's your starter pack.` |
| 2 | 1 day | `Vy3SHH` Flow B · Email 2 · First 10 | `Get your first 10 customers this weekend` | `Five quick moves that compound.` |
| 3 | 3 days | `Rkb568` Flow B · Email 3 · The city is hungry | `12,400 hungry locals just opened Cravvr` | `What happened in your city last week.` |
| 4 | 7 days | `UV2Q76` Flow B · Email 4 · Week 1 check-in | `Week 1: how'd it go?` | `Rate the experience so far.` |
| 5 | 14 days | `WHsHBz` Flow B · Email 5 · Top truck moves | `Two things our top trucks do differently` | `Patterns from your highest earners.` |

**Sender for all 5**: `Modd from Cravvr`

### 2.5 Set Live
Same as 1.6. **It will not fire** until I wire the `Truck Activated` event.

---

## 3. Flow C — Eater Welcome & First Order

**🟡 Status:** Templates ready. Trigger **not yet wired in code** (Clerk webhook → Klaviyo).

### 3.1 Create the flow shell
- **Flow Name**: `Eater Welcome & First Order (Flow C)`

### 3.2 Trigger — pick ONE of two options

**Option A — Klaviyo List trigger (recommended, simpler):**
1. First, create the list:
   - Left sidebar → **Lists & Segments**
   - Top right → **Create List / Segment** → **List**
   - Name: `Eaters - All Customers`
   - **Default opt-in process**: pick **Single Opt-In**
   - Save
   - Note the list ID (6 chars from URL after `/lists/`)

2. In flow editor → Trigger block
3. Pick **List** card
4. Dropdown: pick `Eaters - All Customers`
5. Save

**Option B — Metric trigger:**
1. Trigger block → **Metric**
2. **Choose metric**: type `Created Account` → if missing, **+ Create**
3. Save

Pick A unless you specifically want metric flexibility later.

### 3.3 Profile Filters
| # | Top dropdown | Property | Condition | Value |
|---|---|---|---|---|
| 1 | Properties about someone | `email` | Is set | — |
| 2 | What someone has done (or not done) | `Placed Order` | Hasn't been done | At least 1 time |

**Filter #2 is critical** — anyone who orders mid-flow exits immediately (no more first-order-nudge emails).

To add filter #2:
1. **+ AND**
2. Top dropdown: **What someone has done (or not done)**
3. "Person has" → dropdown shows metrics → pick **Placed Order** (this is a Klaviyo standard metric — should be there even if no events fired yet)
4. Action toggle: **HASN'T**
5. Frequency: **at least 1 time** (default)
6. Save

### 3.4 Sequence (4 emails)

| # | Delay | Template ID + Name | Subject | Preview |
|---|---|---|---|---|
| 1 | 5 min | `SvzTXY` Flow C · Email 1 · Eater welcome | `Welcome to Cravvr, {{ first_name\|default:"there" }}` | `Find & order from the best trucks near you.` |
| 2 | 1 day | `UhZMut` Flow C · Email 2 · Taste your city | `Taste your city, {{ first_name\|default:"there" }}` | `Three trucks to try right now.` |
| 3 | 3 days | `XSRyvr` Flow C · Email 3 · First order nudge | `Ready to order? Three reasons why.` | `Why Cravvr is different.` |
| 4 | 7 days | `VtqCnj` Flow C · Email 4 · Favorites prompt | `Favorite a few trucks — get the inside track` | `Get notified when your truck rolls by.` |

**Sender for all 4**: `Cravvr` (not Modd — brand voice, not founder voice)

### 3.5 Set Live
Same as 1.6.

---

## 4. Flow D — Eater Win-Back

**🟡 Status:** Templates ready. Trigger requires `Placed Order` events in Klaviyo (currently not wired). **Also requires disabling the existing Resend-based win-back to avoid double-sending.**

Build later when you're ready — for completeness, here's the spec.

### 4.1 Create the flow shell
- **Flow Name**: `Eater Win-Back 60d (Flow D)`

### 4.2 Trigger

**Pick Date-based trigger:**
1. Trigger block → **Date Property** card
2. **Profile property**: type `last_ordered_at` (won't exist yet — comes from your future Placed Order wiring)
3. **Trigger timing**: **After date**
4. **Days after**: `60`
5. Save

### 4.3 Profile Filters
| # | Top dropdown | Property | Condition | Value |
|---|---|---|---|---|
| 1 | Properties about someone | `email` | Is set | — |
| 2 | If someone can or cannot receive marketing | (email channel) | Can receive marketing | — |
| 3 | What someone has done (or not done) | `Placed Order` | Hasn't been done | In the last 60 days |

### 4.4 Sequence (3 emails)

| # | Delay | Template ID + Name | Subject | Preview |
|---|---|---|---|---|
| 1 | Immediate (when trigger fires at 60d) | `RfxNJJ` Flow D · Email 1 · We miss you | `We miss you, {{ first_name\|default:"friend" }}` | `New trucks, same 0% commission.` |
| 2 | 2 days | `T3XGfd` Flow D · Email 2 · New trucks | `These trucks joined while you were away` | `New in your city since you've been gone.` |
| 3 | 4 days | `UQpzKG` Flow D · Email 3 · Last call | `Last call` | `We won't bug you anymore unless you say so.` |

**Sender**: `Cravvr`

### 4.5 IMPORTANT — disable Resend win-back
Before flipping Live, edit `supabase/functions/lifecycle-email-runner/index.ts`:

```ts
// Remove win_back from this map or comment it out:
const TEMPLATES = {
  abandoned_cart: 'abandoned-cart',
  first_reorder: 'first-reorder-nudge',
  // win_back: 'win-back',   // ← disabled, now in Klaviyo Flow D
} as const;
```

Then redeploy: `supabase functions deploy lifecycle-email-runner`

Otherwise dormant customers get TWO win-back emails per day for 3 days. Bad look.

### 4.6 Set Live
Only after the wiring is in place.

---

## 5. Universal patterns you'll hit on every flow

### 5.1 The block picker (+) tile reference
After clicking the **+** between any two blocks:

| Tile | Use when |
|---|---|
| **Email** | Sending an email — most common |
| **SMS** | If you've enabled SMS sending |
| **Time Delay** | Wait between blocks |
| **Conditional Split** | "If X then this email, else that email" |
| **Trigger Split** | Different paths based on trigger properties |
| **Update Profile Property** | Set `onboarded=true` programmatically |
| **Webhook** | Call your own endpoint |

For all 4 flows above you only need **Email** and **Time Delay**.

### 5.2 Sender profile dropdown gotcha
If the **From label** dropdown is empty when configuring an email:
- Your sender profile from §0.2 / §0.3 wasn't saved → revisit
- Or your domain isn't authenticated → can't use that From email yet

### 5.3 The 3 status states
Top-right badge in flow editor:

| Status | What happens |
|---|---|
| **Draft** | Nothing sends. No one enters the flow. |
| **Manual** | Triggers are tracked but messages held — useful for review |
| **Live** | Everything runs. |
| **Filtered out** | Showing only filtered users in analytics view — not a real status |

### 5.4 Smart Sending
Toggle on every email. Default ON. Skips anyone who got an email from you in the last 16 hours. Leave it on unless you have a transactional-style use case.

### 5.5 Test send vs. live send
**Preview & Send Test** ignores Profile Filters. So even if your test profile would fail filters in production, the test still arrives. Don't rely on test sends to validate filter logic — use the live end-to-end test in §1.7.

---

## 6. Quick recovery: things going wrong

| What you see | What it means | Fix |
|---|---|---|
| Trigger metric dropdown empty | Metric hasn't fired yet in your account | Submit a test lead → wait 30 sec → refresh |
| "Save" greyed out on filter | Required field empty (usually Value when condition needs it) | Fill all fields |
| Email block shows "No template" | Forgot to pick a Saved Template | Click email → Email content → Use Saved Template |
| Live test never arrives | Sender profile not set OR Smart Sending blocked (you got an email in the last 16h) | Check both |
| Test arrives but missing logo | Email client blocked external images | Whitelist sender on recipient side; in production, Klaviyo's image hosting handles this |
| All emails sent at once (no delays) | Time Delay blocks missing between emails | Add them — Klaviyo doesn't auto-space sends |
| Person re-enters flow on every trigger | Trigger Filter missing "Once per profile" setting | At trigger config, check the "Re-entry" option — set to "Once per profile" if you only want each lead through once |

---

## 7. After all 4 are Live

Bookmark these for daily/weekly review:

### Daily (2 min)
- **Flows → each flow → Analytics tab** → glance at open rate trend

### Weekly (10 min)
- For each flow:
  - **Open rate** target: 50%+ across all emails
  - **Click rate** target: 15%+ on emails with a CTA button
  - **Unsubscribe rate** target: <2% per email
  - If any email is dragging open rate: use Klaviyo's **Subject Line Assistant** (AI sparkles button) for 3 alternatives → A/B test

### Monthly (30 min)
- Review **Profiles → Segments**:
  - Build segment: "Flow A entrants past 30 days"
  - Build segment: "Flow A entrants who did NOT book a call"
  - This becomes your remarketing audience for Meta

---

## 8. What gets wired vs not

| Flow | Live now? | What I need to do next |
|---|---|---|
| **A** | ✅ Yes (after you assemble) | Nothing |
| **B** | ❌ Templates ready, trigger event not firing | Wire `Truck Activated` event when admin marks a lead onboarded — ~30 min code |
| **C** | ❌ Templates ready, signup→Klaviyo not wired | Wire Clerk webhook → Klaviyo profile upsert + list subscribe — ~30 min code |
| **D** | ❌ Templates ready, depends on Placed Order events + Resend disable | Wire Stripe/Square webhooks → Klaviyo `Placed Order` event + disable Resend win-back — ~60 min code |

**Recommended order:**
1. Today: assemble Flow A in UI → ship the operator nurture
2. This week: tell me to wire Flow C (cheapest wiring) so eater signups get the welcome flow
3. When first truck onboards: tell me to wire Flow B
4. After ~100 orders: tell me to wire Flow D + disable Resend

Tell me which to wire when you're ready.
