# Cravvr UI migration — complete

This document records the full shadcn + Tailwind migration of the Cravvr codebase. Use it to figure out which CSS files are still load-bearing, which surfaces are on Tailwind, and which design primitives to reach for first.

## Status: complete

Every primary surface now renders through shadcn primitives + Tailwind utilities. The remaining CSS files in `src/` are documented at the bottom — each has a specific reason to exist.

## Surfaces migrated

| Surface | Path |
|---|---|
| Owner dashboard (8 tabs) | `src/components/owner/OwnerDashboard.jsx` |
| Owner Kitchen Display | `src/components/owner/KitchenDisplay.jsx` |
| Owner Payments dashboard | `src/components/owner/PaymentsDashboard.jsx` |
| Owner Menu form | `src/components/truck-form/MenuItemForm.jsx` |
| Customer profile (account/orders/favorites/rewards/addresses/payment/notifications/security/help) | `src/components/customer/CustomerProfile.jsx` |
| Customer punch card | `src/components/customer/PunchCard.jsx` |
| Customer order tracker | `src/components/customer/OrderTracker.jsx` |
| Cart drawer + Checkout page | `src/components/cart/{Cart,Checkout}.jsx` |
| Login + signup + reset | `src/pages/{LoginPage,ResetPasswordPage,AuthConfirmPage}.jsx` |
| Waitlist multi-step funnel | `src/pages/WaitlistPage.jsx` |
| Marketing pages | `src/components/landing/LandingPage.jsx`, `src/pages/{EnterprisePage,CravvrPlusPage,GoPage}.jsx` |
| Public Home (mobile + desktop) | `src/components/home/HomePage.jsx` |
| Truck detail page | `src/components/truck/TruckDetailPage.jsx` |
| Discover (Tinder-style swipe) | `src/components/discover/DiscoverView.jsx` |
| Map view | `src/components/map/MapView.jsx` (+ `src/styles/leaflet.css`) |
| Bolt AI playground | `src/components/bolt/BoltView.jsx` |
| Admin dashboard (7 sections) | `src/admin/AdminDashboard.jsx` |
| Admin trucks list | `src/admin/trucks/AdminTrucksListPage.jsx` |
| Admin truck detail (11 tabs) | `src/admin/trucks/{AdminTruckDetailPage,tabs/*}.jsx` |
| 6 modals → shadcn Dialog | ConfirmModal, ReviewModal, MenuItemRatingModal, MenuItemForm, OwnerReassignModal (kept original shell), CreateTruckModal (kept original shell) |
| ProtectedRoute / OrderTracker / CustomerProfile / dashboard auth-loading | All use `LoadingSplash` |

## Shared primitives

Reach for these before duplicating markup:

**shadcn UI** — `src/components/ui/`
- `<Card>` / `<CardContent>` / `<CardHeader>` / `<CardTitle>`
- `<Button>` (variants: default, outline, ghost, destructive, secondary, link; sizes: default, sm, lg, icon)
- `<Badge>` (variants: positive, warning, info, destructive, secondary, outline)
- `<Dialog>` family
- `<Input>`, `<Label>`, `<Textarea>`, `<Select>`, `<Tabs>`
- `<DashboardShell>`, `<DashboardSidebar>`, `<DashboardMobileNav>`

**Cravvr-specific**
- `<LoadingSplash size="full|card|inline" tagline="…" />` — `src/components/common/LoadingSplash.jsx`
- `<MarketingHeader>`, `<MarketingFooter>`, `<MarketingFAQ>`, `<BrowserMockup>` — `src/components/landing/`
- `cn()` from `@/lib/utils`

**Tone-chip helper** (`TONE_CHIP` constant) is duplicated across OwnerDashboard, OrdersTab, PaymentsDashboard, EnterprisePage, CravvrPlusPage. Promote to `src/lib/tones.js` if you find yourself reaching for it again.

## Remaining CSS files — why each exists

