import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';
import LoadingSplash from '../common/LoadingSplash';

// Route guard. Unauthenticated users get redirected to /login with the
// attempted path stored in state so the page can send them back after
// they sign in. Role-restricted routes (owner/admin) bounce to "/" if the
// signed-in user doesn't have the right role.
const ProtectedRoute = ({ children, requiredRole = null }) => {
  const { user, profile, loading } = useAuth();
  const location = useLocation();

  if (loading) return <LoadingSplash />;

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requiredRole) {
    const userRole = profile?.role;
    if (userRole === 'admin') return children; // admin can access anything
    if (requiredRole === 'owner' && userRole !== 'owner') return <Navigate to="/" replace />;
    if (requiredRole === 'admin' && userRole !== 'admin') return <Navigate to="/" replace />;
    if (requiredRole === 'customer' && !['customer', 'owner', 'admin'].includes(userRole)) {
      return <Navigate to="/" replace />;
    }
  }

  return children;
};

export const RequireAuth = ProtectedRoute;
export const RequireOwner = ({ children }) => (
  <ProtectedRoute requiredRole="owner">{children}</ProtectedRoute>
);
export const RequireAdmin = ({ children }) => (
  <ProtectedRoute requiredRole="admin">{children}</ProtectedRoute>
);

export default ProtectedRoute;
