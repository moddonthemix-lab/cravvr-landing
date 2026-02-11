import React, { useState } from 'react';
import { useCart } from '../../contexts/CartContext';
import { Icons } from '../common/Icons';

const SidebarCart = () => {
  const {
    items,
    itemCount,
    total,
    currentTruckName,
    openCart,
    incrementItem,
    decrementItem,
  } = useCart();

  const [expanded, setExpanded] = useState(true);

  if (itemCount === 0) {
    return (
      <div className="sidebar-cart empty">
        <div className="sidebar-cart-header">
          {Icons.shoppingBag}
          <span>Your Order</span>
        </div>
        <p className="sidebar-cart-empty-text">No items yet</p>
      </div>
    );
  }

  return (
    <div className="sidebar-cart">
      <div className="sidebar-cart-header" onClick={() => setExpanded(!expanded)}>
        {Icons.shoppingBag}
        <span>Your Order ({itemCount})</span>
        <span className={`sidebar-cart-chevron ${expanded ? 'expanded' : ''}`}>
          {Icons.chevronDown}
        </span>
      </div>

      {currentTruckName && (
        <div className="sidebar-cart-truck">
          {Icons.truck} {currentTruckName}
        </div>
      )}

      {expanded && (
        <div className="sidebar-cart-items">
          {items.map(item => (
            <div key={item.id} className="sidebar-cart-item">
              <span className="sci-emoji">{item.emoji || '\uD83C\uDF7D\uFE0F'}</span>
              <div className="sci-info">
                <span className="sci-name">{item.name}</span>
                <span className="sci-price">${(parseFloat(item.price) * item.quantity).toFixed(2)}</span>
              </div>
              <div className="sci-qty">
                <button onClick={() => decrementItem(item.id)}>{Icons.minus}</button>
                <span>{item.quantity}</span>
                <button onClick={() => incrementItem(item.id)}>{Icons.plus}</button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="sidebar-cart-footer">
        <div className="sidebar-cart-total">
          <span>Total</span>
          <span>${total.toFixed(2)}</span>
        </div>
        <button className="sidebar-cart-checkout" onClick={openCart}>
          Checkout
        </button>
      </div>
    </div>
  );
};

export default SidebarCart;
