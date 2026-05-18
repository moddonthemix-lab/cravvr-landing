import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { SignIn } from '@clerk/clerk-react';
import { useAuth } from '../components/auth/AuthContext';

// Dedicated sign-in page at /login. SignUp lives separately at /sign-up so
// Clerk's path-based routing can handle each component's sub-steps
// (verification, factor selection, etc.) without colliding.
const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isOwner, loading } = useAuth();

  const explicitFrom = location.state?.from?.pathname;
  const from = explicitFrom || '/';
  const fromTab = location.state?.from?.search || '';

  // Wait for the profile to load before redirecting so we can route truck
  // owners straight to their dashboard. Without this, owners would always
  // land on `/` and never see the onboarding prompt.
  useEffect(() => {
    if (!user || loading) return;
    if (!explicitFrom && isOwner) {
      navigate('/owner', { replace: true });
    } else {
      navigate(from + fromTab, { replace: true });
    }
  }, [user, loading, isOwner, navigate, from, fromTab, explicitFrom]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-muted/30 px-4 py-12">
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Cravvr</h1>
        <p className="text-sm text-muted-foreground">Welcome back</p>
      </div>
      <SignIn
        routing="path"
        path="/login"
        signUpUrl="/sign-up"
        forceRedirectUrl={`/post-auth?next=${encodeURIComponent(from + fromTab)}`}
      />
    </div>
  );
};

export default LoginPage;
