import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from '../../lib/supabase';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Legend,
} from 'recharts';
import { format, subDays } from 'date-fns';

const formatCents = (cents) => {
  if (cents == null) return '—';
  return `$${(cents / 100).toFixed(2)}`;
};
const formatRatio = (n) => (n == null ? '—' : `${Number(n).toFixed(2)}x`);

const ratioBadgeColor = (r) => {
  if (r == null) return '#9ca3af';
  if (r >= 3) return '#16a34a';
  if (r >= 1) return '#eab308';
  return '#dc2626';
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
        supabase
          .from('cohort_performance_v')
          .select('*')
          .order('cohort_week', { ascending: false })
          .limit(200),
        supabase
          .from('daily_channel_performance')
          .select('*')
          .gte('day', format(subDays(new Date(), 30), 'yyyy-MM-dd'))
          .order('day', { ascending: true }),
        supabase
          .from('ad_spend')
          .select('*')
          .gte('day', format(subDays(new Date(), 30), 'yyyy-MM-dd'))
          .order('day', { ascending: true }),
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
      const { error } = await supabase.rpc('refresh_cohort_performance');
      if (error) throw error;
      await load();
    } catch (e) {
      setError(e.message || String(e));
    } finally {
      setRefreshing(false);
    }
  };

  // Top-line metrics — trailing 30 days.
  const summary = useMemo(() => {
    const revenue = daily.reduce((sum, d) => sum + Number(d.revenue || 0), 0);
    const orders = daily.reduce((sum, d) => sum + Number(d.orders || 0), 0);
    const newCustomers = daily.reduce((sum, d) => sum + Number(d.new_customers || 0), 0);
    const spend = adSpend.reduce((sum, d) => sum + Number(d.spend_cents || 0), 0) / 100;
    const mer = spend > 0 ? revenue / spend : null;
    const blendedCac = newCustomers > 0 ? spend / newCustomers : null;
    return { revenue, orders, newCustomers, spend, mer, blendedCac };
  }, [daily, adSpend]);

  // Daily revenue chart data.
  const dailyChart = useMemo(() => {
    const byDay = new Map();
    for (const d of daily) {
      const key = format(new Date(d.day), 'MMM d');
      byDay.set(key, (byDay.get(key) || 0) + Number(d.revenue || 0));
    }
    return Array.from(byDay.entries()).map(([day, revenue]) => ({ day, revenue }));
  }, [daily]);

  // Channel leaderboard: aggregate cohorts across weeks.
  const channelLeaderboard = useMemo(() => {
    const bySource = new Map();
    for (const c of cohorts) {
      const cur = bySource.get(c.source) || {
        source: c.source, new_customers: 0, spend_cents: 0,
        revenue_d30_cents: 0, revenue_d90_cents: 0,
      };
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

  return (
    <div style={{ padding: 24, maxWidth: 1280, margin: '0 auto', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 28 }}>Growth</h1>
          <p style={{ margin: '4px 0 0', color: '#6b7280' }}>
            Per-channel CAC, LTV and cohort performance. Refreshes nightly.
          </p>
        </div>
        <button
          onClick={triggerRefresh}
          disabled={refreshing}
          style={{
            background: '#e11d48', color: 'white', border: 'none',
            padding: '10px 16px', borderRadius: 8, fontWeight: 600,
            cursor: refreshing ? 'wait' : 'pointer',
          }}
        >
          {refreshing ? 'Refreshing…' : 'Recompute now'}
        </button>
      </div>

      {error && (
        <div style={{ background: '#fee2e2', color: '#991b1b', padding: 12, borderRadius: 8, marginBottom: 16 }}>
          {error}
        </div>
      )}

      {/* Top-line cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
        <Card label="Revenue (30d)" value={`$${summary.revenue.toFixed(2)}`} />
        <Card label="Ad spend (30d)" value={`$${summary.spend.toFixed(2)}`} />
        <Card label="Blended MER" value={summary.mer ? formatRatio(summary.mer) : '—'} />
        <Card label="Blended CAC" value={summary.blendedCac ? `$${summary.blendedCac.toFixed(2)}` : '—'} />
        <Card label="New customers (30d)" value={String(summary.newCustomers)} />
        <Card label="Orders (30d)" value={String(summary.orders)} />
      </div>

      {/* Daily revenue */}
      <Section title="Daily revenue (30d)">
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={dailyChart}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="day" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="revenue" stroke="#e11d48" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </Section>

      {/* Channel leaderboard */}
      <Section title="Channel leaderboard (all-time)">
        {channelLeaderboard.length === 0 ? (
          <Empty>No channel data yet — once visitors arrive with UTMs and convert, they'll appear here.</Empty>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ textAlign: 'left', borderBottom: '2px solid #e5e7eb' }}>
                <Th>Source</Th>
                <Th align="right">New customers</Th>
                <Th align="right">Spend</Th>
                <Th align="right">CAC</Th>
                <Th align="right">LTV (d30)</Th>
                <Th align="right">LTV:CAC (d30)</Th>
              </tr>
            </thead>
            <tbody>
              {channelLeaderboard.map((c) => (
                <tr key={c.source} style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <Td><strong>{c.source}</strong></Td>
                  <Td align="right">{c.new_customers}</Td>
                  <Td align="right">{formatCents(c.spend_cents)}</Td>
                  <Td align="right">{formatCents(c.cac_cents)}</Td>
                  <Td align="right">{formatCents(c.ltv_d30_cents)}</Td>
                  <Td align="right">
                    <span style={{
                      background: ratioBadgeColor(c.ltv_cac_d30),
                      color: 'white', padding: '2px 8px', borderRadius: 4, fontSize: 12, fontWeight: 600,
                    }}>
                      {formatRatio(c.ltv_cac_d30)}
                    </span>
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Section>

      {/* Cohort table */}
      <Section title="Cohorts (week × channel)">
        {cohorts.length === 0 ? (
          <Empty>No cohort rows yet. Click "Recompute now" once you have orders, or wait for the nightly job at 03:00 UTC.</Empty>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
            <thead>
              <tr style={{ textAlign: 'left', borderBottom: '2px solid #e5e7eb' }}>
                <Th>Cohort week</Th>
                <Th>Source</Th>
                <Th>Campaign</Th>
                <Th align="right">New cust.</Th>
                <Th align="right">CAC</Th>
                <Th align="right">LTV d7</Th>
                <Th align="right">LTV d30</Th>
                <Th align="right">LTV d90</Th>
                <Th align="right">LTV:CAC d30</Th>
              </tr>
            </thead>
            <tbody>
              {cohorts.map((c) => (
                <tr
                  key={`${c.cohort_week}-${c.source}-${c.medium}-${c.campaign}`}
                  style={{ borderBottom: '1px solid #f3f4f6' }}
                >
                  <Td>{format(new Date(c.cohort_week), 'MMM d, yyyy')}</Td>
                  <Td>{c.source}</Td>
                  <Td>{c.campaign || '—'}</Td>
                  <Td align="right">{c.new_customers}</Td>
                  <Td align="right">{formatCents(c.cac_cents)}</Td>
                  <Td align="right">{formatCents(c.ltv_d7_cents)}</Td>
                  <Td align="right">{formatCents(c.ltv_d30_cents)}</Td>
                  <Td align="right">{formatCents(c.ltv_d90_cents)}</Td>
                  <Td align="right">
                    <span style={{
                      background: ratioBadgeColor(c.ltv_cac_d30),
                      color: 'white', padding: '2px 6px', borderRadius: 4, fontSize: 11, fontWeight: 600,
                    }}>
                      {formatRatio(c.ltv_cac_d30)}
                    </span>
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Section>
    </div>
  );
};

const Card = ({ label, value }) => (
  <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: 8, padding: 16 }}>
    <div style={{ fontSize: 12, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</div>
    <div style={{ fontSize: 24, fontWeight: 700, marginTop: 4 }}>{value}</div>
  </div>
);

const Section = ({ title, children }) => (
  <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: 8, padding: 20, marginBottom: 24 }}>
    <h2 style={{ margin: '0 0 16px', fontSize: 18 }}>{title}</h2>
    {children}
  </div>
);

const Th = ({ children, align }) => (
  <th style={{ padding: '8px 12px', fontSize: 12, color: '#6b7280', fontWeight: 600, textAlign: align || 'left' }}>
    {children}
  </th>
);
const Td = ({ children, align }) => (
  <td style={{ padding: '10px 12px', textAlign: align || 'left' }}>{children}</td>
);
const Empty = ({ children }) => (
  <div style={{ padding: 24, textAlign: 'center', color: '#6b7280' }}>{children}</div>
);

export default GrowthDashboard;
