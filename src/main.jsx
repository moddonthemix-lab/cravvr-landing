import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import { AuthProvider } from './components/auth/AuthContext';
import { CartProvider } from './contexts/CartContext';
import { TruckProvider } from './contexts/TruckContext';
import { FavoritesProvider } from './contexts/FavoritesContext';
import './index.css';
import './styles/auth.css';
import './styles/navigation.css';
import './styles/animations.css';
import './styles/modals.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <TruckProvider>
          <FavoritesProvider>
            <CartProvider>
              <App />
            </CartProvider>
          </FavoritesProvider>
        </TruckProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
