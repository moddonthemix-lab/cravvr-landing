import React, { useEffect, useState } from 'react';
import { BarChart, BarList } from '@tremor/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Icons } from '../common/Icons';
import { useCravvrSubscription } from '../../hooks/useCravvrSubscription';

const AnalyticsTab = ({ trucks, orders }) => {
  const { isPlus, plans, openCheckout, loading: subLoading } = useCravvrSubscription();
  const [period, setPeriod] = useState('week');
  const [upgrading, setUpgrading] = useState(false);

  // Free users are locked to the weekly view. If their state somehow holds
  // a gated period (e.g. a stored preference from before the gate), snap back.
  useEffect(() => {
    if (!subLoading && !isPlus && period !== 'week') setPeriod('week');
  }, [subLoading, isPlus, period]);

  const plusPlan = plans?.find?.((p) => p.code === 'plus');
  const plusPriceLabel = plusPlan
    ? `$${(plusPlan.price_cents / 100).toFixed(plusPlan.price_cents % 100 === 0 ? 0 : 2)}/${plusPlan.interval || 'mo'}`
    : '';

  const handleUpgrade = async () => {
    setUpgrading(true);
    try { await openCheckout('plus'); }
    catch { setUpgrading(false); }
  };

  const lockSuffix = isPlus ? '' : ' — Cravvr Go';

  const getDateRange = () => {
    const now = new Date();
    switch (period) {
      case 'week': return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      case 'month': {
        const d = new Date(now);
        d.setMonth(d.getMonth() - 1);
        return d;
      }
      case '30days': return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      case 'year': {
        const d = new Date(now);
        d.setFullYear(d.getFullYear() - 1);
        return d;
      }
      default: return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }
  };

  const periodStart = getDateRange();
  const periodOrders = orders.filter(o => new Date(o.created_at) >= periodStart);

  const getChartData = () => {
    if (period === 'week') {
      const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      const data = days.map(day => ({ label: day, orders: 0, revenue: 0 }));
      periodOrders.forEach(order => {
        const dayIndex = (new Date(order.created_at).getDay() + 6) % 7;
        data[dayIndex].orders += 1;
        data[dayIndex].revenue += parseFloat(order.total || 0);
      });
      return data;
    } else if (period === 'month' || period === '30days') {
      const weeks = [];
      for (let i = 0; i < 4; i++) {
        weeks.push({ label: `Week ${i + 1}`, orders: 0, revenue: 0 });
      }
      periodOrders.forEach(order => {
        const daysSinceStart = Math.floor((new Date(order.created_at) - periodStart) / (24 * 60 * 60 * 1000));
        const weekIndex = Math.min(Math.floor(daysSinceStart / 7), 3);
        weeks[weekIndex].orders += 1;
        weeks[weekIndex].revenue += parseFloat(order.total || 0);
      });
      return weeks;
    } else {
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const data = months.map(m => ({ label: m, orders: 0, revenue: 0 }));
      periodOrders.forEach(order => {
        const monthIndex = new Date(order.created_at).getMonth();
        data[monthIndex].orders += 1;
        data[monthIndex].revenue += parseFloat(order.total || 0);
      });
      return data;
    }
  };

  const chartData = getChartData();
  const totalRevenue = periodOrders.reduce((sum, o) => sum + parseFloat(o.total || 0), 0);
  const totalOrders = periodOrders.length;

  const avgOrderValue = periodOrders.length > 0
    ? totalRevenue / periodOrders.length
    : 0;

  const dayCount = Math.max(1, Math.ceil((Date.now() - periodStart.getTime()) / (24 * 60 * 60 * 1000)));
  const ordersPerDay = periodOrders.length > 0 ? (periodOrders.length / dayCount).toFixed(1) : 0;

  const bestTruck = trucks.reduce((best, truck) => {
    if (!best || (truck.today_revenue || 0) > (best.today_revenue || 0)) return truck;
    return best;
  }, null);

  const periodLabels = {
    week: 'This Week',
    month: 'This Month',
    '30days': 'Last 30 Days',
    year: 'This Year',
  };

  const chartTitle = period === 'week' ? 'Daily Revenue' : period === 'year' ? 'Monthly Revenue' : 'Weekly Revenue';

  // Tremor BarChart expects data with a categorical axis key + value keys.
  const chartDataForTremor = chartData.map(d => ({ date: d.label, Revenue: d.revenue }));

  // Tremor BarList expects { name, value } items.
  const truckPerformanceData = trucks
    .map(t => ({ name: t.name, value: Math.round(t.today_revenue || 0) }))
    .sort((a, b) => b.value - a.value);

  return (
    <div className="tab-content">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
          <p className="text-sm text-muted-foreground">
            Track your performance and insights.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            className="h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
          >
            <option value="week">This Week</option>
            <option value="month" disabled={!isPlus && !subLoading}>This Month{lockSuffix}</option>
            <option value="30days" disabled={!isPlus && !subLoading}>Last 30 Days{lockSuffix}</option>
            <option value="year" disabled={!isPlus && !subLoading}>This Year{lockSuffix}</option>
          </select>
          {!isPlus && !subLoading && (
            <Button
              size="sm"
              onClick={handleUpgrade}
              disabled={upgrading}
            >
              {upgrading
                ? 'Loading…'
                : `Unlock Cravvr Go${plusPriceLabel ? ` — ${plusPriceLabel}` : ''}`}
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle>{chartTitle}</CardTitle>
            <span className="text-sm font-semibold tabular-nums text-positive">
              ${totalRevenue.toFixed(0)} total
            </span>
          </CardHeader>
          <CardContent>
            <BarChart
              data={chartDataForTremor}
              index="date"
              categories={['Revenue']}
              colors={['rose']}
              valueFormatter={(v) => `$${v.toFixed(0)}`}
              yAxisWidth={48}
              showLegend={false}
              className="h-64"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Truck Performance</CardTitle>
          </CardHeader>
          <CardContent>
            {truckPerformanceData.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4">No trucks yet</p>
            ) : (
              <BarList
                data={truckPerformanceData}
                valueFormatter={(v) => `$${v}`}
                color="rose"
                className="text-sm"
              />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Performance Metrics</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="divide-y divide-border">
              <li className="flex items-center justify-between py-2.5 first:pt-0 last:pb-0">
                <span className="text-sm text-muted-foreground">Average Order Value</span>
                <span className="text-sm font-semibold tabular-nums">
                  ${avgOrderValue.toFixed(2)}
                </span>
              </li>
              <li className="flex items-center justify-between py-2.5">
                <span className="text-sm text-muted-foreground">Orders Per Day</span>
                <span className="text-sm font-semibold tabular-nums">{ordersPerDay}</span>
              </li>
              <li className="flex items-center justify-between py-2.5">
                <span className="text-sm text-muted-foreground">
                  {periodLabels[period]} Orders
                </span>
                <span className="text-sm font-semibold tabular-nums">{totalOrders}</span>
              </li>
              <li className="flex items-center justify-between py-2.5 last:pb-0">
                <span className="text-sm text-muted-foreground">Active Trucks</span>
                <span className="text-sm font-semibold tabular-nums">
                  {trucks.filter(t => t.is_open).length}/{trucks.length}
                </span>
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Insights</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="flex items-center gap-3 rounded-lg border bg-card p-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-info/10 text-info shrink-0">
                  {Icons.chart}
                </span>
                <div className="min-w-0">
                  <div className="text-xs text-muted-foreground">Total Orders</div>
                  <div className="text-sm font-semibold truncate">
                    {orders.length} all time
                  </div>
                </div>
              </div>
              {bestTruck && (
                <div className="flex items-center gap-3 rounded-lg border bg-card p-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-positive/10 text-positive shrink-0">
                    {Icons.truck}
                  </span>
                  <div className="min-w-0">
                    <div className="text-xs text-muted-foreground">Best Today</div>
                    <div className="text-sm font-semibold truncate">{bestTruck.name}</div>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-3 rounded-lg border bg-card p-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/10 text-warning shrink-0">
                  {Icons.star}
                </span>
                <div className="min-w-0">
                  <div className="text-xs text-muted-foreground">Average Rating</div>
                  <div className="text-sm font-semibold">
                    {trucks.filter(t => t.average_rating).length > 0
                      ? (
                          trucks
                            .filter(t => t.average_rating)
                            .reduce((sum, t) => sum + parseFloat(t.average_rating), 0) /
                          trucks.filter(t => t.average_rating).length
                        ).toFixed(1)
                      : 'N/A'}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AnalyticsTab;
