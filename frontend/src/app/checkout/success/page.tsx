"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Order } from "@/lib/api";
import { useStore } from "@/lib/store";
import OrderDetails from "@/components/OrderDetails";

export default function CheckoutSuccessPage() {
  const { isAuthenticated } = useStore();
  const [order, setOrder] = useState<Order | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("glam-last-order");
      if (raw) setOrder(JSON.parse(raw) as Order);
    } catch {
      // Nothing stored — fall through to the generic message.
    }
    setLoaded(true);
  }, []);

  if (!loaded) return null;

  return (
    <div className="min-h-screen bg-background py-12">
      <div className="max-w-3xl mx-auto px-4 space-y-8">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto rounded-full bg-green-100 flex items-center justify-center">
            <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="mt-4 text-3xl font-serif font-bold text-foreground">Thank you for your order!</h1>
          <p className="mt-2 text-foreground/60">
            {order
              ? <>We&apos;ve sent a confirmation to <span className="font-medium">{order.email}</span>.</>
              : "Your order has been placed."}
          </p>
        </div>

        {order && <OrderDetails order={order} />}

        <div className="flex flex-wrap justify-center gap-3">
          <Link href="/products" className="bg-primary text-white px-6 py-3 rounded-xl text-sm font-semibold hover:bg-primary-dark">
            Continue Shopping
          </Link>
          <Link
            href={isAuthenticated ? "/account" : "/track-order"}
            className="px-6 py-3 rounded-xl border border-nude-dark/30 text-sm font-semibold text-foreground/70 hover:bg-nude-light/50"
          >
            {isAuthenticated ? "View My Orders" : "Track Your Order"}
          </Link>
        </div>
      </div>
    </div>
  );
}
