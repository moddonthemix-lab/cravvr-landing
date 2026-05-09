import React from 'react';
import { Link } from 'react-router-dom';
import { Icons } from '../common/Icons';

const SOCIAL_LINKS = [
  { href: '#twitter', label: 'Twitter', icon: Icons.twitter },
  { href: '#instagram', label: 'Instagram', icon: Icons.instagram },
  { href: '#facebook', label: 'Facebook', icon: Icons.facebook },
];

const renderLink = (link) => {
  if (link.to) {
    return <Link to={link.to}>{link.label}</Link>;
  }
  return <a href={link.href}>{link.label}</a>;
};

const MarketingFooter = ({
  blurb = 'The map-first food truck platform that connects hungry eaters with amazing local trucks.',
  columns = [],
}) => (
  <footer className="border-t border-border bg-card/40">
    <div className="mx-auto max-w-6xl grid gap-10 px-5 py-12 md:grid-cols-[2fr_3fr]">
      <div className="space-y-4 max-w-sm">
        <Link to="/" className="inline-block">
          <img src="/logo/cravrr-logo-transparent.png" alt="Cravrr" className="h-9 w-auto" />
        </Link>
        <p className="text-sm text-muted-foreground leading-relaxed">{blurb}</p>
        <div className="flex items-center gap-3">
          {SOCIAL_LINKS.map(s => (
            <a
              key={s.label}
              href={s.href}
              aria-label={s.label}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:border-primary hover:text-primary"
            >
              <span className="h-4 w-4">{s.icon}</span>
            </a>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 text-sm">
        {columns.map((col, i) => (
          <div key={i} className="space-y-2">
            <h4 className="font-bold text-foreground">{col.title}</h4>
            {col.links.map((link, j) => (
              <span
                key={j}
                className="block text-muted-foreground transition-colors hover:text-foreground"
              >
                {renderLink(link)}
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
    <div className="border-t border-border">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-1 px-5 py-5 text-xs text-muted-foreground sm:flex-row sm:justify-between">
        <p>© {new Date().getFullYear()} Cravvr. All rights reserved.</p>
        <p>Made with ❤️ for food trucks everywhere</p>
      </div>
    </div>
  </footer>
);

export default MarketingFooter;
