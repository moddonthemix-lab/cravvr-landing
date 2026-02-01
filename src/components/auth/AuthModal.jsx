import React, { useState } from 'react';
import { useAuth } from './AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { Icons } from '../common/Icons';

// Auth Modal Component - handles both login and signup
const AuthModal = ({ isOpen, onClose, initialMode = 'login' }) => {
  const [mode, setMode] = useState(initialMode); // 'login', 'signup', 'forgot'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('customer');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const { signIn, signUp, resetPassword } = useAuth();
  const { showToast } = useToast();

  // Reset form state
  const resetForm = () => {
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setName('');
    setRole('customer');
    setError('');
    setSuccess('');
  };

  // Switch between modes
  const switchMode = (newMode) => {
    setMode(newMode);
    setError('');
    setSuccess('');
  };

  // Handle login
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const { error } = await signIn({ email, password });

    if (error) {
      setError(error?.message || error || 'An error occurred');
      showToast(error?.message || error || 'Sign in failed', 'error');
    } else {
      resetForm();
      showToast('Welcome back!', 'success');
      onClose();
    }

    setLoading(false);
  };

  // Handle signup
  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validate password match
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    // Validate password length
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      setLoading(false);
      return;
    }

    const { error } = await signUp({ email, password, name, role });

    if (error) {
      setError(error?.message || error || 'An error occurred');
      showToast(error?.message || error || 'Sign up failed', 'error');
    } else {
      setSuccess('Check your email for a confirmation link!');
      showToast('Account created! Check your email to confirm.', 'success');
      // Don't close modal - let user see the success message
    }

    setLoading(false);
  };

  // Handle forgot password
  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const { error } = await resetPassword(email);

    if (error) {
      setError(error?.message || error || 'An error occurred');
      showToast(error?.message || error || 'Password reset failed', 'error');
    } else {
      setSuccess('Password reset email sent! Check your inbox.');
      showToast('Password reset email sent!', 'success');
    }

    setLoading(false);
  };

  if (!isOpen) return null;

  return (
    <div className="auth-modal-overlay" onClick={onClose}>
      <div className="auth-modal" onClick={(e) => e.stopPropagation()}>
        {/* Close button */}
        <button className="auth-modal-close" onClick={onClose}>
          {Icons.x}
        </button>

        {/* Logo */}
        <div className="auth-modal-logo">
          <span className="auth-logo-icon">{Icons.truck}</span>
          <span className="auth-logo-text">Cravrr</span>
        </div>

        {/* Title */}
        <h2 className="auth-modal-title">
          {mode === 'login' && 'Welcome back'}
          {mode === 'signup' && 'Create an account'}
          {mode === 'forgot' && 'Reset password'}
        </h2>
        <p className="auth-modal-subtitle">
          {mode === 'login' && 'Sign in to find your favorite food trucks'}
          {mode === 'signup' && 'Join thousands of food truck lovers'}
          {mode === 'forgot' && "We'll send you a link to reset your password"}
        </p>

        {/* Error/Success Messages */}
        {error && (
          <div className="auth-message error">
            <span className="auth-message-icon">{Icons.alertCircle}</span>
            {error}
          </div>
        )}
        {success && (
          <div className="auth-message success">
            <span className="auth-message-icon">{Icons.checkCircle}</span>
            {success}
          </div>
        )}

        {/* Login Form */}
        {mode === 'login' && (
          <form onSubmit={handleLogin} className="auth-form">
            <div className="auth-field">
              <label>Email</label>
              <div className="auth-input-wrapper">
                <span className="auth-input-icon">{Icons.mail}</span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                />
              </div>
            </div>

            <div className="auth-field">
              <label>Password</label>
              <div className="auth-input-wrapper">
                <span className="auth-input-icon">{Icons.lock}</span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                />
                <button
                  type="button"
                  className="auth-password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? Icons.eyeOff : Icons.eye}
                </button>
              </div>
            </div>

            <button
              type="button"
              className="auth-forgot-link"
              onClick={() => switchMode('forgot')}
            >
              Forgot password?
            </button>

            <button type="submit" className="auth-submit-btn" disabled={loading}>
              {loading ? (
                <>
                  <span className="auth-loader">{Icons.loader}</span>
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </button>

            <p className="auth-switch-text">
              Don't have an account?{' '}
              <button type="button" onClick={() => switchMode('signup')}>
                Sign up
              </button>
            </p>
          </form>
        )}

        {/* Signup Form */}
        {mode === 'signup' && !success && (
          <form onSubmit={handleSignup} className="auth-form">
            <div className="auth-field">
              <label>Full Name</label>
              <div className="auth-input-wrapper">
                <span className="auth-input-icon">{Icons.user}</span>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  required
                />
              </div>
            </div>

            <div className="auth-field">
              <label>Email</label>
              <div className="auth-input-wrapper">
                <span className="auth-input-icon">{Icons.mail}</span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                />
              </div>
            </div>

            <div className="auth-field">
              <label>Password</label>
              <div className="auth-input-wrapper">
                <span className="auth-input-icon">{Icons.lock}</span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  className="auth-password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? Icons.eyeOff : Icons.eye}
                </button>
              </div>
            </div>

            <div className="auth-field">
              <label>Confirm Password</label>
              <div className="auth-input-wrapper">
                <span className="auth-input-icon">{Icons.lock}</span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm your password"
                  required
                />
              </div>
            </div>

            <div className="auth-role-selector">
              <label>I am a...</label>
              <div className="auth-role-options">
                <button
                  type="button"
                  className={`auth-role-btn ${role === 'customer' ? 'active' : ''}`}
                  onClick={() => setRole('customer')}
                >
                  <span className="auth-role-icon">{Icons.heart}</span>
                  <span className="auth-role-label">Food Lover</span>
                  <span className="auth-role-desc">Find & follow trucks</span>
                </button>
                <button
                  type="button"
                  className={`auth-role-btn ${role === 'owner' ? 'active' : ''}`}
                  onClick={() => setRole('owner')}
                >
                  <span className="auth-role-icon">{Icons.truck}</span>
                  <span className="auth-role-label">Truck Owner</span>
                  <span className="auth-role-desc">Manage your truck</span>
                </button>
              </div>
            </div>

            <button type="submit" className="auth-submit-btn" disabled={loading}>
              {loading ? (
                <>
                  <span className="auth-loader">{Icons.loader}</span>
                  Creating account...
                </>
              ) : (
                'Create Account'
              )}
            </button>

            <p className="auth-switch-text">
              Already have an account?{' '}
              <button type="button" onClick={() => switchMode('login')}>
                Sign in
              </button>
            </p>
          </form>
        )}

        {/* Success state for signup */}
        {mode === 'signup' && success && (
          <div className="auth-success-state">
            <div className="auth-success-icon">{Icons.mail}</div>
            <p>Check your email to confirm your account.</p>
            <button
              className="auth-submit-btn"
              onClick={() => {
                resetForm();
                switchMode('login');
              }}
            >
              Go to Login
            </button>
          </div>
        )}

        {/* Forgot Password Form */}
        {mode === 'forgot' && !success && (
          <form onSubmit={handleForgotPassword} className="auth-form">
            <div className="auth-field">
              <label>Email</label>
              <div className="auth-input-wrapper">
                <span className="auth-input-icon">{Icons.mail}</span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                />
              </div>
            </div>

            <button type="submit" className="auth-submit-btn" disabled={loading}>
              {loading ? (
                <>
                  <span className="auth-loader">{Icons.loader}</span>
                  Sending...
                </>
              ) : (
                'Send Reset Link'
              )}
            </button>

            <p className="auth-switch-text">
              Remember your password?{' '}
              <button type="button" onClick={() => switchMode('login')}>
                Sign in
              </button>
            </p>
          </form>
        )}

        {/* Success state for forgot password */}
        {mode === 'forgot' && success && (
          <div className="auth-success-state">
            <div className="auth-success-icon">{Icons.mail}</div>
            <p>Check your email for a password reset link.</p>
            <button
              className="auth-submit-btn"
              onClick={() => {
                resetForm();
                switchMode('login');
              }}
            >
              Go to Login
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuthModal;
