import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Icons } from '../components/common/Icons';
import './AuthConfirmPage.css';

const ResetPasswordPage = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [status, setStatus] = useState('form'); // 'form', 'success', 'error'
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (password.length < 6) {
      setMessage('Password must be at least 6 characters');
      return;
    }

    if (password !== confirmPassword) {
      setMessage('Passwords do not match');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const { error } = await supabase.auth.updateUser({ password });

      if (error) throw error;

      setStatus('success');
      setMessage('Password updated successfully! Redirecting...');
      setTimeout(() => navigate('/'), 2000);
    } catch (error) {
      console.error('Password reset error:', error);
      setStatus('error');
      setMessage(error.message || 'Failed to reset password. The link may have expired.');
    } finally {
      setLoading(false);
    }
  };

  if (status === 'success') {
    return (
      <div className="auth-confirm-page">
        <div className="confirm-card">
          <div className="confirm-icon success">{Icons.check}</div>
          <h1>Password Updated!</h1>
          <p>{message}</p>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="auth-confirm-page">
        <div className="confirm-card">
          <div className="confirm-icon error">{Icons.x}</div>
          <h1>Reset Failed</h1>
          <p>{message}</p>
          <button className="btn-primary" onClick={() => navigate('/eat')}>
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-confirm-page">
      <div className="confirm-card">
        <h1>Reset Your Password</h1>
        <p>Enter your new password below.</p>

        <form onSubmit={handleSubmit} style={{ textAlign: 'left' }}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, color: '#374151', fontSize: 14 }}>
              New Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 6 characters"
              required
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '2px solid #e5e7eb',
                borderRadius: 12,
                fontSize: 16,
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>
          <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, color: '#374151', fontSize: 14 }}>
              Confirm Password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm your password"
              required
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '2px solid #e5e7eb',
                borderRadius: 12,
                fontSize: 16,
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {message && (
            <p style={{ color: '#ef4444', fontSize: 14, marginBottom: 16 }}>{message}</p>
          )}

          <button
            type="submit"
            className="btn-primary"
            disabled={loading}
            style={{ width: '100%' }}
          >
            {loading ? 'Updating...' : 'Update Password'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
