import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Icons } from '../common/Icons';
import { useAuth } from '../auth/AuthContext';
import UserMenu from '../auth/UserMenu';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const NAV_LINKS = [
  { href: '#features', label: 'Features' },
  { href: '#how-it-works', label: 'How it Works' },
  { href: '#pricing', label: 'Pricing' },
  { href: '#faq', label: 'FAQ' },
];

const Header = ({ mobileMenuOpen, setMobileMenuOpen, setCurrentView }) => {
  const navigate = useNavigate();
  const { isAuthenticated, openAuth } = useAuth();

  const openLogin = () => {
    openAuth('login');
    setMobileMenuOpen(false);
  };

  const openSignup = () => {
    openAuth('signup');
    setMobileMenuOpen(false);
  };

  const handleNavigate = (destination) => {
    if (destination === 'profile') setCurrentView('profile');
    else if (destination === 'owner-dashboard') setCurrentView('owner-dashboard');
    else if (destination === 'settings') setCurrentView('settings');
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
        <a
          href="/"
          className="flex items-center gap-2.5 font-bold text-foreground"
          onClick={(e) => { e.preventDefault(); setCurrentView('landing'); }}
        >
          <img src="/logo/cravvr-logo.png" alt="Cravrr" className="h-10 w-auto" />
        </a>

        <nav className="hidden md:flex items-center gap-9">
          {NAV_LINKS.map(link => (
            <a
              key={link.href}
              href={link.href}
              className="relative text-sm font-medium text-muted-foreground transition-colors hover:text-foreground after:absolute after:-bottom-1 after:left-0 after:h-0.5 after:w-0 after:bg-primary after:transition-all hover:after:w-full"
            >
              {link.label}
            </a>
          ))}
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/')}
            className="rounded-full border-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground"
          >
            Order Now
          </Button>
        </nav>

        <div className="hidden md:flex items-center gap-2">
          {isAuthenticated ? (
            <UserMenu onNavigate={handleNavigate} />
          ) : (
            <>
              <Button variant="ghost" size="sm" onClick={openLogin}>
                Log In
              </Button>
              <Button size="sm" onClick={openSignup}>
                Sign Up
              </Button>
            </>
          )}
        </div>

        <button
          type="button"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle menu"
          aria-expanded={mobileMenuOpen}
          className="flex h-10 w-10 items-center justify-center rounded-md text-foreground transition-colors hover:bg-muted md:hidden"
        >
          <span className="h-6 w-6">{mobileMenuOpen ? Icons.x : Icons.menu}</span>
        </button>
      </div>

      <div
        className={cn(
          'absolute left-0 right-0 top-full overflow-hidden border-b border-border bg-white transition-[max-height,padding] duration-300 md:hidden',
          mobileMenuOpen ? 'max-h-[600px] px-5 pt-4 pb-6' : 'max-h-0'
        )}
      >
        <nav className="flex flex-col">
          {NAV_LINKS.map(link => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setMobileMenuOpen(false)}
              className="border-b border-border py-3.5 text-base font-medium text-foreground"
            >
              {link.label}
            </a>
          ))}
          <Button
            variant="outline"
            onClick={() => { navigate('/'); setMobileMenuOpen(false); }}
            className="mt-4 w-full rounded-full border-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground"
          >
            Order Now
          </Button>
        </nav>

        <div className="mt-5 flex flex-col gap-2">
          {isAuthenticated ? (
            <UserMenu onNavigate={(dest) => { handleNavigate(dest); setMobileMenuOpen(false); }} />
          ) : (
            <>
              <Button variant="ghost" onClick={openLogin} className="w-full">
                Log In
              </Button>
              <Button onClick={openSignup} className="w-full">
                Sign Up
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
