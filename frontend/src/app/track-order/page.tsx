"use client";

import { useState } from "react";
import OrderDetails from "@/components/OrderDetails";
import { errorMessage, trackOrder, type Order } from "@/lib/api";

export default function TrackOrderPage() {
  const [form, setForm] = useState({ orderNumber: "", email: "" });
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setOrder(null);
    try {
      setOrder(await trackOrder(form.orderNumber, form.email));
    } catch (err) {
      setError(errorMessage(err, "We couldn't find an order with those details."));
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    "w-full px-4 py-3 rounded-xl border border-nude-dark/30 bg-white focus:outline-none focus:border-primary/50 text-sm";

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-nude-gradient py-12">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h1 className="text-3xl sm:text-4xl font-serif font-bold text-foreground">Track Your Order</h1>
          <p className="mt-2 text-foreground/60">Enter your order number and the email you used at checkout.</p>
        </div>
      </div>
      <div className="max-w-3xl mx-auto px-4 py-10 space-y-8">
        <form onSubmit={submit} className="bg-white rounded-2xl border border-nude-light/50 p-6 grid sm:grid-cols-[1fr_1fr_auto] gap-3">
          <input className={inputClass} required placeholder="Order number (GBY-…)" aria-label="Order number" value={form.orderNumber} onChange={(e) => setForm((f) => ({ ...f, orderNumber: e.target.value }))} />
          <input className={inputClass} required type="email" placeholder="Email address" aria-label="Email address" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
          <button disabled={loading} className="bg-primary text-white px-6 py-3 rounded-xl text-sm font-semibold hover:bg-primary-dark disabled:opacity-60">
            {loading ? "Searching…" : "Track"}
          </button>
        </form>
        {error && <p className="text-center text-red-600" role="alert">{error}</p>}
        {order && <OrderDetails order={order} />}
      </div>
    </div>
  );
}
