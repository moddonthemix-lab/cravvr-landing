import React from 'react';
import { Icons } from '../common/Icons';

const BrowserMockup = ({
  url,
  image,
  alt,
  navItems = [],
  badge,
  logo,
  tagline,
  metric,
  metricSub,
  metricIcon,
  ctaLabel,
  hint = [],
}) => (
  <div className="relative w-full max-w-md rounded-2xl overflow-hidden shadow-2xl ring-1 ring-black/10 bg-white">
    {/* Chrome */}
    <div className="flex items-center gap-2 border-b border-border bg-muted/60 px-3 py-2.5">
      <span className="h-2.5 w-2.5 rounded-full bg-rose-400" />
      <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
      <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
      <div className="ml-2 flex items-center gap-1.5 rounded-md bg-white border border-border px-2 py-1 text-xs text-muted-foreground">
        <span className="h-3 w-3">{Icons.lock}</span>
        <span className="truncate max-w-[14rem]">{url}</span>
      </div>
    </div>

    {/* Screen */}
    <div className="relative aspect-[4/3] w-full bg-gradient-to-br from-slate-100 to-slate-200">
      <img src={image} alt={alt} className="h-full w-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent" />

      {navItems.length > 0 && (
        <div className="absolute inset-x-0 top-0 flex items-center justify-end gap-4 px-4 py-3 text-xs font-semibold text-white/90">
          {navItems.map((item, i) => (
            <span key={i}>{item}</span>
          ))}
        </div>
      )}

      <div className="absolute inset-x-0 bottom-0 px-5 py-4 space-y-2 text-white">
        {badge && (
          <span className="inline-flex items-center rounded-full bg-positive/90 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide">
            {badge}
          </span>
        )}
        {logo && <div className="text-base font-bold">{logo}</div>}
        {tagline && <div className="text-xs text-white/80">{tagline}</div>}
        {metric && (
          <div className="flex items-center gap-1.5 text-sm">
            {metricIcon && <span className="h-3.5 w-3.5 text-warning">{metricIcon}</span>}
            <span className="font-bold">{metric}</span>
            {metricSub && <span className="text-white/70 text-xs">{metricSub}</span>}
          </div>
        )}
        {ctaLabel && (
          <button
            type="button"
            className="mt-1 rounded-full bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground"
          >
            {ctaLabel}
          </button>
        )}
      </div>
    </div>

    {hint.length > 0 && (
      <div className="flex items-center justify-between gap-3 border-t border-border bg-muted/40 px-5 py-3 text-[11px] text-muted-foreground">
        {hint.map((h, i) => (
          <span key={i} className="inline-flex items-center gap-1.5">
            {h.icon && <span className="h-3.5 w-3.5">{h.icon}</span>}
            {h.label}
          </span>
        ))}
      </div>
    )}
  </div>
);

export default BrowserMockup;
