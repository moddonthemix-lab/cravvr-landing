import * as React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

/**
 * DashboardSidebar — vertical nav for owner / admin / customer dashboards.
 * Visual language matches the customer profile menu-list card: divided rows
 * with chip-style icons and a rose primary active state.
 *
 * Props:
 *   title       string                 — heading shown in the sidebar header
 *   subtitle    string?                — small line under the title
 *   brand       ReactNode?             — replaces title block entirely (e.g. logo + role badge)
 *   navItems    Array<{id, label, icon, badge?, onClick?, disabled?}>
 *   activeId    string                 — currently active nav id
 *   onNavigate  (id) => void           — fired when a nav item is clicked
 *   footer      ReactNode?             — slot at the bottom of the sidebar (logout / user info etc.)
 *   className   string?
 */
const DashboardSidebar = ({
  title,
  subtitle,
  brand,
  navItems = [],
  activeId,
  onNavigate,
  footer,
  className,
}) => (
  <aside
    className={cn(
      'hidden lg:flex flex-col w-64 shrink-0 sticky top-0 h-screen py-4 pl-4 pr-2',
      className
    )}
  >
    <Card className="flex-1 flex flex-col overflow-hidden shadow-sm">
      {(brand || title) && (
        <div className="border-b border-border px-4 py-4">
          {brand ? (
            brand
          ) : (
            <>
              <h2 className="text-base font-bold tracking-tight leading-tight">{title}</h2>
              {subtitle && (
                <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
              )}
            </>
          )}
        </div>
      )}

      <nav className="flex-1 overflow-y-auto p-2 space-y-0.5">
        {navItems.map((item) => {
          const isActive = item.id === activeId;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                if (item.disabled) return;
                if (item.onClick) item.onClick();
                else onNavigate?.(item.id);
              }}
              disabled={item.disabled}
              className={cn(
                'group w-full flex items-center gap-3 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                isActive
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                item.disabled && 'opacity-50 cursor-not-allowed hover:bg-transparent'
              )}
            >
              <span
                className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-md shrink-0 transition-colors',
                  isActive
                    ? 'bg-white/20 text-primary-foreground'
                    : 'bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary'
                )}
              >
                <span className="h-4 w-4 flex items-center justify-center">{item.icon}</span>
              </span>
              <span className="flex-1 text-left truncate">{item.label}</span>
              {item.badge != null && (
                <Badge
                  variant={isActive ? 'secondary' : 'outline'}
                  className={cn(
                    'tabular-nums text-[10px] py-0 px-1.5',
                    isActive && 'bg-white/20 text-primary-foreground border-0'
                  )}
                >
                  {item.badge}
                </Badge>
              )}
            </button>
          );
        })}
      </nav>

      {footer && <div className="border-t border-border p-3">{footer}</div>}
    </Card>
  </aside>
);

/**
 * DashboardMobileNav — horizontal scroll pill nav shown on mobile / tablet
 * when the sidebar is hidden. Same data-driven nav structure.
 */
const DashboardMobileNav = ({ navItems = [], activeId, onNavigate, className }) => (
  <div
    className={cn(
      'lg:hidden sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80',
      className
    )}
  >
    <nav className="flex overflow-x-auto gap-1.5 px-3 py-2.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {navItems.map((item) => {
        const isActive = item.id === activeId;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => {
              if (item.disabled) return;
              if (item.onClick) item.onClick();
              else onNavigate?.(item.id);
            }}
            disabled={item.disabled}
            className={cn(
              'inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
              isActive
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground',
              item.disabled && 'opacity-50 cursor-not-allowed'
            )}
          >
            <span className="h-3.5 w-3.5 flex items-center justify-center">{item.icon}</span>
            <span>{item.label}</span>
            {item.badge != null && (
              <span
                className={cn(
                  'rounded-full px-1.5 py-px text-[10px] font-semibold tabular-nums',
                  isActive ? 'bg-white/25 text-white' : 'bg-muted text-muted-foreground'
                )}
              >
                {item.badge}
              </span>
            )}
          </button>
        );
      })}
    </nav>
  </div>
);

/**
 * DashboardShell — flex layout that places the sidebar to the left of the
 * main content on desktop. Provide `<DashboardSidebar />` (or null) and
 * children for the main area.
 */
const DashboardShell = ({ sidebar, mobileNav, children, className }) => (
  <div className={cn('flex flex-col lg:flex-row min-h-screen w-full bg-muted/30', className)}>
    {sidebar}
    <div className="flex-1 min-w-0 flex flex-col">
      {mobileNav}
      <main className="flex-1 min-w-0 px-4 py-4 lg:px-6 lg:py-6">{children}</main>
    </div>
  </div>
);

export { DashboardSidebar, DashboardMobileNav, DashboardShell };
