"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { errorMessage, verifyPayment, type Order } from "@/lib/api";
import { useStore } from "@/lib/store";
import OrderDetails from "@/components/OrderDetails";

type State = "loading" | "verifying" | "done" | "failed";

export default function CheckoutSuccessPage() {
  const router = useRouter();
  const { isAuthenticated, clearCart } = useStore();
  const [order, setOrder] = useState<Order | null>(null);
  const [state, setState] = useState<State>("loading");
  const [error, setError] = useState("");

  useEffect(() => {
    let stored: Order | null = null;
    try {
      const raw = sessionStorage.getItem("glam-last-order");
      if (raw) stored = JSON.parse(raw) as Order;
    } catch {
      // Nothing stored — fall through to the generic message.
    }
    setOrder(stored);

    // Flutterwave appends ?status=…&tx_ref=…&transaction_id=… when it redirects back.
    const params = new URLSearchParams(window.location.search);
    const paymentStatus = params.get("status");
    if (!stored || stored.paymentStatus !== "unpaid" || stored.status !== "pending" || !paymentStatus) {
      setState("done");
      return;
    }

    setState("verifying");
    verifyPayment({
      orderNumber: stored.orderNumber,
      email: stored.email,
      transactionId: params.get("transaction_id"),
      status: paymentStatus,
    })
      .then((updated) => {
        sessionStorage.setItem("glam-last-order", JSON.stringify(updated));
        if (updated.status === "cancelled") {
          router.replace("/checkout?payment=cancelled");
          return;
        }
        if (updated.paymentStatus === "paid") clearCart();
        setOrder(updated);
        setState("done");
      })
      .catch((err) => {
        setError(errorMessage(err, "We couldn't confirm your payment."));
        setState("failed");
      });
    // Runs once on arrival; clearCart/router identities don't matter here.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (state === "loading") return null;

  if (state === "verifying") {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 px-4 text-center">
        <div className="w-10 h-10 rounded-full border-4 border-primary/20 border-t-primary animate-spin" aria-hidden="true" />
        <p className="text-foreground/70">Confirming your payment…</p>
      </div>
    );
  }

  if (state === "failed") {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 px-4 text-center max-w-md mx-auto">
        <h1 className="text-2xl font-serif font-bold text-foreground">Payment not confirmed</h1>
        <p className="text-foreground/60" role="alert">{error}</p>
        <p className="text-sm text-foreground/50">
          If money left your account, it will be matched to order {order?.orderNumber} automatically and we&apos;ll email you.
        </p>
        <Link href="/checkout" className="bg-primary text-white px-6 py-3 rounded-xl text-sm font-semibold hover:bg-primary-dark">
          Try again
        </Link>
      </div>
    );
  }

  const awaitingPayment = order?.status === "pending" && order.paymentStatus === "unpaid";

  return (
    <div className="min-h-screen bg-background py-12">
      <div className="max-w-3xl mx-auto px-4 space-y-8">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto rounded-full bg-green-100 flex items-center justify-center">
            <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="mt-4 text-3xl font-serif font-bold text-foreground">
            {awaitingPayment ? "Your order is reserved" : "Thank you for your order!"}
          </h1>
          <p className="mt-2 text-foreground/60">
            {awaitingPayment
              ? "We're waiting for your payment to be confirmed. We'll email you as soon as it is."
              : order
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
