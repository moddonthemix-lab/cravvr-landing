# Cravvr — Master Klaviyo Flows Guide

Everything needed to build, launch, and operate the 4 marketing flows that
sit on top of Cravvr's two-sided marketplace. All templates already exist
in your Klaviyo account — this doc is the complete UI assembly + wiring
playbook.

---

## The flow lineup

| Flow | Side | Trigger | Emails | Goal |
|---|---|---|---|---|
| **A — Truck Operator Nurture** | Operator | `Submitted Truck Application` event | 4 | Lead → onboarding call |
| **B — Operator Post-Onboarding** | Operator | `Truck Activated` event | 5 | New truck → first 10 orders |
| **C — Eater Welcome & First Order** | Eater | `Created Account` event *(or list subscribe)* | 4 | Signup → first order |
| **D — Eater Win-Back** | Eater | Date filter (60+ days since `Placed Order`) | 3 | Dormant → reactivation |

---

## Universal setup (do once)

### 1. Sender domain authenticated
Account → Settings → Domains and Hosting → `cravvr.com` shows **Authenticated** ✅

### 2. Sender profile created
Account → Settings → Email → Sender Profiles
- For operator flows (A, B): `Modd from Cravvr <nolan@cravvr.com>`
- For eater flows (C, D): `Cravvr <hello@cravvr.com>` (more brand-y)

### 3. Account-level UTM tracking
Account → Settings → UTM Tracking → ✅ Enable
- `utm_source` = `klaviyo`
- `utm_medium` = `email`
- `utm_campaign` = `{{ flow.name|default:'manual' }}`
- `utm_content` = `{{ message.subject|default:'' }}`

### 4. Brand voice (one-time, after first 5 templates exist)
Account → Brand Library → Brand Voice → Train with these 5 emails:
- Flow A · Email 1 · Confirmation
- Flow A · Email 3 · Quick question
- Flow B · Email 2 · First 10 customers
- Flow C · Email 1 · Welcome
- Flow D · Email 3 · Last call

Now AI-generated future content matches founder voice.

---

# Flow A — Truck Operator Nurture

**Status: templates ✅ · trigger ✅ · flow assembly pending in UI**

## Trigger setup
- **Trigger type**: Metric → **Does something**
- **Metric**: `Submitted Truck Application`
- **Trigger Filters**: none

## Profile Filters
| # | Top dropdown | Property | Condition | Value |
|---|---|---|---|---|
| 1 | Properties about someone | `email` | is set | — |
| 2 | Properties about someone | `onboarded` | is not equal to | `true` |
| 3 | (optional) Properties about someone | `flow_a_stop` | is not equal to | `true` |

## Sequence
| # | Delay before | Template ID | Subject |
|---|---|---|---|
| 1 | 5 min | `XcKi8X` | `You're in, {{ first_name\|default:"there" }} 🚚` |
| 2 | 1 day | `RcsAYT` | `How {{ event.city\|default:"your neighbor" }}'s first Cravvr truck books 30+ extra orders a weekend` |
| 3 | 3 days | `SYSuvn` | `Quick question, {{ first_name\|default:"there" }}` |
| 4 | 4 days | `UMimZR` | `Should I close your spot?` |

## Sender
**Modd from Cravvr** — operator flows lean founder-voice for reply rate.

---

# Flow B — Operator Post-Onboarding

**Status: templates ✅ · trigger ⏳ needs code wiring (see below)**

Fires when a truck owner finishes onboarding. Drives them to first 10 orders.

## Trigger setup
- **Trigger type**: Metric → **Does something**
- **Metric**: `Truck Activated` *(does not exist yet — see "Wiring" below)*
- **Trigger Filters**: none

## Profile Filters
| # | Top dropdown | Property | Condition | Value |
|---|---|---|---|---|
| 1 | Properties about someone | `email` | is set | — |
| 2 | Properties about someone | `flow_b_stop` | is not equal to | `true` |

## Sequence
| # | Delay before | Template ID | Subject |
|---|---|---|---|
| 1 | Immediate | `RXc7GK` | `🎉 You're live, {{ event.truck_name\|default:"friend" }}` |
| 2 | 1 day | `Vy3SHH` | `Get your first 10 customers this weekend` |
| 3 | 3 days | `Rkb568` | `12,400 hungry locals just opened Cravvr` |
| 4 | 7 days | `UV2Q76` | `Week 1: how'd it go?` |
| 5 | 14 days | `WHsHBz` | `Two things our top trucks do differently` |

## Sender
**Modd from Cravvr** — same as Flow A.

## Wiring needed (deferred — request when ready)
Fire `Truck Activated` to Klaviyo when:
- Admin sets `truck_leads.status = 'onboarded'` on a lead row, OR
- A new `food_trucks` row is created with `verified = true`

Event payload required:
```json
{
  "metric": "Truck Activated",
  "profile": { "email": "...", "phone_number": "+1..." },
  "properties": {
    "truck_name": "Mumbo Gumbo",
    "truck_slug": "mumbo-gumbo",
    "city": "Portland, OR",
    "cuisine": "Mexican"
  }
}
```

