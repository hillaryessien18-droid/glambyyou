"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import RequireAuth from "@/components/RequireAuth";
import OrderDetails from "@/components/OrderDetails";
import { useStore } from "@/lib/store";
import { cancelOrder, errorMessage, getOrder, type Order } from "@/lib/api";

function OrderView() {
  const { orderNumber } = useParams<{ orderNumber: string }>();
  const { notify } = useStore();
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState("");
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    getOrder(orderNumber)
      .then(setOrder)
      .catch((err) => setError(errorMessage(err, "Order not found")));
  }, [orderNumber]);

  const cancel = async () => {
    if (!order || !confirm("Cancel this order? Any payment will be refunded.")) return;
    setCancelling(true);
    try {
      setOrder(await cancelOrder(order.orderNumber));
      notify("Order cancelled");
    } catch (err) {
      notify(errorMessage(err), "error");
    } finally {
      setCancelling(false);
    }
  };

  if (error) return <p className="text-center text-red-600 py-20">{error}</p>;
  if (!order) return <p className="text-center text-foreground/40 animate-pulse py-20">Loading order…</p>;

  return (
    <div className="space-y-4">
      <OrderDetails order={order} />
      {order.canCancel && (
        <button onClick={cancel} disabled={cancelling} className="px-5 py-2.5 rounded-xl border border-red-300 text-red-600 text-sm font-semibold hover:bg-red-50 disabled:opacity-60">
          {cancelling ? "Cancelling…" : "Cancel Order"}
        </button>
      )}
    </div>
  );
}

export default function OrderPage() {
  return (
    <RequireAuth>
      <div className="min-h-screen bg-background py-10">
        <div className="max-w-3xl mx-auto px-4 space-y-6">
          <Link href="/account" className="text-sm text-foreground/50 hover:text-primary">← Back to my account</Link>
          <OrderView />
        </div>
      </div>
    </RequireAuth>
  );
}
