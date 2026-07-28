"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";

export default function CheckoutPage() {
  const router = useRouter();
  const { cart, cartTotal, clearCart } = useStore();
  const [step, setStep] = useState<"shipping" | "payment" | "confirm">("shipping");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    zip: "",
    country: "US",
    cardNumber: "",
    expDate: "",
    cvc: "",
    nameOnCard: "",
  });

  useEffect(() => {
    if (mounted && cart.length === 0) {
      router.push("/cart");
    }
  }, [mounted, cart, router]);

  if (!mounted || cart.length === 0) return null;

  const updateField = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (step === "shipping") setStep("payment");
    else if (step === "payment") setStep("confirm");
    else {
      clearCart();
      router.push("/");
    }
  };

  const inputClass = "w-full px-4 py-3 rounded-xl border border-nude-dark/30 bg-white focus:outline-none focus:border-primary/50 transition-colors text-sm";

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-nude-gradient py-12">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-3xl sm:text-4xl font-serif font-bold text-foreground">Checkout</h1>
          <div className="flex items-center justify-center gap-3 mt-4 text-sm">
            {(["shipping", "payment", "confirm"] as const).map((s, i) => (
              <div key={s} className="flex items-center gap-2">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                    step === s
                      ? "bg-primary text-white"
                      : i < ["shipping", "payment", "confirm"].indexOf(step)
                      ? "bg-green-500 text-white"
                      : "bg-nude-light text-foreground/40"
                  }`}
                >
                  {i < ["shipping", "payment", "confirm"].indexOf(step) ? "✓" : i + 1}
                </div>
                <span className={`capitalize hidden sm:inline ${step === s ? "text-foreground font-medium" : "text-foreground/40"}`}>
                  {s}
                </span>
                {i < 2 && <span className="text-foreground/20 mx-1">—</span>}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="lg:grid lg:grid-cols-5 lg:gap-8">
          <div className="lg:col-span-3">
            <form onSubmit={handleSubmit}>
              {step === "shipping" && (
                <div className="bg-white rounded-2xl border border-nude-light/50 p-6 space-y-4 animate-fade-in">
                  <h2 className="text-lg font-serif font-bold text-foreground">Shipping Information</h2>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground/70 mb-1">First Name</label>
                      <input type="text" required value={formData.firstName} onChange={(e) => updateField("firstName", e.target.value)} className={inputClass} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground/70 mb-1">Last Name</label>
                      <input type="text" required value={formData.lastName} onChange={(e) => updateField("lastName", e.target.value)} className={inputClass} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground/70 mb-1">Email</label>
                    <input type="email" required value={formData.email} onChange={(e) => updateField("email", e.target.value)} className={inputClass} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground/70 mb-1">Phone</label>
                    <input type="tel" value={formData.phone} onChange={(e) => updateField("phone", e.target.value)} className={inputClass} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground/70 mb-1">Address</label>
                    <input type="text" required value={formData.address} onChange={(e) => updateField("address", e.target.value)} className={inputClass} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground/70 mb-1">City</label>
                      <input type="text" required value={formData.city} onChange={(e) => updateField("city", e.target.value)} className={inputClass} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground/70 mb-1">State</label>
                      <input type="text" required value={formData.state} onChange={(e) => updateField("state", e.target.value)} className={inputClass} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground/70 mb-1">ZIP Code</label>
                      <input type="text" required value={formData.zip} onChange={(e) => updateField("zip", e.target.value)} className={inputClass} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground/70 mb-1">Country</label>
                      <select value={formData.country} onChange={(e) => updateField("country", e.target.value)} className={inputClass}>
                        <option value="US">United States</option>
                        <option value="CA">Canada</option>
                        <option value="UK">United Kingdom</option>
                        <option value="AU">Australia</option>
                      </select>
                    </div>
                  </div>
                  <button type="submit" className="w-full bg-primary text-white py-3 rounded-xl font-semibold text-sm hover:bg-primary-dark transition-colors mt-2">
                    Continue to Payment
                  </button>
                </div>
              )}

              {step === "payment" && (
                <div className="bg-white rounded-2xl border border-nude-light/50 p-6 space-y-4 animate-fade-in">
                  <h2 className="text-lg font-serif font-bold text-foreground">Payment Information</h2>
                  <div className="bg-nude-light/30 rounded-xl p-4 text-sm text-foreground/60">
                    <p className="font-medium text-foreground mb-1">Test Mode</p>
                    <p>Use any card number (e.g., 4242 4242 4242 4242), any future date, any CVC.</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground/70 mb-1">Card Number</label>
                    <input type="text" required value={formData.cardNumber} onChange={(e) => updateField("cardNumber", e.target.value)} placeholder="4242 4242 4242 4242" className={inputClass} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground/70 mb-1">Expiry Date</label>
                      <input type="text" required value={formData.expDate} onChange={(e) => updateField("expDate", e.target.value)} placeholder="MM/YY" className={inputClass} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground/70 mb-1">CVC</label>
                      <input type="text" required value={formData.cvc} onChange={(e) => updateField("cvc", e.target.value)} placeholder="123" className={inputClass} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground/70 mb-1">Name on Card</label>
                    <input type="text" required value={formData.nameOnCard} onChange={(e) => updateField("nameOnCard", e.target.value)} className={inputClass} />
                  </div>
                  <div className="flex gap-3">
                    <button type="button" onClick={() => setStep("shipping")} className="flex-1 py-3 rounded-xl border border-nude-dark/30 text-sm font-semibold text-foreground/70 hover:bg-nude-light/50 transition-colors">
                      Back
                    </button>
                    <button type="submit" className="flex-1 bg-primary text-white py-3 rounded-xl font-semibold text-sm hover:bg-primary-dark transition-colors">
                      Review Order
                    </button>
                  </div>
                </div>
              )}

              {step === "confirm" && (
                <div className="bg-white rounded-2xl border border-nude-light/50 p-6 space-y-4 animate-fade-in">
                  <h2 className="text-lg font-serif font-bold text-foreground">Confirm Order</h2>
                  <div className="space-y-3 text-sm">
                    <h3 className="font-semibold text-foreground">Shipping To</h3>
                    <p className="text-foreground/70">{formData.firstName} {formData.lastName}</p>
                    <p className="text-foreground/70">{formData.address}</p>
                    <p className="text-foreground/70">{formData.city}, {formData.state} {formData.zip}</p>
                    <hr className="border-nude-light" />
                    <h3 className="font-semibold text-foreground">Payment</h3>
                    <p className="text-foreground/70">Card ending in {formData.cardNumber.slice(-4)}</p>
                  </div>
                  <div className="flex gap-3">
                    <button type="button" onClick={() => setStep("payment")} className="flex-1 py-3 rounded-xl border border-nude-dark/30 text-sm font-semibold text-foreground/70 hover:bg-nude-light/50 transition-colors">
                      Back
                    </button>
                    <button type="submit" className="flex-1 bg-green-600 text-white py-3 rounded-xl font-semibold text-sm hover:bg-green-700 transition-colors">
                      Place Order — ${cartTotal.toFixed(2)}
                    </button>
                  </div>
                </div>
              )}
            </form>
          </div>

          <div className="lg:col-span-2 mt-8 lg:mt-0">
            <div className="bg-white rounded-2xl border border-nude-light/50 p-6 sticky top-28">
              <h3 className="text-lg font-serif font-bold text-foreground mb-4">
                {cart.length} {cart.length === 1 ? "Item" : "Items"}
              </h3>
              <div className="space-y-3">
                {cart.map((item) => (
                  <div key={item.product.id} className="flex gap-3">
                    <div className="w-14 h-14 rounded-lg overflow-hidden bg-nude-light/30 shrink-0">
                      <img src={item.product.image} alt={item.product.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{item.product.name}</p>
                      <p className="text-xs text-foreground/50">Qty: {item.quantity}</p>
                      <p className="text-sm font-bold text-foreground">${(item.product.price * item.quantity).toFixed(2)}</p>
                    </div>
                  </div>
                ))}
              </div>
              <hr className="border-nude-light my-4" />
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-foreground/70">
                  <span>Subtotal</span>
                  <span>${cartTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-foreground/70">
                  <span>Shipping</span>
                  <span className="text-green-600 font-medium">Free</span>
                </div>
                <hr className="border-nude-light" />
                <div className="flex justify-between text-base font-bold text-foreground">
                  <span>Total</span>
                  <span>${cartTotal.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
