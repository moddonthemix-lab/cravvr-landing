# Cravvr — UI rules for Claude

The codebase is fully on **shadcn + Tailwind** as of 2026-05-09. See `MIGRATION_COMPLETE.md` for the full inventory of what's where.

## Defaults — do these unless explicitly told otherwise

1. **No new handwritten CSS files.** New surfaces use Tailwind utilities + the shadcn primitives below. The few remaining `.css` files exist for documented reasons (3rd-party DOM, html2canvas exports, shared utilities used by multiple surfaces) — see `MIGRATION_COMPLETE.md`.

2. **Reach for existing primitives first**:
   - `<Card>`, `<CardContent>`, `<CardHeader>`, `<CardTitle>` from `@/components/ui/card`
   - `<Button>` from `@/components/ui/button` (variants: default, outline, ghost, destructive, secondary, link; sizes: sm, default, lg, icon)
   - `<Badge>` from `@/components/ui/badge` (variants: positive, warning, info, destructive, secondary, outline)
   - `<Dialog>` family from `@/components/ui/dialog` — for any modal
   - `<Input>`, `<Label>`, `<Textarea>`, `<Select>`, `<Tabs>`
   - `<DashboardShell>` + `<DashboardSidebar>` from `@/components/ui/dashboard-sidebar` — for any tabbed dashboard surface
   - `<LoadingSplash size="full|card|inline" tagline="..." />` from `@/components/common/LoadingSplash` — for any loading state
   - `<MarketingHeader>`, `<MarketingFooter>`, `<MarketingFAQ>`, `<BrowserMockup>` from `@/components/landing/` — for marketing pages
   - `cn()` from `@/lib/utils`

3. **Color tokens, not hex.** Use the design tokens. The full set:
   - `bg-primary` / `text-primary` (rose) — brand
   - `bg-positive` / `text-positive` (emerald) — success, money, completion
   - `bg-warning` / `text-warning` (amber) — pending, alerts
   - `bg-info` / `text-info` (blue) — informational
   - `bg-destructive` / `text-destructive` — errors, cancellations
   - `bg-muted` / `text-muted-foreground` — secondary text, muted surfaces
   - `bg-card` / `bg-background` / `text-foreground` — base surfaces
   - `border-border` / `border-input` — borders

4. **Always wrap raw `Icons.*` SVGs in sized spans:**
   ```jsx
   <span className="h-4 w-4">{Icons.plus}</span>
   ```
   Without the wrapper, the SVG defaults to 300×150 and blows up the layout. This regression has bitten the codebase before; do it every time.

5. **Loading states:**
   - Full-page route load → `<LoadingSplash />`
   - Tab/section load → `<LoadingSplash size="inline" tagline="LOADING X" />`
   - Inline button spinner → `<span className="h-4 w-4 animate-spin">{Icons.loader}</span>`

6. **Modals → shadcn `<Dialog>`.** Don't build a `.modal-overlay` / `.modal` div tree.

## Common patterns to copy

**Stat card row** (Owner OrdersTab, EnterprisePage, etc):
```jsx
<div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
  {stats.map(s => (
    <Card key={s.label}>
      <CardContent className="p-4 flex items-center gap-3">
        <div className={cn('flex h-9 w-9 items-center justify-center rounded-lg shrink-0', TONE_CHIP[s.tone])}>
          <span className="h-4 w-4">{s.icon}</span>
        </div>
        <div className="min-w-0">
          <div className="text-xl font-bold tabular-nums truncate">{s.value}</div>
          <div className="text-xs text-muted-foreground truncate">{s.label}</div>
        </div>
      </CardContent>
    </Card>
  ))}
</div>
```
The `TONE_CHIP` map is duplicated in several files — promote to `src/lib/tones.js` if you reach for it again.

**Table with mobile fallback** (Owner OrdersTab, PaymentsDashboard):
- Desktop (`md:block`): `<Card><table className="w-full text-sm">…</table></Card>` with `<thead>` row classed `border-b border-border bg-muted/40 text-xs font-semibold uppercase tracking-wide text-muted-foreground`
- Mobile (`md:hidden`): stacked `<Card>`s with header row + meta row + bordered total

**Filter pills:**
```jsx
<button className={cn(
  'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium capitalize transition-colors',
  isActive
    ? 'border-primary bg-primary text-primary-foreground'
    : 'border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground'
)}>
```

**Section header** (consistent across every owner tab):
```jsx
<div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between mb-6">
  <div>
    <h1 className="text-2xl font-bold tracking-tight">Title</h1>
    <p className="text-sm text-muted-foreground">Subtitle.</p>
  </div>
  <div>{/* actions */}</div>
</div>
```

## Before deleting CSS rules

Run a strict className grep first:
```bash
grep -rE "className=\"[^\"]*\\b<class-name>\\b" src --include="*.jsx" --include="*.js"
```
Many old classes (`.btn-primary`, `.toggle`, `.form-group`, `.modal-*`) are still shared across surfaces. The Phase E sweep (commit `ad42522`) removed clearly-dead rules but stopped short of breaking shared utilities.

## Commits

Run `npm run build` and `npm test` before pushing. Both must pass. The user has been bitten by the `--no-verify` shortcut in this codebase — don't use it.

## App-level chrome — single source of truth

**Every authenticated route renders through `PageWrapper`** (`src/components/app/PageWrapper.jsx`). It owns:
- Desktop top header (logo + search + city + notifications + cart)
- Desktop left sidebar (Home/Map/Discover/Bolt + Favorites/Orders + Account/My Trucks/Admin/Sign Out)
- Mobile bottom nav

Route wrappers in `src/components/wrappers/index.jsx` (`OwnerDashboardWrapper`, `AdminDashboardWrapper`, `CustomerProfileWrapper`, `AdminAreaWrapper`) all use `PageWrapper`. **Do not add a second sidebar/header layer.** Inner pages render plain content; the chrome is the wrapper's job.

If you find yourself building an "app shell" or "sidebar" component, you're solving a problem that's already solved — extend `PageWrapper` instead.

## Pages NOT to touch without asking

- `src/components/social/SocialGraphics.css` — html2canvas pixel-perfect exports rely on this; Tailwind purge could silently break image generation.
- `src/styles/leaflet.css` — overrides Leaflet's runtime DOM; React/Tailwind can't reach those elements.
- The `:root` CSS variables block at the top of `src/index.css` — every shadcn class resolves through them.
