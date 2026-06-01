import React, { useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../components/auth/AuthContext';
import { track } from '../services/analytics';
import LoadingSplash from '../components/common/LoadingSplash';

// Bouncer landed on immediately after Clerk sign-in/sign-up completes.
// Waits for the Supabase profile to load, then routes by role:
//   owner  → /owner   (so the onboarding wizard auto-opens if no truck)
//   admin  → /admin
//   else   → ?next= (or /)
//
// Clerk's `forceRedirectUrl` runs before we know the user's role, so we
// can't decide there. This page bridges the gap.
export default function PostAuthRedirect() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { user, profile, loading, isOwner, isAdmin } = useAuth();
  const signupFired = useRef(false);

  const next = params.get('next') || '/';
  // SignUpPage appends `?signup=<role>` to its forceRedirectUrl — present only
  // after a completed registration (sign-in uses LoginPage's own redirect).
  const signupRole = params.get('signup');

  // Fire CompleteRegistration once on a brand-new registration, pinned to a
  // deterministic event_id so it dedupes against the clerk-webhook CAPI hit.
  useEffect(() => {
    if (!signupRole || !user?.id || signupFired.current) return;
    signupFired.current = true;
    track('signup', { role: signupRole }, { eventId: `signup:${user.id}` });
  }, [signupRole, user?.id]);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      navigate('/login', { replace: true });
      return;
    }
    if (!profile) return; // still resolving
    if (isOwner) navigate('/owner', { replace: true });
    else if (isAdmin) navigate('/admin', { replace: true });
    else navigate(next, { replace: true });
  }, [user, profile, loading, isOwner, isAdmin, next, navigate]);

  return <LoadingSplash tagline="SIGNING YOU IN" />;
}
