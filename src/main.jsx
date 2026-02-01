import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import ErrorBoundary from './components/common/ErrorBoundary';
import ToastContainer from './components/common/Toast';
import { AuthProvider } from './components/auth/AuthContext';
import { CartProvider } from './contexts/CartContext';
import { TruckProvider } from './contexts/TruckContext';
import { FavoritesProvider } from './contexts/FavoritesContext';
import { ToastProvider } from './contexts/ToastContext';
import { ConfirmProvider } from './contexts/ConfirmContext';
import { NotificationProvider } from './contexts/NotificationContext';
import './index.css';
import './styles/auth.css';
import './styles/navigation.css';
import './styles/animations.css';
import './styles/modals.css';
import './styles/toast.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <ToastProvider>
        <ConfirmProvider>
          <BrowserRouter>
            <AuthProvider>
              <NotificationProvider>
                <TruckProvider>
                  <FavoritesProvider>
                    <CartProvider>
                      <App />
                      <ToastContainer />
                    </CartProvider>
                  </FavoritesProvider>
                </TruckProvider>
              </NotificationProvider>
            </AuthProvider>
          </BrowserRouter>
        </ConfirmProvider>
      </ToastProvider>
    </ErrorBoundary>
  </React.StrictMode>
);
