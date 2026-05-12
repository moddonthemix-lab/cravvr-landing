import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useUser, useClerk } from '@clerk/clerk-react';
import { supabase } from '../../lib/supabase';
import { track as trackEvent, identify as identifyVisitor } from '../../services/analytics';

// Auth state for the app. Wraps Clerk for identity + supabase for profile
// data. No modal — sign-in/sign-up live on dedicated routes (/login, /sign-up)
// and openAuth() just navigates to the right one.
const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const { user: clerkUser, isLoaded: clerkLoaded, isSignedIn } = useUser();
  const clerk = useClerk();
  const navigate = useNavigate();
  const location = useLocation();

  const [profile, setProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [error, setError] = useState(null);

  // Impersonation ("View As") — admin-only, purely client-side.
  const [viewingAs, setViewingAs] = useState(null);
  const [originalProfile, setOriginalProfile] = useState(null);

  const [devSettings, setDevSettings] = useState(() => {
    const saved = localStorage.getItem('cravvr_dev_settings');
    return saved ? JSON.parse(saved) : { skipReviewOrderRequirement: false };
  });

  const loadedUserIdRef = useRef(null);

  const fetchProfile = async (userId) => {
    try {
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (profileError) {
        if (profileError.code === 'PGRST116') return null;
        setError(`Profile load failed: ${profileError.message}`);
        return null;
      }
      setError(null);

      const built = {
        ...profileData,
        phone: '',
        points: 0,
        avatar_url: profileData.avatar_url || '',
        subscription_type: '',
        permissions: null,
      };

      if (profileData.role === 'customer') {
        const { data } = await supabase
          .from('customers')
          .select('phone, points, avatar_url')
          .eq('id', userId)
          .single();
        if (data) {
          built.phone = data.phone || '';
          built.points = data.points || 0;
          built.avatar_url = data.avatar_url || built.avatar_url;
        }
      } else if (profileData.role === 'owner') {
        const { data } = await supabase
          .from('owners')
          .select('subscription_type')
          .eq('id', userId)
          .single();
        if (data) built.subscription_type = data.subscription_type || '';
      } else if (profileData.role === 'admin') {
        const { data } = await supabase
          .from('admins')
          .select('permissions, last_login')
          .eq('id', userId)
          .single();
        if (data) built.permissions = data.permissions || null;
      }

      return built;
    } catch (err) {
      setError(`Profile load failed: ${err.message}`);
      return null;
    }
  };

  useEffect(() => {
    if (!clerkLoaded) return;
    if (!isSignedIn || !clerkUser) {
      setProfile(null);
      loadedUserIdRef.current = null;
      return;
    }
    if (loadedUserIdRef.current === clerkUser.id) return;

    let cancelled = false;
    setProfileLoading(true);
    (async () => {
      const data = await fetchProfile(clerkUser.id);
      if (cancelled) return;
      setProfile(data);
      loadedUserIdRef.current = clerkUser.id;
      setProfileLoading(false);

      try {
        await identifyVisitor(clerkUser.id);
        trackEvent('login');
      } catch {
        /* analytics best-effort */
      }
    })();
    return () => { cancelled = true; };
  }, [clerkLoaded, isSignedIn, clerkUser?.id]);

  const user = clerkUser
    ? {
        id: clerkUser.id,
        email: clerkUser.primaryEmailAddress?.emailAddress ?? '',
        name: [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(' '),
      }
    : null;

  const signOut = async () => {
    setError(null);
    try {
      await clerk.signOut();
      setProfile(null);
      loadedUserIdRef.current = null;
      return { error: null };
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const updateProfile = async (updates) => {
    setError(null);
    if (!clerkUser) return { error: new Error('Not signed in') };
    try {
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', clerkUser.id);
      if (error) throw error;
      const refreshed = await fetchProfile(clerkUser.id);
      setProfile(refreshed);
      return { error: null };
    } catch (err) {
      setError(err.message);
      return { error: err };
    }
  };

  const refreshProfile = async () => {
    if (!clerkUser) return;
    const fresh = await fetchProfile(clerkUser.id);
    setProfile(fresh);
  };

  // openAuth navigates to the dedicated page. No modal. The "from" state
  // lets LoginPage/SignUpPage send the user back where they started after
  // they finish authenticating.
  const openAuth = (mode = 'login') => {
    const target = mode === 'signup' ? '/sign-up' : '/login';
    if (location.pathname.startsWith(target)) return; // already there
    navigate(target, { state: { from: location } });
  };
  const closeAuth = () => {};

  const startViewingAs = async (targetUser) => {
    if (!profile || profile.role !== 'admin') return;
    setOriginalProfile(profile);
    const targetProfile = await fetchProfile(targetUser.id);
    if (targetProfile) {
      setViewingAs({ ...targetProfile, email: targetUser.email });
    }
  };
  const stopViewingAs = () => {
    setViewingAs(null);
    setOriginalProfile(null);
  };

  const updateDevSettings = (next) => {
    const merged = { ...devSettings, ...next };
    setDevSettings(merged);
    localStorage.setItem('cravvr_dev_settings', JSON.stringify(merged));
  };

  const effectiveProfile = viewingAs || profile;
  const effectiveUser = viewingAs ? { id: viewingAs.id, email: viewingAs.email } : user;

  const value = {
    user: effectiveUser,
    profile: effectiveProfile,
    realUser: user,
    realProfile: profile,
    loading: !clerkLoaded || profileLoading,
    error,
    signOut,
    updateProfile,
    refreshProfile,
    isAuthenticated: !!clerkUser,
    isOwner: effectiveProfile?.role === 'owner',
    isCustomer: effectiveProfile?.role === 'customer',
    isAdmin: profile?.role === 'admin',
    hasAdminPermission: (perm) => {
      if (profile?.role !== 'admin') return false;
      const p = profile?.permissions;
      if (!p || (Array.isArray(p) && p.length === 0)) return true;
      if (Array.isArray(p)) return p.includes('*') || p.includes(perm);
      if (typeof p === 'object') {
        if (Array.isArray(p.permissions)) return p.permissions.includes('*') || p.permissions.includes(perm);
        if (p['*'] === true) return true;
        if (p[perm] === true) return true;
      }
      return false;
    },
    // Kept for back-compat with any caller that still reads these. With the
    // modal gone the values are inert — openAuth navigates instead.
    showAuthModal: false,
    authMode: 'login',
    openAuth,
    closeAuth,
    viewingAs,
    startViewingAs,
    stopViewingAs,
    isViewingAs: !!viewingAs,
    devSettings,
    updateDevSettings,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
