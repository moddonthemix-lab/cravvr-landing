import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { SignIn, SignUp } from '@clerk/clerk-react';
import { useAuth } from '../components/auth/AuthContext';
import { cn } from '@/lib/utils';

// Thin shell around Clerk's hosted <SignIn> / <SignUp> components. Mode is
// driven by the `mode` query param so the same route can serve both flows:
//   /login            → sign in (default)
//   /login?mode=signup → sign up (with role toggle: food lover or truck owner)
const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();

  const mode = searchParams.get('mode') === 'signup' ? 'signup' : 'login';
  const from = location.state?.from?.pathname || '/';
  const fromTab = location.state?.from?.search || '';

  // Default to customer; URL `?as=owner` preselects the truck-owner pill so
  // marketing CTAs can deep-link people straight into the right flow.
  const initialRole = searchParams.get('as') === 'owner' ? 'owner' : 'customer';
  const [role, setRole] = useState(initialRole);

  useEffect(() => {
    if (user) navigate(from + fromTab, { replace: true });
  }, [user, navigate, from, fromTab]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-muted/30 px-4 py-12">
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Cravvr</h1>
        <p className="text-sm text-muted-foreground">
          {mode === 'signup' ? 'Create your account' : 'Welcome back'}
        </p>
      </div>

      {mode === 'signup' && (
        <div className="mb-4 w-full max-w-sm">
          <p className="mb-2 text-center text-xs font-medium uppercase tracking-wide text-muted-foreground">
            I'm signing up as
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setRole('customer')}
              className={cn(
                'rounded-lg border p-3 text-sm font-medium transition-colors',
                role === 'customer'
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground'
              )}
            >
              🍔 Food Lover
            </button>
            <button
              type="button"
              onClick={() => setRole('owner')}
              className={cn(
                'rounded-lg border p-3 text-sm font-medium transition-colors',
                role === 'owner'
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground'
              )}
            >
              🚚 Truck Owner
            </button>
          </div>
        </div>
      )}

      {mode === 'signup' ? (
        <SignUp
          routing="path"
          path="/login"
          signInUrl="/login"
          afterSignUpUrl={from + fromTab}
          unsafeMetadata={{ role }}
        />
      ) : (
        <SignIn
          routing="path"
          path="/login"
          signUpUrl="/login?mode=signup"
          afterSignInUrl={from + fromTab}
        />
      )}
    </div>
  );
};

export default LoginPage;
