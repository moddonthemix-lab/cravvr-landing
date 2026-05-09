import React, { useState, useEffect } from 'react';
import { fetchOwnerPayments } from '../../services/payments';
import { Icons } from '../common/Icons';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const TIME_RANGES = [
  { key: 'today', label: 'Today' },
  { key: 'week', label: 'Last 7 days' },
  { key: 'month', label: 'Last 30 days' },
  { key: 'all', label: 'All time' },
];

const PAYMENT_STATUS_BADGE = {
  succeeded: 'positive',
  processing: 'warning',
  failed: 'destructive',
  refunded: 'secondary',
  partially_refunded: 'secondary',
  pending: 'outline',
};

const PaymentsDashboard = ({ trucks }) => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('week');

  useEffect(() => {
    const fetchPayments = async () => {
      setLoading(true);
      try {
        const rows = await fetchOwnerPayments(trucks.map((t) => t.id), { range: timeRange });
        setPayments(rows);
      } catch (err) {
        console.error('Error fetching payments:', err);
      } finally {
        setLoading(false);
      }
    };

    if (trucks.length > 0) fetchPayments();
  }, [trucks, timeRange]);

  const totalRevenue = payments
    .filter(p => p.status === 'succeeded')
    .reduce((sum, p) => sum + (p.amount - p.platform_fee) / 100, 0);

  const totalFees = payments
    .filter(p => p.status === 'succeeded')
    .reduce((sum, p) => sum + p.platform_fee / 100, 0);

  const totalRefunds = payments
    .filter(p => ['refunded', 'partially_refunded'].includes(p.status))
    .reduce((sum, p) => sum + p.refund_amount / 100, 0);

  const stats = [
    { label: 'Net revenue', value: `$${totalRevenue.toFixed(2)}`, tone: 'positive', iconKey: 'dollarSign' },
    { label: 'Platform fees', value: `$${totalFees.toFixed(2)}`, tone: 'info', iconKey: 'creditCard' },
    { label: 'Refunds', value: `$${totalRefunds.toFixed(2)}`, tone: 'warning', iconKey: 'refresh' },
    { label: 'Transactions', value: payments.length, tone: 'info', iconKey: 'orders' },
  ];

  const TONE_CHIP = {
    positive: 'bg-positive/10 text-positive',
    warning: 'bg-warning/10 text-warning',
    info: 'bg-info/10 text-info',
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Payments</h2>
          <p className="text-sm text-muted-foreground">
            Transaction history and payouts across your trucks.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {TIME_RANGES.map(range => {
            const isActive = timeRange === range.key;
            return (
              <button
                key={range.key}
                onClick={() => setTimeRange(range.key)}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                  isActive
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground'
                )}
              >
                {range.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map(stat => (
          <Card key={stat.label}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className={cn('flex h-9 w-9 items-center justify-center rounded-lg shrink-0', TONE_CHIP[stat.tone])}>
                <span className="h-4 w-4">{Icons[stat.iconKey] || Icons.dollarSign}</span>
              </div>
              <div className="min-w-0">
                <div className="text-xl font-bold tracking-tight leading-tight tabular-nums truncate">
                  {stat.value}
                </div>
                <div className="text-xs text-muted-foreground truncate">{stat.label}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {loading ? (
        <Card>
          <CardContent className="flex items-center justify-center gap-2 py-12 text-sm text-muted-foreground">
            <span className="h-4 w-4 animate-spin">{Icons.loader}</span>
            Loading payments…
          </CardContent>
        </Card>
      ) : payments.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground mb-3">
              <span className="h-5 w-5">{Icons.creditCard}</span>
            </div>
            <h3 className="text-base font-semibold">No payments yet</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Transactions will appear here once customers start paying online.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Table view (md+) */}
          <Card className="hidden md:block overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/40 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    <th className="px-4 py-3">Order</th>
                    <th className="px-4 py-3">Truck</th>
                    <th className="px-4 py-3">Amount</th>
                    <th className="px-4 py-3">Fee</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {payments.map(payment => (
                    <tr key={payment.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 font-semibold">
                        #{payment.orders?.order_number || '—'}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {payment.food_trucks?.name || '—'}
                      </td>
                      <td className="px-4 py-3 font-semibold tabular-nums">
                        ${(payment.amount / 100).toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground tabular-nums">
                        ${(payment.platform_fee / 100).toFixed(2)}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={PAYMENT_STATUS_BADGE[payment.status] || 'secondary'}>
                          {payment.status?.replace(/_/g, ' ')}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground tabular-nums">
                        {new Date(payment.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Stacked card view (mobile) */}
          <div className="md:hidden flex flex-col gap-3">
            {payments.map(payment => (
              <Card key={payment.id}>
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-sm">
                        #{payment.orders?.order_number || '—'}
                      </div>
                      <div className="text-xs text-muted-foreground truncate">
                        {payment.food_trucks?.name || '—'}
                      </div>
                    </div>
                    <Badge variant={PAYMENT_STATUS_BADGE[payment.status] || 'secondary'} className="shrink-0">
                      {payment.status?.replace(/_/g, ' ')}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span className="tabular-nums">
                      Fee ${(payment.platform_fee / 100).toFixed(2)}
                    </span>
                    <span className="tabular-nums">
                      {new Date(payment.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between border-t pt-2">
                    <span className="text-xs text-muted-foreground">Amount</span>
                    <span className="text-sm font-bold tabular-nums">
                      ${(payment.amount / 100).toFixed(2)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default PaymentsDashboard;
