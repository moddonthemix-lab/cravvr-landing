import React from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import AdminDashboard from './admin/AdminDashboard';
import LandingPage from './components/landing/LandingPage';
import CartDrawer from './components/cart/Cart';
import TruckDetailPage from './components/truck/TruckDetailPage';
import SocialPage from './pages/SocialPage';
import ResponsiveApp from './components/app/ResponsiveApp';
import MapPage from './pages/MapPage';
import DiscoverPage from './pages/DiscoverPage';
import BoltPage from './pages/BoltPage';
import LoginPage from './pages/LoginPage';
import ProtectedRoute, { RequireOwner, RequireAdmin } from './components/auth/ProtectedRoute';
import AuthModal from './components/auth/AuthModal';
import { useAuth } from './components/auth/AuthContext';
import { OwnerDashboardWrapper, CustomerProfileWrapper } from './components/wrappers';

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
      <CartDrawer />
      <AuthModal isOpen={showAuthModal} onClose={closeAuth} initialMode={authMode} />
      <Routes>
        {/* Main app - responsive: TabContainer on mobile, HomePage on desktop */}
        <Route path="/" element={<ResponsiveApp />} />

        {/* Landing/Marketing page at /eat */}
        <Route path="/eat" element={<LandingPageWrapper />} />

        {/* Standalone login page */}
        <Route path="/login" element={<LoginPage />} />

        {/* Browse trucks - redirect to home */}
        <Route path="/browse" element={<Navigate to="/" replace />} />

        {/* Feature pages with sidebar (desktop) */}
        <Route path="/map" element={<MapPage />} />
        <Route path="/discover" element={<DiscoverPage />} />
        <Route path="/bolt" element={<BoltPage />} />

        {/* Truck detail page - production version */}
        <Route path="/truck/:id" element={<TruckDetailPage />} />

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
            <AdminDashboard />
          </RequireAdmin>
        } />

        {/* Social media graphics studio */}
        <Route path="/social" element={<SocialPage />} />

        {/* Fallback to home */}
        <Route path="*" element={<ResponsiveApp />} />
      </Routes>
    </>
  );
};

export default App;
