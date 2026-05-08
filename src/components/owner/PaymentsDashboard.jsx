import React, { useState, useEffect } from 'react';
import { fetchOwnerPayments } from '../../services/payments';
import { Icons } from '../common/Icons';

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

  const statusBadge = (status) => {
    const colors = {
      succeeded: '#22c55e',
      processing: '#f97316',
      failed: '#ef4444',
      refunded: '#8b5cf6',
      partially_refunded: '#8b5cf6',
      pending: '#999',
    };
    return (
      <span className="payment-status-badge" style={{ color: colors[status] || '#999' }}>
        {status}
      </span>
    );
  };

  return (
    <div className="payments-dashboard">
      <div className="payments-header">
        <h3>Payments</h3>
        <div className="payments-filters">
          {['today', 'week', 'month', 'all'].map(range => (
            <button
              key={range}
              className={`filter-btn ${timeRange === range ? 'active' : ''}`}
              onClick={() => setTimeRange(range)}
            >
              {range.charAt(0).toUpperCase() + range.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="payments-stats">
        <div className="payment-stat">
          <span className="stat-label">Net Revenue</span>
          <span className="stat-value">${totalRevenue.toFixed(2)}</span>
        </div>
        <div className="payment-stat">
          <span className="stat-label">Platform Fees</span>
          <span className="stat-value">${totalFees.toFixed(2)}</span>
        </div>
        <div className="payment-stat">
          <span className="stat-label">Refunds</span>
          <span className="stat-value">${totalRefunds.toFixed(2)}</span>
        </div>
        <div className="payment-stat">
          <span className="stat-label">Transactions</span>
          <span className="stat-value">{payments.length}</span>
        </div>
      </div>

      {loading ? (
        <div className="payments-loading">Loading payments...</div>
      ) : payments.length === 0 ? (
        <div className="payments-empty">
          <p>No payments found for this period.</p>
        </div>
      ) : (
        <div className="payments-table">
          <div className="table-header">
            <span>Order</span>
            <span>Truck</span>
            <span>Amount</span>
            <span>Fee</span>
            <span>Status</span>
            <span>Date</span>
          </div>
          {payments.map(payment => (
            <div key={payment.id} className="table-row">
              <span className="payment-order">#{payment.orders?.order_number || '\u2014'}</span>
              <span className="payment-truck">{payment.food_trucks?.name || '\u2014'}</span>
              <span className="payment-amount">${(payment.amount / 100).toFixed(2)}</span>
              <span className="payment-fee">${(payment.platform_fee / 100).toFixed(2)}</span>
              <span>{statusBadge(payment.status)}</span>
              <span className="payment-date">{new Date(payment.created_at).toLocaleDateString()}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PaymentsDashboard;
