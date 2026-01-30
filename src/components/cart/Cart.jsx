import React from 'react';
import { useCart } from '../../contexts/CartContext';
import './Cart.css';

// Icons
const Icons = {
  x: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  minus: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  plus: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  trash: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>,
  shoppingBag: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>,
  truck: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>,
};

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
