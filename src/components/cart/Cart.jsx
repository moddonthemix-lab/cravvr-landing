import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../contexts/CartContext';
import { Icons } from '../common/Icons';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const CartItem = ({ item, onIncrement, onDecrement, onRemove }) => (
  <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-3">
    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted text-2xl shrink-0">
      {item.emoji || '🍽️'}
    </div>
    <div className="flex-1 min-w-0">
      <h4 className="font-semibold text-sm leading-tight truncate">{item.name}</h4>
      <span className="text-sm font-bold tabular-nums text-primary">
        ${parseFloat(item.price).toFixed(2)}
      </span>
    </div>
    <div className="inline-flex items-center rounded-full bg-muted">
      <button
        type="button"
        onClick={() => onDecrement(item.id)}
        aria-label="Decrease quantity"
        className="flex h-8 w-8 items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
      >
        <span className="h-3.5 w-3.5">{Icons.minus}</span>
      </button>
      <span className="min-w-[24px] text-center text-sm font-semibold tabular-nums">
        {item.quantity}
      </span>
      <button
        type="button"
        onClick={() => onIncrement(item.id)}
        aria-label="Increase quantity"
        className="flex h-8 w-8 items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
      >
        <span className="h-3.5 w-3.5">{Icons.plus}</span>
      </button>
    </div>
    <button
      type="button"
      onClick={() => onRemove(item.id)}
      aria-label="Remove item"
      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
    >
      <span className="h-4 w-4">{Icons.trash}</span>
    </button>
  </div>
);

const CartDrawer = ({ onCheckout }) => {
  const navigate = useNavigate();
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

  const handleCheckout = () => {
    if (onCheckout) return onCheckout();
    closeCart();
    navigate('/checkout');
  };

  if (!isOpen) return null;

  return (
    <>
      <div
        onClick={closeCart}
        className="fixed inset-0 z-[80] bg-black/40 backdrop-blur-sm animate-in fade-in duration-200"
      />
      <div className="fixed right-0 top-0 z-[81] h-full w-full max-w-md bg-background shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
        <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-4">
          <div className="flex items-center gap-2.5">
            <span className="h-5 w-5 text-primary">{Icons.shoppingBag}</span>
            <h2 className="text-lg font-bold">Your Order</h2>
            {itemCount > 0 && (
              <span className="inline-flex h-6 min-w-[24px] items-center justify-center rounded-full bg-primary px-2 text-xs font-bold text-primary-foreground tabular-nums">
                {itemCount}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={closeCart}
            aria-label="Close cart"
            className="flex h-9 w-9 items-center justify-center rounded-full text-foreground transition-colors hover:bg-muted"
          >
            <span className="h-5 w-5">{Icons.x}</span>
          </button>
        </div>

        {currentTruckName && (
          <div className="flex items-center gap-2 border-b border-border bg-muted/40 px-5 py-2.5 text-sm">
            <span className="h-4 w-4 text-primary">{Icons.truck}</span>
            <span className="font-medium truncate">{currentTruckName}</span>
          </div>
        )}

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-muted text-muted-foreground">
                <span className="h-7 w-7">{Icons.shoppingBag}</span>
              </span>
              <h3 className="text-base font-semibold">Your cart is empty</h3>
              <p className="text-sm text-muted-foreground">
                Add some delicious items to get started!
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
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
          <div className="border-t border-border bg-card p-5 space-y-3">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>Subtotal</span>
                <span className="tabular-nums">${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>Tax (8%)</span>
                <span className="tabular-nums">${tax.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between text-base font-bold pt-2 border-t border-border">
                <span>Total</span>
                <span className="tabular-nums">${total.toFixed(2)}</span>
              </div>
            </div>
            <Button onClick={handleCheckout} size="lg" className="w-full">
              Proceed to Checkout
            </Button>
            <Button onClick={clearCart} variant="ghost" className="w-full text-muted-foreground">
              Clear Cart
            </Button>
          </div>
        )}
      </div>
    </>
  );
};

export const CartButton = ({ onClick }) => {
  const { itemCount, total, isOpen } = useCart();

  if (isOpen) return null;

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Open cart"
      className={cn(
        'fixed bottom-20 right-5 z-[60] flex items-center gap-2 rounded-full bg-primary text-primary-foreground shadow-xl shadow-primary/30 transition-all hover:scale-105 lg:bottom-5',
        itemCount > 0 ? 'h-14 px-5' : 'h-14 w-14 justify-center'
      )}
    >
      <span className="h-6 w-6">{Icons.shoppingBag}</span>
      {itemCount > 0 && (
        <>
          <span className="inline-flex h-6 min-w-[24px] items-center justify-center rounded-full bg-white/25 px-2 text-xs font-bold tabular-nums">
            {itemCount}
          </span>
          <span className="text-sm font-bold tabular-nums">${total.toFixed(2)}</span>
        </>
      )}
    </button>
  );
};

export default CartDrawer;