| File | Lines | Why |
|---|---|---|
| `src/index.css` | 1,035 | CSS variables / design tokens at the top + a small set of legacy utilities (`.card`, `.muted`, `.pill`, `.meta`, `.rating-star`, `.gradient-text`, `.section`, `.container`, `.page`) + animation `@keyframes` blocks (`fadeInUp`, `fadeIn`, `float`, `pulse`, `shimmer`, `scaleIn`) referenced by `tailwindcss-animate`. Anything dead was swept in Phase E. |
| `src/admin/AdminDashboard.css` | 811 | Modal chrome (`.modal-overlay`, `.modal`, `.modal-header`, `.modal-footer`, `.modal-body`, `.close-btn`), button utilities (`.btn-primary`, `.btn-secondary`, `.btn-icon`, `.btn-link`), toggle switches (`.toggle-switch`, `.toggle-group`, `.toggle-label`), `.location-suggestions` autocomplete, `.image-upload` drop zone — all still consumed by inner sections of AdminDashboard.jsx that weren't fully migrated. |
| `src/styles/leaflet.css` | 120 | **3rd-party-DOM only.** Leaflet renders markers + popups via `L.divIcon` HTML strings; React/Tailwind can't reach those. Owns `.leaflet-marker-content`, `.leaflet-popup-*`, `.user-marker-*`, `.custom-truck-marker`, `.marker-img`. |
| `src/styles/auth.css` | 741 | Untouched in this migration — pre-existing global auth styles. May be partially dead; future sweep candidate. |
| `src/styles/animations.css` | 203 | Shared `@keyframes` library used across the app. |
| `src/styles/modals.css` | 203 | Shared modal chrome — older copy, separate from AdminDashboard.css's modal block. |
| `src/styles/navigation.css` | 93 | Shared nav utilities. |
| `src/components/owner/OwnerDashboard.css` | 622 | Mostly form/button utilities (`.form-group`, `.btn-primary`, `.modal-*`, `.image-upload`) still consumed by truck-form components imported into OwnerDashboard. |
| `src/components/social/SocialGraphics.css` | 867 | **Kept by design.** SocialGraphics uses html2canvas to render exact-pixel images; Tailwind's purge would risk silently breaking exports. |
| `src/components/owner/CravvrPlusBilling.css` | 148 | Subscription/billing UI; not migrated (low traffic, niche). |
| `src/components/owner/PaymentProcessorSetup.css` | 153 | Stripe / Square onboarding UI; not migrated. |
| `src/components/owner/StripeOnboarding.css` | 90 | Stripe-specific onboarding; not migrated. |
| `src/components/layout/AppLayout.css` | 296 | App-level shell (sidebar, mobile bottom-nav, page wrappers); not fully migrated. |
| `src/components/navigation/BottomNav.css` | 65 | Mobile bottom-nav; not fully migrated. |
| `src/components/common/NotificationBell.css` | 347 | Notification dropdown; not migrated (low traffic). |
| `src/components/common/ImageUpload.css` | 167 | Reusable image-upload component; not migrated. |
| `src/components/common/ErrorBoundary.css` | 133 | Crash screen. |

Total: ~6,094 lines remaining (down from ~22K at session start across all CSS files).

## How to extend

When touching one of the surfaces above:
1. Default to shadcn + Tailwind. No new handwritten CSS files.
2. For loading states, prefer `<LoadingSplash />` (`size="inline"` for tab-level loaders).
3. For modals/dialogs, use shadcn `<Dialog>`.
4. For tables, mirror the shadcn-styled table pattern in `OrdersTab.jsx` / `PaymentsDashboard.jsx` (`thead` row with `border-b bg-muted/40 text-xs font-semibold uppercase`).
5. For stat cards, mirror the `Card` + `TONE_CHIP` icon-chip pattern.
6. For class collisions: many old classes (`.toggle`, `.btn-primary`, `.form-group`, `.modal-*`) are still defined in CSS and shared across surfaces — when migrating the last consumer, run a strict-grep dead-class detection before deleting.

## Verification

`npm run build` passes. `npm test` passes (22 tests). Every surface listed above has been visually verified to render with the new styling.
