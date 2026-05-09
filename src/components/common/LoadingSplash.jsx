import React from 'react';
import { cn } from '@/lib/utils';

const SIZE_PRESETS = {
  full: {
    container: 'fixed inset-0 z-[200] min-h-screen w-full',
    logo: 'h-24',
    divider: 'h-px w-32',
    tagline: 'text-xs tracking-[0.35em]',
    gap: 'gap-5',
  },
  card: {
    container: 'w-full rounded-xl py-16',
    logo: 'h-16',
    divider: 'h-px w-24',
    tagline: 'text-[11px] tracking-[0.3em]',
    gap: 'gap-4',
  },
  inline: {
    container: 'w-full rounded-xl py-10',
    logo: 'h-12',
    divider: 'h-px w-20',
    tagline: 'text-[10px] tracking-[0.25em]',
    gap: 'gap-3',
  },
};

const LoadingSplash = ({
  fullScreen,
  size,
  tagline = 'FRESH FOOD, FOUND FAST',
  className,
}) => {
  const variant = size || (fullScreen === false ? 'card' : 'full');
  const preset = SIZE_PRESETS[variant] || SIZE_PRESETS.full;

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center bg-background text-foreground',
        preset.container,
        className
      )}
      role="status"
      aria-label="Loading"
    >
      <div className={cn('flex flex-col items-center animate-pulse', preset.gap)}>
        <img
          src="/logo/cravrr-logo-transparent.png"
          alt="Cravvr"
          className={cn('w-auto select-none', preset.logo)}
          draggable={false}
        />
        <div className={cn('bg-primary/30', preset.divider)} />
        {tagline && (
          <span
            className={cn(
              'font-bold uppercase text-primary',
              preset.tagline
            )}
          >
            {tagline}
          </span>
        )}
      </div>
    </div>
  );
};

export default LoadingSplash;
