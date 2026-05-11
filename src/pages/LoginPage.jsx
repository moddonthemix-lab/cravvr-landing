import React, { useEffect } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { SignIn, SignUp } from '@clerk/clerk-react';
import { useAuth } from '../components/auth/AuthContext';

// Thin shell around Clerk's hosted <SignIn> / <SignUp> components. Mode is
// driven by the `mode` query param so the same route can serve both flows:
//   /login           → sign in (default)
//   /login?mode=signup → sign up
const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();

  const mode = searchParams.get('mode') === 'signup' ? 'signup' : 'login';
  const from = location.state?.from?.pathname || '/';
  const fromTab = location.state?.from?.search || '';

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
      {mode === 'signup' ? (
        <SignUp
          routing="path"
          path="/login"
          signInUrl="/login"
          afterSignUpUrl={from + fromTab}
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
