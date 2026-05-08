# Cravvr — 2026 Master Marketing & Rollout Plan

**The unified operating doctrine.** Combines the Brez/CTC data-first paid playbook (already in motion) with boots-on-the-ground supply-side acquisition (Portland-first, founder-led). One document, calendar-anchored to where we actually are.

**Today: 2026-05-06** — Wednesday of Brez Week 1. Pipeline live, consumer marketing not yet started, Stripe still on test keys, ~0 trucks formally onboarded.

---

## 0 — The Three Operating Rules

These rules govern every spend, every hire, every launch decision for the entire year.

| # | Rule | What it means in practice |
|---|------|---------------------------|
| 1 | **Supply before demand** | Boots-on-ground truck onboarding ALWAYS leads paid consumer ads in any new geo. Empty-app first impression kills the flywheel. |
| 2 | **Earn before you spend** | Every spend tier has a milestone gate. Don't scale paid until LTV:CAC d30 > 1.5×. Don't expand cities until Portland is cash-flow positive. |
| 3 | **Data over instinct** | Brez/CTC discipline: every link UTM-tagged, every channel reviewed weekly via `/admin/growth`, every kill/scale decision tied to a metric not a feeling. |

**The synthesis insight:** The Rollout Plan ("get 20 trucks first, then market") and the Brez Plan ("light up data, run paid") are NOT sequential — they run in **parallel tracks**. Boots-on-ground builds supply. Digital builds demand-side data infrastructure. They converge when paid ads launch (Brez Week 3 / late May) into an app that already has trucks worth opening.

---

## 1 — Where We Are (Phase 0, May 5–11)

### Live infrastructure
- Pipeline verified end-to-end: puppeteer → live site → Supabase row landed
- Meta Pixel + GA4 firing on prod
- Domain verified with Meta
- Resend pipeline live, branded email lands in inbox
- Lifecycle email crons scheduled (hourly/daily/weekly)
- `/admin/growth` ready to render data the moment data exists
- Stripe scaffold shipped — **on test keys** (live activation Week 2)

### Open debts to clear THIS WEEK
- [ ] Roll three exposed secrets (Resend API, Supabase service_role, Supabase access token)
- [ ] Verify Resend domain DNS — DKIM, SPF, DMARC all green before any volume
- [ ] Delete stale SendGrid secrets (cosmetic)
- [ ] Map every Portland food truck pod — Lloyd, PSU Farmers Market, Mississippi Ave, Cartopia, Alberta Arts (spreadsheet: name, IG, regular spot, schedule)
- [ ] Print 50 founder one-pagers + 100 business cards

### Truck onboarding status
- **Goal:** 20 founding trucks committed by May 31
- **Where we actually are:** 0 (not a real number — get an honest count)
- **Founding offer:** First 6 months of Pro free + "Founding Truck" badge + logo on launch page

---

## 2 — The Two Parallel Tracks

### Track A — Boots-on-Ground (Supply / Founder-Led)
Lives entirely outside the app's digital surface. Founder time, not money.

| Activity | Cadence | Who |
|----------|---------|-----|
| Visit Portland food trucks in person | 8–10 trucks/week through May | Founder |
| Founding truck pitch (free 6mo + badge + meetup invite) | At every visit | Founder |
| Build truck profile FOR them on the spot | Same visit, on phone | Founder |
| "Founding Truck" pizza meetup | Once, ~May 24 | Founder |
| Weekly truck check-in calls | Friday afternoons | Founder |
| Truck owner onboarding kit (one-pager + QR code + table tent) | Hand-deliver | Founder |

### Track B — Digital Funnel (Demand / Data)
The Brez/CTC playbook. Lives in the app + ad accounts + `/admin/growth`.

| Activity | Cadence | Tool |
|----------|---------|------|
| UTM-tag every link, everywhere | Always | UTM builder in `/admin/marketing` |
| Cohort + channel review | Weekly Sunday | `/admin/growth` |
| Lifecycle emails (welcome, abandoned cart, first-reorder, win-back) | Automated | Resend + Supabase crons |
| Pixel/GA4/CAPI event quality checks | Weekly | Meta Events Manager + GA4 DebugView |
| Ad spend log + LTV:CAC | Weekly | `/admin/growth` Growth tab |

