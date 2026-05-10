import React from 'react';
import { useTruckAdmin } from '../hooks/useTruckAdmin';
import { useAuth } from '../../../components/auth/AuthContext';
import { Card, CardContent } from '@/components/ui/card';

const Toggle = ({ label, checked, disabled, onChange, hint }) => (
  <label className="flex items-start gap-3 cursor-pointer rounded-lg border border-border bg-card p-3 transition-colors hover:bg-muted/30">
    <input
      type="checkbox"
      checked={!!checked}
      disabled={disabled}
      onChange={(e) => onChange(e.target.checked)}
      className="mt-0.5 h-4 w-4 rounded border-input text-primary focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 accent-primary"
    />
    <div className="flex-1 min-w-0">
      <strong className="text-sm font-semibold">{label}</strong>
      {hint && <p className="text-xs text-muted-foreground mt-0.5">{hint}</p>}
    </div>
  </label>
);

const AdminBadgePanel = ({ truck, onChange }) => {
  const { setFlag, busy } = useTruckAdmin();
  const { hasAdminPermission } = useAuth();
  const canFlags = hasAdminPermission('truck.flags');
  const canWrite = hasAdminPermission('truck.write');

  const handleToggle = async (flag, value) => {
    try {
      await setFlag(truck.id, flag, value);
      onChange?.();
    } catch (e) { /* toasted */ }
  };

  return (
    <Card>
      <CardContent className="p-4 space-y-2">
        <h3 className="text-sm font-bold text-foreground mb-2">Admin flags</h3>
        <Toggle
          label="Featured"
          hint={canFlags ? 'Show on homepage hero rail' : 'Requires truck.flags permission'}
          checked={truck.featured}
          disabled={busy || !canFlags}
          onChange={(v) => handleToggle('featured', v)}
        />
        <Toggle
          label="Verified"
          hint={canFlags ? 'Display verified badge on public page' : 'Requires truck.flags permission'}
          checked={truck.verified}
          disabled={busy || !canFlags}
          onChange={(v) => handleToggle('verified', v)}
        />
        <Toggle
          label="Open"
          checked={truck.is_open}
          disabled={busy || !(canFlags || canWrite)}
          onChange={(v) => handleToggle('is_open', v)}
        />
        <Toggle
          label="Accepting orders"
          checked={truck.accepting_orders}
          disabled={busy || !(canFlags || canWrite)}
          onChange={(v) => handleToggle('accepting_orders', v)}
        />
      </CardContent>
    </Card>
  );
};

export default AdminBadgePanel;
