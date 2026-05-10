import React, { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { fetchAdminAuditLog, fetchProfilesByIds } from '../../../services/admin';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import LoadingSplash from '../../../components/common/LoadingSplash';

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
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-6 space-y-5">
      <div>
        <h2 className="text-xl font-bold tracking-tight">Audit log</h2>
        <p className="text-xs text-muted-foreground mt-1">
          Every admin write is recorded here.
        </p>
      </div>

      {loading ? (
        <LoadingSplash size="inline" tagline="LOADING AUDIT LOG" />
      ) : rows.length === 0 ? (
        <Card>
          <CardContent className="flex items-center justify-center py-10 text-sm text-muted-foreground">
            No admin changes recorded yet.
          </CardContent>
        </Card>
      ) : (
        <ul className="space-y-3">
          {rows.map(row => {
            const changed = row.action === 'update' ? diffKeys(row.before, row.after) : [];
            const admin = admins[row.admin_id];
            const isOpen = expanded.has(row.id);
            return (
              <Card key={row.id}>
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <strong className="font-semibold capitalize">{row.action}</strong>
                      {row.action === 'update' && changed.length > 0 && (
                        <span className="text-xs text-muted-foreground"> · {changed.join(', ')}</span>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground tabular-nums shrink-0">
                      {admin?.email || row.admin_id} · {new Date(row.created_at).toLocaleString()}
                    </div>
                  </div>
                  {row.reason && (
                    <p className="text-xs text-muted-foreground italic">"{row.reason}"</p>
                  )}
                  <Button variant="ghost" size="sm" onClick={() => toggle(row.id)}>
                    {isOpen ? 'Hide details' : 'Show details'}
                  </Button>
                  {isOpen && (
                    <pre className="overflow-x-auto rounded-md bg-muted p-3 text-xs leading-relaxed">
{JSON.stringify({ before: row.before, after: row.after }, null, 2)}
                    </pre>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </ul>
      )}

      <div className="flex items-center justify-end gap-2">
        <Button
          variant="outline"
          disabled={page === 0}
          onClick={() => setPage(p => Math.max(0, p - 1))}
        >
          Previous
        </Button>
        <Button
          variant="outline"
          disabled={!hasMore}
          onClick={() => setPage(p => p + 1)}
        >
          Next
        </Button>
      </div>
    </div>
  );
};

export default AuditTab;
