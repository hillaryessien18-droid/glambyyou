"use client";

import Link from "next/link";
import { useStore } from "@/lib/store";

export default function CartPage() {
  const { cart, removeFromCart, updateQuantity, cartTotal, clearCart } = useStore();

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center px-6">
          <svg className="w-20 h-20 text-nude-dark mx-auto mb-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
          </svg>
          <h1 className="text-2xl font-serif font-bold text-foreground">Your Cart is Empty</h1>
          <p className="text-foreground/60 mt-2">Looks like you haven&apos;t added anything yet</p>
          <Link
            href="/products"
            className="inline-flex items-center gap-2 mt-6 bg-primary text-white px-6 py-3 rounded-full text-sm font-semibold hover:bg-primary-dark transition-colors"
          >
            Continue Shopping
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-nude-gradient py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl sm:text-4xl font-serif font-bold text-foreground text-center">Shopping Cart</h1>
          <p className="text-foreground/60 text-center mt-2">{cart.length} {cart.length === 1 ? "item" : "items"}</p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="lg:grid lg:grid-cols-3 lg:gap-8">
          <div className="lg:col-span-2 space-y-4">
            {cart.map((item) => (
              <div key={item.product.id} className="bg-white rounded-2xl border border-nude-light/50 p-4 sm:p-5 flex gap-4 sm:gap-6">
                <Link href={`/products/${item.product.slug}`} className="shrink-0 w-24 h-24 sm:w-28 sm:h-28 rounded-xl overflow-hidden bg-nude-light/30">
                  <img src={item.product.image} alt={item.product.name} className="w-full h-full object-cover" />
                </Link>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div>
                      <Link href={`/products/${item.product.slug}`}>
                        <h3 className="text-sm sm:text-base font-semibold text-foreground hover:text-primary transition-colors">
                          {item.product.name}
                        </h3>
                      </Link>
                      <p className="text-xs text-foreground/50 mt-0.5 capitalize">{item.product.category.replace("-", " ")}</p>
                    </div>
                    <button
                      onClick={() => removeFromCart(item.product.id)}
                      className="text-foreground/30 hover:text-primary transition-colors p-1"
                      aria-label="Remove"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <div className="flex items-center border border-nude-dark/30 rounded-lg">
                      <button
                        onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                        className="w-8 h-8 flex items-center justify-center text-foreground/60 hover:text-foreground transition-colors text-sm"
                      >
                        -
                      </button>
                      <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                        className="w-8 h-8 flex items-center justify-center text-foreground/60 hover:text-foreground transition-colors text-sm"
                      >
                        +
                      </button>
                    </div>
                    <span className="text-base font-bold text-foreground">
                      ${(item.product.price * item.quantity).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            ))}

            <button
              onClick={clearCart}
              className="text-sm text-foreground/50 hover:text-primary transition-colors"
            >
              Clear Cart
            </button>
          </div>

          <div className="mt-8 lg:mt-0">
            <div className="bg-white rounded-2xl border border-nude-light/50 p-6 sticky top-28">
              <h3 className="text-lg font-serif font-bold text-foreground mb-4">Order Summary</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between text-foreground/70">
                  <span>Subtotal</span>
                  <span className="font-medium text-foreground">${cartTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-foreground/70">
                  <span>Shipping</span>
                  <span className="font-medium text-green-600">Free</span>
                </div>
                <div className="flex justify-between text-foreground/70">
                  <span>Tax</span>
                  <span className="font-medium text-foreground">Calculated at checkout</span>
                </div>
                <hr className="border-nude-light" />
                <div className="flex justify-between text-base font-bold text-foreground">
                  <span>Total</span>
                  <span>${cartTotal.toFixed(2)}</span>
                </div>
              </div>

              <Link
                href="/checkout"
                className="block w-full mt-6 bg-primary text-white text-center py-3 rounded-xl font-semibold text-sm hover:bg-primary-dark transition-colors shadow-lg shadow-primary/20"
              >
                Proceed to Checkout
              </Link>

              <Link
                href="/products"
                className="block w-full mt-3 text-center text-sm text-foreground/50 hover:text-foreground transition-colors"
              >
                Continue Shopping
              </Link>

              <div className="mt-4 flex justify-center gap-2">
                <span className="text-xs text-foreground/30 uppercase">Visa</span>
                <span className="text-xs text-foreground/30 uppercase">MC</span>
                <span className="text-xs text-foreground/30 uppercase">Amex</span>
                <span className="text-xs text-foreground/30 uppercase">PayPal</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
