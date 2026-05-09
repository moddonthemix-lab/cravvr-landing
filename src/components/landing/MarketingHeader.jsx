import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Icons } from '../common/Icons';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const MarketingHeader = ({ navLinks = [], ctaLabel, ctaHref, ctaTo }) => {
  const [open, setOpen] = useState(false);

  const renderLink = (link, onClick) => {
    if (link.to) {
      return (
        <Link to={link.to} onClick={onClick}>
          {link.label}
        </Link>
      );
    }
    return (
      <a href={link.href} onClick={onClick}>
        {link.label}
      </a>
    );
  };

  const renderCta = (extraClass = '') => {
    if (ctaTo) {
      return (
        <Button asChild size="sm" className={extraClass}>
          <Link to={ctaTo} onClick={() => setOpen(false)}>{ctaLabel}</Link>
        </Button>
      );
    }
    return (
      <Button asChild size="sm" className={extraClass}>
        <a href={ctaHref} onClick={() => setOpen(false)}>{ctaLabel}</a>
      </Button>
    );
  };

  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/70 border-b border-border/80">
      <div className="mx-auto flex max-w-[1200px] items-center justify-between px-5 py-3.5">
        <Link to="/" className="flex items-center gap-2.5 font-bold text-foreground">
          <img src="/logo/cravvr-logo.png" alt="Cravvr" className="h-10 w-auto" />
        </Link>

        <nav className="hidden md:flex items-center gap-9 text-sm font-medium text-muted-foreground">
          {navLinks.map((link, i) => (
            <span
              key={i}
              className="relative transition-colors hover:text-foreground after:absolute after:-bottom-1 after:left-0 after:h-0.5 after:w-0 after:bg-primary after:transition-all hover:after:w-full"
            >
              {renderLink(link)}
            </span>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-2">
          {ctaLabel && renderCta()}
        </div>

        <button
          type="button"
          onClick={() => setOpen(!open)}
          aria-label="Toggle menu"
          aria-expanded={open}
          className="flex h-10 w-10 items-center justify-center rounded-md text-foreground transition-colors hover:bg-muted md:hidden"
        >
          <span className="h-6 w-6">{open ? Icons.x : Icons.menu}</span>
        </button>
      </div>

      <div
        className={cn(
          'absolute left-0 right-0 top-full overflow-hidden border-b border-border bg-white transition-[max-height,padding] duration-300 md:hidden',
          open ? 'max-h-[600px] px-5 pt-4 pb-6' : 'max-h-0'
        )}
      >
        <nav className="flex flex-col">
          {navLinks.map((link, i) => (
            <span
              key={i}
              className="border-b border-border py-3.5 text-base font-medium text-foreground"
            >
              {renderLink(link, () => setOpen(false))}
            </span>
          ))}
        </nav>
        {ctaLabel && (
          <div className="mt-5">
            {renderCta('w-full')}
          </div>
        )}
      </div>
    </header>
  );
};

export default MarketingHeader;
