/**
 * Route wrapper components that add navigation functionality to pages
 */
import { useNavigate } from 'react-router-dom';
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
 * Wrapper for CustomerProfile with navigation
 */
export const CustomerProfileWrapper = () => {
  const navigate = useNavigate();
  return <CustomerProfile onBack={() => navigate('/')} />;
};
