import React, { useCallback, useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { fetchAdminTruckOrders } from '../../../services/admin';
import { Icons } from '../../../components/common/Icons';
import { useConfirm } from '../../../contexts/ConfirmContext';
import { useAuth } from '../../../components/auth/AuthContext';
import { useTruckAdmin } from '../hooks/useTruckAdmin';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import LoadingSplash from '../../../components/common/LoadingSplash';

const STATUSES = ['all', 'pending', 'confirmed', 'preparing', 'ready', 'completed', 'cancelled', 'rejected'];

const STATUS_BADGE = {
  pending: 'info',
  confirmed: 'info',
  preparing: 'warning',
  ready: 'positive',
  completed: 'secondary',
  cancelled: 'destructive',
  rejected: 'destructive',
};

const OrdersTab = () => {
  const { truck } = useOutletContext();
  const { forceCancelOrder, busy } = useTruckAdmin();
  const { prompt } = useConfirm();
  const { hasAdminPermission } = useAuth();
  const canCancel = hasAdminPermission('order.force_cancel');
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      setOrders(await fetchAdminTruckOrders(truck.id, { status: filter }));
    } catch (err) {
      console.error(err);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [truck.id, filter]);

  useEffect(() => { fetch(); }, [fetch]);

  const handleCancel = async (order) => {
    const reason = await prompt({
      title: `Force cancel ${order.order_number}`,
      message: 'This cancels the order regardless of state. Reason is recorded in audit log.',
      confirmText: 'Force cancel',
      variant: 'danger',
      inputLabel: 'Reason',
    });
    if (!reason) return;
    await forceCancelOrder(order.id, reason);
    fetch();
  };

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 py-6 space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-xl font-bold tracking-tight">Orders</h2>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="h-9 rounded-md border border-input bg-background px-3 text-sm capitalize focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        >
          {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {loading ? (
        <LoadingSplash size="inline" tagline="LOADING ORDERS" />
      ) : orders.length === 0 ? (
        <Card>
          <CardContent className="flex items-center justify-center py-10 text-sm text-muted-foreground">
            No orders for this filter.
          </CardContent>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  <th className="px-4 py-3">Order</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Payment</th>
                  <th className="px-4 py-3">Total</th>
                  <th className="px-4 py-3">Created</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {orders.map(o => (
                  <tr key={o.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 font-semibold">{o.order_number}</td>
                    <td className="px-4 py-3">
                      <Badge variant={STATUS_BADGE[o.status] || 'secondary'}>{o.status}</Badge>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {o.payment_status || '—'}
                    </td>
                    <td className="px-4 py-3 font-semibold tabular-nums">
                      ${parseFloat(o.total || 0).toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground tabular-nums">
                      {new Date(o.created_at).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {canCancel && !['cancelled', 'rejected', 'completed'].includes(o.status) && (
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={busy}
                          onClick={() => handleCancel(o)}
                          className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                        >
                          Force cancel
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
};

export default OrdersTab;
