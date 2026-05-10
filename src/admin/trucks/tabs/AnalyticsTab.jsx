import React, { useEffect, useMemo, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { fetchAdminTruckAnalytics } from '../../../services/admin';
import { Card, CardContent } from '@/components/ui/card';
import LoadingSplash from '../../../components/common/LoadingSplash';
import { cn } from '@/lib/utils';

const RANGES = [
  { value: 7, label: '7 days' },
  { value: 30, label: '30 days' },
  { value: 90, label: '90 days' },
  { value: 365, label: '1 year' },
];

const fmtMoney = (cents) => `$${(cents / 100).toFixed(2)}`;

const Metric = ({ label, value, tone = 'neutral' }) => (
  <Card>
    <CardContent className="p-4 space-y-1">
      <span className="block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      <span
        className={cn(
          'block text-2xl font-bold tabular-nums tracking-tight',
          tone === 'warning' && 'text-warning'
        )}
      >
        {value}
      </span>
    </CardContent>
  </Card>
);

const AnalyticsTab = () => {
  const { truck } = useOutletContext();
  const [orders, setOrders] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [days, setDays] = useState(30);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
        const { orders: ordersData, reviews: reviewsData } =
          await fetchAdminTruckAnalytics(truck.id, since);
        if (!cancelled) {
          setOrders(ordersData);
          setReviews(reviewsData);
        }
      } catch (err) {
        if (!cancelled) console.error('Analytics fetch failed:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [truck.id, days]);

  const stats = useMemo(() => {
    const completed = orders.filter(o => o.status === 'completed' || o.payment_status === 'paid');
    const revenue = completed.reduce((s, o) => s + Math.round((parseFloat(o.total) || 0) * 100), 0);
    const cancelled = orders.filter(o => ['cancelled', 'rejected'].includes(o.status)).length;
    const aov = completed.length ? Math.round(revenue / completed.length) : 0;
    const visibleReviews = reviews.filter(r => !r.hidden_at && !r.is_hidden);
    const avgRating = visibleReviews.length
      ? (visibleReviews.reduce((s, r) => s + (r.rating || 0), 0) / visibleReviews.length).toFixed(2)
      : null;
    return {
      orderCount: orders.length,
      completedCount: completed.length,
      cancelledCount: cancelled,
      revenue,
      aov,
      reviewCount: visibleReviews.length,
      avgRating,
    };
  }, [orders, reviews]);

  const dailyRevenue = useMemo(() => {
    const map = new Map();
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setHours(0, 0, 0, 0);
      d.setDate(d.getDate() - i);
      map.set(d.toISOString().slice(0, 10), 0);
    }
    for (const o of orders) {
      if (!(o.status === 'completed' || o.payment_status === 'paid')) continue;
      const key = (o.created_at || '').slice(0, 10);
      if (map.has(key)) map.set(key, map.get(key) + Math.round((parseFloat(o.total) || 0) * 100));
    }
    return [...map.entries()];
  }, [orders, days]);

  const peak = Math.max(1, ...dailyRevenue.map(([, v]) => v));

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 py-6 space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-xl font-bold tracking-tight">Analytics</h2>
        <select
          value={days}
          onChange={(e) => setDays(Number(e.target.value))}
          className="h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        >
          {RANGES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
        </select>
      </div>

      {loading ? (
        <LoadingSplash size="inline" tagline="LOADING ANALYTICS" />
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
            <Metric label="Revenue" value={fmtMoney(stats.revenue)} />
            <Metric label="Completed orders" value={stats.completedCount} />
            <Metric label="Avg order value" value={fmtMoney(stats.aov)} />
            <Metric
              label="Cancelled / rejected"
              value={stats.cancelledCount}
              tone={stats.cancelledCount > 0 ? 'warning' : 'neutral'}
            />
            <Metric label="Reviews" value={stats.reviewCount} />
            <Metric label="Avg rating" value={stats.avgRating ?? '—'} />
          </div>

          <Card>
            <CardContent className="p-5 space-y-3">
              <h3 className="text-base font-bold">Daily revenue</h3>
              <div className="flex h-32 items-end gap-1">
                {dailyRevenue.map(([day, v]) => (
                  <div
                    key={day}
                    className="flex-1 min-w-[2px] flex flex-col justify-end"
                    title={`${day}: ${fmtMoney(v)}`}
                  >
                    <div
                      className="w-full rounded-t-sm bg-primary/70 transition-all hover:bg-primary"
                      style={{ height: `${(v / peak) * 100}%`, minHeight: v > 0 ? '2px' : 0 }}
                    />
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground tabular-nums">
                Peak: {fmtMoney(peak)} on best day in window.
              </p>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default AnalyticsTab;
