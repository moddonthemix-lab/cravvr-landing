/**
 * Route wrapper components that add the unified PageWrapper chrome.
 *
 * PageWrapper owns the desktop sidebar (Home/Map/Discover/Bolt + Favorites/Orders +
 * Account/My Trucks/Admin/Sign Out) and the mobile bottom-nav. Every authenticated
 * area routes through it so the sidebar is identical no matter which surface the
 * user is on.
 */
import OwnerDashboard from '../owner/OwnerDashboard';
import CustomerProfile from '../customer/CustomerProfile';
import AdminDashboard from '../../admin/AdminDashboard';
import PageWrapper from '../app/PageWrapper';

export const AdminAreaWrapper = ({ children }) => (
  <PageWrapper activeNav="/admin">
    {children}
  </PageWrapper>
);

export const OwnerDashboardWrapper = () => (
  <PageWrapper activeNav="/owner">
    <OwnerDashboard />
  </PageWrapper>
);

export const AdminDashboardWrapper = () => (
  <PageWrapper activeNav="/admin">
    <AdminDashboard />
  </PageWrapper>
);

export const CustomerProfileWrapper = () => (
  <PageWrapper activeNav="/profile">
    <CustomerProfile />
  </PageWrapper>
);