Easiest place to wire: extend the existing `truck-lead` edge function with a `markOnboarded(leadId)` action, or add a small `truck-activated` edge function called from the admin UI.

---

# Flow C — Eater Welcome & First Order

**Status: templates ✅ · trigger ⏳ needs code wiring**

Fires when someone creates a Cravvr account (eater side). Drives first order.

## Trigger setup
- **Trigger type**: List → **Joins a list**
- **List**: `Eaters - All Customers` *(need to create — see "Wiring" below)*

*OR alternative trigger:*
- **Trigger type**: Metric → **Does something**
- **Metric**: `Created Account` *(custom event, see Wiring)*

## Profile Filters
| # | Top dropdown | Property | Condition | Value |
|---|---|---|---|---|
| 1 | Properties about someone | `email` | is set | — |
| 2 | What someone has done | `Placed Order` | hasn't happened | at least 1 time |

The second filter is the magic — anyone who already ordered (e.g., a signup that ordered immediately) exits the flow before Email 1 fires.

## Sequence
| # | Delay before | Template ID | Subject |
|---|---|---|---|
| 1 | 5 min | `SvzTXY` | `Welcome to Cravvr, {{ first_name\|default:"there" }}` |
| 2 | 1 day | `UhZMut` | `Taste your city, {{ first_name\|default:"there" }}` |
| 3 | 3 days | `XSRyvr` | `Ready to order? Three reasons why.` |
| 4 | 7 days | `VtqCnj` | `Favorite a few trucks — get the inside track` |

## Sender
**Cravvr** (not founder voice) — eater flows feel more like a brand than a founder.

## Wiring needed
Two options, pick one:

**Option A — List trigger (simpler):**
- Create list `Eaters - All Customers` in Klaviyo
- On Clerk `user.created` webhook (`supabase/functions/clerk-webhook`), upsert profile to Klaviyo and add to the list. ~15 lines of code.

**Option B — Metric trigger (more flexible):**
- Same Clerk webhook fires Klaviyo event `Created Account` with profile data
- Lets you also trigger Flow C from manual list subscribes later

I recommend Option A for now — simpler, gets the flow live faster.

---

# Flow D — Eater Win-Back

**Status: templates ✅ · trigger ⏳ depends on `Placed Order` event in Klaviyo**

Fires when an eater hasn't ordered in 60 days.

## Trigger setup
- **Trigger type**: Date-based → **Has a date property occur**
- **Profile property**: `last_ordered_at`
- **Trigger condition**: `60 days after`

*OR alternative:*
- **Trigger type**: Segment → **Joins a segment**
- **Segment**: "Eaters dormant 60d" (a segment you build in Klaviyo using `Placed Order` metric + recency)

## Profile Filters
| # | Top dropdown | Property | Condition | Value |
|---|---|---|---|---|
| 1 | Properties about someone | `email` | is set | — |
| 2 | Properties about someone | `unsubscribed` | is not equal to | `true` |
| 3 | What someone has done | `Placed Order` | hasn't happened | in the last 60 days |

The third filter re-checks before EACH send — if they place an order mid-flow, they exit (no more dormancy emails).

## Sequence
| # | Delay before | Template ID | Subject |
|---|---|---|---|
| 1 | Trigger fires at 60d | `RfxNJJ` | `We miss you, {{ first_name\|default:"friend" }}` |
| 2 | 2 days | `T3XGfd` | `These trucks joined while you were away` |
| 3 | 4 days | `UQpzKG` | `Last call` |

## Sender
**Cravvr** (brand voice).

## Wiring needed
- Klaviyo needs to receive `Placed Order` events from your codebase
- Add to `stripe-webhook` and `square-webhook` edge functions: on successful payment, push event to Klaviyo with order details

**Important coexistence note:** Your codebase already has a Resend-based `win-back` flow running via `lifecycle-email-runner`. If you launch Klaviyo Flow D, **disable the Resend version** to avoid double-sending. Open `supabase/functions/lifecycle-email-runner/index.ts` → remove `win_back` from the TEMPLATES map, or set its pg_cron to disabled.

---

# Universal UI walkthrough (applies to every flow)

Use this for every Build step above.

## Phase 1 — Create the flow shell

1. Left sidebar → **Flows**
2. Top right → **Create Flow** (blue button)
3. Modal: **Create from scratch**
4. **Flow name**: paste from above
5. **Create Flow**

## Phase 2 — Configure trigger

Click the **Trigger** block (top of canvas). Right panel:

1. **When someone...** dropdown — pick from above:
   - "Does something" = Metric
   - "Joins a list" = List
   - "Has a date property occur" = Date
2. Pick the relevant metric / list / property
3. **Trigger Filters**: leave empty unless the flow doc says otherwise
4. **Save**

## Phase 3 — Profile Filters

