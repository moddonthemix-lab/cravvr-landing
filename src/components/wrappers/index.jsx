/**
 * Route wrapper components that add navigation functionality to pages
 */
import { useNavigate } from 'react-router-dom';
import OwnerDashboard from '../owner/OwnerDashboard';
import CustomerProfile from '../customer/CustomerProfile';

/**
 * Wrapper for OwnerDashboard with navigation
 */
export const OwnerDashboardWrapper = () => {
  const navigate = useNavigate();
  return <OwnerDashboard onBack={() => navigate('/')} />;
};

/**
 * Wrapper for CustomerProfile with navigation
 */
export const CustomerProfileWrapper = () => {
  const navigate = useNavigate();
  return <CustomerProfile onBack={() => navigate('/')} />;
};
