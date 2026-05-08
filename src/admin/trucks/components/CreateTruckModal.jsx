import React, { useEffect, useState } from 'react';
import { adminCreateTruck, searchOwnerProfiles } from '../../../services/admin';
import { Icons } from '../../../components/common/Icons';
import { useTruckAdmin } from '../hooks/useTruckAdmin';

const CreateTruckModal = ({ onClose, onCreated }) => {
  const { busy } = useTruckAdmin();
  const [submitting, setSubmitting] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [pickedOwner, setPickedOwner] = useState(null);
  const [name, setName] = useState('');
  const [cuisine, setCuisine] = useState('');
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (query.length < 2) { setResults([]); return; }
    const handle = setTimeout(async () => {
      try {
        setResults(await searchOwnerProfiles(query));
      } catch (err) {
        console.error('Owner search failed:', err);
      }
    }, 300);
    return () => clearTimeout(handle);
  }, [query]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!pickedOwner) { setError('Pick an owner first'); return; }
    setSubmitting(true);
    setError('');
    try {
      const data = await adminCreateTruck(pickedOwner.id, { name, cuisine }, reason || null);
      onCreated?.(data);
      onClose();
    } catch (err) {
      setError(err.message || 'Create failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <h2>Create truck</h2>
          <button type="button" className="close-btn" onClick={onClose}>{Icons.x}</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Owner (search by email or name)</label>
            <input type="text" autoFocus value={query} onChange={(e) => setQuery(e.target.value)} placeholder="owner@example.com" />
          </div>
          {results.length > 0 && (
            <ul className="owner-results">
              {results.map(r => (
                <li
                  key={r.id}
                  className={pickedOwner?.id === r.id ? 'picked' : ''}
                  onClick={() => setPickedOwner(r)}
                >
                  <div>
                    <strong>{r.name || '(no name)'}</strong>
                    <span className="cell-sub"> · {r.email}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
          {pickedOwner && <p className="cell-sub">Will create truck under <strong>{pickedOwner.email}</strong>.</p>}

          <div className="form-group">
            <label>Truck name</label>
            <input type="text" required value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="form-group">
            <label>Cuisine</label>
            <input type="text" value={cuisine} onChange={(e) => setCuisine(e.target.value)} placeholder="Tacos, BBQ, etc." />
          </div>
          <div className="form-group">
            <label>Audit reason</label>
            <input type="text" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="why this is being created" />
          </div>

          {error && <p className="form-error">{error}</p>}

          <div className="form-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={submitting || busy || !pickedOwner || !name}>
              {submitting ? 'Creating…' : 'Create truck'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateTruckModal;
