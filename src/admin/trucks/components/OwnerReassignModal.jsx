import React, { useEffect, useState } from 'react';
import { searchOwnerProfiles } from '../../../services/admin';
import { Icons } from '../../../components/common/Icons';
import { useTruckAdmin } from '../hooks/useTruckAdmin';

const OwnerReassignModal = ({ truck, onClose, onTransferred }) => {
  const { transferOwner, busy } = useTruckAdmin();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [picked, setPicked] = useState(null);
  const [reason, setReason] = useState('');

  useEffect(() => {
    if (query.length < 2) { setResults([]); return; }
    const handle = setTimeout(async () => {
      setSearching(true);
      try {
        setResults(await searchOwnerProfiles(query));
      } catch (err) {
        console.error(err);
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => clearTimeout(handle);
  }, [query]);

  const submit = async (e) => {
    e.preventDefault();
    if (!picked) return;
    await transferOwner(truck.id, picked.id, reason || null);
    onTransferred?.();
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <h2>Transfer ownership</h2>
          <button type="button" className="close-btn" onClick={onClose}>{Icons.x}</button>
        </div>
        <form onSubmit={submit}>
          <div className="form-group">
            <label>Search owners by name or email</label>
            <input type="text" autoFocus value={query} onChange={(e) => setQuery(e.target.value)} placeholder="jane@example.com" />
            {searching && <span className="cell-sub">Searching…</span>}
          </div>

          {results.length > 0 && (
            <ul className="owner-results">
              {results.map(r => (
                <li
                  key={r.id}
                  className={picked?.id === r.id ? 'picked' : ''}
                  onClick={() => setPicked(r)}
                >
                  <div>
                    <strong>{r.name || '(no name)'}</strong>
                    <span className="cell-sub"> · {r.email}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}

          {picked && (
            <p className="cell-sub">
              Will transfer <strong>{truck.name}</strong> to <strong>{picked.email}</strong>.
            </p>
          )}

          <div className="form-group">
            <label>Reason (audit log)</label>
            <input type="text" value={reason} onChange={(e) => setReason(e.target.value)} required />
          </div>

          <div className="form-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={!picked || busy || !reason}>
              {busy ? 'Transferring…' : 'Transfer ownership'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default OwnerReassignModal;
