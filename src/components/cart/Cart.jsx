import React from 'react';
import { useCart } from '../../contexts/CartContext';
import { Icons } from '../common/Icons';
import './Cart.css';

// Cart Item Component
const CartItem = ({ item, onIncrement, onDecrement, onRemove }) => (
  <div className="cart-item">
    <div className="cart-item-emoji">
      {item.emoji || '🍽️'}
    </div>
    <div className="cart-item-details">
      <h4 className="cart-item-name">{item.name}</h4>
      <span className="cart-item-price">${parseFloat(item.price).toFixed(2)}</span>
    </div>
    <div className="cart-item-quantity">
      <button className="qty-btn" onClick={() => onDecrement(item.id)}>
        {Icons.minus}
      </button>
      <span className="qty-value">{item.quantity}</span>
      <button className="qty-btn" onClick={() => onIncrement(item.id)}>
        {Icons.plus}
      </button>
    </div>
    <button className="cart-item-remove" onClick={() => onRemove(item.id)}>
      {Icons.trash}
    </button>
  </div>
);

// Cart Drawer Component
const CartDrawer = ({ onCheckout }) => {
  const {
    items,
    itemCount,
    subtotal,
    tax,
    total,
    currentTruckName,
    isOpen,
    closeCart,
    incrementItem,
    decrementItem,
    removeItem,
    clearCart,
  } = useCart();

  if (!isOpen) return null;

  return (
    <>
      <div className="cart-overlay" onClick={closeCart} />
      <div className="cart-drawer">
        <div className="cart-header">
          <div className="cart-title">
            {Icons.shoppingBag}
            <h2>Your Order</h2>
            {itemCount > 0 && <span className="cart-badge">{itemCount}</span>}
          </div>
          <button className="cart-close" onClick={closeCart}>
            {Icons.x}
          </button>
        </div>

        {currentTruckName && (
          <div className="cart-truck">
            {Icons.truck}
            <span>{currentTruckName}</span>
          </div>
        )}

        <div className="cart-content">
          {items.length === 0 ? (
            <div className="cart-empty">
              <div className="cart-empty-icon">{Icons.shoppingBag}</div>
              <h3>Your cart is empty</h3>
              <p>Add some delicious items to get started!</p>
            </div>
          ) : (
            <div className="cart-items">
              {items.map(item => (
                <CartItem
                  key={item.id}
                  item={item}
                  onIncrement={incrementItem}
                  onDecrement={decrementItem}
                  onRemove={removeItem}
                />
              ))}
            </div>
          )}
        </div>

        {items.length > 0 && (
          <div className="cart-footer">
            <div className="cart-summary">
              <div className="cart-summary-row">
                <span>Subtotal</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div className="cart-summary-row">
                <span>Tax (8%)</span>
                <span>${tax.toFixed(2)}</span>
              </div>
              <div className="cart-summary-row cart-total">
                <span>Total</span>
                <span>${total.toFixed(2)}</span>
              </div>
            </div>
            <button className="cart-checkout-btn" onClick={onCheckout}>
              Proceed to Checkout
            </button>
            <button className="cart-clear-btn" onClick={clearCart}>
              Clear Cart
            </button>
          </div>
        )}
      </div>
    </>
  );
};

// Floating Cart Button
export const CartButton = ({ onClick }) => {
  const { itemCount, total, isOpen } = useCart();

  if (isOpen) return null;

  return (
    <button className={`cart-fab ${itemCount > 0 ? 'has-items' : ''}`} onClick={onClick}>
      {Icons.shoppingBag}
      {itemCount > 0 && (
        <>
          <span className="cart-fab-badge">{itemCount}</span>
          <span className="cart-fab-total">${total.toFixed(2)}</span>
        </>
      )}
    </button>
  );
};

export default CartDrawer;
