# Cravvr — Month 1 Execution Playbook

The full do-this-now plan for the $100 truck-operator acquisition test.
Pair with:
- `month-1-ad-copy.md` — exact ad copy + UTM URLs per city
- `klaviyo-flow-a-truck-nurture.md` — operator nurture email sequence

---

# Part 1 — Meta Ads Manager Setup ($85 of the $100)

## A. Prerequisites (one-time)

1. **Meta Business Suite account**: business.facebook.com
2. **Ad account** linked to a payment method (set monthly cap to $200 as a safety guard)
3. **Pixel** + **Conversions API** already wired (✅ done)
4. **Cravvr Page** on Facebook + Instagram (required to run ads — minimal setup is fine, ~5 min)

## B. Create the custom conversion (1 min)

Meta optimizes against conversions, not clicks. We need to tell it what "success" looks like.

1. **Events Manager → Custom Conversions → Create**
2. Source: your Pixel
3. Event: `Lead` (this is the standard event we fire from `truckLead.js`)
4. Rule: URL contains `for-trucks`
5. Name: `Truck Lead — Cravvr`
6. Category: `Lead`
7. Value: `$50` (placeholder LTV — adjust later as you learn)
8. **Create**

## C. Set up the 3 city campaigns

For each city (Portland, St. Pete, Tampa), create one campaign with the
same structure. Naming convention locks in attribution clarity:

**Campaign name:** `M1-PRT-Operator-Lead` (PRT / STP / TPA)

