import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ClerkProvider } from '@clerk/clerk-react';
import { AuthContext } from './components/auth/AuthContext';
import { Toaster } from 'sonner';
import App from './App.jsx';
import ErrorBoundary from './components/common/ErrorBoundary';
import { AuthProvider } from './components/auth/AuthContext';
import { CartProvider } from './contexts/CartContext';
import { TruckProvider } from './contexts/TruckContext';
import { FavoritesProvider } from './contexts/FavoritesContext';
import { ToastProvider } from './contexts/ToastContext';
import { ConfirmProvider } from './contexts/ConfirmContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { AnalyticsProvider } from './contexts/AnalyticsContext';
import { validateConfig } from './lib/configValidation';
import './styles/shadcn.css';
import './index.css';

validateConfig();

const CLERK_PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
if (!CLERK_PUBLISHABLE_KEY) {
  if (import.meta.env.PROD) {
    throw new Error('Missing VITE_CLERK_PUBLISHABLE_KEY in .env.local');
  }
  console.warn('[dev] VITE_CLERK_PUBLISHABLE_KEY not set — auth features disabled');
}

import './styles/auth.css';
import './styles/navigation.css';
import './styles/animations.css';
import './styles/modals.css';

const AppInner = () => (
  <AnalyticsProvider>
    <NotificationProvider>
      <TruckProvider>
        <FavoritesProvider>
          <CartProvider>
            <App />
            <Toaster position="top-left" richColors closeButton theme="light" />
          </CartProvider>
        </FavoritesProvider>
      </TruckProvider>
    </NotificationProvider>
  </AnalyticsProvider>
);

const DEV_AUTH_STUB = {
  user: { id: 'dev-admin', email: 'dev@local.test' },
  profile: { id: 'dev-admin', role: 'admin', name: 'Dev Admin', email: 'dev@local.test', permissions: ['*'] },
  realUser: { id: 'dev-admin', email: 'dev@local.test' },
  realProfile: { id: 'dev-admin', role: 'admin', name: 'Dev Admin', email: 'dev@local.test', permissions: ['*'] },
  loading: false,
  error: null,
  isAuthenticated: true,
  isOwner: false,
  isCustomer: false,
  isAdmin: true,
  hasAdminPermission: () => true,
  signOut: async () => {},
  updateProfile: async () => ({ error: null }),
  updatePassword: async () => { throw new Error('Password change unavailable in dev mode'); },
  refreshProfile: async () => {},
  viewingAs: null,
  isViewingAs: false,
  startViewingAs: () => {},
  stopViewingAs: () => {},
  showAuthModal: false,
  authMode: 'login',
  openAuth: (mode) => console.warn(`[dev] Auth stub — would open ${mode}`),
  closeAuth: () => {},
  devSettings: {},
  updateDevSettings: () => {},
};

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <ToastProvider>
        <ConfirmProvider>
          <BrowserRouter>
            {CLERK_PUBLISHABLE_KEY ? (
              <ClerkProvider
                publishableKey={CLERK_PUBLISHABLE_KEY}
                signInUrl="/login"
                signUpUrl="/sign-up"
                signInFallbackRedirectUrl="/post-auth"
                signUpFallbackRedirectUrl="/post-auth"
                appearance={{
                  variables: {
                    colorPrimary: '#e11d48',
                    borderRadius: '0.5rem',
                    fontFamily: 'inherit',
                  },
                  elements: {
                    card: 'shadow-none border-none',
                    formButtonPrimary:
                      'bg-primary hover:bg-primary/90 text-primary-foreground',
                  },
                }}
              >
                <AuthProvider>
                  <AppInner />
                </AuthProvider>
              </ClerkProvider>
            ) : (
              <AuthContext.Provider value={DEV_AUTH_STUB}>
                <AppInner />
              </AuthContext.Provider>
            )}
          </BrowserRouter>
        </ConfirmProvider>
      </ToastProvider>
    </ErrorBoundary>
  </React.StrictMode>
);
