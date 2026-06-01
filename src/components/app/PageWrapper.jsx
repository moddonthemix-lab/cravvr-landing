import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ChevronsUpDown, LogOut, User, Settings, Truck, ShieldCheck } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { useCart } from '../../contexts/CartContext';
import { Icons } from '../common/Icons';
import NotificationBell from '../common/NotificationBell';
import useUserLocation from '../../hooks/useUserLocation';
import { cn } from '@/lib/utils';

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';

// ── helpers ────────────────────────────────────────────────────────────────

const getInitials = (name, email) => {
  if (name) return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  if (email) return email[0].toUpperCase();
  return 'U';
};

// ── Nav sections ───────────────────────────────────────────────────────────

const NAV_MAIN = [
  { label: 'Home',     icon: Icons.home,     path: '/'         },
  { label: 'Map',      icon: Icons.map,      path: '/map'      },
  { label: 'Discover', icon: Icons.compass,  path: '/discover' },
  { label: 'Bolt',     icon: Icons.bolt,     path: '/bolt'     },
];

const NAV_LIBRARY = [
  { label: 'Favorites', icon: Icons.heart,   path: '/profile?tab=favorites' },
  { label: 'Orders',    icon: Icons.orders,  path: '/profile?tab=orders'   },
];

// ── AppSidebar ──────────────────────────────────────────────────────────────

const AppSidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, profile, isOwner, isAdmin, openAuth, signOut } = useAuth();

  const isActive = (path) => {
    const base = path.split('?')[0];
    if (base === '/') return location.pathname === '/';
    return location.pathname.startsWith(base);
  };

  const handleSignOut = async () => {
    try {
      navigate('/', { replace: true });
      await signOut();
    } catch (err) {
      console.error('Sign out failed:', err);
    }
  };

  const displayName = profile?.name || user?.email?.split('@')[0] || 'Guest';
  const displayEmail = user?.email || '';
  const initials = getInitials(profile?.name, user?.email);

  return (
    <Sidebar collapsible="icon">
      {/* Logo */}
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              className="cursor-pointer hover:bg-transparent active:bg-transparent"
              onClick={() => navigate('/')}
            >
              <img
                src="/logo/cravvr-logo.png"
                alt="Cravvr"
                className="h-10 w-auto object-contain"
              />
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        {/* Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {NAV_MAIN.map((item) => (
                <SidebarMenuItem key={item.label}>
                  <SidebarMenuButton
                    tooltip={item.label}
                    isActive={isActive(item.path)}
                    onClick={() => navigate(item.path)}
                  >
                    <span className="h-4 w-4 shrink-0">{item.icon}</span>
                    <span>{item.label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Library — authenticated only */}
        {user && (
          <SidebarGroup>
            <SidebarGroupLabel>Library</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {NAV_LIBRARY.map((item) => (
                  <SidebarMenuItem key={item.label}>
                    <SidebarMenuButton
                      tooltip={item.label}
                      isActive={isActive(item.path)}
                      onClick={() => navigate(item.path)}
                    >
                      <span className="h-4 w-4 shrink-0">{item.icon}</span>
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Role-specific — owner / admin */}
        {user && (isOwner || isAdmin) && (
          <SidebarGroup>
            <SidebarGroupLabel>
              {isAdmin ? 'Admin' : 'My Business'}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {isOwner && (
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      tooltip="My Trucks"
                      isActive={isActive('/owner')}
                      onClick={() => navigate('/owner')}
                    >
                      <Truck className="h-4 w-4 shrink-0" />
                      <span>My Trucks</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )}
                {isAdmin && (
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      tooltip="Admin Dashboard"
                      isActive={isActive('/admin')}
                      onClick={() => navigate('/admin')}
                    >
                      <ShieldCheck className="h-4 w-4 shrink-0" />
                      <span>Admin</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      {/* User avatar footer */}
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <SidebarMenuButton
                    size="lg"
                    className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                  >
                    <Avatar className="h-8 w-8 rounded-lg shrink-0">
                      <AvatarImage src={profile?.avatar_url} alt={displayName} />
                      <AvatarFallback className="rounded-lg bg-primary text-primary-foreground text-xs font-semibold">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="grid flex-1 text-left text-sm leading-tight min-w-0">
                      <span className="truncate font-semibold">{displayName}</span>
                      <span className="truncate text-xs text-muted-foreground">{displayEmail}</span>
                    </div>
                    <ChevronsUpDown className="ml-auto h-4 w-4 shrink-0 opacity-50" />
                  </SidebarMenuButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                  side="bottom"
                  align="end"
                  sideOffset={4}
                >
                  <DropdownMenuLabel className="p-0 font-normal">
                    <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                      <Avatar className="h-8 w-8 rounded-lg shrink-0">
                        <AvatarImage src={profile?.avatar_url} alt={displayName} />
                        <AvatarFallback className="rounded-lg bg-primary text-primary-foreground text-xs font-semibold">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                      <div className="grid flex-1 text-left text-sm leading-tight min-w-0">
                        <span className="truncate font-semibold">{displayName}</span>
                        <span className="truncate text-xs text-muted-foreground">{displayEmail}</span>
                      </div>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuGroup>
                    <DropdownMenuItem onClick={() => navigate('/profile')}>
                      <User className="mr-2 h-4 w-4" />
                      Account
                    </DropdownMenuItem>
                    {isOwner && (
                      <DropdownMenuItem onClick={() => navigate('/owner')}>
                        <Truck className="mr-2 h-4 w-4" />
                        My Trucks
                      </DropdownMenuItem>
                    )}
                    {isAdmin && (
                      <DropdownMenuItem onClick={() => navigate('/admin')}>
                        <ShieldCheck className="mr-2 h-4 w-4" />
                        Admin Dashboard
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuGroup>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleSignOut}
                    className="text-destructive focus:bg-destructive/10 focus:text-destructive"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <SidebarMenuButton
                size="lg"
                onClick={() => openAuth('login')}
                className="text-primary hover:text-primary"
              >
                <Avatar className="h-8 w-8 rounded-lg shrink-0">
                  <AvatarFallback className="rounded-lg bg-muted text-muted-foreground text-xs">
                    ?
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">Sign In</span>
                  <span className="truncate text-xs text-muted-foreground">Get started free</span>
                </div>
              </SidebarMenuButton>
            )}
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
};

// ── Bottom nav item (mobile) ───────────────────────────────────────────────

const BottomNavItem = ({ icon, label, active, onClick, badge }) => (
  <button
    type="button"
    onClick={onClick}
    className={cn(
      'relative flex flex-col items-center justify-center gap-0.5 py-2 text-[11px] font-medium transition-colors',
      active ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
    )}
  >
    <span className="h-5 w-5">{icon}</span>
    <span>{label}</span>
    {badge != null && badge > 0 && (
      <span className="absolute top-1 right-2 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-primary px-1 text-[9px] font-semibold text-primary-foreground tabular-nums">
        {badge}
      </span>
    )}
  </button>
);

// ── PageWrapper ────────────────────────────────────────────────────────────

const PageWrapper = ({ children, activeNav }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, openAuth } = useAuth();
  const { itemCount, openCart } = useCart();
  const { city: rawCity } = useUserLocation();
  const userCity = typeof rawCity === 'string' ? rawCity : (rawCity?.city || 'Your Location');

  const isActive = (path) => {
    if (activeNav) return activeNav === path;
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <SidebarProvider>
      <AppSidebar />

      <SidebarInset className="pb-20 lg:pb-0">
        {/* Header */}
        <header className="sticky top-0 z-40 flex items-center gap-2 border-b border-border bg-background/85 backdrop-blur px-3 py-2.5 sm:px-4 min-w-0">
          <SidebarTrigger className="-ml-1 h-9 w-9" />
          <Separator orientation="vertical" className="h-5 mx-1" />

          <form
            onSubmit={(e) => { e.preventDefault(); if (location.pathname !== '/') navigate('/'); }}
            className="hidden md:flex flex-1 min-w-0 max-w-xl"
          >
            <div className="relative w-full">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground">
                {Icons.search}
              </span>
              <input
                type="search"
                placeholder="Search food trucks, cuisines…"
                onClick={() => location.pathname !== '/' && navigate('/')}
                className="h-9 w-full rounded-full border border-input bg-muted/50 pl-10 pr-4 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              />
            </div>
          </form>

          <div className="flex items-center gap-1.5 ml-auto shrink-0">
            <div className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1.5 text-xs">
              <span className="h-3.5 w-3.5 text-primary">{Icons.mapPin}</span>
              <span className="font-medium truncate max-w-[10rem]">{userCity}</span>
            </div>

            <NotificationBell />

            <button
              type="button"
              onClick={openCart}
              aria-label="Open cart"
              className="relative flex h-9 w-9 items-center justify-center rounded-md text-foreground transition-colors hover:bg-muted"
            >
              <span className="h-5 w-5">{Icons.shoppingBag}</span>
              {itemCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[11px] font-semibold text-primary-foreground tabular-nums">
                  {itemCount}
                </span>
              )}
            </button>
          </div>
        </header>

        <main className="flex-1">{children}</main>
      </SidebarInset>

      {/* Mobile bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-background/95 backdrop-blur lg:hidden">
        <div className="grid grid-cols-6 items-center">
          <BottomNavItem icon={Icons.home}        label="Home"    active={isActive('/')}          onClick={() => navigate('/')} />
          <BottomNavItem icon={Icons.map}         label="Map"     active={isActive('/map')}        onClick={() => navigate('/map')} />
          <BottomNavItem icon={Icons.compass}     label="Discover" active={isActive('/discover')} onClick={() => navigate('/discover')} />
          <BottomNavItem icon={Icons.bolt}        label="Bolt"    active={isActive('/bolt')}       onClick={() => navigate('/bolt')} />
          <BottomNavItem icon={Icons.shoppingBag} label="Cart"    badge={itemCount}               onClick={openCart} />
          <BottomNavItem
            icon={Icons.user}
            label={user ? 'Account' : 'Sign In'}
            active={isActive('/profile')}
            onClick={() => (user ? navigate('/profile') : openAuth('login'))}
          />
        </div>
      </nav>
    </SidebarProvider>
  );
};

export default PageWrapper;
