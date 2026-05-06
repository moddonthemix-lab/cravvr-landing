import React, { useEffect, useMemo, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { supabase } from '../../../lib/supabase';
import { Icons } from '../../../components/common/Icons';

const RANGES = [
  { value: 7, label: '7 days' },
  { value: 30, label: '30 days' },
  { value: 90, label: '90 days' },
  { value: 365, label: '1 year' },
];

const fmtMoney = (cents) => `$${(cents / 100).toFixed(2)}`;

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
        const [ordersRes, reviewsRes] = await Promise.all([
          supabase
            .from('orders')
            .select('id, total, status, payment_status, created_at')
            .eq('truck_id', truck.id)
            .gte('created_at', since)
            .order('created_at', { ascending: true }),
          supabase
            .from('reviews')
            .select('id, rating, created_at, hidden_at, is_hidden')
            .eq('truck_id', truck.id)
            .gte('created_at', since)
            .order('created_at', { ascending: true }),
        ]);
        if (!cancelled) {
          setOrders(ordersRes.data || []);
          setReviews(reviewsRes.data || []);
        }
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

  // Build daily revenue spark
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
    <div className="admin-tab-form">
      <div className="admin-tab-header">
        <h2>Analytics</h2>
        <select value={days} onChange={(e) => setDays(Number(e.target.value))}>
          {RANGES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="loading-state">{Icons.loader} Loading...</div>
      ) : (
        <>
          <div className="metric-grid">
            <Metric label="Revenue" value={fmtMoney(stats.revenue)} />
            <Metric label="Completed orders" value={stats.completedCount} />
            <Metric label="Avg order value" value={fmtMoney(stats.aov)} />
            <Metric label="Cancelled / rejected" value={stats.cancelledCount} tone={stats.cancelledCount > 0 ? 'warning' : 'neutral'} />
            <Metric label="Reviews" value={stats.reviewCount} />
            <Metric label="Avg rating" value={stats.avgRating ?? '—'} />
          </div>

          <h3 style={{ marginTop: 24 }}>Daily revenue</h3>
          <div className="spark-bars">
            {dailyRevenue.map(([day, v]) => (
              <div key={day} className="spark-col" title={`${day}: ${fmtMoney(v)}`}>
                <div className="spark-bar" style={{ height: `${(v / peak) * 100}%` }} />
              </div>
            ))}
          </div>
          <p className="cell-sub">Peak: {fmtMoney(peak)} on best day in window.</p>
        </>
      )}
    </div>
  );
};

const Metric = ({ label, value, tone = 'neutral' }) => (
  <div className={`admin-metric tone-${tone}`}>
    <span className="admin-metric-label">{label}</span>
    <span className="admin-metric-value">{value}</span>
  </div>
);

export default AnalyticsTab;
