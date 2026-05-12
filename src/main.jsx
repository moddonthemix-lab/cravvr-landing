import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ClerkProvider } from '@clerk/clerk-react';
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
  throw new Error('Missing VITE_CLERK_PUBLISHABLE_KEY in .env.local');
}

import './styles/auth.css';
import './styles/navigation.css';
import './styles/animations.css';
import './styles/modals.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <ToastProvider>
        <ConfirmProvider>
          <BrowserRouter>
            <ClerkProvider
              publishableKey={CLERK_PUBLISHABLE_KEY}
              signInUrl="/login"
              signUpUrl="/sign-up"
              signInFallbackRedirectUrl="/"
              signUpFallbackRedirectUrl="/"
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
                <AnalyticsProvider>
                  <NotificationProvider>
                    <TruckProvider>
                      <FavoritesProvider>
                        <CartProvider>
                          <App />
                          <Toaster
                            position="top-left"
                            richColors
                            closeButton
                            theme="light"
                          />
                        </CartProvider>
                      </FavoritesProvider>
                    </TruckProvider>
                  </NotificationProvider>
                </AnalyticsProvider>
              </AuthProvider>
            </ClerkProvider>
          </BrowserRouter>
        </ConfirmProvider>
      </ToastProvider>
    </ErrorBoundary>
  </React.StrictMode>
);