**Convergence point:** Late May — when paid ads launch, both tracks deliver to the same place: a live, multi-truck app with attribution intact.

---

## 3 — The Calendar (rest of 2026)

### MAY — Foundation (where we are now)

**W1 May 5–11 · Light up the data layer**
- UTM-tag every social bio (IG, TikTok, FB, X) — `?utm_source=<platform>&utm_medium=bio&utm_campaign=may_2026`
- Resend DNS verified (DKIM/SPF/DMARC green)
- Post 1 UTM-tagged piece per platform with `utm_medium=organic_post`
- **Boots track:** map all Portland trucks, design one-pager, print materials
- **Sun May 11 read:** `SELECT first_utm_source, COUNT(*) FROM visitors WHERE first_seen_at > NOW() - '7 days' GROUP BY 1` — target ≥10 attributed visitors

**W2 May 12–18 · Stripe live + content cadence + first 5 trucks**
- Flip Stripe to live keys (Vercel `VITE_STRIPE_PUBLISHABLE_KEY`, Supabase `STRIPE_SECRET_KEY`, webhook URL + new `whsec_…`)
- Test end-to-end with real $1 order
- Content cadence: IG 3 posts + 5 stories, TikTok 4–5 videos, FB cross-post
- **Boots track:** visit 10 trucks in person, sign 5+ founding trucks (with profiles built)
- **Sun May 18 target:** ≥50 unique visitors that week, ≥3 signups, ≥1 paid online order

**W3 May 19–25 · First paid ad test + 10 more trucks**
- Meta paid test: $10–15/day × 7 days, geo-targeted Portland, optimization goal = Purchases
- Creative: ONE 15-sec video (food shot → app screen → "tap to order"). Don't overproduce.
- Destination: `?utm_source=facebook&utm_medium=paid_social&utm_campaign=may_paid_test&utm_content=video_v1`
- **Boots track:** 10 more truck visits, target 15 total committed
- **Wed May 21 midpoint:** check signups by campaign — kill creative/audience if 0 signups & <20 visitors
- **Founding Truck pizza meetup ~May 24** at a food cart pod (use the 20–25 committed list)

**W4 May 26–Jun 1 · First decision + lifecycle email tuning**
- Read `/admin/growth` channel leaderboard, 30-day window
- LTV:CAC d30 decision matrix:
  - `> 3.0×` → triple budget next month
  - `1.5–3.0×` → maintain, iterate creative
  - `1.0–1.5×` → new creative or audience before judging
  - `< 1.0×` → kill, redeploy
- Tune lifecycle email templates with real customer voice (`abandoned-cart.tsx`, `first-reorder-nudge.tsx`, `win-back.tsx`); redeploy `resend-email`
- **Boots track:** first follow-up calls with founding trucks — are they checking in 3+ times/week?
- **Phase 0 exit gate:** 20+ committed trucks, 300+ MAU, 4.0+ rating, ≥1 paid online order, first cohort row in `cohort_performance_v`

### JUNE — Soft Launch & First Paid Channel

**Goal:** turn the validated channel into a repeatable engine; sustainable content rhythm; rewards/referral live.

| Week | Focus | Critical action |
|------|-------|-----------------|
| W1 (Jun 2–8) | Double down | 2–3× budget on Week 4's winning channel. New creative variants. |
| W2 (Jun 9–15) | Second channel test | If Meta won → test TikTok Spark Ads ($10–15/day). If Meta failed → iterate creative, don't add channels. |
| W3 (Jun 16–22) | First real cohort lookback | Run cohort decay query. Are May cohorts retaining? Lifecycle emails performing? |
| W4 (Jun 23–30) | CAPI + rewards launch | If monthly Meta spend >$500, add `META_CAPI_PIXEL_ID` + `META_CAPI_ACCESS_TOKEN`. Launch Cravvr Points (50/150/400 redemption tiers). Launch referral (25 bonus pts/friend). |

**Boots track all of June:** push Portland truck count from 20 → 35. Daily check-in habit is the #1 priority — call every truck that goes quiet 3 days in a row.

**June exit gate:** 1,000+ MAU Portland, 20+ paying Pro trucks once we turn Pro on (see July), positive unit economics emerging, app rating holding 4.2+, referral generating ≥15% of new downloads.

### JULY — Monetize the Supply Side

