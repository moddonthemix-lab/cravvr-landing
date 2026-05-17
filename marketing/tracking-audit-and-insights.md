# Cravvr — Tracking Audit + AI Insights Design

## Part 1 — Audit (what you already have)

### ✅ Visitor identity (`visitors` table, 99 visitors tracked)
- Persistent `visitor_id` via `localStorage`
- First-touch UTMs frozen on first hit (`first_utm_source`, `first_click_id`, `first_click_platform`)
- Last-touch UTMs updated on each visit
- Auto-stitches `visitor_id → user_id` on auth via `identify()`
- `acquisition_visitor_id` stamped on `customers` for first-stitch attribution

### ✅ Event stream (`analytics_events` table, 1,365 events collected)
Columns: `event_name`, `event_source`, `visitor_id`, `user_id`, `session_id`,
`utm_source/medium/campaign/content/term`, `click_id`, `url`, `path`,
`referrer`, `properties` (jsonb), `event_id`, `occurred_at`.

Routes auto-emit `page_view` events via `AnalyticsContext` route listener.

### ✅ Pixel mirroring (`src/lib/pixels.js`)
- Meta Pixel (browser-side)
- Google Analytics 4
- TikTok Pixel
- Microsoft Clarity (installed, dormant until env var set)

### ✅ Server-side conversion APIs
- Meta CAPI — wired (user confirmed)
- Edge function `analytics-server-event` deduplicates with client pixel via `event_id`

### ✅ Lead capture (`truck_leads` table)
Full attribution copied onto every lead:
- All UTMs + `click_id` + `click_platform`
- `referrer`, `landing_url`
- `visitor_id` → stitches lead to the full session journey in `analytics_events`

### ✅ Klaviyo profile properties
Every lead → Klaviyo profile gets: `lead_type`, `truck_name`, `cuisine`, `city`,
`utm_source`, `utm_campaign` — usable for segments and AI subject-line targeting.

---

## Part 2 — Gaps (what's missing for the AI insights ask)

| Gap | Why it matters |
|---|---|
| **Funnel view** that joins `truck_leads` ← `analytics_events` by `visitor_id` | Need to compute: which UTM combos viewed → submitted → onboarded |
| **Daily aggregates** by city × creative × source | Manual reading 1,365 events isn't scalable; need a rollup |
| **Lead scoring** | Prioritize follow-up by likelihood to onboard (response speed, source quality, profile signal) |
| **AI-generated weekly digest** | Plain-English recommendations: "double down on M1-PRT-A, kill M1-STP-C" |

---

## Part 3 — Design: what we're building

### A. SQL view `truck_lead_attribution`
Per-lead row enriched with: sessions before submit, time-on-page, distinct
URLs viewed, first-touch UTM (from `visitors`), last-touch UTM (from
`truck_leads`), and a derived `lead_score` (0–100, simple heuristic).

### B. SQL view `marketing_funnel_daily`
Daily roll-up: by `city × utm_source × utm_campaign × utm_content`,
- `views` (page_view events on `/for-trucks/*`)
- `submits` (truck_leads inserted that day)
- `conversion_rate`
- `cost_per_lead` (joinable to `ad_spend` later)

### C. Edge function `marketing-insights`
Returns JSON:
```json
{
  "as_of": "2026-05-17T..."
  "summary": { "total_leads_7d": N, "cpl_estimate": "$..." },
  "by_city": [ { city, views, submits, conv_rate } ],
  "by_creative": [ { utm_content, views, submits, conv_rate, status } ],
  "lead_scoring": [ { lead_id, score, reasons } ],
  "ai_recommendations": "..."  // optional, only when ANTHROPIC_API_KEY set
}
```

Optional `ai_recommendations` field uses Anthropic's Claude API to produce a
plain-English summary like:

> "M1-PRT-A (Portland, founder-voice variant) is converting at 12.4% — 3x
> better than M1-PRT-C. Recommend reallocating $10 from C → A. St. Pete
> has zero conversions on Variant B — pause it and run a check on the
> targeting layer. Lead 3f8a... has a high score (84) and submitted 22
> minutes ago — text them now."

### D. Admin UI
New section in admin "Marketing → Insights" tab that loads the function on
demand and renders:
- Header card: total leads, CPL, conv rate (7-day)
- Table: creative leaderboard (by `utm_content`)
- Table: open leads ranked by score
- Bottom: AI recommendations (gracefully says "set ANTHROPIC_API_KEY to enable" if missing)

### E. Optional cron
A 9am daily run that POSTs the AI summary to Slack/email so you start the
day with one screen of recommendations.

---

## Part 4 — What you'd do later (Month 2+)

- Train a real lead-scoring model on `truck_leads.status = 'onboarded'` outcomes
- Build look-alike audiences in Meta off your top-converting leads
- Wire `ad_spend` daily imports from Meta + Google Ads APIs for real CPL
  computation (currently we estimate from total spend / total leads)
