import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { refreshCohortPerformance, upsertAdSpend } from '../../services/admin';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { format, subDays } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Icons } from '../common/Icons';
import AdminNavBar from './AdminNavBar';

const CHART_TOOLTIP = {
  contentStyle: {
    background: 'white',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    fontSize: '12px',
    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.07)',
  },
};

const formatCents = (cents) => (cents == null ? '—' : `$${(cents / 100).toFixed(2)}`);
const formatRatio = (n) => (n == null ? '—' : `${Number(n).toFixed(2)}x`);

const ratioBadgeVariant = (r) => {
  if (r == null) return 'secondary';
  if (r >= 3) return 'positive';
  if (r >= 1) return 'warning';
  return 'destructive';
};

const GrowthDashboard = () => {
  const [cohorts, setCohorts] = useState([]);
  const [daily, setDaily] = useState([]);
  const [adSpend, setAdSpend] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    setError('');
    try {
      const [cohortRes, dailyRes, spendRes] = await Promise.all([
        supabase.from('cohort_performance_v').select('*').order('cohort_week', { ascending: false }).limit(200),
        supabase.from('daily_channel_performance').select('*').gte('day', format(subDays(new Date(), 30), 'yyyy-MM-dd')).order('day', { ascending: true }),
        supabase.from('ad_spend').select('*').gte('day', format(subDays(new Date(), 30), 'yyyy-MM-dd')).order('day', { ascending: true }),
      ]);
      if (cohortRes.error) throw cohortRes.error;
      if (dailyRes.error) throw dailyRes.error;
      if (spendRes.error) throw spendRes.error;
      setCohorts(cohortRes.data || []);
      setDaily(dailyRes.data || []);
      setAdSpend(spendRes.data || []);
    } catch (e) {
      setError(e.message || String(e));
    }
  };

  useEffect(() => { load(); }, []);

  const triggerRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshCohortPerformance();
      await load();
    } catch (e) {
      setError(e.message || String(e));
    } finally {
      setRefreshing(false);
    }
  };

  const summary = useMemo(() => {
    const revenue = daily.reduce((sum, d) => sum + Number(d.paid_revenue || 0), 0);
    const orders = daily.reduce((sum, d) => sum + Number(d.orders || 0), 0);
    const newCustomers = daily.reduce((sum, d) => sum + Number(d.new_customers || 0), 0);
    const spend = adSpend.reduce((sum, d) => sum + Number(d.spend_cents || 0), 0) / 100;
    const mer = spend > 0 ? revenue / spend : null;
    const blendedCac = newCustomers > 0 ? spend / newCustomers : null;
    return { revenue, orders, newCustomers, spend, mer, blendedCac };
  }, [daily, adSpend]);

  const dailyChart = useMemo(() => {
    const byDay = new Map();
    for (const d of daily) {
      const key = format(new Date(d.day), 'MMM d');
      byDay.set(key, (byDay.get(key) || 0) + Number(d.paid_revenue || 0));
    }
    return Array.from(byDay.entries()).map(([day, revenue]) => ({ day, revenue }));
  }, [daily]);

  const channelLeaderboard = useMemo(() => {
    const bySource = new Map();
    for (const c of cohorts) {
      const cur = bySource.get(c.source) || { source: c.source, new_customers: 0, spend_cents: 0, revenue_d30_cents: 0, revenue_d90_cents: 0 };
      cur.new_customers += Number(c.new_customers || 0);
      cur.spend_cents += Number(c.spend_cents || 0);
      cur.revenue_d30_cents += Number(c.revenue_d30_cents || 0);
      cur.revenue_d90_cents += Number(c.revenue_d90_cents || 0);
      bySource.set(c.source, cur);
    }
    return Array.from(bySource.values())
      .map((row) => ({
        ...row,
        cac_cents: row.new_customers > 0 ? Math.round(row.spend_cents / row.new_customers) : 0,
        ltv_d30_cents: row.new_customers > 0 ? Math.round(row.revenue_d30_cents / row.new_customers) : 0,
        ltv_cac_d30: row.spend_cents > 0 ? row.revenue_d30_cents / row.spend_cents : null,
      }))
      .sort((a, b) => (b.ltv_cac_d30 ?? -1) - (a.ltv_cac_d30 ?? -1));
  }, [cohorts]);

  const summaryCards = [
    { label: 'Revenue (30d)', value: `$${summary.revenue.toFixed(2)}` },
    { label: 'Ad spend (30d)', value: `$${summary.spend.toFixed(2)}` },
    { label: 'Blended MER', value: summary.mer ? formatRatio(summary.mer) : '—' },
    { label: 'Blended CAC', value: summary.blendedCac ? `$${summary.blendedCac.toFixed(2)}` : '—' },
    { label: 'New customers (30d)', value: String(summary.newCustomers) },
    { label: 'Orders (30d)', value: String(summary.orders) },
  ];

  return (
    <>
      <AdminNavBar activeId="growth" />
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Growth</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Per-channel CAC, LTV and cohort performance. Refreshes nightly.
          </p>
        </div>
        <Button onClick={triggerRefresh} disabled={refreshing} size="sm" className="gap-2 shrink-0">
          <span className="h-4 w-4">{Icons.refresh}</span>
          {refreshing ? 'Refreshing…' : 'Recompute now'}
        </Button>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <span className="h-4 w-4 shrink-0">{Icons.alertCircle}</span>
          {error}
        </div>
      )}

      <AdSpendForm onSaved={load} />

      {/* Top-line cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-4">
        {summaryCards.map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4 space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground truncate">{s.label}</p>
              <p className="text-2xl font-bold tabular-nums tracking-tight">{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Daily revenue chart */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Daily revenue (30d)</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={dailyChart}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="day" stroke="#94a3b8" fontSize={11} />
              <YAxis stroke="#94a3b8" fontSize={11} />
              <Tooltip {...CHART_TOOLTIP} />
              <Line type="monotone" dataKey="revenue" stroke="#e11d48" strokeWidth={2} dot={false} name="Revenue ($)" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Channel leaderboard */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Channel leaderboard (all-time)</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {channelLeaderboard.length === 0 ? (
            <p className="px-5 py-10 text-center text-sm text-muted-foreground">
              No channel data yet — once visitors arrive with UTMs and convert, they'll appear here.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/40 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    <th className="px-4 py-3">Source</th>
                    <th className="px-4 py-3 text-right">New customers</th>
                    <th className="px-4 py-3 text-right">Spend</th>
                    <th className="px-4 py-3 text-right">CAC</th>
                    <th className="px-4 py-3 text-right">LTV (d30)</th>
                    <th className="px-4 py-3 text-right">LTV:CAC (d30)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {channelLeaderboard.map((c) => (
                    <tr key={c.source} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 font-medium">{c.source}</td>
                      <td className="px-4 py-3 text-right tabular-nums">{c.new_customers}</td>
                      <td className="px-4 py-3 text-right tabular-nums">{formatCents(c.spend_cents)}</td>
                      <td className="px-4 py-3 text-right tabular-nums">{formatCents(c.cac_cents)}</td>
                      <td className="px-4 py-3 text-right tabular-nums">{formatCents(c.ltv_d30_cents)}</td>
                      <td className="px-4 py-3 text-right">
                        <Badge variant={ratioBadgeVariant(c.ltv_cac_d30)}>{formatRatio(c.ltv_cac_d30)}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Cohort table */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Cohorts (week × channel)</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {cohorts.length === 0 ? (
            <p className="px-5 py-10 text-center text-sm text-muted-foreground">
              No cohort rows yet. Click "Recompute now" once you have orders, or wait for the nightly job at 03:00 UTC.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/40 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    <th className="px-4 py-3">Cohort week</th>
                    <th className="px-4 py-3">Source</th>
                    <th className="px-4 py-3">Campaign</th>
                    <th className="px-4 py-3 text-right">New cust.</th>
                    <th className="px-4 py-3 text-right">CAC</th>
                    <th className="px-4 py-3 text-right">LTV d7</th>
                    <th className="px-4 py-3 text-right">LTV d30</th>
                    <th className="px-4 py-3 text-right">LTV d90</th>
                    <th className="px-4 py-3 text-right">LTV:CAC d30</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {cohorts.map((c) => (
                    <tr
                      key={`${c.cohort_week}-${c.source}-${c.medium}-${c.campaign}`}
                      className="hover:bg-muted/30 transition-colors"
                    >
                      <td className="px-4 py-3 tabular-nums">{format(new Date(c.cohort_week), 'MMM d, yyyy')}</td>
                      <td className="px-4 py-3">{c.source}</td>
                      <td className="px-4 py-3 text-muted-foreground">{c.campaign || '—'}</td>
                      <td className="px-4 py-3 text-right tabular-nums">{c.new_customers}</td>
                      <td className="px-4 py-3 text-right tabular-nums">{formatCents(c.cac_cents)}</td>
                      <td className="px-4 py-3 text-right tabular-nums">{formatCents(c.ltv_d7_cents)}</td>
                      <td className="px-4 py-3 text-right tabular-nums">{formatCents(c.ltv_d30_cents)}</td>
                      <td className="px-4 py-3 text-right tabular-nums">{formatCents(c.ltv_d90_cents)}</td>
                      <td className="px-4 py-3 text-right">
                        <Badge variant={ratioBadgeVariant(c.ltv_cac_d30)}>{formatRatio(c.ltv_cac_d30)}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
    </>
  );
};

const AdSpendForm = ({ onSaved }) => {
  const today = format(new Date(), 'yyyy-MM-dd');
  const [open, setOpen] = useState(false);
  const [day, setDay] = useState(today);
  const [source, setSource] = useState('');
  const [medium, setMedium] = useState('');
  const [campaign, setCampaign] = useState('');
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  const reset = () => {
    setDay(today); setSource(''); setMedium(''); setCampaign('');
    setAmount(''); setNotes(''); setErr(''); setMsg('');
  };

  const submit = async (e) => {
    e.preventDefault();
    setErr(''); setMsg('');
    const dollars = Number(amount);
    if (!source.trim()) return setErr('Source is required (e.g. instagram, google, meta).');
    if (!Number.isFinite(dollars) || dollars < 0) return setErr('Amount must be a non-negative number.');
    setSaving(true);
    try {
      const row = {
        day,
        source: source.trim().toLowerCase(),
        medium: medium.trim().toLowerCase() || null,
        campaign: campaign.trim().toLowerCase() || null,
        spend_cents: Math.round(dollars * 100),
        notes: notes.trim() || null,
      };
      await upsertAdSpend(row);
      await refreshCohortPerformance();
      setMsg(`Saved $${dollars.toFixed(2)} for ${row.source} on ${day}.`);
      reset();
      if (onSaved) await onSaved();
    } catch (e2) {
      setErr(e2.message || String(e2));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardContent className="p-5 space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-base font-bold">Record ad spend</h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              Add what you spent on a channel for a given day. Without spend rows, CAC and LTV:CAC stay at $0/—.
            </p>
          </div>
          <Button
            variant={open ? 'outline' : 'default'}
            size="sm"
            onClick={() => setOpen((v) => !v)}
            className="shrink-0"
          >
            {open ? 'Close' : 'Add spend'}
          </Button>
        </div>

        {open && (
          <form onSubmit={submit} className="space-y-4 pt-2 border-t border-border">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label>Day *</Label>
                <Input type="date" value={day} onChange={(e) => setDay(e.target.value)} required />
              </div>
              <div className="space-y-1.5">
                <Label>Source *</Label>
                <Input value={source} onChange={(e) => setSource(e.target.value)} placeholder="instagram" required />
              </div>
              <div className="space-y-1.5">
                <Label>Medium</Label>
                <Input value={medium} onChange={(e) => setMedium(e.target.value)} placeholder="paid_social" />
              </div>
              <div className="space-y-1.5">
                <Label>Campaign</Label>
                <Input value={campaign} onChange={(e) => setCampaign(e.target.value)} placeholder="may_2026" />
              </div>
              <div className="space-y-1.5">
                <Label>Amount (USD) *</Label>
                <Input type="number" min="0" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="25.00" required />
              </div>
              <div className="space-y-1.5 sm:col-span-3">
                <Label>Notes</Label>
                <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="optional" />
              </div>
            </div>

            {err && (
              <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {err}
              </div>
            )}
            {msg && (
              <div className="flex items-center gap-2 rounded-lg border border-positive/30 bg-positive/10 px-4 py-3 text-sm text-positive">
                {msg}
              </div>
            )}

            <div className="flex gap-2">
              <Button type="submit" size="sm" disabled={saving}>
                {saving ? 'Saving…' : 'Save spend'}
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={reset} disabled={saving}>
                Clear
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Re-saving the same day + source + medium + campaign overwrites the existing row.
            </p>
          </form>
        )}
      </CardContent>
    </Card>
  );
};

export default GrowthDashboard;
