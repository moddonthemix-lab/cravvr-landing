import React, { lazy, Suspense } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import CartDrawer from './components/cart/Cart';
import ProtectedRoute, { RequireOwner, RequireAdmin } from './components/auth/ProtectedRoute';
import AuthModal from './components/auth/AuthModal';
import ViewAsBanner from './components/admin/ViewAsBanner';
import { useAuth } from './components/auth/AuthContext';

const LandingPage = lazy(() => import('./components/landing/LandingPage'));
const TruckDetailPage = lazy(() => import('./components/truck/TruckDetailPage'));
const SocialPage = lazy(() => import('./pages/SocialPage'));
const WaitlistPage = lazy(() => import('./pages/WaitlistPage'));
const CravvrPlusPage = lazy(() => import('./pages/CravvrPlusPage'));
const ResponsiveApp = lazy(() => import('./components/app/ResponsiveApp'));
const MapPage = lazy(() => import('./pages/MapPage'));
const DiscoverPage = lazy(() => import('./pages/DiscoverPage'));
const BoltPage = lazy(() => import('./pages/BoltPage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const AuthConfirmPage = lazy(() => import('./pages/AuthConfirmPage'));
const ResetPasswordPage = lazy(() => import('./pages/ResetPasswordPage'));
const OrderTrackerPage = lazy(() => import('./pages/OrderTrackerPage'));
const CheckoutPage = lazy(() => import('./pages/CheckoutPage'));
const OwnerDashboardWrapper = lazy(() =>
  import('./components/wrappers').then((m) => ({ default: m.OwnerDashboardWrapper }))
);
const AdminDashboardWrapper = lazy(() =>
  import('./components/wrappers').then((m) => ({ default: m.AdminDashboardWrapper }))
);
const CustomerProfileWrapper = lazy(() =>
  import('./components/wrappers').then((m) => ({ default: m.CustomerProfileWrapper }))
);
const GrowthDashboard = lazy(() => import('./components/admin/GrowthDashboard'));
const Unsubscribe = lazy(() => import('./pages/Unsubscribe'));

// Wrapper for LandingPage with navigate
const LandingPageWrapper = () => {
  const navigate = useNavigate();

  const setCurrentView = (view) => {
    switch (view) {
      case 'home':
        navigate('/');
        break;
      case 'app':
        navigate('/browse');
        break;
      case 'owner-dashboard':
        navigate('/owner');
        break;
      case 'profile':
        navigate('/profile');
        break;
      case 'admin':
        navigate('/admin');
        break;
      default:
        navigate('/eat');
    }
  };

  return <LandingPage setCurrentView={setCurrentView} />;
};

const App = () => {
  const { showAuthModal, authMode, closeAuth } = useAuth();

  return (
    <>
      <ViewAsBanner />
      <CartDrawer />
      <AuthModal isOpen={showAuthModal} onClose={closeAuth} initialMode={authMode} />
      <Suspense fallback={null}>
      <Routes>
        {/* Main app - responsive: TabContainer on mobile, HomePage on desktop */}
        <Route path="/" element={<ResponsiveApp />} />

        {/* Landing/Marketing page at /eat */}
        <Route path="/eat" element={<LandingPageWrapper />} />

        {/* Standalone login page */}
        <Route path="/login" element={<LoginPage />} />

        {/* Email confirmation page */}
        <Route path="/auth/confirm" element={<AuthConfirmPage />} />

        {/* Password reset page */}
        <Route path="/reset-password" element={<ResetPasswordPage />} />

        {/* Browse trucks - redirect to home */}
        <Route path="/browse" element={<Navigate to="/" replace />} />

        {/* Feature pages with sidebar (desktop) */}
        <Route path="/map" element={<MapPage />} />
        <Route path="/discover" element={<DiscoverPage />} />
        <Route path="/bolt" element={<BoltPage />} />

        {/* Truck detail page - production version */}
        <Route path="/truck/:id" element={<TruckDetailPage />} />

        {/* Checkout - requires authentication */}
        <Route path="/checkout" element={
          <ProtectedRoute>
            <CheckoutPage />
          </ProtectedRoute>
        } />

        {/* Order tracking page */}
        <Route path="/order/:orderId" element={
          <ProtectedRoute>
            <OrderTrackerPage />
          </ProtectedRoute>
        } />

        {/* User profile - requires authentication */}
        <Route path="/profile" element={
          <ProtectedRoute>
            <CustomerProfileWrapper />
          </ProtectedRoute>
        } />
        {/* Redirect legacy profile tab routes */}
        <Route path="/orders" element={<Navigate to="/profile?tab=orders" replace />} />
        <Route path="/favorites" element={<Navigate to="/profile?tab=favorites" replace />} />

        {/* Owner dashboard - requires owner role */}
        <Route path="/owner" element={
          <RequireOwner>
            <OwnerDashboardWrapper />
          </RequireOwner>
        } />

        {/* Admin dashboard - requires admin role */}
        <Route path="/admin" element={
          <RequireAdmin>
            <AdminDashboardWrapper />
          </RequireAdmin>
        } />

        {/* Growth dashboard (CAC/LTV cohorts) - admin only */}
        <Route path="/admin/growth" element={
          <RequireAdmin>
            <GrowthDashboard />
          </RequireAdmin>
        } />

        {/* Unsubscribe from marketing email - public, token-authenticated */}
        <Route path="/unsubscribe" element={<Unsubscribe />} />

        {/* Social media graphics studio */}
        <Route path="/social" element={<SocialPage />} />

        {/* Waitlist signup questionnaire */}
        <Route path="/waitlist" element={<WaitlistPage />} />

        {/* Cravvr Plus premium landing page */}
        <Route path="/plus" element={<CravvrPlusPage />} />
        <Route path="/CravvrPlus" element={<CravvrPlusPage />} />

        {/* Fallback to home */}
        <Route path="*" element={<ResponsiveApp />} />
      </Routes>
      </Suspense>
    </>
  );
};

export default App;
