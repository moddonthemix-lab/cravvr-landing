import React, { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Icons } from '../../../components/common/Icons';
import { useTruckAdmin } from '../hooks/useTruckAdmin';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const ToggleRow = ({ checked, onChange, title, hint }) => (
  <label className="flex items-start gap-3 cursor-pointer rounded-lg border border-border bg-card p-4 transition-colors hover:bg-muted/30">
    <input
      type="checkbox"
      checked={checked}
      onChange={onChange}
      className="mt-0.5 h-4 w-4 rounded border-input text-primary focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 accent-primary"
    />
    <div className="flex-1 min-w-0">
      <strong className="text-sm font-semibold">{title}</strong>
      {hint && <p className="text-xs text-muted-foreground mt-0.5">{hint}</p>}
    </div>
  </label>
);

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
    <form
      onSubmit={handleSubmit}
      className="mx-auto max-w-3xl px-4 sm:px-6 py-6 space-y-5"
    >
      <h2 className="text-xl font-bold tracking-tight">Operational settings</h2>

      <ToggleRow
        checked={form.accepting_orders}
        onChange={(e) => setForm({ ...form, accepting_orders: e.target.checked })}
        title="Accepting orders"
        hint="Globally allow customers to place orders"
      />

      <ToggleRow
        checked={form.auto_pause_enabled}
        onChange={(e) => setForm({ ...form, auto_pause_enabled: e.target.checked })}
        title="Auto-pause when busy"
        hint="Pause new orders when queue hits the max"
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="settings-max-queue">Max queue size</Label>
          <Input
            id="settings-max-queue"
            type="number"
            min={1}
            value={form.max_queue_size}
            onChange={(e) => setForm({ ...form, max_queue_size: e.target.value })}
            className="tabular-nums"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="settings-prep-time">Estimated prep time</Label>
          <Input
            id="settings-prep-time"
            type="text"
            value={form.estimated_prep_time}
            onChange={(e) => setForm({ ...form, estimated_prep_time: e.target.value })}
          />
        </div>
      </div>

      <div className="border-t border-border pt-5 space-y-4">
        <div>
          <h3 className="text-base font-bold">Stripe overrides</h3>
          <p className="text-xs text-muted-foreground mt-1">
            Use only when Stripe webhook state is stuck. Changes are audited.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="settings-stripe-id">Stripe account ID</Label>
          <Input
            id="settings-stripe-id"
            type="text"
            value={form.stripe_account_id}
            onChange={(e) => setForm({ ...form, stripe_account_id: e.target.value })}
            placeholder="acct_…"
          />
        </div>

        <ToggleRow
          checked={form.stripe_onboarding_complete}
          onChange={(e) => setForm({ ...form, stripe_onboarding_complete: e.target.checked })}
          title="Onboarding complete"
        />

        <ToggleRow
          checked={form.stripe_charges_enabled}
          onChange={(e) => setForm({ ...form, stripe_charges_enabled: e.target.checked })}
          title="Charges enabled"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="settings-audit-reason">Audit reason</Label>
        <Input
          id="settings-audit-reason"
          type="text"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="why this change"
        />
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={busy} className="gap-1.5">
          {busy ? (
            'Saving…'
          ) : (
            <>
              <span className="h-4 w-4">{Icons.check}</span>
              Save settings
            </>
          )}
        </Button>
      </div>
    </form>
  );
};

export default SettingsTab;
