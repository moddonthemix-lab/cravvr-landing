import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../components/auth/AuthContext';
import { Icons } from '../components/common/Icons';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

const InputWithIcon = ({ icon, type = 'text', rightAdornment, ...props }) => (
  <div className="relative">
    {icon && (
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground">
        {icon}
      </span>
    )}
    <Input
      type={type}
      className={cn(icon && 'pl-9', rightAdornment && 'pr-10')}
      {...props}
    />
    {rightAdornment && (
      <div className="absolute right-1 top-1/2 -translate-y-1/2">{rightAdornment}</div>
    )}
  </div>
);

const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signIn, signUp, resetPassword } = useAuth();

  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const from = location.state?.from?.pathname || '/';
  const fromTab = location.state?.from?.search || '';

  useEffect(() => {
    if (user) navigate(from + fromTab, { replace: true });
  }, [user, navigate, from, fromTab]);

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setName('');
    setError('');
    setSuccess('');
  };

  const switchMode = (newMode) => {
    setMode(newMode);
    setError('');
    setSuccess('');
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const { error } = await signIn({ email, password });
    if (error) {
      setError(error?.message || error || 'Invalid email or password');
    } else {
      resetForm();
      navigate(from + fromTab, { replace: true });
    }
    setLoading(false);
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      setLoading(false);
      return;
    }

    const { error } = await signUp({ email, password, name, role: 'customer' });
    if (error) {
      setError(error?.message || error || 'Could not create account');
    } else {
      setSuccess('Check your email for a confirmation link!');
    }
    setLoading(false);
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const { error } = await resetPassword(email);
    if (error) {
      setError(error?.message || error || 'Could not send reset email');
    } else {
      setSuccess('Password reset email sent! Check your inbox.');
    }
    setLoading(false);
  };

  const passwordToggle = (
    <button
      type="button"
      onClick={() => setShowPassword(!showPassword)}
      aria-label={showPassword ? 'Hide password' : 'Show password'}
      className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted"
    >
      <span className="h-4 w-4">{showPassword ? Icons.eyeOff : Icons.eye}</span>
    </button>
  );

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-rose-100 via-rose-50 to-background">
      <div
        aria-hidden
        className="absolute inset-0 -z-10 opacity-50"
        style={{
          backgroundImage:
            'radial-gradient(circle at 25% 20%, rgba(225, 29, 72, 0.15) 0px, transparent 50%), radial-gradient(circle at 75% 80%, rgba(225, 29, 72, 0.10) 0px, transparent 50%)',
        }}
      />

      <div className="mx-auto flex min-h-screen max-w-md flex-col px-5 py-8">
        <header className="flex items-center justify-between mb-8">
          <Link
            to="/"
            className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <span className="h-4 w-4">{Icons.chevronLeft}</span>
            Back
          </Link>
          <Link to="/" className="flex items-center gap-2">
            <img src="/logo/cravvr-logo.png" alt="Cravvr" className="h-9 w-auto" />
          </Link>
        </header>

        <Card className="shadow-xl">
          <CardContent className="p-6 sm:p-8 space-y-5">
            <div className="text-center space-y-1.5">
              {mode === 'login' && (
                <>
                  <h1 className="text-2xl font-bold tracking-tight">Welcome back</h1>
                  <p className="text-sm text-muted-foreground">
                    Sign in to access your favorites, orders, and more
                  </p>
                </>
              )}
              {mode === 'signup' && (
                <>
                  <h1 className="text-2xl font-bold tracking-tight">Create account</h1>
                  <p className="text-sm text-muted-foreground">
                    Join Cravrr to discover the best food trucks near you
                  </p>
                </>
              )}
              {mode === 'forgot' && (
                <>
                  <h1 className="text-2xl font-bold tracking-tight">Reset password</h1>
                  <p className="text-sm text-muted-foreground">
                    Enter your email and we'll send you a reset link
                  </p>
                </>
              )}
            </div>

            {error && (
              <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                <span className="h-4 w-4 shrink-0 mt-0.5">{Icons.alertCircle}</span>
                {error}
              </div>
            )}
            {success && (
              <div className="flex items-start gap-2 rounded-lg border border-positive/30 bg-positive/10 px-4 py-3 text-sm text-positive">
                <span className="h-4 w-4 shrink-0 mt-0.5">{Icons.check}</span>
                {success}
              </div>
            )}

            {mode === 'login' && (
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email">Email</Label>
                  <InputWithIcon
                    id="login-email"
                    icon={Icons.email}
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    autoComplete="email"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="login-password">Password</Label>
                  <InputWithIcon
                    id="login-password"
                    icon={Icons.lock}
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    required
                    autoComplete="current-password"
                    rightAdornment={passwordToggle}
                  />
                </div>

                <button
                  type="button"
                  onClick={() => switchMode('forgot')}
                  className="text-sm font-medium text-primary hover:underline"
                >
                  Forgot password?
                </button>

                <Button type="submit" size="lg" disabled={loading} className="w-full">
                  {loading ? 'Signing in…' : 'Sign In'}
                </Button>

                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="h-px flex-1 bg-border" />
                  or
                  <span className="h-px flex-1 bg-border" />
                </div>

                <p className="text-center text-sm text-muted-foreground">
                  Don't have an account?{' '}
                  <button
                    type="button"
                    onClick={() => switchMode('signup')}
                    className="font-semibold text-primary hover:underline"
                  >
                    Create one
                  </button>
                </p>
              </form>
            )}

            {mode === 'signup' && (
              <form onSubmit={handleSignup} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-name">Full Name</Label>
                  <InputWithIcon
                    id="signup-name"
                    icon={Icons.user}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name"
                    required
                    autoComplete="name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <InputWithIcon
                    id="signup-email"
                    icon={Icons.email}
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    autoComplete="email"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <InputWithIcon
                    id="signup-password"
                    icon={Icons.lock}
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    required
                    minLength={6}
                    autoComplete="new-password"
                    rightAdornment={passwordToggle}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-confirm">Confirm Password</Label>
                  <InputWithIcon
                    id="signup-confirm"
                    icon={Icons.lock}
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm your password"
                    required
                    autoComplete="new-password"
                  />
                </div>

                <Button type="submit" size="lg" disabled={loading} className="w-full">
                  {loading ? 'Creating account…' : 'Create Account'}
                </Button>

                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="h-px flex-1 bg-border" />
                  or
                  <span className="h-px flex-1 bg-border" />
                </div>

                <p className="text-center text-sm text-muted-foreground">
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => switchMode('login')}
                    className="font-semibold text-primary hover:underline"
                  >
                    Sign in
                  </button>
                </p>
              </form>
            )}

            {mode === 'forgot' && (
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="forgot-email">Email</Label>
                  <InputWithIcon
                    id="forgot-email"
                    icon={Icons.email}
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    autoComplete="email"
                  />
                </div>

                <Button type="submit" size="lg" disabled={loading} className="w-full">
                  {loading ? 'Sending…' : 'Send Reset Link'}
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  onClick={() => switchMode('login')}
                  className="w-full"
                >
                  Back to Sign In
                </Button>
              </form>
            )}
          </CardContent>
        </Card>

        <footer className="mt-6 text-center">
          <p className="text-xs text-muted-foreground">
            By continuing, you agree to our Terms of Service and Privacy Policy
          </p>
        </footer>
      </div>
    </div>
  );
};

export default LoginPage;