**Pro subscription launch.** This is the moment the supply side becomes a paying customer base.
- $29/mo or $49/mo tier (start at $29 to reduce activation friction; raise on tier-2 features later)
- 30-day notice to founding trucks before billing starts
- Pro features that justify the cost: push to nearby users on check-in, advanced dashboard analytics, priority placement in search, monthly performance report
- Handle every churn personally — call them, find out why, fix it
- **Target by July 31:** 20 paying Pro trucks ($580/mo MRR at $29) OR 15 at $49 ($735/mo)

**Paid ads in July:** scale winning creative, kill underperformers weekly, test 2 new ad variants/week.

**Local PR push:** pitch Willamette Week, Portland Mercury, Portland Business Journal, OregonLive food. Angle: "Portland founder builds app to solve food truck discovery problem." Reach out to 2–3 Portland food micro-influencers (10K–50K followers) — offer free Pro partnership or rewards credit instead of cash.

### AUGUST — Optimize & Build for Scale

- Creative cadence: 2 new ad creatives/week, kill worst performer weekly
- Lookalike audiences: once Meta has >100 conversions, build 1% lookalike from highest-LTV cohort
- Email automation tuning: identify highest-conversion lifecycle flow, double down. Add tracking pixels to email templates if open/click visibility matters.
- Cohort decay analysis: are June cohorts performing better than May? Why? Product getting better, or acquisition getting worse?

**August exit gate:** 2,000+ Portland MAU, 30+ Pro subs, MRR > total ad spend, blended LTV:CAC d30 ≥ 1.8×.

### SEPTEMBER — Scale Portland + Begin City 2 Pre-Build

This is when the playbook becomes a doc. Document everything Portland taught you so City 2 launches faster.

**Portland scale:**
- Double winning channel ad spend (cap $1,500/mo until cohort d60 LTV is known)
- Launch Google App Install campaigns now — broader audience justified by retention data
- Hire part-time video editor ($300–500/mo, 10–15 hrs/mo) — content volume can't drop
- Target 5,000 Portland MAU by end of month, 50+ Pro trucks, 75+ active trucks

**City 2 pre-build (supply only, no demand spend):**
- Pick: Miami FL or Austin TX (food truck density, social food culture, market size)
- Identify top 30 trucks via IG / Google Maps / local food blogs
- Begin remote outreach with Portland success story + founding truck offer
- Goal by Sep 30: 10 committed City 2 trucks

### OCTOBER — National PR + City 2 Supply Build

- Pitch Eater, Thrillist, Food & Wine, Fast Company (startup angle)
- Submit to Webby Awards, Fast Company Innovation by Design, Apple App Store editorial
- Podcast outreach: 1–2 founder/food entrepreneur appearances/month
- One scouting trip to City 2 — meet trucks in person, replicate the Portland founding-truck pitch
- Goal by Oct 31: 15 committed City 2 trucks, profiles built and ready

### NOVEMBER — City 2 Soft Launch (Supply Live, Demand Light)

- Activate City 2 truck profiles
- Begin city-specific TikTok/IG content — build local following BEFORE app push
- City 2 trucks post about Cravvr to their own audiences (the most powerful organic demand lever)
- **Do NOT run paid consumer ads in City 2 yet.**

### DECEMBER — City 2 Full Launch

- Flip switch: activate City 2 paid TikTok + Meta playbook from Portland
- Launch giveaway: "10 people win a food truck crawl in [City 2]"
- Local press outreach in City 2 (same playbook as Portland, faster execution)
- **City 2 60-day target:** 500 MAU, 25 Pro subs in that city
- Hire City Launch Coordinator ($1,000–1,500/mo, contract part-time) — owns truck onboarding for City 3+

---

## 4 — Channel Playbooks

### TikTok (primary consumer acquisition)
- Volume beats production. Phone is fine.
- 5–7 posts/week through July, daily once part-time editor is hired
- Formats that work: hidden gem spotlights, "I tried 5 trucks in [pod]," day-in-the-life with a truck owner, GRWM food run
- Hook formula: food visual in first 2 seconds, location in first 5 seconds
- Engage every comment for 30 min after posting (algorithm signal)
- Spark Ads start: only boost organic videos that already perform — don't create ad-first content

