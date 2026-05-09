import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Icons } from '../components/common/Icons';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const ResetPasswordPage = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [status, setStatus] = useState('form');
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

  const Shell = ({ children }) => (
    <div className="min-h-screen bg-gradient-to-b from-rose-50 via-background to-background flex items-center justify-center px-4 py-10">
      <Card className="w-full max-w-md shadow-xl">
        <CardContent className="p-8 space-y-5">{children}</CardContent>
      </Card>
    </div>
  );

  if (status === 'success') {
    return (
      <Shell>
        <div className="text-center space-y-4">
          <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-positive/10 text-positive">
            <span className="h-8 w-8">{Icons.check}</span>
          </span>
          <h1 className="text-2xl font-bold tracking-tight">Password Updated!</h1>
          <p className="text-sm text-muted-foreground">{message}</p>
        </div>
      </Shell>
    );
  }

  if (status === 'error') {
    return (
      <Shell>
        <div className="text-center space-y-4">
          <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <span className="h-8 w-8">{Icons.x}</span>
          </span>
          <h1 className="text-2xl font-bold tracking-tight">Reset Failed</h1>
          <p className="text-sm text-muted-foreground">{message}</p>
          <Button onClick={() => navigate('/eat')} className="w-full">
            Back to Home
          </Button>
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-bold tracking-tight">Reset Your Password</h1>
        <p className="text-sm text-muted-foreground">Enter your new password below.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="reset-password">New Password</Label>
          <Input
            id="reset-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 6 characters"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="reset-password-confirm">Confirm Password</Label>
          <Input
            id="reset-password-confirm"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm your password"
            required
          />
        </div>

        {message && <p className="text-sm text-destructive">{message}</p>}

        <Button type="submit" disabled={loading} size="lg" className="w-full">
          {loading ? 'Updating…' : 'Update Password'}
        </Button>
      </form>
    </Shell>
  );
};

export default ResetPasswordPage;
