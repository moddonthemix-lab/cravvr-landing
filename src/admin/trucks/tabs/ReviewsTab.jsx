import React, { useCallback, useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { supabase } from '../../../lib/supabase';
import { Icons } from '../../../components/common/Icons';
import { useConfirm } from '../../../contexts/ConfirmContext';
import { useTruckAdmin } from '../hooks/useTruckAdmin';

const ReviewsTab = () => {
  const { truck } = useOutletContext();
  const { hideReview, busy } = useTruckAdmin();
  const { prompt, confirm } = useConfirm();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .eq('truck_id', truck.id)
        .order('created_at', { ascending: false })
        .limit(200);
      if (error) throw error;
      setReviews(data || []);
    } catch (err) {
      console.error(err);
      setReviews([]);
    } finally {
      setLoading(false);
    }
  }, [truck.id]);

  useEffect(() => { fetch(); }, [fetch]);

  const handleHide = async (review, hide) => {
    if (hide) {
      const reason = await prompt({
        title: 'Hide review',
        message: 'Hidden reviews are excluded from public truck pages and rating averages.',
        confirmText: 'Hide',
        variant: 'danger',
        inputLabel: 'Reason',
      });
      if (!reason) return;
      await hideReview(review.id, true, reason);
    } else {
      const ok = await confirm({
        title: 'Restore review',
        message: 'Make this review visible to the public again?',
        confirmText: 'Restore',
      });
      if (!ok) return;
      await hideReview(review.id, false, 'admin restored');
    }
    fetch();
  };

  return (
    <div className="admin-tab-form">
      <h2>Reviews</h2>
      {loading ? (
        <div className="loading-state">{Icons.loader} Loading...</div>
      ) : reviews.length === 0 ? (
        <p className="cell-sub">No reviews yet.</p>
      ) : (
        <ul className="audit-list">
          {reviews.map(r => {
            const hidden = r.hidden_at || r.is_hidden;
            return (
              <li key={r.id} className="audit-item" style={hidden ? { opacity: 0.6 } : null}>
                <div className="audit-row">
                  <div>
                    <strong>{'★'.repeat(r.rating || 0)}{'☆'.repeat(5 - (r.rating || 0))}</strong>
                    {hidden && <span className="admin-badge admin-badge-danger" style={{ marginLeft: 8 }}>Hidden</span>}
                  </div>
                  <div className="cell-sub">{new Date(r.created_at).toLocaleDateString()}</div>
                </div>
                {r.comment && <p>{r.comment}</p>}
                {r.hidden_reason && <p className="audit-reason">Hidden: {r.hidden_reason}</p>}
                <button
                  type="button"
                  className={`btn-link ${hidden ? '' : 'danger'}`}
                  disabled={busy}
                  onClick={() => handleHide(r, !hidden)}
                >
                  {hidden ? 'Restore' : 'Hide'}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default ReviewsTab;
