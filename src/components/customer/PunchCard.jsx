import React from 'react';
import { Icons } from '../common/Icons';
import { cn } from '@/lib/utils';

/**
 * Loyalty punch card. Filled stamps + linear progress bar + reward chip.
 */
const PunchCard = ({ truckName, punches, total = 10, reward = 'Free Item', onClaim }) => {
  const filledPunches = punches % total;
  const isRewardReady = punches >= total;
  const completedCards = Math.floor(punches / total);
  const showFilled = isRewardReady ? total : filledPunches;

  return (
    <div
      className={cn(
        'rounded-2xl border bg-card shadow-sm transition-all',
        isRewardReady
          ? 'border-primary ring-2 ring-primary/20 shadow-md'
          : 'border-border'
      )}
    >
      <div className="flex items-center gap-3 border-b border-border bg-muted/40 px-5 py-3">
        <img src="/logo/apple-touch-icon.png" alt="" className="h-9 w-9 rounded-md" />
        <div className="flex flex-col leading-tight">
          <span className="text-xs font-bold tracking-[0.2em] text-primary">CRAVRR</span>
          <span className="text-[10px] font-semibold tracking-wider text-muted-foreground">
            LOYALTY CARD
          </span>
        </div>
      </div>

      <div className="px-5 pt-4">
        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
          Valid at
        </span>
        <h3 className="text-lg font-bold tracking-tight leading-tight">{truckName}</h3>
      </div>

      <div className="px-5 py-4">
        <div className="grid grid-cols-5 gap-2">
          {Array.from({ length: total }).map((_, i) => {
            const isPunched = i < showFilled;
            return (
              <div
                key={i}
                className={cn(
                  'relative flex aspect-square items-center justify-center rounded-full border-2 transition-colors',
                  isPunched
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-dashed border-border text-muted-foreground/40'
                )}
              >
                {isPunched ? (
                  <img
                    src="/logo/apple-touch-icon.png"
                    alt=""
                    className="h-5 w-5 rounded-full opacity-90"
                  />
                ) : (
                  <span className="text-[10px] font-bold tabular-nums">{i + 1}</span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="px-5 pb-4 space-y-1.5">
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full bg-gradient-to-r from-primary to-rose-700 transition-all duration-500"
            style={{ width: `${(filledPunches / total) * 100}%` }}
          />
        </div>
        <p className="text-xs text-muted-foreground tabular-nums">
          {isRewardReady ? 'Complete! Claim your reward.' : `${filledPunches} of ${total} punches`}
        </p>
      </div>

      <div className="flex items-center gap-3 border-t border-border bg-primary/5 px-5 py-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground">
          <span className="h-4 w-4">{Icons.gift}</span>
        </span>
        <div className="flex-1 min-w-0">
          <span className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            Your Reward
          </span>
          <span className="block text-sm font-semibold truncate">{reward}</span>
        </div>
        {completedCards > 0 && (
          <span className="rounded-full bg-positive px-2.5 py-1 text-[11px] font-bold text-positive-foreground tabular-nums">
            {completedCards}×
          </span>
        )}
      </div>

      {isRewardReady && (
        <div className="px-5 pb-5">
          <button
            type="button"
            onClick={onClaim}
            className="flex w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-md transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <span className="h-4 w-4">{Icons.gift}</span>
            Claim Reward
          </button>
        </div>
      )}

      <div className="flex items-center justify-between border-t border-dashed border-border px-5 py-2.5 text-[10px] uppercase tracking-wider text-muted-foreground">
        <span>Buy {total}, get 1 free!</span>
        <span className="tabular-nums">#{Math.random().toString(36).substr(2, 8).toUpperCase()}</span>
      </div>
    </div>
  );
};

export default PunchCard;
