import React, { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { fetchAdminAuditLog, fetchProfilesByIds } from '../../../services/admin';
import { Icons } from '../../../components/common/Icons';

const PAGE_SIZE = 25;

const AuditTab = () => {
  const { truck } = useOutletContext();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [admins, setAdmins] = useState({});
  const [expanded, setExpanded] = useState(new Set());

  const fetchPage = async (p) => {
    setLoading(true);
    try {
      const data = await fetchAdminAuditLog(truck.id, { page: p, pageSize: PAGE_SIZE });
      setRows(data);
      setHasMore(data.length === PAGE_SIZE);

      const adminIds = [...new Set(data.map(r => r.admin_id))];
      if (adminIds.length > 0) {
        const profs = await fetchProfilesByIds(adminIds);
        const map = {};
        profs.forEach(pr => { map[pr.id] = pr; });
        setAdmins(prev => ({ ...prev, ...map }));
      }
    } catch (err) {
      console.error('Audit fetch failed', err);
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPage(page); }, [page, truck.id]);

  const diffKeys = (before, after) => {
    if (!before || !after) return [];
    const keys = new Set([...Object.keys(before), ...Object.keys(after)]);
    return [...keys].filter(k => JSON.stringify(before[k]) !== JSON.stringify(after[k]));
  };

  const toggle = (id) => {
    const next = new Set(expanded);
    if (next.has(id)) next.delete(id); else next.add(id);
    setExpanded(next);
  };

  return (
    <div className="admin-tab-form">
      <h2>Audit log</h2>
      <p className="cell-sub">Every admin write is recorded here.</p>

      {loading ? (
        <div className="loading-state">{Icons.loader} Loading...</div>
      ) : rows.length === 0 ? (
        <p className="cell-sub">No admin changes recorded yet.</p>
      ) : (
        <ul className="audit-list">
          {rows.map(row => {
            const changed = row.action === 'update' ? diffKeys(row.before, row.after) : [];
            const admin = admins[row.admin_id];
            const isOpen = expanded.has(row.id);
            return (
              <li key={row.id} className="audit-item">
                <div className="audit-row">
                  <div>
                    <strong>{row.action}</strong>
                    {row.action === 'update' && changed.length > 0 && (
                      <span className="cell-sub"> · {changed.join(', ')}</span>
                    )}
                  </div>
                  <div className="cell-sub">
                    {admin?.email || row.admin_id} · {new Date(row.created_at).toLocaleString()}
                  </div>
                </div>
                {row.reason && <p className="audit-reason">"{row.reason}"</p>}
                <button type="button" className="btn-link" onClick={() => toggle(row.id)}>
                  {isOpen ? 'Hide details' : 'Show details'}
                </button>
                {isOpen && (
                  <pre className="audit-detail">
{JSON.stringify({ before: row.before, after: row.after }, null, 2)}
                  </pre>
                )}
              </li>
            );
          })}
        </ul>
      )}

      <div className="form-actions">
        <button className="btn-secondary" disabled={page === 0} onClick={() => setPage(p => Math.max(0, p - 1))}>Previous</button>
        <button className="btn-secondary" disabled={!hasMore} onClick={() => setPage(p => p + 1)}>Next</button>
      </div>
    </div>
  );
};

export default AuditTab;
