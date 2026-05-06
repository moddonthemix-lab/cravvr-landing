import React, { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Icons } from '../../../components/common/Icons';
import { useTruckAdmin } from '../hooks/useTruckAdmin';

const SettingsTab = () => {
  const { truck, refetch } = useOutletContext();
  const { updateTruck, busy } = useTruckAdmin();
  const [form, setForm] = useState({
    accepting_orders: true,
    max_queue_size: 10,
    auto_pause_enabled: false,
    estimated_prep_time: '15-25 min',
    stripe_account_id: '',
    stripe_onboarding_complete: false,
    stripe_charges_enabled: false,
  });
  const [reason, setReason] = useState('');

  useEffect(() => {
    setForm({
      accepting_orders: truck.accepting_orders ?? true,
      max_queue_size: truck.max_queue_size ?? 10,
      auto_pause_enabled: !!truck.auto_pause_enabled,
      estimated_prep_time: truck.estimated_prep_time || '15-25 min',
      stripe_account_id: truck.stripe_account_id || '',
      stripe_onboarding_complete: !!truck.stripe_onboarding_complete,
      stripe_charges_enabled: !!truck.stripe_charges_enabled,
    });
  }, [truck]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    await updateTruck(truck.id, {
      accepting_orders: form.accepting_orders,
      max_queue_size: parseInt(form.max_queue_size, 10),
      auto_pause_enabled: form.auto_pause_enabled,
      estimated_prep_time: form.estimated_prep_time,
      stripe_account_id: form.stripe_account_id || null,
      stripe_onboarding_complete: form.stripe_onboarding_complete,
      stripe_charges_enabled: form.stripe_charges_enabled,
    }, reason || null);
    setReason('');
    refetch();
  };

  return (
    <form className="admin-tab-form" onSubmit={handleSubmit}>
      <h2>Operational settings</h2>

      <label className="admin-toggle-row">
        <input type="checkbox" checked={form.accepting_orders} onChange={(e) => setForm({ ...form, accepting_orders: e.target.checked })} />
        <div>
          <strong>Accepting orders</strong>
          <p className="cell-sub">Globally allow customers to place orders</p>
        </div>
      </label>

      <label className="admin-toggle-row">
        <input type="checkbox" checked={form.auto_pause_enabled} onChange={(e) => setForm({ ...form, auto_pause_enabled: e.target.checked })} />
        <div>
          <strong>Auto-pause when busy</strong>
          <p className="cell-sub">Pause new orders when queue hits the max</p>
        </div>
      </label>

      <div className="form-row">
        <div className="form-group">
          <label>Max queue size</label>
          <input type="number" min={1} value={form.max_queue_size} onChange={(e) => setForm({ ...form, max_queue_size: e.target.value })} />
        </div>
        <div className="form-group">
          <label>Estimated prep time</label>
          <input type="text" value={form.estimated_prep_time} onChange={(e) => setForm({ ...form, estimated_prep_time: e.target.value })} />
        </div>
      </div>

      <h3 style={{ marginTop: 24 }}>Stripe overrides</h3>
      <p className="cell-sub">Use only when Stripe webhook state is stuck. Changes are audited.</p>

      <div className="form-group">
        <label>Stripe account ID</label>
        <input type="text" value={form.stripe_account_id} onChange={(e) => setForm({ ...form, stripe_account_id: e.target.value })} placeholder="acct_..." />
      </div>

      <label className="admin-toggle-row">
        <input type="checkbox" checked={form.stripe_onboarding_complete} onChange={(e) => setForm({ ...form, stripe_onboarding_complete: e.target.checked })} />
        <div><strong>Onboarding complete</strong></div>
      </label>

      <label className="admin-toggle-row">
        <input type="checkbox" checked={form.stripe_charges_enabled} onChange={(e) => setForm({ ...form, stripe_charges_enabled: e.target.checked })} />
        <div><strong>Charges enabled</strong></div>
      </label>

      <div className="form-group">
        <label>Audit reason</label>
        <input type="text" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="why this change" />
      </div>

      <div className="form-actions">
        <button type="submit" className="btn-primary" disabled={busy}>
          {busy ? 'Saving...' : <>{Icons.check} Save settings</>}
        </button>
      </div>
    </form>
  );
};

export default SettingsTab;
