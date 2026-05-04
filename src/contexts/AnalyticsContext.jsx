import React, { createContext, useContext, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../components/auth/AuthContext';
import {
  initVisitor,
  identify,
  setCurrentUser,
  track,
  getVisitorId,
  getSessionId,
} from '../services/analytics';
import { loadPixels } from '../lib/pixels';

const AnalyticsContext = createContext(null);

export const AnalyticsProvider = ({ children }) => {
  const { user } = useAuth();
  const location = useLocation();
  const initialized = useRef(false);
  const lastIdentified = useRef(null);
  const lastPath = useRef(null);

  // Boot the visitor identity once on mount.
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    loadPixels();
    initVisitor();
  }, []);

  // Keep the analytics module's notion of "current user" in sync with auth.
  // Stitch the visitor → user the first time we see a logged-in user.
  useEffect(() => {
    setCurrentUser(user?.id ?? null);
    if (user?.id && lastIdentified.current !== user.id) {
      lastIdentified.current = user.id;
      identify(user.id);
    }
  }, [user?.id]);

  // Fire page_view on every route change (after init).
  useEffect(() => {
    const path = location.pathname + location.search;
    if (lastPath.current === path) return;
    lastPath.current = path;
    if (!getVisitorId()) return; // not initialized yet — first page_view fires from initVisitor's caller
    track('page_view', { path: location.pathname });
  }, [location.pathname, location.search]);

  const value = { track, identify, getVisitorId, getSessionId };

  return (
    <AnalyticsContext.Provider value={value}>
      {children}
    </AnalyticsContext.Provider>
  );
};

export const useAnalytics = () => {
  const ctx = useContext(AnalyticsContext);
  if (!ctx) {
    throw new Error('useAnalytics must be used within an AnalyticsProvider');
  }
  return ctx;
};

export default AnalyticsContext;
