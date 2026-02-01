import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../components/auth/AuthContext';
import { Icons } from '../components/common/Icons';
import './LoginPage.css';

const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signIn, signUp, resetPassword } = useAuth();

  const [mode, setMode] = useState('login'); // 'login', 'signup', 'forgot'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Get the intended destination from state
  const from = location.state?.from?.pathname || '/';
  const fromTab = location.state?.from?.search || '';

  // If already logged in, redirect
  useEffect(() => {
    if (user) {
      navigate(from + fromTab, { replace: true });
    }
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

  return (
    <div className="login-page">
      {/* Background */}
      <div className="login-bg">
        <div className="login-bg-gradient"></div>
        <div className="login-bg-pattern"></div>
      </div>

      {/* Content */}
      <div className="login-content">
        {/* Logo & Back */}
        <header className="login-header">
          <Link to="/" className="login-back">
            {Icons.chevronLeft}
            <span>Back</span>
          </Link>
          <div className="login-logo">
            <div className="login-logo-icon">
              {Icons.truck}
            </div>
            <span className="login-logo-text">Cravrr</span>
          </div>
        </header>

        {/* Card */}
        <div className="login-card">
          {/* Title */}
          <div className="login-title">
            {mode === 'login' && (
              <>
                <h1>Welcome back</h1>
                <p>Sign in to access your favorites, orders, and more</p>
              </>
            )}
            {mode === 'signup' && (
              <>
                <h1>Create account</h1>
                <p>Join Cravrr to discover the best food trucks near you</p>
              </>
            )}
            {mode === 'forgot' && (
              <>
                <h1>Reset password</h1>
                <p>Enter your email and we'll send you a reset link</p>
              </>
            )}
          </div>

          {/* Error/Success Messages */}
          {error && (
            <div className="login-message error">
              {Icons.alertCircle}
              <span>{error}</span>
            </div>
          )}
          {success && (
            <div className="login-message success">
              {Icons.check}
              <span>{success}</span>
            </div>
          )}

          {/* Login Form */}
          {mode === 'login' && (
            <form onSubmit={handleLogin} className="login-form">
              <div className="form-group">
                <label>Email</label>
                <div className="input-wrapper">
                  <span className="input-icon">{Icons.email}</span>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    autoComplete="email"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Password</label>
                <div className="input-wrapper">
                  <span className="input-icon">{Icons.lock}</span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    required
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? Icons.eyeOff : Icons.eye}
                  </button>
                </div>
              </div>

              <button
                type="button"
                className="forgot-link"
                onClick={() => switchMode('forgot')}
              >
                Forgot password?
              </button>

              <button type="submit" className="login-btn primary" disabled={loading}>
                {loading ? (
                  <>
                    <span className="btn-spinner"></span>
                    <span>Signing in...</span>
                  </>
                ) : (
                  <span>Sign In</span>
                )}
              </button>

              <div className="login-divider">
                <span>or</span>
              </div>

              <p className="login-switch">
                Don't have an account?{' '}
                <button type="button" onClick={() => switchMode('signup')}>
                  Create one
                </button>
              </p>
            </form>
          )}

          {/* Signup Form */}
          {mode === 'signup' && (
            <form onSubmit={handleSignup} className="login-form">
              <div className="form-group">
                <label>Full Name</label>
                <div className="input-wrapper">
                  <span className="input-icon">{Icons.user}</span>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name"
                    required
                    autoComplete="name"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Email</label>
                <div className="input-wrapper">
                  <span className="input-icon">{Icons.email}</span>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    autoComplete="email"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Password</label>
                <div className="input-wrapper">
                  <span className="input-icon">{Icons.lock}</span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    required
                    minLength={6}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? Icons.eyeOff : Icons.eye}
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label>Confirm Password</label>
                <div className="input-wrapper">
                  <span className="input-icon">{Icons.lock}</span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm your password"
                    required
                    autoComplete="new-password"
                  />
                </div>
              </div>

              <button type="submit" className="login-btn primary" disabled={loading}>
                {loading ? (
                  <>
                    <span className="btn-spinner"></span>
                    <span>Creating account...</span>
                  </>
                ) : (
                  <span>Create Account</span>
                )}
              </button>

              <div className="login-divider">
                <span>or</span>
              </div>

              <p className="login-switch">
                Already have an account?{' '}
                <button type="button" onClick={() => switchMode('login')}>
                  Sign in
                </button>
              </p>
            </form>
          )}

          {/* Forgot Password Form */}
          {mode === 'forgot' && (
            <form onSubmit={handleForgotPassword} className="login-form">
              <div className="form-group">
                <label>Email</label>
                <div className="input-wrapper">
                  <span className="input-icon">{Icons.email}</span>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    autoComplete="email"
                  />
                </div>
              </div>

              <button type="submit" className="login-btn primary" disabled={loading}>
                {loading ? (
                  <>
                    <span className="btn-spinner"></span>
                    <span>Sending...</span>
                  </>
                ) : (
                  <span>Send Reset Link</span>
                )}
              </button>

              <button
                type="button"
                className="login-btn secondary"
                onClick={() => switchMode('login')}
              >
                Back to Sign In
              </button>
            </form>
          )}
        </div>

        {/* Footer */}
        <footer className="login-footer">
          <p>By continuing, you agree to our Terms of Service and Privacy Policy</p>
        </footer>
      </div>
    </div>
  );
};

export default LoginPage;
