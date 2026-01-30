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

  // Ref to prevent double profile fetch on page refresh
  const initialLoadComplete = useRef(false);

  // Fetch user profile from database
  const fetchProfile = async (userId) => {
    try {
      const { data, error: fetchError } = await supabase
        .from('profiles')
        .select(`
          *,
          customers (phone, points, avatar_url),
          owners (subscription_type),
          admins (permissions, last_login)
        `)
        .eq('id', userId)
        .single();

      if (fetchError) {
        // Surface error to context instead of silent failure
        setError(`Profile load failed: ${fetchError.message}`);
        console.error('Error fetching profile:', fetchError);
        return null;
      }

      // Clear any previous errors
      setError(null);

      return {
        ...data,
        phone: data.customers?.phone || '',
        points: data.customers?.points || 0,
        avatar_url: data.customers?.avatar_url || data.avatar_url || '',
        subscription_type: data.owners?.subscription_type || '',
        permissions: data.admins?.permissions || null,
      };
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
          emailRedirectTo: `${window.location.origin}/`,
        },
      });

      if (error) throw error;

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
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setUser(null);
      setProfile(null);
    } catch (err) {
      setError(err.message);
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

  const value = {
    user,
    profile,
    loading,
    error,
    signUp,
    signIn,
    signOut,
    resetPassword,
    updateProfile,
    refreshProfile,
    isAuthenticated: !!user,
    isOwner: profile?.role === 'owner',
    isCustomer: profile?.role === 'customer',
    isAdmin: profile?.role === 'admin',
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
