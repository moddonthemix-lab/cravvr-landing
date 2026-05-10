import React, { useCallback, useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { adminUpdateOwner, fetchOwnerForAdmin } from '../../../services/admin';
import { Icons } from '../../../components/common/Icons';
import { useToast } from '../../../contexts/ToastContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import LoadingSplash from '../../../components/common/LoadingSplash';

const OwnerProfileTab = () => {
  const { truck, owner } = useOutletContext();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    business_name: '',
    tax_id: '',
    business_address: '',
    phone: '',
    notification_preferences: {},
  });
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  const fetchOwner = useCallback(async () => {
    if (!truck.owner_id) { setLoading(false); return; }
    setLoading(true);
    try {
      const data = await fetchOwnerForAdmin(truck.owner_id);
      setForm({
        business_name: data?.business_name || '',
        tax_id: data?.tax_id || '',
        business_address: data?.business_address || '',
        phone: data?.phone || '',
        notification_preferences: data?.notification_preferences || {},
      });
    } catch (err) {
      console.error(err);
      showToast('Failed to load owner profile', 'error');
    } finally {
      setLoading(false);
    }
  }, [truck.owner_id, showToast]);

  useEffect(() => { fetchOwner(); }, [fetchOwner]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await adminUpdateOwner(truck.owner_id, {
        business_name: form.business_name,
        tax_id: form.tax_id,
        business_address: form.business_address,
        phone: form.phone,
        notification_preferences: form.notification_preferences,
      }, reason || null);
      showToast('Owner profile saved', 'success');
      setReason('');
    } catch (err) {
      setError(err.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  if (!truck.owner_id) {
    return (
      <div className="mx-auto max-w-3xl px-4 sm:px-6 py-6 space-y-3">
        <h2 className="text-xl font-bold tracking-tight">Owner profile</h2>
        <p className="text-sm text-muted-foreground">
          No owner is linked to this truck. Use Danger Zone → Reassign owner first.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mx-auto max-w-3xl px-4 sm:px-6 py-6 space-y-5"
    >
      <div>
        <h2 className="text-xl font-bold tracking-tight">Owner profile</h2>
        <p className="text-xs text-muted-foreground mt-1">
          Editing the owner ({owner?.email || truck.owner_id}). All changes are audited.
        </p>
      </div>

      {loading ? (
        <LoadingSplash size="inline" tagline="LOADING OWNER" />
      ) : (
        <>
          <div className="space-y-2">
            <Label htmlFor="owner-business-name">Business name</Label>
            <Input
              id="owner-business-name"
              type="text"
              value={form.business_name}
              onChange={(e) => setForm({ ...form, business_name: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="owner-tax-id">Tax ID / EIN</Label>
              <Input
                id="owner-tax-id"
                type="text"
                value={form.tax_id}
                onChange={(e) => setForm({ ...form, tax_id: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="owner-phone">Phone</Label>
              <Input
                id="owner-phone"
                type="tel"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="owner-address">Business address</Label>
            <Textarea
              id="owner-address"
              rows={2}
              value={form.business_address}
              onChange={(e) => setForm({ ...form, business_address: e.target.value })}
            />
          </div>

          <div className="border-t border-border pt-5 space-y-2">
            <div>
              <h3 className="text-base font-bold">Notification preferences</h3>
              <p className="text-xs text-muted-foreground mt-1">
                JSON shape stored on <code className="rounded bg-muted px-1.5 py-0.5 text-foreground">owners.notification_preferences</code>. Edit raw if needed.
              </p>
            </div>
            <Textarea
              rows={6}
              value={JSON.stringify(form.notification_preferences || {}, null, 2)}
              onChange={(e) => {
                try {
                  const parsed = JSON.parse(e.target.value);
                  setForm({ ...form, notification_preferences: parsed });
                  setError('');
                } catch { setError('Invalid JSON in notification preferences'); }
              }}
              className="font-mono text-xs"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="owner-audit-reason">Audit reason</Label>
            <Input
              id="owner-audit-reason"
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>

          {error && (
            <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              <span className="h-4 w-4 shrink-0 mt-0.5">{Icons.alertCircle}</span>
              {error}
            </div>
          )}

          <div className="flex justify-end">
            <Button type="submit" disabled={saving || !!error} className="gap-1.5">
              {saving ? (
                'Saving…'
              ) : (
                <>
                  <span className="h-4 w-4">{Icons.check}</span>
                  Save owner profile
                </>
              )}
            </Button>
          </div>
        </>
      )}
    </form>
  );
};

export default OwnerProfileTab;
