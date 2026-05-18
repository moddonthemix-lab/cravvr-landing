import React from 'react';
import { cn } from '@/lib/utils';

// Deterministic muted gradient from the truck name so trucks without a photo
// still feel distinct. Falls back to a neutral muted swatch when no name.
const GRADIENTS = [
  'from-rose-200 to-amber-200',
  'from-amber-200 to-emerald-200',
  'from-emerald-200 to-sky-200',
  'from-sky-200 to-indigo-200',
  'from-indigo-200 to-rose-200',
  'from-fuchsia-200 to-rose-200',
];

const gradientFor = (name) => {
  if (!name) return 'from-muted to-muted';
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) | 0;
  return GRADIENTS[Math.abs(h) % GRADIENTS.length];
};

export default function TruckImage({ src, name, alt, className, imgClassName }) {
  if (src) {
    return (
      <img
        src={src}
        alt={alt ?? name ?? ''}
        className={cn('h-full w-full object-cover', imgClassName, className)}
      />
    );
  }
  const initial = (name || '?').trim().charAt(0).toUpperCase();
  return (
    <div
      aria-label={alt ?? name ?? 'No photo'}
      role="img"
      className={cn(
        'flex h-full w-full items-center justify-center bg-gradient-to-br text-foreground/40',
        gradientFor(name),
        className,
      )}
    >
      <span className="text-3xl font-bold tracking-tight">{initial}</span>
    </div>
  );
}
