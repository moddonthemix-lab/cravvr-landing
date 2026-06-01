import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetClose } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { Icons } from '../common/Icons';
import { useAuth } from '../auth/AuthContext';
import UserMenu from '../auth/UserMenu';

/**
 * SiteHeader — single canonical header for all marketing / landing pages.
 *
 * Props:
 *   navLinks   [{ label, href?, to? }]  — desktop + mobile nav links
 *   cta        { label, href?, to?, onClick? }  — optional CTA button
 *   showAuth   boolean  — show Login / Sign Up when unauthenticated (landing page)
 *   onLogoClick  fn  — override logo link behavior (landing page view switcher)
 *   onNavigate   fn  — passed to UserMenu for dashboard routing
 */
const SiteHeader = ({
  navLinks = [],
  cta,
  showAuth = false,
  onLogoClick,
  onNavigate,
}) => {
  const navigate = useNavigate();
  const { isAuthenticated, openAuth } = useAuth();

  const renderNavLink = (link, className = '', onClick) => {
    const shared = { className, onClick };
    if (link.to) return <Link to={link.to} {...shared}>{link.label}</Link>;
    return <a href={link.href} {...shared}>{link.label}</a>;
  };

  const renderCta = (extraClass = '') => {
    if (!cta) return null;
    const cls = cn('gap-2', extraClass);
    if (cta.onClick) {
      return <Button size="sm" onClick={cta.onClick} className={cls}>{cta.label}</Button>;
    }
    if (cta.to) {
      return (
        <Button asChild size="sm" className={cls}>
          <Link to={cta.to}>{cta.label}</Link>
        </Button>
      );
    }
    return (
      <Button asChild size="sm" className={cls}>
        <a href={cta.href}>{cta.label}</a>
      </Button>
    );
  };

  const logoEl = (
    <img src="/logo/cravvr-logo.png" alt="Cravvr" className="h-10 w-auto" />
  );

  const renderLogo = () => {
    if (onLogoClick) {
      return (
        <a
          href="/"
          className="flex items-center gap-2.5 font-bold text-foreground"
          onClick={(e) => { e.preventDefault(); onLogoClick(); }}
        >
          {logoEl}
        </a>
      );
    }
    return (
      <Link to="/" className="flex items-center gap-2.5 font-bold text-foreground">
        {logoEl}
      </Link>
    );
  };

  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/70 border-b border-border/80">
      <a
        href="#main"
        className="absolute -top-10 left-0 z-[10000] bg-primary text-primary-foreground px-4 py-2 transition-all focus:top-0"
      >
        Skip to main content
      </a>

      <div className="mx-auto flex max-w-[1200px] items-center justify-between px-5 py-3.5">
        {renderLogo()}

        {/* Desktop nav */}
        {navLinks.length > 0 && (
          <nav className="hidden md:flex items-center gap-9">
            {navLinks.map((link) => (
              <React.Fragment key={link.label}>
                {renderNavLink(
                  link,
                  'relative text-sm font-medium text-muted-foreground transition-colors hover:text-foreground after:absolute after:-bottom-1 after:left-0 after:h-0.5 after:w-0 after:bg-primary after:transition-all hover:after:w-full'
                )}
              </React.Fragment>
            ))}
          </nav>
        )}

        {/* Desktop right actions */}
        <div className="hidden md:flex items-center gap-2">
          {renderCta()}
          {showAuth && (
            isAuthenticated ? (
              <UserMenu onNavigate={onNavigate} />
            ) : (
              <>
                <Button variant="ghost" size="sm" onClick={() => openAuth('login')}>
                  Log In
                </Button>
                <Button size="sm" onClick={() => openAuth('signup')}>
                  Sign Up
                </Button>
              </>
            )
          )}
        </div>

        {/* Mobile: Sheet trigger */}
        <Sheet>
          <SheetTrigger asChild>
            <button
              type="button"
              aria-label="Open menu"
              className="flex h-10 w-10 items-center justify-center rounded-md text-foreground transition-colors hover:bg-muted md:hidden"
            >
              <span className="h-6 w-6">{Icons.menu}</span>
            </button>
          </SheetTrigger>

          <SheetContent side="left" className="flex flex-col gap-0 p-0">
            {/* Sheet header */}
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              {renderLogo()}
            </div>

            {/* Nav links */}
            <nav className="flex flex-col px-5 py-2">
              {navLinks.map((link) => (
                <SheetClose asChild key={link.label}>
                  {renderNavLink(
                    link,
                    'block border-b border-border py-3.5 text-base font-medium text-foreground hover:text-primary transition-colors'
                  )}
                </SheetClose>
              ))}
            </nav>

            {/* CTA + Auth */}
            <div className="mt-auto flex flex-col gap-2 border-t border-border px-5 py-5">
              {cta && (
                <SheetClose asChild>
                  {renderCta('w-full justify-center')}
                </SheetClose>
              )}
              {showAuth && (
                isAuthenticated ? (
                  <UserMenu onNavigate={(dest) => { onNavigate?.(dest); }} />
                ) : (
                  <>
                    <SheetClose asChild>
                      <Button variant="outline" onClick={() => openAuth('login')} className="w-full">
                        Log In
                      </Button>
                    </SheetClose>
                    <SheetClose asChild>
                      <Button onClick={() => openAuth('signup')} className="w-full">
                        Sign Up
                      </Button>
                    </SheetClose>
                  </>
                )
              )}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
};

export default SiteHeader;
