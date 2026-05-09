import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Icons } from '../components/common/Icons';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

const AuthConfirmPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('verifying');
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
        const { data, error } = await supabase.auth.verifyOtp({
          token_hash: tokenHash,
          type: 'email',
        });

        if (error) throw error;

        setStatus('success');
        setMessage('Email confirmed successfully! Redirecting...');

        setTimeout(() => navigate('/'), 2000);
      } catch (error) {
        console.error('Email confirmation error:', error);
        setStatus('error');
        setMessage(error.message || 'Failed to confirm email. Please try again or contact support.');
      }
    };

    confirmEmail();
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-50 via-background to-background flex items-center justify-center px-4 py-10">
      <Card className="w-full max-w-md shadow-xl">
        <CardContent className="p-8 text-center space-y-5">
          <div
            className={cn(
              'mx-auto flex h-16 w-16 items-center justify-center rounded-full',
              status === 'verifying' && 'bg-primary/10 text-primary',
              status === 'success' && 'bg-positive/10 text-positive',
              status === 'error' && 'bg-destructive/10 text-destructive'
            )}
          >
            <span className={cn('h-8 w-8', status === 'verifying' && 'animate-spin')}>
              {status === 'verifying' && Icons.loader}
              {status === 'success' && Icons.check}
              {status === 'error' && Icons.x}
            </span>
          </div>

          <h1 className="text-2xl font-bold tracking-tight">
            {status === 'verifying' && 'Confirming Your Email'}
            {status === 'success' && 'Email Confirmed!'}
            {status === 'error' && 'Confirmation Failed'}
          </h1>

          <p className="text-sm text-muted-foreground leading-relaxed">{message}</p>

          {status === 'error' && (
            <Button onClick={() => navigate('/eat')} className="w-full">
              Back to Home
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AuthConfirmPage;
