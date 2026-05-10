import React, { useCallback, useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { fetchAdminTruckReviews } from '../../../services/admin';
import { useConfirm } from '../../../contexts/ConfirmContext';
import { useAuth } from '../../../components/auth/AuthContext';
import { useTruckAdmin } from '../hooks/useTruckAdmin';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import LoadingSplash from '../../../components/common/LoadingSplash';
import { cn } from '@/lib/utils';

const ReviewsTab = () => {
  const { truck } = useOutletContext();
  const { hideReview, busy } = useTruckAdmin();
  const { prompt, confirm } = useConfirm();
  const { hasAdminPermission } = useAuth();
  const canHide = hasAdminPermission('review.hide');
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      setReviews(await fetchAdminTruckReviews(truck.id));
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
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-6 space-y-5">
      <h2 className="text-xl font-bold tracking-tight">Reviews</h2>

      {loading ? (
        <LoadingSplash size="inline" tagline="LOADING REVIEWS" />
      ) : reviews.length === 0 ? (
        <Card>
          <CardContent className="flex items-center justify-center py-10 text-sm text-muted-foreground">
            No reviews yet.
          </CardContent>
        </Card>
      ) : (
        <ul className="space-y-3">
          {reviews.map(r => {
            const hidden = r.hidden_at || r.is_hidden;
            return (
              <Card key={r.id} className={cn(hidden && 'opacity-60')}>
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="text-warning text-base font-semibold tabular-nums">
                        {'★'.repeat(r.rating || 0)}
                        <span className="text-muted-foreground/40">
                          {'☆'.repeat(5 - (r.rating || 0))}
                        </span>
                      </span>
                      {hidden && <Badge variant="destructive">Hidden</Badge>}
                    </div>
                    <span className="text-xs text-muted-foreground tabular-nums shrink-0">
                      {new Date(r.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  {r.comment && <p className="text-sm leading-relaxed">{r.comment}</p>}
                  {r.hidden_reason && (
                    <p className="text-xs text-muted-foreground italic">
                      Hidden: {r.hidden_reason}
                    </p>
                  )}
                  {canHide && (
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={busy}
                      onClick={() => handleHide(r, !hidden)}
                      className={cn(
                        !hidden && 'text-destructive hover:bg-destructive/10 hover:text-destructive'
                      )}
                    >
                      {hidden ? 'Restore' : 'Hide'}
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default ReviewsTab;
