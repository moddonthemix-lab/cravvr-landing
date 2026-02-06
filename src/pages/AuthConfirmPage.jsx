import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Icons } from '../components/common/Icons';
import './AuthConfirmPage.css';

const AuthConfirmPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('verifying'); // 'verifying', 'success', 'error'
  const [message, setMessage] = useState('Confirming your email...');

  useEffect(() => {
    const confirmEmail = async () => {
      const tokenHash = searchParams.get('token_hash');
      const type = searchParams.get('type');

      if (!tokenHash || type !== 'email') {
        setStatus('error');
        setMessage('Invalid confirmation link');
        return;
      }

      try {
        // Verify the email using the token
        const { data, error } = await supabase.auth.verifyOtp({
          token_hash: tokenHash,
          type: 'email',
        });

        if (error) throw error;

        setStatus('success');
        setMessage('Email confirmed successfully! Redirecting...');

        // Redirect to home after 2 seconds
        setTimeout(() => {
          navigate('/');
        }, 2000);
      } catch (error) {
        console.error('Email confirmation error:', error);
        setStatus('error');
        setMessage(error.message || 'Failed to confirm email. Please try again or contact support.');
      }
    };

    confirmEmail();
  }, [searchParams, navigate]);

  return (
    <div className="auth-confirm-page">
      <div className="confirm-card">
        <div className={`confirm-icon ${status}`}>
          {status === 'verifying' && <div className="spinner">{Icons.loader}</div>}
          {status === 'success' && Icons.check}
          {status === 'error' && Icons.x}
        </div>

        <h1>
          {status === 'verifying' && 'Confirming Your Email'}
          {status === 'success' && 'Email Confirmed!'}
          {status === 'error' && 'Confirmation Failed'}
        </h1>

        <p>{message}</p>

        {status === 'error' && (
          <button className="btn-primary" onClick={() => navigate('/eat')}>
            Back to Home
          </button>
        )}
      </div>
    </div>
  );
};

export default AuthConfirmPage;
