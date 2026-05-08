import React, { useCallback, useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { fetchAdminTruckOrders } from '../../../services/admin';
import { Icons } from '../../../components/common/Icons';
import { useConfirm } from '../../../contexts/ConfirmContext';
import { useAuth } from '../../../components/auth/AuthContext';
import { useTruckAdmin } from '../hooks/useTruckAdmin';

const STATUSES = ['all', 'pending', 'confirmed', 'preparing', 'ready', 'completed', 'cancelled', 'rejected'];

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
    <div className="admin-tab-form">
      <div className="admin-tab-header">
        <h2>Orders</h2>
        <select value={filter} onChange={(e) => setFilter(e.target.value)}>
          {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="loading-state">{Icons.loader} Loading...</div>
      ) : orders.length === 0 ? (
        <p className="cell-sub">No orders for this filter.</p>
      ) : (
        <table className="admin-trucks-table">
          <thead>
            <tr>
              <th>Order</th>
              <th>Status</th>
              <th>Payment</th>
              <th>Total</th>
              <th>Created</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {orders.map(o => (
              <tr key={o.id}>
                <td>{o.order_number}</td>
                <td><span className={`admin-badge admin-badge-${o.status === 'cancelled' || o.status === 'rejected' ? 'danger' : o.status === 'completed' ? 'success' : 'neutral'}`}>{o.status}</span></td>
                <td className="cell-sub">{o.payment_status || '—'}</td>
                <td>${parseFloat(o.total || 0).toFixed(2)}</td>
                <td className="cell-sub">{new Date(o.created_at).toLocaleString()}</td>
                <td>
                  {canCancel && !['cancelled', 'rejected', 'completed'].includes(o.status) && (
                    <button className="btn-link danger" disabled={busy} onClick={() => handleCancel(o)}>
                      Force cancel
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default OrdersTab;
