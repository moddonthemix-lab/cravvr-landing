import React, { useEffect, useMemo, useState } from 'react';
import { fetchPlaybookState, setPlaybookItem } from '../../services/admin';

// ---------------------------------------------------------------------------
// Track tag (colored chip) — which workstream a checklist item belongs to.
// Mirrors the master plan's distinction between supply (boots), digital
// (Brez/CTC), engineering plumbing, and ratio-driven decisions.
// ---------------------------------------------------------------------------

const TRACK_STYLE = {
  engineering: { bg: '#dbeafe', fg: '#1e40af', label: 'engineering' },
  digital:     { bg: '#fce7f3', fg: '#9d174d', label: 'digital' },
  boots:       { bg: '#fef3c7', fg: '#92400e', label: 'boots-on-ground' },
  decision:    { bg: '#e0e7ff', fg: '#3730a3', label: 'decision' },
  admin:       { bg: '#f3f4f6', fg: '#374151', label: 'admin' },
};

const TrackChip = ({ track }) => {
  const s = TRACK_STYLE[track] || TRACK_STYLE.admin;
  return (
    <span style={{
      display: 'inline-block', padding: '2px 8px', borderRadius: 4,
      fontSize: 10, fontWeight: 700, letterSpacing: 0.04,
      textTransform: 'uppercase',
      background: s.bg, color: s.fg,
    }}>{s.label}</span>
  );
};

// ---------------------------------------------------------------------------
// The plan, in data. Pulled from docs/cravvr-2026-master-plan.md sections
// 1, 3, and 10. Edit here to evolve the plan; check-state in DB carries over
// as long as item_key stays stable.
// ---------------------------------------------------------------------------

