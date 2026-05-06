import React from 'react';
import { useTruckAdmin } from '../hooks/useTruckAdmin';

const Toggle = ({ label, checked, disabled, onChange, hint }) => (
  <label className="admin-toggle-row">
    <input type="checkbox" checked={!!checked} disabled={disabled} onChange={(e) => onChange(e.target.checked)} />
    <div>
      <strong>{label}</strong>
      {hint && <p className="cell-sub">{hint}</p>}
    </div>
  </label>
);

const AdminBadgePanel = ({ truck, onChange }) => {
  const { setFlag, busy } = useTruckAdmin();

  const handleToggle = async (flag, value) => {
    try {
      await setFlag(truck.id, flag, value);
      onChange?.();
    } catch (e) { /* toasted */ }
  };

  return (
    <div className="admin-badge-panel">
      <h3>Admin flags</h3>
      <Toggle
        label="Featured"
        hint="Show on homepage hero rail"
        checked={truck.featured}
        disabled={busy}
        onChange={(v) => handleToggle('featured', v)}
      />
      <Toggle
        label="Verified"
        hint="Display verified badge on public page"
        checked={truck.verified}
        disabled={busy}
        onChange={(v) => handleToggle('verified', v)}
      />
      <Toggle
        label="Open"
        checked={truck.is_open}
        disabled={busy}
        onChange={(v) => handleToggle('is_open', v)}
      />
      <Toggle
        label="Accepting orders"
        checked={truck.accepting_orders}
        disabled={busy}
        onChange={(v) => handleToggle('accepting_orders', v)}
      />
    </div>
  );
};

export default AdminBadgePanel;
