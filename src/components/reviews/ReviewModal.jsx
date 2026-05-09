import React, { useState, useEffect } from 'react';
import { useToast } from '../../contexts/ToastContext';
import { submitTruckReview } from '../../services/reviews';
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
import { Label } from '@/components/ui/label';

const ReviewModal = ({ isOpen, onClose, truck, userId, existingReview, onSuccess }) => {
  const { showToast } = useToast();
  const [rating, setRating] = useState(existingReview?.rating || 0);
  const [comment, setComment] = useState(existingReview?.comment || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (existingReview) {
      setRating(existingReview.rating);
      setComment(existingReview.comment || '');
    } else {
      setRating(0);
      setComment('');
    }
    setError('');
    setSuccess(false);
  }, [existingReview, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rating === 0) {
      setError('Please select a rating');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await submitTruckReview({
        truckId: truck.id,
        userId,
        rating,
        comment,
        existingReviewId: existingReview?.id,
      });
      setSuccess(true);
      showToast(
        existingReview ? 'Review updated! Thanks for your feedback.' : 'Review submitted! Thanks for your feedback.',
        'success'
      );
      setTimeout(() => {
        onSuccess?.();
        onClose();
      }, 1500);
    } catch (err) {
      console.error('Error submitting review:', err);
      setError('Failed to submit review. Please try again.');
      showToast('Failed to submit review', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        {success ? (
          <div className="flex flex-col items-center text-center py-6 space-y-3">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-positive/10 text-positive">
              <span className="h-7 w-7">{Icons.check}</span>
            </span>
            <h2 className="text-2xl font-bold tracking-tight">Thank you!</h2>
            <p className="text-sm text-muted-foreground">
              Your review has been {existingReview ? 'updated' : 'submitted'}
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <DialogHeader className="space-y-3 text-center sm:text-center">
              <div className="mx-auto">
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-warning/10 text-warning">
                  <span className="h-6 w-6">{Icons.star}</span>
                </span>
              </div>
              <DialogTitle className="text-center">
                {existingReview ? 'Edit Your Review' : 'Rate Your Experience'}
              </DialogTitle>
              <p className="text-sm text-muted-foreground text-center">{truck.name}</p>
            </DialogHeader>

            {error && (
              <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                <span className="h-4 w-4 shrink-0 mt-0.5">{Icons.alertCircle}</span>
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label>How was your experience?</Label>
              <div className="flex justify-center py-2">
                <StarRatingInput value={rating} onChange={setRating} size="lg" showLabel />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="review-comment">Share your thoughts (optional)</Label>
              <Textarea
                id="review-comment"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Tell others about your experience…"
                rows={4}
                maxLength={500}
              />
              <p className="text-right text-xs text-muted-foreground tabular-nums">
                {comment.length}/500
              </p>
            </div>

            <DialogFooter className="gap-2 sm:space-x-0">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading || rating === 0} className="gap-2">
                {loading ? (
                  <>
                    <span className="h-4 w-4 animate-spin">{Icons.loader}</span>
                    Submitting…
                  </>
                ) : existingReview ? 'Update Review' : 'Submit Review'}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ReviewModal;
