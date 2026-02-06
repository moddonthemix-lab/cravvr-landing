import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';

// Create Auth Context
const AuthContext = createContext({});

// Auth Provider Component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Auth modal state (centralized for entire app)
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState('login'); // 'login', 'signup', 'forgot'

  // Admin impersonation state (View As feature)
  const [viewingAs, setViewingAs] = useState(null);
  const [originalProfile, setOriginalProfile] = useState(null);

  // Dev settings (stored in localStorage)
  const [devSettings, setDevSettings] = useState(() => {
    const saved = localStorage.getItem('cravvr_dev_settings');
    return saved ? JSON.parse(saved) : {
      skipReviewOrderRequirement: false,
    };
  });

  // Ref to prevent double profile fetch on page refresh
  const initialLoadComplete = useRef(false);

  // Open auth modal from anywhere in the app
  const openAuth = (mode = 'login') => {
    setAuthMode(mode);
    setShowAuthModal(true);
  };

  // Close auth modal
  const closeAuth = () => {
    setShowAuthModal(false);
  };

  // Fetch user profile from database
  const fetchProfile = async (userId) => {
    try {
      // First, fetch the basic profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (profileError) {
        // If profile doesn't exist, that's okay - user just doesn't have a profile yet
        if (profileError.code === 'PGRST116') {
          console.log('No profile found for user:', userId);
          return null;
        }
        setError(`Profile load failed: ${profileError.message}`);
        console.error('Error fetching profile:', profileError);
        return null;
      }

      // Clear any previous errors
      setError(null);

      // Build the profile object with basic data
      const profile = {
        ...profileData,
        phone: '',
        points: 0,
        avatar_url: profileData.avatar_url || '',
        subscription_type: '',
        permissions: null,
      };

      // Ensure a customers row exists for all users (needed for favorites, rewards, etc.)
      await supabase
        .from('customers')
        .upsert({ id: userId }, { onConflict: 'id', ignoreDuplicates: true });

      // Optionally fetch role-specific data based on role
      if (profileData.role === 'customer') {
        const { data: customerData } = await supabase
          .from('customers')
          .select('phone, points, avatar_url')
          .eq('id', userId)
          .single();

        if (customerData) {
          profile.phone = customerData.phone || '';
          profile.points = customerData.points || 0;
          profile.avatar_url = customerData.avatar_url || profile.avatar_url;
        }
      } else if (profileData.role === 'owner') {
        const { data: ownerData } = await supabase
          .from('owners')
          .select('subscription_type')
          .eq('id', userId)
          .single();

        if (ownerData) {
          profile.subscription_type = ownerData.subscription_type || '';
        }
      } else if (profileData.role === 'admin') {
        const { data: adminData } = await supabase
          .from('admins')
          .select('permissions, last_login')
          .eq('id', userId)
          .single();

        if (adminData) {
          profile.permissions = adminData.permissions || null;
        }
      }

      return profile;
    } catch (err) {
      setError(`Profile load failed: ${err.message}`);
      console.error('Error fetching profile:', err);
      return null;
    }
  };

  // Initialize auth state
  useEffect(() => {
    // Get initial session
    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setUser(session.user);
          const profileData = await fetchProfile(session.user.id);
          setProfile(profileData);
        }
        // Mark initial load as complete AFTER profile fetch
        initialLoadComplete.current = true;
        setLoading(false);
      } catch (err) {
        console.error('Auth init error:', err);
        initialLoadComplete.current = true;
        setLoading(false);
      }
    };

    initAuth();

    // Listen for auth changes (but skip initial session event to avoid double fetch)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      // Skip SIGNED_IN during initial load - initAuth handles it
      if (event === 'SIGNED_IN' && session?.user) {
        if (!initialLoadComplete.current) {
          // Initial load in progress, skip to avoid double fetch
          return;
        }
        setLoading(true);
        setUser(session.user);
        const profileData = await fetchProfile(session.user.id);
        setProfile(profileData);
        setLoading(false);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setProfile(null);
        setError(null);
      } else if (event === 'USER_UPDATED' && session?.user) {
        setLoading(true);
        setUser(session.user);
        const profileData = await fetchProfile(session.user.id);
        setProfile(profileData);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Sign up with email/password
  const signUp = async ({ email, password, name, role = 'customer' }) => {
    setError(null);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
            role,
          },
          emailRedirectTo: `${window.location.origin}/auth/confirm`,
        },
      });

      if (error) throw error;

      // Supabase handles confirmation emails automatically via built-in email templates
      if (data.user && data.user.identities && data.user.identities.length === 0) {
        console.log('User already exists');
      } else if (data.user && !data.session) {
        console.log('Confirmation email sent via Supabase');
      }

      return { data, error: null };
    } catch (err) {
      setError(err.message);
      return { data: null, error: err };
    }
  };

  // Sign in with email/password
  const signIn = async ({ email, password }) => {
    setError(null);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      return { data, error: null };
    } catch (err) {
      setError(err.message);
      return { data: null, error: err };
    }
  };

  // Sign out
  const signOut = async () => {
    setError(null);
    setLoading(true);
    try {
      console.log('Signing out...');
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Supabase signOut error:', error);
        throw error;
      }
      console.log('Sign out successful, clearing state');
      setUser(null);
      setProfile(null);
      initialLoadComplete.current = false; // Reset for next login
      setLoading(false);
      return { error: null };
    } catch (err) {
      console.error('SignOut failed:', err);
      setError(err.message);
      setLoading(false);
      throw err; // Re-throw so callers can catch
    }
  };

  // Reset password
  const resetPassword = async (email) => {
    setError(null);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      return { error: null };
    } catch (err) {
      setError(err.message);
      return { error: err };
    }
  };

  // Update profile
  const updateProfile = async (updates) => {
    setError(null);
    try {
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id);

      if (error) throw error;

      // Refresh profile
      const updatedProfile = await fetchProfile(user.id);
      setProfile(updatedProfile);

      return { error: null };
    } catch (err) {
      setError(err.message);
      return { error: err };
    }
  };

  // Refresh profile data
  const refreshProfile = async () => {
    if (user) {
      const profile = await fetchProfile(user.id);
      setProfile(profile);
    }
  };

  // Admin impersonation - View As feature
  const startViewingAs = async (targetUser) => {
    if (!profile || profile.role !== 'admin') {
      console.error('Only admins can use View As');
      return;
    }

    // Save original profile
    setOriginalProfile(profile);

    // Fetch target user's profile
    const targetProfile = await fetchProfile(targetUser.id);
    if (targetProfile) {
      setViewingAs({
        ...targetProfile,
        email: targetUser.email,
      });
    }
  };

  const stopViewingAs = () => {
    setViewingAs(null);
    setOriginalProfile(null);
  };

  // Update dev settings
  const updateDevSettings = (newSettings) => {
    const updated = { ...devSettings, ...newSettings };
    setDevSettings(updated);
    localStorage.setItem('cravvr_dev_settings', JSON.stringify(updated));
  };

  // Get the effective profile (impersonated or real)
  const effectiveProfile = viewingAs || profile;
  const effectiveUser = viewingAs ? { id: viewingAs.id, email: viewingAs.email } : user;

  const value = {
    user: effectiveUser,
    profile: effectiveProfile,
    realUser: user,
    realProfile: profile,
    loading,
    error,
    signUp,
    signIn,
    signOut,
    resetPassword,
    updateProfile,
    refreshProfile,
    isAuthenticated: !!user,
    isOwner: effectiveProfile?.role === 'owner',
    isCustomer: effectiveProfile?.role === 'customer',
    isAdmin: profile?.role === 'admin', // Always check real profile for admin
    // Auth modal controls (centralized)
    showAuthModal,
    authMode,
    openAuth,
    closeAuth,
    // Admin impersonation (View As)
    viewingAs,
    startViewingAs,
    stopViewingAs,
    isViewingAs: !!viewingAs,
    // Dev settings
    devSettings,
    updateDevSettings,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
