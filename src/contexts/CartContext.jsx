import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useConfirm } from './ConfirmContext';
import { useToast } from './ToastContext';

const CartContext = createContext({});

export const CartProvider = ({ children }) => {
  const { confirm } = useConfirm();
  const { showToast } = useToast();
  const [items, setItems] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [currentTruckId, setCurrentTruckId] = useState(null);
  const [currentTruckName, setCurrentTruckName] = useState('');

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem('cravvr_cart');
    if (savedCart) {
      try {
        const parsed = JSON.parse(savedCart);
        setItems(parsed.items || []);
        setCurrentTruckId(parsed.truckId || null);
        setCurrentTruckName(parsed.truckName || '');
      } catch (e) {
        console.error('Failed to parse saved cart:', e);
      }
    }
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('cravvr_cart', JSON.stringify({
      items,
      truckId: currentTruckId,
      truckName: currentTruckName,
    }));
  }, [items, currentTruckId, currentTruckName]);

  // Add item to cart
  const addItem = useCallback(async (item, truck) => {
    // If cart has items from a different truck, ask to clear
    if (currentTruckId && currentTruckId !== truck.id && items.length > 0) {
      const confirmed = await confirm({
        title: 'Clear cart?',
        message: `Your cart contains items from ${currentTruckName}. Would you like to clear it and add items from ${truck.name}?`,
        confirmText: 'Clear & Add',
        cancelText: 'Keep Current',
        variant: 'default',
      });
      if (!confirmed) return false;
      setItems([]);
      showToast(`Cart cleared. Now ordering from ${truck.name}`, 'info');
    }

    setCurrentTruckId(truck.id);
    setCurrentTruckName(truck.name);

    setItems(prev => {
      const existingIndex = prev.findIndex(i => i.id === item.id);
      if (existingIndex >= 0) {
        // Increment quantity
        const updated = [...prev];
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: updated[existingIndex].quantity + 1,
        };
        return updated;
      }
      // Add new item
      return [...prev, { ...item, quantity: 1 }];
    });

    showToast(`${item.name} added to cart`, 'success');
    return true;
  }, [currentTruckId, currentTruckName, items.length, confirm, showToast]);

  // Remove item from cart
  const removeItem = useCallback((itemId) => {
    setItems(prev => {
      const item = prev.find(i => i.id === itemId);
      if (item) {
        showToast(`${item.name} removed from cart`, 'info');
      }
      return prev.filter(i => i.id !== itemId);
    });
  }, [showToast]);

  // Update item quantity
  const updateQuantity = useCallback((itemId, quantity) => {
    if (quantity <= 0) {
      removeItem(itemId);
      return;
    }
    setItems(prev =>
      prev.map(i => i.id === itemId ? { ...i, quantity } : i)
    );
  }, [removeItem]);

  // Increment item quantity
  const incrementItem = useCallback((itemId) => {
    setItems(prev =>
      prev.map(i => i.id === itemId ? { ...i, quantity: i.quantity + 1 } : i)
    );
  }, []);

  // Decrement item quantity
  const decrementItem = useCallback((itemId) => {
    setItems(prev => {
      const item = prev.find(i => i.id === itemId);
      if (item && item.quantity <= 1) {
        return prev.filter(i => i.id !== itemId);
      }
      return prev.map(i => i.id === itemId ? { ...i, quantity: i.quantity - 1 } : i);
    });
  }, []);

  // Clear cart
  const clearCart = useCallback((silent = false) => {
    setItems([]);
    setCurrentTruckId(null);
    setCurrentTruckName('');
    if (!silent) {
      showToast('Cart cleared', 'info');
    }
  }, [showToast]);

  // Calculate subtotal
  const subtotal = items.reduce((sum, item) => sum + (parseFloat(item.price) * item.quantity), 0);

  // Calculate tax (assume 8%)
  const taxRate = 0.08;
  const tax = subtotal * taxRate;

  // Calculate total
  const total = subtotal + tax;

  // Item count
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  // Open/close cart drawer
  const openCart = useCallback(() => setIsOpen(true), []);
  const closeCart = useCallback(() => setIsOpen(false), []);
  const toggleCart = useCallback(() => setIsOpen(prev => !prev), []);

  const value = {
    items,
    itemCount,
    subtotal,
    tax,
    total,
    taxRate,
    currentTruckId,
    currentTruckName,
    isOpen,
    addItem,
    removeItem,
    updateQuantity,
    incrementItem,
    decrementItem,
    clearCart,
    openCart,
    closeCart,
    toggleCart,
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export default CartContext;
