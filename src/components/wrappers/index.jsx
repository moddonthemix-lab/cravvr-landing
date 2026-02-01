/**
 * Route wrapper components that add AppLayout integration for consistent navigation
 */
import OwnerDashboard from '../owner/OwnerDashboard';
import CustomerProfile from '../customer/CustomerProfile';
import AdminDashboard from '../../admin/AdminDashboard';
import AppLayout from '../layout/AppLayout';

/**
 * Wrapper for OwnerDashboard with AppLayout integration
 * Owner dashboard now uses the main app layout for consistent navigation
 */
export const OwnerDashboardWrapper = () => {
  return (
    <AppLayout activeNav="/owner">
      <OwnerDashboard />
    </AppLayout>
  );
};

/**
 * Wrapper for AdminDashboard with AppLayout integration
 * Admin dashboard uses the main app layout for consistent navigation
 */
export const AdminDashboardWrapper = () => {
  return (
    <AppLayout activeNav="/admin">
      <AdminDashboard />
    </AppLayout>
  );
};

/**
 * Wrapper for CustomerProfile with AppLayout integration
 * Profile page now uses the main app layout for consistent navigation on desktop
 */
export const CustomerProfileWrapper = () => {
  return (
    <AppLayout activeNav="/profile">
      <CustomerProfile />
    </AppLayout>
  );
};
