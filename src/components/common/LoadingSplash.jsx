import React from 'react';
import { cn } from '@/lib/utils';

const LoadingSplash = ({
  fullScreen = true,
  tagline = 'FRESH FOOD, FOUND FAST',
  className,
}) => {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center bg-primary text-primary-foreground',
        fullScreen ? 'fixed inset-0 z-[200] min-h-screen w-full' : 'w-full py-24',
        className
      )}
      role="status"
      aria-label="Loading"
    >
      <div className="flex flex-col items-center gap-5 animate-pulse">
        <img
          src="/logo/cravrr-logo-transparent.png"
          alt="Cravvr"
          className="h-24 w-auto select-none drop-shadow-sm"
          draggable={false}
        />
        <div className="h-px w-32 bg-white/40" />
        <span className="text-xs font-bold tracking-[0.35em] text-white/90 uppercase">
          {tagline}
        </span>
      </div>
    </div>
  );
};

export default LoadingSplash;
