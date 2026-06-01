import React from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardTabBar } from '@/components/ui/dashboard-sidebar';
import { Icons } from '../common/Icons';

export const ADMIN_NAV_ITEMS = [
  { id: 'dashboard',  label: 'Dashboard',   icon: Icons.chart       },
  { id: 'waitlist',   label: 'Waitlist',     icon: Icons.users       },
  { id: 'users',      label: 'Users',        icon: Icons.user        },
  { id: 'trucks',     label: 'Food Trucks',  icon: Icons.truck       },
  { id: 'orders',     label: 'Orders',       icon: Icons.shoppingBag },
  { id: 'analytics',  label: 'Analytics',    icon: Icons.trendingUp  },
  { id: 'marketing',  label: 'Marketing',    icon: Icons.megaphone   },
  { id: 'growth',     label: 'Growth',       icon: Icons.target      },
  { id: 'playbook',   label: 'Playbook',     icon: Icons.checkCircle },
  { id: 'settings',   label: 'Settings',     icon: Icons.settings    },
];

const ROUTED = { trucks: '/admin/trucks', growth: '/admin/growth' };

/**
 * Shared tab bar for all admin pages.
 *
 * Props:
 *   activeId        — which tab is highlighted
 *   onLocalNavigate — (id) => void — called for non-routed tabs when already
 *                     on /admin. Omit on pages that navigate away from /admin.
 */
const AdminNavBar = ({ activeId, onLocalNavigate }) => {
  const navigate = useNavigate();

  const handleNavigate = (id) => {
    if (ROUTED[id]) {
      navigate(ROUTED[id]);
    } else if (onLocalNavigate) {
      onLocalNavigate(id);
    } else {
      navigate('/admin');
    }
  };

  return (
    <DashboardTabBar
      navItems={ADMIN_NAV_ITEMS}
      activeId={activeId}
      onNavigate={handleNavigate}
      header={
        <div className="px-3 sm:px-6 pt-4 pb-2">
          <h1 className="text-lg font-bold tracking-tight">Admin Dashboard</h1>
          <p className="text-xs text-muted-foreground">Cravvr internal tools</p>
        </div>
      }
    />
  );
};

export default AdminNavBar;
