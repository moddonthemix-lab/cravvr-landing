import React, { useCallback, useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { supabase } from '../../../lib/supabase';
import { Icons } from '../../../components/common/Icons';
import { useToast } from '../../../contexts/ToastContext';

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
      const { data, error: err } = await supabase
        .from('owners')
        .select('business_name, tax_id, business_address, phone, notification_preferences')
        .eq('id', truck.owner_id)
        .maybeSingle();
      if (err) throw err;
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
      const { error: rpcErr } = await supabase.rpc('admin_update_owner', {
        p_id: truck.owner_id,
        p_patch: {
          business_name: form.business_name,
          tax_id: form.tax_id,
          business_address: form.business_address,
          phone: form.phone,
          notification_preferences: form.notification_preferences,
        },
        p_reason: reason || null,
      });
      if (rpcErr) throw rpcErr;
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
      <div className="admin-tab-form">
        <h2>Owner profile</h2>
        <p className="cell-sub">No owner is linked to this truck. Use Danger Zone → Reassign owner first.</p>
      </div>
    );
  }

  return (
    <form className="admin-tab-form" onSubmit={handleSubmit}>
      <h2>Owner profile</h2>
      <p className="cell-sub">
        Editing the owner ({owner?.email || truck.owner_id}). All changes are audited.
      </p>

      {loading ? (
        <div className="loading-state">{Icons.loader} Loading...</div>
      ) : (
        <>
          <div className="form-group">
            <label>Business name</label>
            <input type="text" value={form.business_name} onChange={(e) => setForm({ ...form, business_name: e.target.value })} />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Tax ID / EIN</label>
              <input type="text" value={form.tax_id} onChange={(e) => setForm({ ...form, tax_id: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Phone</label>
              <input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
          </div>
          <div className="form-group">
            <label>Business address</label>
            <textarea rows={2} value={form.business_address} onChange={(e) => setForm({ ...form, business_address: e.target.value })} />
          </div>

          <h3 style={{ marginTop: 20 }}>Notification preferences</h3>
          <p className="cell-sub">JSON shape stored on owners.notification_preferences. Edit raw if needed.</p>
          <textarea
            rows={6}
            value={JSON.stringify(form.notification_preferences || {}, null, 2)}
            onChange={(e) => {
              try {
                const parsed = JSON.parse(e.target.value);
                setForm({ ...form, notification_preferences: parsed });
                setError('');
              } catch { setError('Invalid JSON in notification preferences'); }
            }}
            style={{ fontFamily: 'ui-monospace, monospace', fontSize: 12 }}
          />

          <div className="form-group">
            <label>Audit reason</label>
            <input type="text" value={reason} onChange={(e) => setReason(e.target.value)} />
          </div>

          {error && <p className="form-error">{error}</p>}

          <div className="form-actions">
            <button type="submit" className="btn-primary" disabled={saving || !!error}>
              {saving ? 'Saving…' : <>{Icons.check} Save owner profile</>}
            </button>
          </div>
        </>
      )}
    </form>
  );
};

export default OwnerProfileTab;
