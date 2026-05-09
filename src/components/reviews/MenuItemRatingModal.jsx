import React, { useState, useEffect } from 'react';
import { submitMenuItemRating } from '../../services/reviews';
import { Icons } from '../common/Icons';
import StarRatingInput from '../common/StarRatingInput';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

const MenuItemRatingModal = ({ isOpen, onClose, item, userId, existingRating, onSuccess }) => {
  const [rating, setRating] = useState(existingRating?.rating || 0);
  const [comment, setComment] = useState(existingRating?.comment || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (existingRating) {
      setRating(existingRating.rating);
      setComment(existingRating.comment || '');
    } else {
      setRating(0);
      setComment('');
    }
    setError('');
    setSuccess(false);
  }, [existingRating, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rating === 0) {
      setError('Please select a rating');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await submitMenuItemRating({ itemId: item.id, userId, rating });
      setSuccess(true);
      setTimeout(() => {
        onSuccess?.();
        onClose();
      }, 1200);
    } catch (err) {
      console.error('Error submitting rating:', err);
      setError('Failed to submit rating. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!item) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-sm">
        {success ? (
          <div className="flex flex-col items-center text-center py-6 space-y-3">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-positive/10 text-positive">
              <span className="h-7 w-7">{Icons.check}</span>
            </span>
            <p className="text-base font-semibold">Rating saved!</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <DialogHeader className="space-y-3 sm:text-center text-center">
              <div className="flex items-center gap-3 mx-auto">
                {item.image && (
                  <img
                    src={item.image}
                    alt={item.name}
                    className="h-14 w-14 rounded-xl object-cover ring-1 ring-black/5"
                  />
                )}
                <div className="text-left">
                  <DialogTitle className="text-base">{item.name}</DialogTitle>
                  <p className="text-sm font-bold tabular-nums text-primary">{item.price}</p>
                </div>
              </div>
            </DialogHeader>

            {error && (
              <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                <span className="h-4 w-4 shrink-0 mt-0.5">{Icons.alertCircle}</span>
                {error}
              </div>
            )}

            <div className="flex justify-center py-2">
              <StarRatingInput value={rating} onChange={setRating} size="lg" showLabel />
            </div>

            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Add a comment (optional)"
              rows={2}
              maxLength={200}
            />

            <DialogFooter className="gap-2 sm:space-x-0">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading || rating === 0} className="gap-2">
                {loading ? (
                  <>
                    <span className="h-4 w-4 animate-spin">{Icons.loader}</span>
                    Saving…
                  </>
                ) : existingRating ? 'Update Rating' : 'Submit Rating'}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default MenuItemRatingModal;