Find **Profile Filters** in the left rail (or gear icon on trigger).

1. Click **+ Add Filter**
2. **Top dropdown** must be **"Properties about someone"** for profile-property filters (NOT "What someone has done")
3. Property, condition, value from the table
4. Save
5. Click **+ AND** to add the next filter

## Phase 4 — Build the sequence

For each email in the sequence:

1. Click **+** below the previous block (or trigger for the first)
2. Pick **Time Delay** → set amount/unit → Save
3. Click **+** → **Email**
4. **Choose your email** → **Use Template** → search for the template name → Select
5. Subject + Preview text from the table
6. Sender Name + Email → your sender profile
7. ✅ Open Tracking · ✅ Click Tracking · ✅ Smart Sending — all ON
8. **Save Content**

## Phase 5 — Test before live

For each email block:
- Top right → **Preview & Send Test** → your email → **Send**
- Check Gmail web + iPhone — logo loads, layout intact, CTA works

## Phase 6 — Set Live

Top right of flow editor → **Status** badge → change from **Manual** to **Live** → confirm.

## Phase 7 — Verify end-to-end

Trigger the flow with real data:
- Flow A → submit a test lead on `/for-trucks/portland`
- Flow B → manually fire `Truck Activated` event (or wait for first onboarded truck)
- Flow C → create a new test customer account
- Flow D → can't test live; manually advance a test profile's `last_ordered_at`

Check **Flows → [flow name] → Analytics** to confirm: "1 person entered, 1 email sent."

---

# What's already wired vs what needs wiring

| Flow | Trigger needs code? | Where to wire |
|---|---|---|
| A | ✅ Already firing | `supabase/functions/truck-lead/index.ts` |
| B | ⏳ Yes — `Truck Activated` event | New action OR extend `truck-lead` |
| C | ⏳ Yes — list subscribe on signup | `supabase/functions/clerk-webhook/index.ts` |
| D | ⏳ Yes — `Placed Order` event from Stripe/Square webhooks | `supabase/functions/stripe-webhook` + `square-webhook` |

**Recommended wiring order (when ready):**

1. **Flow A** — already live, just assemble in UI today
2. **Flow C** — easiest second wiring (Clerk webhook is already there)
3. **Flow B** — needs an admin action UI for "mark onboarded" → wire there
4. **Flow D** — biggest lift; defer until you have ~100 orders

Ask me to wire any of these when you're ready — each is 30–60 min of code.

---

# Sender profile checklist per flow

| Flow | Sender name | Sender email |
|---|---|---|
| A | Modd from Cravvr | nolan@cravvr.com |
| B | Modd from Cravvr | nolan@cravvr.com |
| C | Cravvr | hello@cravvr.com |
| D | Cravvr | hello@cravvr.com |

Make sure both addresses are on the authenticated cravvr.com domain.

---

# Common gotchas

| Symptom | Cause | Fix |
|---|---|---|
| Email goes to spam | Domain not fully authenticated | Account → Settings → Domains → Re-verify |
| Logo doesn't load in Gmail | Image blocked | Whitelist sender (recipient-side); image is at `https://www.cravvr.com/logo/icon-192.png` — confirm it loads in browser |
| Flow shows "Manual" not "Live" | Forgot to flip status | Top right → Status badge → Live |
| Test lead doesn't trigger flow | Flow is Manual, OR sender profile missing on an email, OR profile filter excluded | Check each in order |
| `{{ first_name }}` shows literally in email | Profile didn't have first_name; `default:` filter only fires when property is missing entirely | Confirm event payload includes first_name |
| Two emails arriving for same event | Resend + Klaviyo both firing | Disable one (Resend lives in `lifecycle-email-runner`) |
| Customer enters Flow C then orders → gets Email 2 anyway | Profile filter isn't re-checking | Make sure filter is added to **Profile Filters** not **Trigger Filters** (Trigger only runs once at entry) |

---

# Maintenance — what to do weekly

1. **Klaviyo → Flows → each flow → Analytics tab**: check open rate (target: 50%+), click rate (target: 15%+), unsubscribe rate (target: <2%)
2. If a single email is dragging: A/B test subject line with **Klaviyo's Subject Line Assistant** (AI button in subject field)
3. Once you have 50+ flow entrants, turn on **Smart Sending Optimization** under each flow's settings
4. Once you have 500+ profiles, **Predictive Analytics** unlocks — segment leads by likelihood to onboard

---

# What this gives you when fully assembled

| | Volume potential | Outcome |
|---|---|---|
| Flow A live | ~30 leads/mo from $100 ads | 50%+ booking rate → 15 onboarding calls |
| Flow B live | Every onboarded truck | 80%+ hit 10 orders week 1 |
| Flow C live | Every new eater signup | 35%+ first-order conversion |
| Flow D live | Auto-rescue 15-20% of dormants | Maintains repeat-order rate |

Total system cost: $0/month (Klaviyo free up to 250 profiles, then ~$20/mo at 500).
