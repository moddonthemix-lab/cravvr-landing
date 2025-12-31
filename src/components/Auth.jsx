import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

// Auth Modal Component
export const AuthModal = ({ isOpen, onClose, initialMode = 'login' }) => {
  const [mode, setMode] = useState(initialMode); // 'login', 'signup', 'role-select'
  const [role, setRole] = useState(null); // 'customer' or 'owner'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const { signUp, signIn } = useAuth();

  console.log('🎭 AuthModal render - isOpen:', isOpen, 'mode:', mode);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (mode === 'signup') {
        const { data, error } = await signUp(email, password, {
          name,
          role
        });

        if (error) throw error;

        setSuccess(true);
        setTimeout(() => {
          onClose();
          setSuccess(false);
        }, 2000);
      } else if (mode === 'login') {
        const { data, error } = await signIn(email, password);

        if (error) throw error;

        onClose();
      }
    } catch (err) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setName('');
    setError('');
    setSuccess(false);
  };

  // Role Selection View
  if (mode === 'role-select') {
    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl max-w-md w-full p-8 relative">
          {/* Close Button */}
          <button
            onClick={() => { onClose(); resetForm(); }}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Title */}
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Join Cravvr</h2>
            <p className="text-gray-600">Choose your account type</p>
          </div>

          {/* Role Options */}
          <div className="space-y-4">
            <button
              onClick={() => { setRole('customer'); setMode('signup'); }}
              className="w-full p-6 border-2 border-gray-200 rounded-xl hover:border-rose-500 hover:bg-rose-50 transition-all group"
            >
              <div className="text-4xl mb-2">🍔</div>
              <div className="font-semibold text-lg text-gray-900 group-hover:text-rose-600">I'm a Customer</div>
              <div className="text-sm text-gray-600 mt-1">Discover amazing food trucks</div>
            </button>

            <button
              onClick={() => { setRole('owner'); setMode('signup'); }}
              className="w-full p-6 border-2 border-gray-200 rounded-xl hover:border-rose-500 hover:bg-rose-50 transition-all group"
            >
              <div className="text-4xl mb-2">🚚</div>
              <div className="font-semibold text-lg text-gray-900 group-hover:text-rose-600">I'm a Truck Owner</div>
              <div className="text-sm text-gray-600 mt-1">Manage your food truck business</div>
            </button>
          </div>

          {/* Switch to Login */}
          <div className="mt-6 text-center text-sm text-gray-600">
            Already have an account?{' '}
            <button
              onClick={() => { setMode('login'); resetForm(); }}
              className="text-rose-600 font-semibold hover:text-rose-700"
            >
              Sign in
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Login/Signup Form View
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-8 relative">
        {/* Close Button */}
        <button
          onClick={() => { onClose(); resetForm(); }}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Title */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            {mode === 'signup' ? 'Create Account' : 'Welcome Back'}
          </h2>
          <p className="text-gray-600">
            {mode === 'signup'
              ? `Sign up as a ${role === 'owner' ? 'Truck Owner' : 'Customer'}`
              : 'Sign in to your account'}
          </p>
        </div>

        {/* Success Message */}
        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-800 text-sm">
            ✅ Account created! Check your email to verify your account.
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'signup' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent outline-none"
                placeholder="John Doe"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent outline-none"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent outline-none"
              placeholder="••••••••"
            />
            {mode === 'signup' && (
              <p className="text-xs text-gray-500 mt-1">Must be at least 6 characters</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-rose-600 text-white py-3 rounded-lg font-semibold hover:bg-rose-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Please wait...' : (mode === 'signup' ? 'Create Account' : 'Sign In')}
          </button>
        </form>

        {/* Switch Mode */}
        <div className="mt-6 text-center text-sm text-gray-600">
          {mode === 'signup' ? (
            <>
              Already have an account?{' '}
              <button
                onClick={() => { setMode('login'); resetForm(); }}
                className="text-rose-600 font-semibold hover:text-rose-700"
              >
                Sign in
              </button>
            </>
          ) : (
            <>
              Don't have an account?{' '}
              <button
                onClick={() => { setMode('role-select'); resetForm(); }}
                className="text-rose-600 font-semibold hover:text-rose-700"
              >
                Sign up
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// Auth Button Component (for header/nav)
export const AuthButton = ({ onClick, onProfileClick }) => {
  const { user, signOut, isAuthenticated } = useAuth();

  if (isAuthenticated) {
    return (
      <div className="flex items-center gap-3">
        <span className="text-sm text-gray-700 hidden sm:block">
          {user.email}
        </span>
        {onProfileClick && (
          <button
            onClick={onProfileClick}
            className="px-4 py-2 text-sm font-semibold text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
          >
            Profile
          </button>
        )}
        <button
          onClick={signOut}
          className="px-4 py-2 text-sm font-semibold text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
        >
          Sign Out
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => {
        console.log('🔘 Sign In button clicked');
        if (onClick) {
          onClick();
        } else {
          console.error('❌ onClick handler is undefined');
        }
      }}
      className="px-4 py-2 text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-colors"
    >
      Sign In
    </button>
  );
};