### Campaign-level settings
- Objective: **Sales** (formerly "Conversions" — uses CAPI optimization)
- Conversion location: **Website**
- Performance goal: **Maximize number of conversions**
- Budget: campaign-level **$20 lifetime** over 14 days
- Special ad category: **None** (this isn't housing/credit/employment)

### Ad set-level settings
- Conversion event: **Truck Lead — Cravvr** (your custom conversion)
- Schedule: 14 days from launch date
- **Location**: 15-mile radius around the city center
  - Portland: 45.5152, -122.6784
  - St. Pete: 27.7676, -82.6403
  - Tampa: 27.9506, -82.4572
- **Age**: 25–60
- **Detailed targeting**:
  - Interests: `Food truck`, `Mobile catering`, `Restaurant owner`,
    `Small business owner`, `Street food`, `Catering`
  - Behaviors: `Small business owners`
- **Targeting expansion**: ON (Advantage+ audience)
- **Placements**: Advantage+ placements (let Meta pick — Feed/Reels/Stories)
- **Optimization**: Conversions

### Ad-level (3 ads per ad set, one per copy variant)

For each city, create 3 ads using the variants in `month-1-ad-copy.md`.
Naming: `M1-PRT-Operator-Lead-A` / `-B` / `-C`

For each ad:
- **Format**: Single image or video
- **Identity**: Cravvr Facebook page + Instagram
- **Primary text**: from `month-1-ad-copy.md` (variant A/B/C)
- **Headline**: from same doc
- **Description**: leave empty (most placements ignore it)
- **CTA**: from same doc
- **Destination**: Website
- **URL** (this is the critical part — copy exactly):
  ```
  https://www.cravvr.com/for-trucks/portland?utm_source=meta&utm_medium=paid_social&utm_campaign=m1-truck-onboard&utm_content=m1-prt-a&utm_term=interests
  ```
  Swap city slug + creative letter per ad.
- **Display link**: `cravvr.com/for-trucks/portland`

## D. Launch checklist before pressing Publish

- [ ] Did you preview the ad in feed + story + reels?
- [ ] Does the URL open the right city page?
- [ ] Is the Pixel showing "Active" for this pixel in Events Manager?
- [ ] Is the Conversions API event showing "Active" in Events Manager? (Should be — we tested it E2E)
- [ ] Have you set the daily/lifetime spend cap on the ad account?

## E. Daily monitoring (10 min/day)

Meta Ads Manager → Filter columns: **CPL, Frequency, Conversions, Reach**

| Signal | Action |
|---|---|
| Frequency > 2.5 in the first week | Kill that ad — audience is too narrow / creative fatigued |
| CPL > $25 by day 5 | Kill the bottom 2 creatives, double the winner |
| CPL < $10 | You found a winner — increase budget by 20%/day (Meta's "20% rule") |
| Zero conversions after $20 spent | Targeting issue, not creative — broaden interests |
| 5+ conversions on one creative | Make 3 variations of that creative + test |

## F. Weekly review (30 min, Sundays)

1. Pull GA4 → Acquisition → Traffic acquisition
2. Filter by `utm_campaign = m1-truck-onboard`
3. Note CPL by city, by creative
4. Watch 3 Clarity replays of users who DIDN'T submit (if Clarity is on)
5. Reallocate budget — winners get more

---

# Part 2 — Google Ads ($15 of the $100)

Smaller spend but captures high-intent searches. One campaign with 3 ad
groups (one per city).

## A. Campaign setup
- Campaign type: **Search**
- Bidding: **Maximize conversions** (after first 30 conversions; until then **Manual CPC** at $1.50 max)
- Budget: **$0.50/day** (~$15 over 30 days)
- Languages: English
- Conversion tracking: Import GA4 `generate_lead` event

## B. Ad groups
One per city: `Portland Operators`, `St Pete Operators`, `Tampa Operators`.

For each:
- **Location targeting**: city + 15 mi
- **Keywords (exact + phrase match only)**:
  - `food truck pos system [city]`
  - `how to get more food truck customers [city]`
  - `food truck app for owners`
  - `mobile ordering for food trucks [city]`
- **Negative keywords (global)**:
  `jobs, hiring, for sale, rental, wedding, party, used`

## C. Responsive Search Ad (one per group)
**Headlines** (15 chars max, give Google 5–10):
- More Truck Orders
- Free Food Truck App
- Cravvr for Trucks
- 0% Commission Pickup
- Get Listed Today
- Founding Cohort
- Apply in 60 Seconds

**Descriptions** (90 chars max, give 2–4):
- Put your truck on Cravvr — hungry locals nearby see you in real time. Free to join.
- Mobile ordering, no commission on pickup, zero setup cost. Apply in 60 seconds.

**Final URL** (per ad group):
```
https://www.cravvr.com/for-trucks/portland?utm_source=google&utm_medium=cpc&utm_campaign=m1-truck-onboard&utm_content={creative}&utm_term={keyword}
```

`{creative}` and `{keyword}` are Google value-track parameters — Google auto-fills them.

---

# Part 3 — Klaviyo Flow B (Post-Onboarding Nurture)

Built AFTER first truck onboards. Same pattern as Flow A.

## Trigger
Metric: `Truck Activated`

This metric needs to be fired when a truck owner finishes onboarding. We'll
wire this from the admin tool when you mark a `truck_lead.status = 'onboarded'`
(or trigger it manually for now).

## Sequence (5 emails over 14 days)

| # | Delay | Subject | Goal |
|---|---|---|---|
| 1 | +0 min | "🎉 Welcome to Cravvr, {{ truck_name }}" | Confirm activation + 3-link starter pack (your profile, customer-side preview, share asset) |
| 2 | +1 day | "How to get your first 10 customers this weekend" | Tactical playbook: share to IG, tag Cravvr, post to neighborhood Facebook groups |
| 3 | +3 days | "{{ truck_name }} is now searchable to 12,400 Cravvr users in {{ city }}" | Social proof / momentum email — feels like the app is working for them |
| 4 | +7 days | "Quick check-in — how's week one going?" | NPS-style. Single CTA: "rate week 1 — 1 to 10" |
| 5 | +14 days | "Two things our top trucks do differently" | Activation deepening — feature requests, advanced setup |

## I'll create these in your Klaviyo when you give the word

Same approach as Flow A: I API-create the 5 HTML templates, give you the
IDs, you assemble in the Klaviyo flow editor.

---

# Part 4 — Founder Video Scripts (3 cities, 30 sec each)

**Recording instructions:**
- iPhone, vertical (9:16), good window light, no headphones
- Record 3 takes, pick the most natural
- Run through Descript (free tier) for auto-captions
- Export 9:16 (Reels/Stories) AND 1:1 (Feed) versions

## Portland — 30 sec
> "Hey, I'm Nolan — I started Cravvr because Portland has some of the best food trucks in the country, but nobody can find them when they're hungry. We just launched in Portland and I'm onboarding the first 25 trucks personally. No setup fee, zero commission on pickup, and you're on the map by tomorrow. If you've got a truck in Portland, hit the link and I'll text you back today."

## St. Pete — 30 sec
> "Hey, I'm Nolan — I started Cravvr right here in St. Pete because I was tired of driving past amazing trucks I didn't know existed. We're onboarding the first 25 trucks in St. Pete personally — no setup fee, zero commission on pickup, real customers ordering from your truck within a day. If you run a truck in St. Pete, hit the link, I'll text you back today."

## Tampa — 30 sec
> "Hey, I'm Nolan — Cravvr is launching in Tampa this month and I'm onboarding the first 25 trucks personally. No setup fee, zero commission on pickup orders, and you're on the map for every hungry local in Tampa by tomorrow. If you run a truck in Tampa, hit the link and I'll text you back today."

**On-screen text (Descript caption layer):**
- 0:00–0:05 — "Cravvr — for [CITY] food trucks"
- 0:25–0:30 — "Apply → cravvr.com/for-trucks/[city]"

---

# Part 5 — Midjourney / Ideogram Prompt Pack

20 prompts. Generate 5–10 images per prompt, pick the best, drop into Canva for text overlay.

## A. Founder + customer (use for Variant A — outcome-led)
1. `warm cinematic photo of a smiling food truck owner handing a wrapped burrito to a young customer, golden hour, shallow depth of field, shot on Canon R5 35mm, vertical 9:16 --ar 9:16 --v 6`
2. `food truck owner laughing on the phone, customer line of 6 people in the background blurred, late afternoon light, documentary style, vertical --ar 9:16 --v 6`
3. `close-up of food truck window with hands exchanging cash and a paper-wrapped sandwich, evening city lights, Portland street, vertical 9:16 --ar 9:16 --v 6`

## B. Truck "hero" shots (use for Variant B — social/community)
4. `wide cinematic shot of a colorful taco food truck parked at sunset on a busy St. Petersburg, Florida street, palm trees, customers walking up, vertical 9:16 --ar 9:16 --v 6`
5. `vibrant Tampa food truck at twilight, neon glow on truck signage, customers in line, Florida palm trees, vertical 9:16 --ar 9:16 --v 6`
6. `Portland food truck pod at golden hour, two trucks visible with steam rising from one, customers seated at picnic tables, cinematic, vertical 9:16 --ar 9:16 --v 6`

## C. Phone-in-hand (use for Variant C — direct/tactical)
7. `over-the-shoulder shot of a customer holding an iPhone with a colorful food truck map app on screen, food truck slightly out of focus in background, vertical 9:16 --ar 9:16 --v 6`
8. `flat lay of a smartphone showing a food truck app next to a paper-wrapped sandwich and iced coffee, marble counter, daylight, vertical --ar 9:16 --v 6`

## D. Map / discovery moment
9. `aerial top-down view of downtown Portland Oregon with cartoon food truck pins glowing on a map, vibrant colors, illustrated style, vertical 9:16 --ar 9:16 --v 6`
10. `phone screen with map view showing multiple food truck pins around a city, hand holding the phone, blurred urban street background --ar 9:16 --v 6`

## E. "Founding cohort" / numbered shots
11. `bold text "FOUNDING COHORT" overlaid on cinematic Portland food truck owner portrait, gritty editorial photography, soft grain, vertical 9:16 --ar 9:16 --v 6`
12. `numbered list visual "1 OF 25 SPOTS" with food truck silhouette, gradient rose to amber background, modern editorial design, vertical --ar 9:16 --v 6`

## F. Square (1:1) feed-ad variants
Repeat 1, 4, 7, 9, 11 with `--ar 1:1` instead.

## Canva text overlay rules
- Single short headline, top third, white text on black 40% scrim
- Sub-text bottom, "cravvr.com/for-trucks/[city]"
- Use Cravvr rose `#E11D48` for the CTA button overlay
- Max 7 words on the image — anything more, drop it

---

# Part 6 — Final pre-launch checklist

Before pressing "Publish" on Day 1 of ads:

- [ ] Sender domain authenticated in Klaviyo ✅
- [ ] Sender profile created in Klaviyo
- [ ] Flow A built + LIVE
- [ ] Sent yourself test emails of Flow A 1–4
- [ ] 3 city landing pages render correctly on prod ✅
- [ ] E2E lead submit creates Supabase row + Klaviyo event ✅
- [ ] GA4 receiving `generate_lead` events (test on /for-trucks/portland)
- [ ] Meta Pixel firing `Lead` event (Events Manager → Test Events)
- [ ] Meta CAPI showing `Lead` events deduplicated with Pixel
- [ ] Custom conversion `Truck Lead — Cravvr` created in Meta
- [ ] Google Ads conversion imported from GA4
- [ ] All 3 city campaigns built in Meta with $20 lifetime each
- [ ] 1 Google campaign built with $0.50/day
- [ ] Founder videos recorded (3 cities)
- [ ] Midjourney static creatives generated + overlaid in Canva
- [ ] Phone charged + Slack/email notifications enabled for new leads
- [ ] Calendar blocked: 10 min/day for ad review, 30 min Sunday for weekly review

---

# Part 7 — Success criteria (Day 30)

Pull on Day 30:

| Metric | Target | Stretch |
|---|---|---|
| Leads submitted | 15 | 30 |
| Cost per lead (CPL) | < $15 | < $8 |
| Lead → onboarded truck rate | 30% | 50% |
| Trucks onboarded | 5 | 10 |
| Cost per onboarded truck | < $40 | < $20 |
| Email open rate (Flow A1) | 70% | 85% |
| Email reply rate (Flow A3) | 15% | 30% |

If CPL > $30 by day 7: rethink targeting + creative.
If CPL < $10 by day 7: increase budget 50%.
If CPL < $5 by day 14: this is working — go to $500/mo in Month 2.
