"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import {
  createOrder,
  errorMessage,
  getAddresses,
  getQuote,
  type Quote,
  type ShippingDetails,
} from "@/lib/api";

type Step = "shipping" | "payment";
const STEPS: Step[] = ["shipping", "payment"];

const COUNTRIES = [
  ["US", "United States"],
  ["CA", "Canada"],
  ["GB", "United Kingdom"],
  ["AU", "Australia"],
  ["NG", "Nigeria"],
  ["GH", "Ghana"],
  ["KE", "Kenya"],
  ["ZA", "South Africa"],
] as const;

const money = (n: number) => `$${Number(n).toFixed(2)}`;

export default function CheckoutPage() {
  const router = useRouter();
  const { cart, cartTotal, clearCart, user, notify } = useStore();
  const [step, setStep] = useState<Step>("shipping");
  const [mounted, setMounted] = useState(false);
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState("");
  const [quote, setQuote] = useState<Quote | null>(null);
  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState("");
  const [couponError, setCouponError] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"card" | "cash_on_delivery">("card");
  const [email, setEmail] = useState("");
  const [shipping, setShipping] = useState<ShippingDetails>({
    firstName: "",
    lastName: "",
    phone: "",
    line1: "",
    line2: "",
    city: "",
    state: "",
    postalCode: "",
    country: "US",
  });

  const lines = useMemo(() => cart.map((i) => ({ productId: i.product.id, quantity: i.quantity })), [cart]);

  useEffect(() => {
    setMounted(true);
    // Shoppers who back out of the Flutterwave page land here with their cart intact.
    if (new URLSearchParams(window.location.search).get("payment") === "cancelled") {
      setError("Payment was cancelled and you have not been charged. You can try again below.");
      setStep("payment");
    }
  }, []);

  useEffect(() => {
    if (mounted && cart.length === 0) router.push("/cart");
  }, [mounted, cart, router]);

  // Pre-fill from the signed-in account and its default address.
  useEffect(() => {
    if (!user) return;
    setEmail((e) => e || user.email);
    getAddresses()
      .then((addresses) => {
        const a = addresses.find((x) => x.isDefault) ?? addresses[0];
        if (!a) return;
        setShipping((s) =>
          s.line1
            ? s
            : {
                firstName: a.firstName,
                lastName: a.lastName,
                phone: a.phone,
                line1: a.line1,
                line2: a.line2,
                city: a.city,
                state: a.state,
                postalCode: a.postalCode,
                country: a.country,
              }
        );
      })
      .catch(() => undefined);
  }, [user]);

  // Server-side pricing whenever the cart or coupon changes.
  useEffect(() => {
    if (lines.length === 0) return;
    let cancelled = false;
    getQuote(lines, appliedCoupon || undefined)
      .then((q) => !cancelled && setQuote(q))
      .catch((err) => {
        if (cancelled) return;
        if (appliedCoupon) {
          setCouponError(errorMessage(err));
          setAppliedCoupon("");
        } else {
          setError(errorMessage(err));
        }
      });
    return () => {
      cancelled = true;
    };
  }, [lines, appliedCoupon]);

  if (!mounted || cart.length === 0) return null;

  const updateShipping = (field: keyof ShippingDetails, value: string) =>
    setShipping((prev) => ({ ...prev, [field]: value }));

  const applyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    setCouponError("");
    setAppliedCoupon(couponInput.trim().toUpperCase());
  };

  const placeOrder = async () => {
    setPlacing(true);
    setError("");
    try {
      const order = await createOrder({
        items: lines,
        email,
        shipping,
        paymentMethod,
        couponCode: appliedCoupon || undefined,
      });
      sessionStorage.setItem("glam-last-order", JSON.stringify(order));
      if (order.paymentUrl) {
        // Hand off to Flutterwave's secure page; the cart is cleared once payment is confirmed.
        window.location.assign(order.paymentUrl);
        return;
      }
      clearCart();
      notify("Order placed — thank you!");
      router.push(`/checkout/success?order=${order.orderNumber}`);
    } catch (err) {
      setError(errorMessage(err, "We couldn't place your order. Please try again."));
    }
    setPlacing(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (step === "shipping") {
      setError("");
      setStep("payment");
    } else if (!placing) {
      placeOrder();
    }
  };

  const inputClass =
    "w-full px-4 py-3 rounded-xl border border-nude-dark/30 bg-white focus:outline-none focus:border-primary/50 transition-colors text-sm";
  const labelClass = "block text-sm font-medium text-foreground/70 mb-1";
  const stepIndex = STEPS.indexOf(step);

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-nude-gradient py-12">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-3xl sm:text-4xl font-serif font-bold text-foreground">Checkout</h1>
          <div className="flex items-center justify-center gap-3 mt-4 text-sm">
            {STEPS.map((s, i) => (
              <div key={s} className="flex items-center gap-2">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                    step === s
                      ? "bg-primary text-white"
                      : i < stepIndex
                      ? "bg-green-500 text-white"
                      : "bg-nude-light text-foreground/40"
                  }`}
                >
                  {i < stepIndex ? "✓" : i + 1}
                </div>
                <span className={`capitalize hidden sm:inline ${step === s ? "text-foreground font-medium" : "text-foreground/40"}`}>
                  {s === "shipping" ? "Details" : "Pay"}
                </span>
                {i < STEPS.length - 1 && <span className="text-foreground/20 mx-1">—</span>}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {!user && step === "shipping" && (
          <p className="mb-6 text-sm text-foreground/60 bg-white border border-nude-light/50 rounded-xl px-4 py-3">
            Checking out as a guest.{" "}
            <Link href="/auth/login?next=/checkout" className="text-primary font-semibold">
              Sign in
            </Link>{" "}
            to save this order to your account.
          </p>
        )}

        <div className="lg:grid lg:grid-cols-5 lg:gap-8">
          <div className="lg:col-span-3">
            <form onSubmit={handleSubmit}>
              {step === "shipping" && (
                <div className="bg-white rounded-2xl border border-nude-light/50 p-6 space-y-4 animate-fade-in">
                  <h2 className="text-lg font-serif font-bold text-foreground">Shipping Information</h2>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={labelClass} htmlFor="firstName">First Name</label>
                      <input id="firstName" autoComplete="given-name" required value={shipping.firstName} onChange={(e) => updateShipping("firstName", e.target.value)} className={inputClass} />
                    </div>
                    <div>
                      <label className={labelClass} htmlFor="lastName">Last Name</label>
                      <input id="lastName" autoComplete="family-name" required value={shipping.lastName} onChange={(e) => updateShipping("lastName", e.target.value)} className={inputClass} />
                    </div>
                  </div>
                  <div>
                    <label className={labelClass} htmlFor="email">Email</label>
                    <input id="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass} htmlFor="phone">Phone</label>
                    <input id="phone" type="tel" autoComplete="tel" value={shipping.phone} onChange={(e) => updateShipping("phone", e.target.value)} className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass} htmlFor="line1">Address</label>
                    <input id="line1" autoComplete="address-line1" required value={shipping.line1} onChange={(e) => updateShipping("line1", e.target.value)} className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass} htmlFor="line2">Apartment, suite, etc. (optional)</label>
                    <input id="line2" autoComplete="address-line2" value={shipping.line2} onChange={(e) => updateShipping("line2", e.target.value)} className={inputClass} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={labelClass} htmlFor="city">City</label>
                      <input id="city" autoComplete="address-level2" required value={shipping.city} onChange={(e) => updateShipping("city", e.target.value)} className={inputClass} />
                    </div>
                    <div>
                      <label className={labelClass} htmlFor="state">State / Region</label>
                      <input id="state" autoComplete="address-level1" required value={shipping.state} onChange={(e) => updateShipping("state", e.target.value)} className={inputClass} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={labelClass} htmlFor="postalCode">Postal Code</label>
                      <input id="postalCode" autoComplete="postal-code" required value={shipping.postalCode} onChange={(e) => updateShipping("postalCode", e.target.value)} className={inputClass} />
                    </div>
                    <div>
                      <label className={labelClass} htmlFor="country">Country</label>
                      <select id="country" autoComplete="country" value={shipping.country} onChange={(e) => updateShipping("country", e.target.value)} className={inputClass}>
                        {COUNTRIES.map(([code, name]) => (
                          <option key={code} value={code}>{name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <button type="submit" className="w-full bg-primary text-white py-3 rounded-xl font-semibold text-sm hover:bg-primary-dark transition-colors mt-2">
                    Continue to Payment
                  </button>
                </div>
              )}

              {step === "payment" && (
                <div className="bg-white rounded-2xl border border-nude-light/50 p-6 space-y-5 animate-fade-in">
                  <div className="text-sm bg-nude-light/30 rounded-xl px-4 py-3 flex items-start justify-between gap-3">
                    <div className="text-foreground/70">
                      <p className="font-semibold text-foreground">{shipping.firstName} {shipping.lastName} · {email}</p>
                      <p>{shipping.line1}{shipping.line2 && `, ${shipping.line2}`}, {shipping.city}, {shipping.state} {shipping.postalCode}, {shipping.country}</p>
                    </div>
                    <button type="button" onClick={() => setStep("shipping")} className="text-primary font-semibold shrink-0">
                      Edit
                    </button>
                  </div>

                  <fieldset className="space-y-3">
                    <legend className="text-lg font-serif font-bold text-foreground mb-3">How would you like to pay?</legend>
                    {([
                      ["card", "Pay now", "Card, bank transfer, USSD or mobile money — secured by Flutterwave"],
                      ["cash_on_delivery", "Pay on delivery", "Pay when your order arrives"],
                    ] as const).map(([value, label, hint]) => (
                      <label
                        key={value}
                        className={`flex items-start gap-3 px-4 py-3 rounded-xl border cursor-pointer text-sm ${
                          paymentMethod === value ? "border-primary bg-primary/5" : "border-nude-dark/30"
                        }`}
                      >
                        <input
                          type="radio"
                          name="paymentMethod"
                          value={value}
                          checked={paymentMethod === value}
                          onChange={() => setPaymentMethod(value)}
                          className="accent-primary mt-1"
                        />
                        <span>
                          <span className="block font-semibold text-foreground">{label}</span>
                          <span className="block text-foreground/60">{hint}</span>
                        </span>
                      </label>
                    ))}
                  </fieldset>

                  {error && <p className="text-sm text-red-600 bg-red-50 rounded-xl px-4 py-3" role="alert">{error}</p>}
                  <button
                    type="submit"
                    disabled={placing || !quote}
                    className="w-full bg-primary text-white py-4 rounded-xl font-semibold hover:bg-primary-dark transition-colors disabled:opacity-60"
                  >
                    {placing
                      ? paymentMethod === "card" ? "Opening secure payment…" : "Placing order…"
                      : paymentMethod === "card"
                      ? `Pay ${money(quote?.total ?? cartTotal)}`
                      : `Place Order — ${money(quote?.total ?? cartTotal)}`}
                  </button>
                  {paymentMethod === "card" && (
                    <p className="text-xs text-center text-foreground/50">
                      You&apos;ll complete payment on Flutterwave&apos;s secure page and return here automatically.
                    </p>
                  )}
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
                      <p className="text-sm font-bold text-foreground">{money(item.product.price * item.quantity)}</p>
                    </div>
                  </div>
                ))}
              </div>

              <form onSubmit={applyCoupon} className="mt-4 flex gap-2">
                <input
                  value={couponInput}
                  onChange={(e) => setCouponInput(e.target.value)}
                  placeholder="Promo code"
                  aria-label="Promo code"
                  className="flex-1 px-3 py-2 rounded-xl border border-nude-dark/30 text-sm uppercase focus:outline-none focus:border-primary/50"
                />
                <button type="submit" disabled={!couponInput.trim()} className="px-4 py-2 rounded-xl bg-foreground text-white text-sm font-semibold disabled:opacity-40">
                  Apply
                </button>
              </form>
              {couponError && <p className="mt-2 text-xs text-red-600">{couponError}</p>}
              {quote?.couponCode && (
                <p className="mt-2 text-xs text-green-600">
                  Code {quote.couponCode} applied ·{" "}
                  <button type="button" className="underline" onClick={() => { setAppliedCoupon(""); setCouponInput(""); }}>
                    remove
                  </button>
                </p>
              )}

              <hr className="border-nude-light my-4" />
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-foreground/70">
                  <span>Subtotal</span>
                  <span>{money(quote?.subtotal ?? cartTotal)}</span>
                </div>
                {!!quote?.discount && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount</span>
                    <span>−{money(quote.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-foreground/70">
                  <span>Shipping</span>
                  {quote && quote.shipping > 0 ? (
                    <span>{money(quote.shipping)}</span>
                  ) : (
                    <span className="text-green-600 font-medium">{quote ? "Free" : "—"}</span>
                  )}
                </div>
                <div className="flex justify-between text-foreground/70">
                  <span>Estimated tax</span>
                  <span>{quote ? money(quote.tax) : "—"}</span>
                </div>
                {quote && quote.shipping > 0 && (
                  <p className="text-xs text-foreground/50">
                    Add {money(quote.freeShippingThreshold - (quote.subtotal - quote.discount))} more for free shipping.
                  </p>
                )}
                <hr className="border-nude-light" />
                <div className="flex justify-between text-base font-bold text-foreground">
                  <span>Total</span>
                  <span>{money(quote?.total ?? cartTotal)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
