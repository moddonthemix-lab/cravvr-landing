import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';

/**
 * ProtectedRoute component - Wraps routes that require authentication
 *
 * @param {Object} props
 * @param {React.ReactNode} props.children - The route content to render
 * @param {string} props.requiredRole - Optional role required ('customer', 'owner', 'admin')
 */
const ProtectedRoute = ({
  children,
  requiredRole = null,
}) => {
  const { user, profile, loading, openAuth } = useAuth();
  const location = useLocation();

  // Open auth modal when user is not authenticated
  useEffect(() => {
    if (!loading && !user) {
      openAuth('login');
    }
  }, [loading, user, openAuth]);

  // Show loading state while checking auth
  if (loading) {
    return (
      <div className="protected-route-loading">
        <div className="loading-spinner" />
      </div>
    );
  }

  // Not logged in - redirect to home (modal will open via useEffect)
  if (!user) {
    // Save the attempted URL to redirect back after login
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  // Check role requirement if specified
  if (requiredRole) {
    const userRole = profile?.role;

    // Admin can access everything
    if (userRole === 'admin') {
      return children;
    }

    // Check if user has the required role
    if (requiredRole === 'owner' && userRole !== 'owner') {
      return <Navigate to="/" replace />;
    }

    if (requiredRole === 'admin' && userRole !== 'admin') {
      return <Navigate to="/" replace />;
    }

    if (requiredRole === 'customer' && !['customer', 'owner', 'admin'].includes(userRole)) {
      return <Navigate to="/" replace />;
    }
  }

  // Authorized - render the protected content
  return children;
};

/**
 * RequireAuth - Alias for ProtectedRoute (for compatibility)
 */
export const RequireAuth = ProtectedRoute;

/**
 * RequireOwner - Convenience wrapper for owner-only routes
 */
export const RequireOwner = ({ children }) => (
  <ProtectedRoute requiredRole="owner">
    {children}
  </ProtectedRoute>
);

/**
 * RequireAdmin - Convenience wrapper for admin-only routes
 */
export const RequireAdmin = ({ children }) => (
  <ProtectedRoute requiredRole="admin">
    {children}
  </ProtectedRoute>
);

export default ProtectedRoute;