### Meta (Instagram + Facebook)
- IG Reels = repurpose every TikTok
- IG Stories = daily — live truck check-ins from the app, polls, behind-the-scenes
- IG grid = curated truck photography, rewards highlights, city spotlights — tag every featured truck so they reshare
- Paid ads: Portland geo, age 22–42, food/local dining/foodies interests, optimization = Purchases
- Always run two creatives — one informational ("how Cravvr works"), one craving-driver (food porn → app screen → CTA)

### Email (Resend, lifecycle automated)
- "The Cravvr Drop" weekly newsletter — best truck this week, new trucks, rewards spotlight
- Welcome sequence: Day 1 (welcome + how to earn points), Day 3 (find a truck near you), Day 7 (first rewards milestone)
- Truck-owner list (separate): product updates, success stories from other trucks, monthly performance summary
- Lifecycle automations already wired: abandoned cart, first-reorder nudge, win-back. Tune copy in `supabase/functions/_shared/emails/` once real customer voice is known (end of May).

### SEO (slow but free)
| Keyword | Vol/mo | Page | Timeline |
|---------|--------|------|----------|
| food trucks near me Portland | 2,400 | GPS-hook landing page | June |
| best food trucks Portland | 1,900 | Blog roundup + map | July |
| Portland food truck schedule | 880 | Auto-updated schedule page | August |
| food truck app | 5,400 | App landing page | June |

### In-Person (the unfair advantage)
- Truck visits = highest-conversion acquisition channel for SUPPLY. No digital channel competes.
- Stickers + QR table tents at every founding truck location — every customer at the truck is a perfectly-targeted potential consumer
- Founding Truck meetup once per quarter — community is the moat
- Portland Food Cart Association + Oregon Food Truck Association — partner for credibility

### Influencer (start nano, never go big)
| Tier | Followers | Cost | When |
|------|-----------|------|------|
| Nano | 1K–10K | trade or $0–100 | now |
| Micro | 10K–100K | $100–500 | July+ |
| Mid | 100K–500K | $500–2,000 | city launch only |
| Macro | 500K+ | $2,000+ | major milestones only |

---

## 5 — Spend Unlock Gates

The most-skipped section. These are hard rules.

| Milestone required | What it unlocks | Approx month |
|--------------------|-----------------|--------------|
| App live + 20 trucks committed | Content creation $100–200/mo | May (now) |
| 300 MAU + trucks checking in 3×/week | First giveaway, first paid test ($300–600/mo) | June |
| App rating ≥4.0 + d7 retention signal | Scale paid to $1,000/mo | July |
| 20+ paying Pro trucks + revenue > ad spend | Hire part-time video editor | September |
| Portland cash-flow positive | City 2 consumer launch spend | November |
| 2 profitable cities | Full-time growth hire + City 3 prep | 2027 Q1 |

**The three rules that prevent ruin:**
1. Never run paid ads in a new city before the trucks are live there.
2. Never scale a paid channel without 14 days of CPI / cohort data.
3. Never hire full-time until that city's revenue covers the salary.

When in doubt: wait one more month, collect more data, decide.

---

## 6 — Weekly Operating Cadence

This is the discipline that runs forever. Set calendar holds.

| When | What | Where |
|------|------|-------|
| Monday AM | Review weekend `/admin/growth` — anything broken? | Dashboard |
| Wednesday | Mid-week paid ad checkpoint — kill or hold | Meta + TikTok ads manager |
| Friday afternoon | Truck check-in calls — every founding truck that's gone quiet | Phone |
| Sunday | Channel review (`/admin/growth` cohort + leaderboard); content plan for next week | Dashboard + Notion |
| 1st of month | Cohort lookback — refresh `cohort_performance_v` materialized view; LTV decay analysis | SQL |
| Quarterly | Strategic review — new channels, new geos, new product lines | Off-site |

---

## 7 — KPIs by Phase

| Metric | Phase 0 (May) | Phase 1 (Jun–Aug) | Phase 2 (Sep–Nov) | Phase 3 (Dec+) |
|--------|---------------|--------------------|--------------------|-----------------|
| Portland MAU | 100 | 1,000 | 3,000 | 5,000 |
| Trucks committed | 20 | 35 | 60 | 80 |
| Paying Pro trucks | 0 (free) | 20 | 40 | 60 |
| Pro MRR | $0 | $580 | $1,160 | $1,740 |
| App rating | ≥4.0 | ≥4.2 | ≥4.4 | ≥4.5 |
| LTV:CAC d30 | n/a | ≥1.5× | ≥2.5× | ≥3.0× |
| Lifecycle email open rate | n/a | 30% | 35% | 40% |

