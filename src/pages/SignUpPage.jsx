import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { SignUp } from '@clerk/clerk-react';
import { useAuth } from '../components/auth/AuthContext';
import { cn } from '@/lib/utils';

// Dedicated signup page. Lives at /sign-up so it gets its own Clerk path
// (Clerk requires separate paths for <SignIn> and <SignUp> when using
// routing="path" — otherwise verification sub-routes collide and the user
// lands on the wrong component).
//
// Marketing CTAs can deep-link with `?as=owner` to preselect the truck-owner
// pill: /sign-up?as=owner
const SignUpPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();

  const from = location.state?.from?.pathname || '/';
  const fromTab = location.state?.from?.search || '';

  const initialRole = searchParams.get('as') === 'owner' ? 'owner' : 'customer';
  const [role, setRole] = useState(initialRole);

  useEffect(() => {
    if (user) navigate(from + fromTab, { replace: true });
  }, [user, navigate, from, fromTab]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-muted/30 px-4 py-12">
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Cravvr</h1>
        <p className="text-sm text-muted-foreground">Create your account</p>
      </div>

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

      <SignUp
        routing="path"
        path="/sign-up"
        signInUrl="/login"
        forceRedirectUrl={from + fromTab}
        unsafeMetadata={{ role }}
      />
    </div>
  );
};

export default SignUpPage;
