import React, { useCallback, useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { supabase } from '../../../lib/supabase';
import { Icons } from '../../../components/common/Icons';
import { useTruckAdmin } from '../hooks/useTruckAdmin';

const ReviewsTab = () => {
  const { truck } = useOutletContext();
  const { hideReview, busy } = useTruckAdmin();
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
    const reason = hide ? window.prompt('Reason for hiding this review?') : null;
    if (hide && !reason) return;
    await hideReview(review.id, hide, reason);
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
