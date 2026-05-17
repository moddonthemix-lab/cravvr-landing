import React, { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Icons } from '../common/Icons';
import { cn } from '@/lib/utils';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

const ENDPOINT = `${SUPABASE_URL}/functions/v1/marketing-insights`;

const fmtPct = (v) => (v == null ? '—' : `${(v * 100).toFixed(1)}%`);

const statusBadge = {
  winner: { label: 'Winner', tone: 'positive' },
  losing: { label: 'Losing', tone: 'destructive' },
  too_early: { label: 'Too early', tone: 'outline' },
};

const MarketingInsights = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [days, setDays] = useState(7);

  const fetchData = async (d = days) => {
    setLoading(true);
    setError('');
    try {
      const token = (await window.Clerk?.session?.getToken()) || SUPABASE_ANON_KEY;
      const res = await fetch(`${ENDPOINT}?days=${d}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'apikey': SUPABASE_ANON_KEY,
        },
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || `http ${res.status}`);
      setData(json);
    } catch (e) {
      setError(String(e.message || e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(days); /* eslint-disable-next-line */ }, [days]);

  return (
    <div className="space-y-6 mb-8">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Marketing Insights</h2>
          <p className="text-sm text-muted-foreground">
            Funnel attribution across all <code>/for-trucks/*</code> traffic.
            {data?.ai_recommendations_error
              ? ` AI summary failed: ${data.ai_recommendations_error}` : ''}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {[7, 14, 30].map((d) => (
            <Button
              key={d}
              variant={days === d ? 'default' : 'outline'}
              size="sm"
              onClick={() => setDays(d)}
            >
              {d}d
            </Button>
          ))}
          <Button variant="outline" size="sm" onClick={() => fetchData()} disabled={loading}>
            {loading ? <span className="h-4 w-4 animate-spin">{Icons.loader}</span> : 'Refresh'}
          </Button>
        </div>
      </div>

      {error && (
        <div className="rounded-md bg-destructive/10 border border-destructive/30 px-3 py-2 text-sm text-destructive">
          {error}
        </div>
      )}

      {!data && !error && (
        <div className="rounded-md border border-border bg-muted/30 p-6 text-center text-sm text-muted-foreground">
          {loading ? 'Loading insights…' : 'No data yet.'}
        </div>
      )}

      {data && (
        <>
          {/* Headline KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <Stat label="Views" value={data.summary.total_views} />
            <Stat label="Leads" value={data.summary.total_leads} />
            <Stat label="Onboarded" value={data.summary.total_onboarded} />
            <Stat label="View → Lead" value={fmtPct(data.summary.submit_rate)} />
            <Stat label="Avg lead score" value={data.summary.avg_lead_score ?? '—'} />
          </div>

          {/* AI digest */}
          {data.ai_recommendations && (
            <Card className="border-primary/40 bg-primary/5">
              <CardContent className="p-5">
                <div className="flex items-center gap-2 mb-3">
                  <span className="h-4 w-4 text-primary">{Icons.sparkles || Icons.zap || '✨'}</span>
                  <h3 className="font-semibold">AI recommendations</h3>
                </div>
                <div className="prose prose-sm max-w-none text-foreground">
                  <ReactMarkdown>{data.ai_recommendations}</ReactMarkdown>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Creative leaderboard */}
          <Card>
            <CardContent className="p-0">
              <div className="px-5 py-4 border-b border-border">
                <h3 className="font-semibold">Creative leaderboard</h3>
                <p className="text-xs text-muted-foreground">By source/campaign/content (utm_content)</p>
              </div>
              <table className="w-full text-sm">
                <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="text-left px-5 py-2 font-semibold">Creative</th>
                    <th className="text-right px-3 py-2 font-semibold">Views</th>
                    <th className="text-right px-3 py-2 font-semibold">Leads</th>
                    <th className="text-right px-3 py-2 font-semibold">Onboarded</th>
                    <th className="text-right px-3 py-2 font-semibold">Conv.</th>
                    <th className="text-center px-3 py-2 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {data.by_creative.length === 0 && (
                    <tr><td colSpan={6} className="px-5 py-6 text-center text-muted-foreground">No creative data yet — launch some ads.</td></tr>
                  )}
                  {data.by_creative.map((r) => {
                    const s = statusBadge[r.status] || statusBadge.too_early;
                    return (
                      <tr key={r.key} className="border-t border-border">
                        <td className="px-5 py-2 font-mono text-xs">{r.key}</td>
                        <td className="text-right px-3 py-2 tabular-nums">{r.unique_views}</td>
                        <td className="text-right px-3 py-2 tabular-nums">{r.submits}</td>
                        <td className="text-right px-3 py-2 tabular-nums">{r.onboarded}</td>
                        <td className="text-right px-3 py-2 tabular-nums">{fmtPct(r.submit_rate)}</td>
                        <td className="text-center px-3 py-2"><Badge variant={s.tone}>{s.label}</Badge></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </CardContent>
          </Card>

          {/* Top open leads by score */}
          <Card>
            <CardContent className="p-0">
              <div className="px-5 py-4 border-b border-border">
                <h3 className="font-semibold">Open leads — ranked by score</h3>
                <p className="text-xs text-muted-foreground">Score combines engagement, source quality, and form completeness (0–100).</p>
              </div>
              <table className="w-full text-sm">
                <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="text-left px-5 py-2 font-semibold">Lead</th>
                    <th className="text-left px-3 py-2 font-semibold">City</th>
                    <th className="text-left px-3 py-2 font-semibold">Source</th>
                    <th className="text-right px-3 py-2 font-semibold">Views</th>
                    <th className="text-right px-3 py-2 font-semibold">Score</th>
                  </tr>
                </thead>
                <tbody>
                  {data.open_leads_top_20.length === 0 && (
                    <tr><td colSpan={5} className="px-5 py-6 text-center text-muted-foreground">No open leads.</td></tr>
                  )}
                  {data.open_leads_top_20.map((l) => (
                    <tr key={l.id} className="border-t border-border">
                      <td className="px-5 py-2">
                        <div className="font-semibold">{l.name}</div>
                        <div className="text-xs text-muted-foreground">{l.truck_name || '—'}</div>
                      </td>
                      <td className="px-3 py-2 capitalize">{l.city}</td>
                      <td className="px-3 py-2 text-xs font-mono text-muted-foreground">
                        {l.last_utm_source || 'direct'}{l.last_utm_content ? ` / ${l.last_utm_content}` : ''}
                      </td>
                      <td className="text-right px-3 py-2 tabular-nums">{l.pageviews_before_submit}</td>
                      <td className="text-right px-3 py-2 tabular-nums font-semibold">
                        <span className={cn(
                          'inline-block min-w-[40px] rounded px-2 py-0.5 text-xs',
                          l.lead_score >= 70 ? 'bg-positive/15 text-positive' :
                          l.lead_score >= 40 ? 'bg-warning/15 text-warning' :
                          'bg-muted text-muted-foreground'
                        )}>{l.lead_score}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

const Stat = ({ label, value }) => (
  <Card>
    <CardContent className="p-4">
      <div className="text-2xl font-bold tabular-nums">{value}</div>
      <div className="text-xs text-muted-foreground mt-1">{label}</div>
    </CardContent>
  </Card>
);

export default MarketingInsights;