---

## 8 — Anti-Roadmap (what NOT to do)

| Don't | Why | Do instead |
|-------|-----|------------|
| Launch in 3 cities | Thin supply everywhere | Dominate Portland first |
| Run paid ads before organic retention | Pay to acquire users who find an empty app | Prove organic retention, then accelerate |
| Build features nobody asked for | Wastes runway | Talk to 10 users/week, build only repeated requests |
| Hire too early | Burns runway | Contractors + part-time until cash flow stable |
| Compete on Pro price | Devalues product | Compete on results — Pro trucks get more customers |
| Ignore truck churn | Shrinking supply kills demand | Call every quiet truck, fix the reason |
| Over-invest in brand before product | Pretty logo doesn't fix retention | Make the app impossible to stop using first |
| Spend ad budget evenly across channels | Splits attention, slows learning | Concentrate on 1 winning channel until ratio breaks |

---

## 9 — Annual Budget Estimate (bootstrap path)

| Phase | Months | Monthly spend | Phase total | Expected revenue |
|-------|--------|---------------|-------------|-------------------|
| 0 — Foundation | May | $200–500 | $200–500 | $0–200 |
| 1 — Soft launch + paid test | Jun–Aug | $600–1,500 | $1,800–4,500 | $1,500–4,000 |
| 2 — Scale Portland | Sep–Nov | $2,000–4,000 | $6,000–12,000 | $6,000–12,000 |
| 3 — City 2 launch | Dec | $3,500–6,000 | $3,500–6,000 | $4,000–7,000 |
| **2026 total** | | | **$11,500–23,000** | **$11,500–23,000** |

Recommendation: target the bootstrap floor ($12K). Increase spend ONLY when retention + CPI metrics justify it. The product and community will tell you when to accelerate.

---

## 10 — The 30-Day Checklist (start here, today)

Most concrete part of the entire plan. Don't read past this — execute it.

| Day | Action |
|-----|--------|
| **May 6 (today)** | Roll exposed secrets. Verify Resend DNS. UTM-tag all 4 social bios. |
| May 7 | Map every Portland food truck on Google Maps (spreadsheet w/ name, IG, regular spot). |
| May 8–9 | Design + print 50 one-pagers + 100 business cards. Visit 2 trucks in person to test the pitch. |
| May 10–11 | Post 1 UTM-tagged piece per platform. Sun: first 7-day visitors-by-source read. |
| May 12 | **Flip Stripe to live keys.** Test $1 real order end-to-end. |
| May 13–17 | Truck visits 5 days × 2 trucks = 10 truck visits. Get 5 founding trucks signed. |
| May 18 | Post weekly: 3 IG, 5 stories, 4 TikTok. Cross-post FB. |
| **May 19** | **Launch first Meta paid test** ($10–15/day, Portland geo, 7 days). |
| May 20–24 | 10 more truck visits. Sign 10 more founding trucks. **Founding Truck meetup at a food cart pod May 24.** |
| May 21 | Mid-test paid ad checkpoint. Kill or hold based on signups. |
| May 25 | Run `SELECT refresh_cohort_performance();` — first cohort row should appear. |
| May 26 | Read `/admin/growth` leaderboard. Make first ratio-driven decision. |
| May 27–30 | Execute decision (scale, kill, or iterate). Tune lifecycle email templates. |
| May 31 | **Phase 0 review.** Did we hit 20 trucks + 300 MAU + first paid order + first cohort row? |

**The one thing that matters tomorrow morning:** UTM-tag your bios and start truck visits. Both tracks. Same day. Everything else flows from that.

---

## 11 — The One Sentence

Cravvr wins by combining founder-led truck onboarding (the unfair advantage) with the Brez/CTC data-discipline paid playbook (the scale lever) — supply first, demand second, data third, expansion fourth, never out of order.

---

*Cravvr · 2026 Master Plan · Synthesizes Brez/CTC weekly cadence + Strategic Rollout Plan + Comprehensive Marketing Plan*
