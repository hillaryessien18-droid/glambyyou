"use client";

import { useStore } from "@/lib/store";
import Link from "next/link";

export default function CartDrawer() {
  const { cart, isCartOpen, setCartOpen, removeFromCart, updateQuantity, cartTotal } = useStore();

  return (
    <>
      {isCartOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-[60] animate-fade-in"
          onClick={() => setCartOpen(false)}
        />
      )}
      <div
        className={`fixed top-0 right-0 h-full w-full max-w-md bg-white z-[70] shadow-2xl transform transition-transform duration-300 ${
          isCartOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between px-6 py-5 border-b border-nude-light">
            <h2 className="text-lg font-serif font-bold text-foreground">
              Shopping Cart ({cart.length})
            </h2>
            <button
              onClick={() => setCartOpen(false)}
              className="p-2 text-foreground/50 hover:text-foreground transition-colors"
              aria-label="Close cart"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {cart.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
              <svg className="w-16 h-16 text-nude-dark mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              <p className="text-foreground font-medium">Your cart is empty</p>
              <p className="text-sm text-foreground/50 mt-1">Discover our beautiful collection</p>
              <button
                onClick={() => setCartOpen(false)}
                className="mt-6 bg-primary text-white px-6 py-2.5 rounded-full text-sm font-semibold hover:bg-primary-dark transition-colors"
              >
                Continue Shopping
              </button>
            </div>
          ) : (
            <>
              <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
                {cart.map((item) => (
                  <div key={item.product.id} className="flex gap-4 p-3 rounded-xl bg-nude-light/30 border border-nude-light/50">
                    <Link href={`/products/${item.product.slug}`} className="shrink-0 w-20 h-20 rounded-lg overflow-hidden bg-nude-light/50">
                      <img src={item.product.image} alt={item.product.name} className="w-full h-full object-cover" />
                    </Link>
                    <div className="flex-1 min-w-0">
                      <Link href={`/products/${item.product.slug}`}>
                        <h3 className="text-sm font-semibold text-foreground truncate hover:text-primary transition-colors">
                          {item.product.name}
                        </h3>
                      </Link>
                      <p className="text-sm font-bold text-primary mt-1">${item.product.price}</p>
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center border border-nude-dark/30 rounded-lg">
                          <button
                            onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                            className="w-7 h-7 flex items-center justify-center text-foreground/60 hover:text-foreground transition-colors text-sm"
                          >
                            -
                          </button>
                          <span className="w-7 text-center text-sm font-medium">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                            className="w-7 h-7 flex items-center justify-center text-foreground/60 hover:text-foreground transition-colors text-sm"
                          >
                            +
                          </button>
                        </div>
                        <button
                          onClick={() => removeFromCart(item.product.id)}
                          className="text-foreground/40 hover:text-primary transition-colors"
                          aria-label="Remove item"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t border-nude-light px-6 py-5 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-foreground/60 text-sm">Subtotal</span>
                  <span className="text-lg font-bold text-foreground">${cartTotal.toFixed(2)}</span>
                </div>
                <p className="text-xs text-foreground/40">Shipping & taxes calculated at checkout</p>
                <Link
                  href="/checkout"
                  onClick={() => setCartOpen(false)}
                  className="block w-full bg-primary text-white text-center py-3 rounded-xl font-semibold text-sm hover:bg-primary-dark transition-colors"
                >
                  Checkout
                </Link>
                <button
                  onClick={() => setCartOpen(false)}
                  className="block w-full text-center text-sm text-foreground/50 hover:text-foreground transition-colors"
                >
                  Continue Shopping
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