const PLAN = [
  {
    phase: 'phase-0',
    title: 'Phase 0 — May · Foundation',
    description: 'Light up the data layer, ship Stripe live, sign first 20 founding trucks, validate the funnel.',
    weeks: [
      {
        key: 'w1', name: 'Week 1 · May 5–11 · Light up the data layer',
        items: [
          { key: 'w1-rotate-secrets',    track: 'engineering', label: 'Roll three exposed secrets (Resend API, Supabase service_role, Supabase access token)' },
          { key: 'w1-resend-dns',        track: 'engineering', label: 'Verify Resend DNS — DKIM, SPF, DMARC all green' },
          { key: 'w1-delete-sendgrid',   track: 'admin',       label: 'Delete stale SendGrid secrets in Supabase (cosmetic)' },
          { key: 'w1-utm-bios',          track: 'digital',     label: 'UTM-tag every social bio (IG, TikTok, FB, X)' },
          { key: 'w1-post-each-platform', track: 'digital',    label: 'Post 1 UTM-tagged piece per platform (organic)' },
          { key: 'w1-map-pdx-trucks',    track: 'boots',       label: 'Map every Portland food truck pod (spreadsheet)' },
          { key: 'w1-print-onepagers',   track: 'boots',       label: 'Print 50 founder one-pagers + 100 business cards' },
          { key: 'w1-sunday-read',       track: 'decision',    label: 'Sun May 11 read — first 7-day visitors-by-source query' },
        ],
      },
      {
        key: 'w2', name: 'Week 2 · May 12–18 · Stripe live + content cadence + first 5 trucks',
        items: [
          { key: 'w2-stripe-live',       track: 'engineering', label: 'Flip Stripe to live keys (Vercel + Supabase + webhook)', detail: 'Blocks on LLC formation' },
          { key: 'w2-test-1-dollar',     track: 'engineering', label: 'Verify end-to-end with real $1 order' },
          { key: 'w2-content-cadence',   track: 'digital',     label: 'Hit content cadence: 3 IG posts, 5 stories, 4–5 TikToks, FB cross-post' },
          { key: 'w2-visit-10-trucks',   track: 'boots',       label: 'Visit 10 trucks in person' },
          { key: 'w2-sign-5-founding',   track: 'boots',       label: 'Sign 5+ founding trucks (profiles built on the spot)' },
          { key: 'w2-target',            track: 'decision',    label: 'Sun May 18 target — ≥50 visitors, ≥3 signups, ≥1 paid online order' },
        ],
      },
      {
        key: 'w3', name: 'Week 3 · May 19–25 · First paid ad test + 10 more trucks',
        items: [
          { key: 'w3-meta-creative',     track: 'digital',     label: 'One 15-sec video creative (food shot → app screen → CTA)' },
          { key: 'w3-meta-test',         track: 'digital',     label: 'Launch Meta paid test — $10–15/day × 7 days, Portland geo, optimization = Purchases' },
          { key: 'w3-visit-10-more',     track: 'boots',       label: 'Visit 10 more trucks, total 15 committed' },
          { key: 'w3-pizza-meetup',      track: 'boots',       label: 'Founding Truck pizza meetup at a food cart pod (~May 24)' },
          { key: 'w3-mid-test-check',    track: 'decision',    label: 'Wed May 21 midpoint check — kill creative/audience if 0 signups & <20 visitors' },
          { key: 'w3-first-cohort-row',  track: 'decision',    label: 'Sun May 25 — first row appears in cohort_performance_v' },
        ],
      },
      {
        key: 'w4', name: 'Week 4 · May 26–Jun 1 · First decision + lifecycle email tuning',
        items: [
          { key: 'w4-read-leaderboard',  track: 'decision',    label: 'Read /admin/growth channel leaderboard — make first ratio-driven decision' },
          { key: 'w4-execute-decision',  track: 'decision',    label: 'Execute decision (scale / kill / iterate creative)' },
          { key: 'w4-tune-lifecycle',    track: 'engineering', label: 'Tune lifecycle email copy (abandoned-cart, first-reorder, win-back) and redeploy resend-email' },
          { key: 'w4-truck-checkins',    track: 'boots',       label: 'First follow-up calls with founding trucks — checking in 3+ times/week?' },
        ],
      },
      {
        key: 'phase-0-exit', name: 'Phase 0 exit gate (May 31)',
        items: [
          { key: 'gate-0-trucks',        track: 'boots',       label: '20+ committed founding trucks' },
          { key: 'gate-0-mau',           track: 'digital',     label: '300+ MAU' },
          { key: 'gate-0-rating',        track: 'boots',       label: 'App rating ≥4.0' },
          { key: 'gate-0-paid-order',    track: 'engineering', label: '≥1 paid online order' },
          { key: 'gate-0-cohort',        track: 'decision',    label: 'First cohort row in cohort_performance_v' },
        ],
      },
    ],
  },
  {
    phase: 'phase-1',
    title: 'Phase 1 — Jun–Aug · Soft Launch & Paid Channel',
    description: 'Turn the validated channel into an engine; rewards + referral live; Pro subscription launch in July.',
    weeks: [
      {
        key: 'jun', name: 'June',
        items: [
          { key: 'jun-double-down',      track: 'digital',     label: 'Double down: 2–3× budget on winning channel + new creative variants' },
          { key: 'jun-second-channel',   track: 'digital',     label: 'Second channel test (TikTok Spark Ads if Meta won)' },
          { key: 'jun-cohort-lookback',  track: 'decision',    label: 'First real cohort lookback — May cohort retention + email perf' },
          { key: 'jun-trucks-to-35',    track: 'boots',       label: 'Portland truck count: 20 → 35' },
          { key: 'jun-launch-rewards',   track: 'engineering', label: 'Launch Cravvr Points (50/150/400 redemption tiers)' },
          { key: 'jun-launch-referral',  track: 'engineering', label: 'Launch referral (25 bonus pts/friend)' },
          { key: 'jun-capi-tokens',      track: 'engineering', label: 'Add Meta CAPI tokens to Supabase secrets (once monthly spend >$500)' },
        ],
      },
      {
        key: 'jul', name: 'July — Pro subscription launch',
        items: [
          { key: 'jul-pro-pricing',      track: 'admin',       label: 'Set Pro tier: $29/mo (or $49 for tier-2 features)' },
          { key: 'jul-pro-notice',       track: 'boots',       label: '30-day notice to founding trucks before billing' },
          { key: 'jul-pro-features',     track: 'engineering', label: 'Ship Pro features: nearby push, advanced analytics, priority search, monthly report' },
          { key: 'jul-pr-push',          track: 'digital',     label: 'Local PR: Willamette Week, Portland Mercury, Portland Business Journal' },
          { key: 'jul-influencers',      track: 'digital',     label: '2–3 Portland food micro-influencers (10K–50K) — Pro partnership or credit instead of cash' },
          { key: 'jul-pro-target',       track: 'decision',    label: 'Target by Jul 31 — 20 paying Pro trucks ($580 MRR) or 15 at $49 ($735)' },
        ],
      },
      {
        key: 'aug', name: 'August — optimize',
        items: [
          { key: 'aug-creative-cadence', track: 'digital',     label: 'Creative cadence: 2 new ad creatives/week, kill worst weekly' },
          { key: 'aug-lookalikes',       track: 'digital',     label: 'Build 1% lookalike from highest-LTV cohort (once Meta has >100 conversions)' },
          { key: 'aug-email-tuning',     track: 'engineering', label: 'Tune lifecycle email — identify highest-conversion flow, double down' },
          { key: 'aug-cohort-decay',     track: 'decision',    label: 'Cohort decay analysis — June vs May cohorts. Product or acquisition issue?' },
        ],
      },
      {
        key: 'phase-1-exit', name: 'Phase 1 exit gate (Aug 31)',
        items: [
          { key: 'gate-1-mau',           track: 'digital',     label: '2,000+ Portland MAU' },
          { key: 'gate-1-pro-subs',      track: 'boots',       label: '30+ paying Pro subs' },
          { key: 'gate-1-mrr-vs-ads',    track: 'decision',    label: 'MRR > total ad spend' },
          { key: 'gate-1-ltv-cac',       track: 'decision',    label: 'Blended LTV:CAC d30 ≥ 1.8×' },
        ],
      },
    ],
  },
  {
    phase: 'phase-2',
    title: 'Phase 2 — Sep–Nov · Scale Portland + Begin City 2',
    description: 'Document the Portland playbook. Build City 2 supply (no demand spend). City 2 soft launch November.',
    weeks: [
      {
        key: 'sep', name: 'September — scale Portland + City 2 pre-build',
        items: [
          { key: 'sep-cap-spend',        track: 'digital',     label: 'Double winning channel ad spend (cap $1,500/mo until d60 cohort LTV known)' },
          { key: 'sep-google-install',   track: 'digital',     label: 'Launch Google App Install campaigns (broader audience)' },
          { key: 'sep-hire-editor',     track: 'admin',       label: 'Hire part-time video editor ($300–500/mo, 10–15 hrs/mo)' },
          { key: 'sep-portland-targets', track: 'boots',       label: 'Portland targets — 5,000 MAU, 50+ Pro trucks, 75+ active trucks' },
          { key: 'sep-pick-city-2',      track: 'decision',    label: 'Pick City 2: Miami FL or Austin TX' },
          { key: 'sep-city2-supply',     track: 'boots',       label: 'Remote outreach to top 30 City 2 trucks (10 committed by Sep 30)' },
        ],
      },
      {
        key: 'oct', name: 'October — national PR + City 2 supply build',
        items: [
          { key: 'oct-pr-eater',         track: 'digital',     label: 'Pitch Eater, Thrillist, Food & Wine, Fast Company' },
          { key: 'oct-awards',           track: 'digital',     label: 'Submit to Webby, Fast Company Innovation by Design, App Store editorial' },
          { key: 'oct-podcasts',         track: 'digital',     label: 'Founder podcast outreach: 1–2 appearances/month' },
          { key: 'oct-city2-trip',       track: 'boots',       label: 'Scouting trip to City 2 — replicate Portland founding-truck pitch' },
          { key: 'oct-city2-target',     track: 'boots',       label: 'Oct 31 target — 15 committed City 2 trucks, profiles built' },
        ],
      },
      {
        key: 'nov', name: 'November — City 2 soft launch (supply live, demand light)',
        items: [
          { key: 'nov-activate-city2',   track: 'engineering', label: 'Activate City 2 truck profiles' },
          { key: 'nov-city2-content',    track: 'digital',     label: 'City-specific TikTok/IG content — build local audience BEFORE app push' },
          { key: 'nov-trucks-post',      track: 'boots',       label: 'City 2 trucks post about Cravvr to their own audiences' },
          { key: 'nov-no-paid-ads',     track: 'admin',       label: 'Do NOT run paid consumer ads in City 2 yet' },
        ],
      },
    ],
  },
  {
    phase: 'phase-3',
    title: 'Phase 3 — Dec · City 2 Full Launch',
    description: 'Activate paid in City 2. Local press. Hire City Launch Coordinator for City 3+.',
    weeks: [
      {
        key: 'dec', name: 'December — City 2 full launch',
        items: [
          { key: 'dec-flip-paid',        track: 'digital',     label: 'Flip switch — activate City 2 paid TikTok + Meta (Portland playbook)' },
          { key: 'dec-giveaway',         track: 'digital',     label: 'Launch giveaway — "10 people win a food truck crawl in [City 2]"' },
          { key: 'dec-press',            track: 'digital',     label: 'Local press outreach in City 2' },
          { key: 'dec-coordinator',      track: 'admin',       label: 'Hire City Launch Coordinator ($1,000–1,500/mo, contract) for City 3+' },
          { key: 'dec-city2-60day',      track: 'decision',    label: 'City 2 60-day target — 500 MAU, 25 Pro subs' },
        ],
      },
    ],
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const allItems = (plan) => plan.flatMap((p) => p.weeks.flatMap((w) => w.items.map((i) => ({ ...i, phase: p.phase, week: w.key }))));

const calendarPosition = () => {
  const today = new Date();
  const may5 = new Date(today.getFullYear(), 4, 5);
  const dayOfYear = Math.floor((today - new Date(today.getFullYear(), 0, 0)) / 86400000);
  const may5DayOfYear = Math.floor((may5 - new Date(today.getFullYear(), 0, 0)) / 86400000);
  const daysSinceMay5 = dayOfYear - may5DayOfYear;
  if (daysSinceMay5 < 0) return { label: 'Before Phase 0', weekKey: null };
  if (daysSinceMay5 < 7)  return { label: 'Phase 0 · Week 1 (May 5–11)', weekKey: 'w1' };
  if (daysSinceMay5 < 14) return { label: 'Phase 0 · Week 2 (May 12–18)', weekKey: 'w2' };
  if (daysSinceMay5 < 21) return { label: 'Phase 0 · Week 3 (May 19–25)', weekKey: 'w3' };
  if (daysSinceMay5 < 28) return { label: 'Phase 0 · Week 4 (May 26–Jun 1)', weekKey: 'w4' };
  const month = today.getMonth();
  if (month === 5) return { label: 'Phase 1 · June',     weekKey: 'jun' };
  if (month === 6) return { label: 'Phase 1 · July',     weekKey: 'jul' };
  if (month === 7) return { label: 'Phase 1 · August',   weekKey: 'aug' };
  if (month === 8) return { label: 'Phase 2 · September', weekKey: 'sep' };
  if (month === 9) return { label: 'Phase 2 · October',  weekKey: 'oct' };
  if (month === 10) return { label: 'Phase 2 · November', weekKey: 'nov' };
  if (month === 11) return { label: 'Phase 3 · December', weekKey: 'dec' };
  return { label: 'Post-2026', weekKey: null };
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const PlaybookPage = () => {
  const [state, setState] = useState({}); // item_key → { done, done_at, ... }
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all'); // all | pending | done
  const [trackFilter, setTrackFilter] = useState('all');

  const load = async () => {
    setLoading(true);
    try {
      const map = await fetchPlaybookState();
      setState(map);
      setError('');
    } catch (e) {
      setError(e.message || String(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const toggle = async (item_key, currentlyDone) => {
    // Optimistic update.
    setState((prev) => ({
      ...prev,
      [item_key]: {
        ...prev[item_key],
        item_key,
        done: !currentlyDone,
        done_at: !currentlyDone ? new Date().toISOString() : null,
      },
    }));
    try {
      const row = await setPlaybookItem(item_key, !currentlyDone);
      setState((prev) => ({ ...prev, [item_key]: row }));
    } catch (e) {
      // Roll back on failure.
      setState((prev) => ({ ...prev, [item_key]: { ...prev[item_key], done: currentlyDone } }));
      setError(e.message || String(e));
    }
  };

  const flat = useMemo(() => allItems(PLAN), []);
  const total = flat.length;
  const completed = flat.filter((i) => state[i.key]?.done).length;
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
  const position = calendarPosition();

  const perPhaseProgress = useMemo(() => {
    return PLAN.map((p) => {
      const items = p.weeks.flatMap((w) => w.items);
      const done = items.filter((i) => state[i.key]?.done).length;
      return { phase: p.phase, title: p.title, done, total: items.length, pct: items.length ? Math.round((done / items.length) * 100) : 0 };
    });
  }, [state]);

  const matches = (item) => {
    const done = !!state[item.key]?.done;
    if (filter === 'pending' && done) return false;
    if (filter === 'done' && !done) return false;
    if (trackFilter !== 'all' && item.track !== trackFilter) return false;
    return true;
  };

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', paddingBottom: 80 }}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ margin: 0, fontSize: 28 }}>Playbook</h1>
        <p style={{ margin: '4px 0 0', color: '#6b7280' }}>
          The 2026 Master Plan, live. Check items as you complete them — progress is shared across all admins.
        </p>
      </div>

      {/* Top-line: progress + calendar position */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: 12, marginBottom: 18,
      }}>
        <Card label="Overall progress" value={`${completed} / ${total}`} sub={`${pct}%`} bar={pct} />
        <Card label="Today's position" value={position.label} sub="Per the master plan calendar" />
        <Card label="Pending items" value={`${total - completed}`} sub={`${100 - pct}% remaining`} />
      </div>

      {/* Per-phase progress bars */}
      <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: 12, padding: 16, marginBottom: 18 }}>
        <h3 style={{ margin: '0 0 12px', fontSize: 14, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 0.5 }}>
          Progress by phase
        </h3>
        {perPhaseProgress.map((p) => (
          <div key={p.phase} style={{ marginBottom: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
              <span style={{ color: '#374151' }}>{p.title}</span>
              <span style={{ color: '#6b7280', fontWeight: 600 }}>{p.done} / {p.total} · {p.pct}%</span>
            </div>
            <div style={{ height: 6, background: '#f3f4f6', borderRadius: 3, overflow: 'hidden' }}>
              <div style={{
                width: `${p.pct}%`, height: '100%',
                background: p.pct >= 80 ? '#16a34a' : p.pct >= 40 ? '#eab308' : '#e11d48',
                transition: 'width 200ms',
              }} />
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{
        display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap',
        background: 'white', border: '1px solid #e5e7eb', borderRadius: 12, padding: 12, marginBottom: 14,
      }}>
        <span style={{ fontSize: 12, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 0.5 }}>Filter</span>
        <Pill active={filter === 'all'} onClick={() => setFilter('all')}>All</Pill>
        <Pill active={filter === 'pending'} onClick={() => setFilter('pending')}>Pending</Pill>
        <Pill active={filter === 'done'} onClick={() => setFilter('done')}>Done</Pill>
        <span style={{ width: 12 }} />
        <Pill active={trackFilter === 'all'}         onClick={() => setTrackFilter('all')}>All tracks</Pill>
        <Pill active={trackFilter === 'engineering'} onClick={() => setTrackFilter('engineering')}>Engineering</Pill>
        <Pill active={trackFilter === 'digital'}     onClick={() => setTrackFilter('digital')}>Digital</Pill>
        <Pill active={trackFilter === 'boots'}       onClick={() => setTrackFilter('boots')}>Boots</Pill>
        <Pill active={trackFilter === 'decision'}    onClick={() => setTrackFilter('decision')}>Decision</Pill>
        <Pill active={trackFilter === 'admin'}       onClick={() => setTrackFilter('admin')}>Admin</Pill>
      </div>

      {error && (
        <div style={{ background: '#fee2e2', color: '#991b1b', padding: 10, borderRadius: 8, marginBottom: 12 }}>
          {error}
        </div>
      )}
      {loading && <div style={{ color: '#6b7280', padding: 8 }}>Loading…</div>}

      {/* Phases → weeks → items */}
      {PLAN.map((phase) => (
        <PhaseBlock
          key={phase.phase}
          phase={phase}
          state={state}
          toggle={toggle}
          matches={matches}
          activeWeekKey={position.weekKey}
        />
      ))}

      <p style={{ marginTop: 32, fontSize: 11, color: '#9ca3af', textAlign: 'center' }}>
        Plan items are version-controlled in <code>PlaybookPage.jsx</code>. Edit there to evolve the plan;
        check-state in <code>playbook_state</code> carries over as long as item_key stays stable.
      </p>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Subcomponents
// ---------------------------------------------------------------------------

const PhaseBlock = ({ phase, state, toggle, matches, activeWeekKey }) => {
  const filteredWeeks = phase.weeks
    .map((w) => ({ ...w, items: w.items.filter(matches) }))
    .filter((w) => w.items.length > 0);
  if (filteredWeeks.length === 0) return null;

  return (
    <div style={{ marginBottom: 26 }}>
      <h2 style={{ margin: '0 0 4px', fontSize: 18 }}>{phase.title}</h2>
      <p style={{ margin: '0 0 14px', color: '#6b7280', fontSize: 13 }}>{phase.description}</p>

      {filteredWeeks.map((week) => (
        <div
          key={week.key}
          style={{
            background: 'white',
            border: '1px solid #e5e7eb',
            borderRadius: 12,
            padding: 14,
            marginBottom: 10,
            ...(week.key === activeWeekKey ? { borderLeft: '4px solid #e11d48' } : {}),
          }}
        >
          <h3 style={{ margin: '0 0 10px', fontSize: 14, color: '#374151' }}>
            {week.name}
            {week.key === activeWeekKey ? (
              <span style={{
                marginLeft: 8, fontSize: 10, fontWeight: 700, letterSpacing: 0.04,
                textTransform: 'uppercase', background: '#e11d48', color: 'white',
                padding: '2px 8px', borderRadius: 4,
              }}>You are here</span>
            ) : null}
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {week.items.map((item) => (
              <ItemRow
                key={item.key}
                item={item}
                row={state[item.key]}
                onToggle={() => toggle(item.key, !!state[item.key]?.done)}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

const ItemRow = ({ item, row, onToggle }) => {
  const done = !!row?.done;
  return (
    <button
      onClick={onToggle}
      style={{
        display: 'flex', alignItems: 'flex-start', gap: 12,
        padding: '10px 12px',
        background: done ? '#f0fdf4' : '#f9fafb',
        border: `1px solid ${done ? '#bbf7d0' : '#e5e7eb'}`,
        borderRadius: 8,
        cursor: 'pointer',
        textAlign: 'left',
        fontFamily: 'inherit',
        fontSize: 13,
        color: done ? '#166534' : '#1f2937',
        transition: 'background 120ms',
      }}
      onMouseEnter={(e) => e.currentTarget.style.background = done ? '#dcfce7' : '#f3f4f6'}
      onMouseLeave={(e) => e.currentTarget.style.background = done ? '#f0fdf4' : '#f9fafb'}
    >
      <div style={{
        flexShrink: 0, width: 18, height: 18, borderRadius: 4,
        border: `2px solid ${done ? '#16a34a' : '#d1d5db'}`,
        background: done ? '#16a34a' : 'white',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginTop: 1,
      }}>
        {done && (
          <svg width="10" height="10" viewBox="0 0 16 16" fill="none" stroke="white" strokeWidth="3">
            <path d="M3 8l3 3 7-7" />
          </svg>
        )}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 600, textDecoration: done ? 'line-through' : 'none', opacity: done ? 0.65 : 1 }}>
          {item.label}
        </div>
        {item.detail ? (
          <div style={{ fontSize: 11, color: '#6b7280', marginTop: 3 }}>{item.detail}</div>
        ) : null}
        {row?.done_at ? (
          <div style={{ fontSize: 11, color: '#16a34a', marginTop: 3 }}>
            ✓ {new Date(row.done_at).toLocaleString()}
          </div>
        ) : null}
      </div>
      <TrackChip track={item.track} />
    </button>
  );
};

const Card = ({ label, value, sub, bar }) => (
  <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: 12, padding: 16 }}>
    <div style={{ fontSize: 11, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 600 }}>{label}</div>
    <div style={{ fontSize: 20, fontWeight: 700, marginTop: 4 }}>{value}</div>
    {sub ? <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>{sub}</div> : null}
    {typeof bar === 'number' ? (
      <div style={{ height: 4, background: '#f3f4f6', borderRadius: 2, marginTop: 8, overflow: 'hidden' }}>
        <div style={{
          width: `${bar}%`, height: '100%',
          background: bar >= 80 ? '#16a34a' : bar >= 40 ? '#eab308' : '#e11d48',
          transition: 'width 200ms',
        }} />
      </div>
    ) : null}
  </div>
);

const Pill = ({ active, onClick, children }) => (
  <button
    onClick={onClick}
    style={{
      background: active ? '#e11d48' : 'white',
      color: active ? 'white' : '#374151',
      border: `1px solid ${active ? '#e11d48' : '#e5e7eb'}`,
      borderRadius: 999, padding: '4px 12px',
      fontSize: 12, fontWeight: 600, cursor: 'pointer',
      fontFamily: 'inherit',
    }}
  >{children}</button>
);

export default PlaybookPage;
