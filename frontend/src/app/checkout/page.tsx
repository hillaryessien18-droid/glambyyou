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

type Step = "shipping" | "payment" | "confirm";
const STEPS: Step[] = ["shipping", "payment", "confirm"];

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

/** Luhn checksum — catches typos before the order is submitted. */
function isValidCardNumber(value: string) {
  const digits = value.replace(/\D/g, "");
  if (digits.length < 12 || digits.length > 19) return false;
  let sum = 0;
  for (let i = 0; i < digits.length; i++) {
    let d = Number(digits[digits.length - 1 - i]);
    if (i % 2 === 1) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
  }
  return sum % 10 === 0;
}

function isValidExpiry(value: string) {
  const match = /^(\d{2})\s*\/\s*(\d{2})$/.exec(value);
  if (!match) return false;
  const month = Number(match[1]);
  const year = 2000 + Number(match[2]);
  if (month < 1 || month > 12) return false;
  return new Date(year, month) > new Date();
}

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
  const [card, setCard] = useState({ number: "", expiry: "", cvc: "", name: "" });
  const [cardError, setCardError] = useState("");

  const lines = useMemo(() => cart.map((i) => ({ productId: i.product.id, quantity: i.quantity })), [cart]);

  useEffect(() => {
    setMounted(true);
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
      clearCart();
      notify("Order placed — thank you!");
      router.push(`/checkout/success?order=${order.orderNumber}`);
    } catch (err) {
      setError(errorMessage(err, "We couldn't place your order. Please try again."));
    } finally {
      setPlacing(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (step === "shipping") {
      setStep("payment");
    } else if (step === "payment") {
      if (paymentMethod === "card") {
        if (!isValidCardNumber(card.number)) return setCardError("Please enter a valid card number.");
        if (!isValidExpiry(card.expiry)) return setCardError("Please enter a valid future expiry date (MM/YY).");
        if (!/^\d{3,4}$/.test(card.cvc)) return setCardError("Please enter a valid CVC.");
      }
      setCardError("");
      setStep("confirm");
    } else {
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
                  {s}
                </span>
                {i < 2 && <span className="text-foreground/20 mx-1">—</span>}
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
                <div className="bg-white rounded-2xl border border-nude-light/50 p-6 space-y-4 animate-fade-in">
                  <h2 className="text-lg font-serif font-bold text-foreground">Payment Method</h2>
                  <div className="grid grid-cols-2 gap-3">
                    {([
                      ["card", "Credit / Debit Card"],
                      ["cash_on_delivery", "Pay on Delivery"],
                    ] as const).map(([value, label]) => (
                      <label
                        key={value}
                        className={`flex items-center gap-2 px-4 py-3 rounded-xl border cursor-pointer text-sm ${
                          paymentMethod === value ? "border-primary bg-primary/5 font-semibold" : "border-nude-dark/30"
                        }`}
                      >
                        <input
                          type="radio"
                          name="paymentMethod"
                          value={value}
                          checked={paymentMethod === value}
                          onChange={() => setPaymentMethod(value)}
                          className="accent-primary"
                        />
                        {label}
                      </label>
                    ))}
                  </div>

                  {paymentMethod === "card" && (
                    <>
                      <div className="bg-nude-light/30 rounded-xl p-4 text-sm text-foreground/60">
                        <p className="font-medium text-foreground mb-1">Test Mode</p>
                        <p>Use 4242 4242 4242 4242, any future date and any CVC. Card details never leave your browser.</p>
                      </div>
                      <div>
                        <label className={labelClass} htmlFor="cardNumber">Card Number</label>
                        <input id="cardNumber" inputMode="numeric" autoComplete="cc-number" required value={card.number} onChange={(e) => setCard((c) => ({ ...c, number: e.target.value }))} placeholder="4242 4242 4242 4242" className={inputClass} />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className={labelClass} htmlFor="expiry">Expiry Date</label>
                          <input id="expiry" autoComplete="cc-exp" required value={card.expiry} onChange={(e) => setCard((c) => ({ ...c, expiry: e.target.value }))} placeholder="MM/YY" className={inputClass} />
                        </div>
                        <div>
                          <label className={labelClass} htmlFor="cvc">CVC</label>
                          <input id="cvc" inputMode="numeric" autoComplete="cc-csc" required value={card.cvc} onChange={(e) => setCard((c) => ({ ...c, cvc: e.target.value }))} placeholder="123" className={inputClass} />
                        </div>
                      </div>
                      <div>
                        <label className={labelClass} htmlFor="nameOnCard">Name on Card</label>
                        <input id="nameOnCard" autoComplete="cc-name" required value={card.name} onChange={(e) => setCard((c) => ({ ...c, name: e.target.value }))} className={inputClass} />
                      </div>
                    </>
                  )}
                  {cardError && <p className="text-sm text-red-600" role="alert">{cardError}</p>}
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
                    <p className="text-foreground/70">{shipping.firstName} {shipping.lastName} · {email}</p>
                    <p className="text-foreground/70">{shipping.line1}{shipping.line2 && `, ${shipping.line2}`}</p>
                    <p className="text-foreground/70">{shipping.city}, {shipping.state} {shipping.postalCode}, {shipping.country}</p>
                    <hr className="border-nude-light" />
                    <h3 className="font-semibold text-foreground">Payment</h3>
                    <p className="text-foreground/70">
                      {paymentMethod === "card" ? `Card ending in ${card.number.replace(/\D/g, "").slice(-4)}` : "Pay on delivery"}
                    </p>
                  </div>
                  {error && <p className="text-sm text-red-600 bg-red-50 rounded-xl px-4 py-3" role="alert">{error}</p>}
                  <div className="flex gap-3">
                    <button type="button" onClick={() => setStep("payment")} className="flex-1 py-3 rounded-xl border border-nude-dark/30 text-sm font-semibold text-foreground/70 hover:bg-nude-light/50 transition-colors">
                      Back
                    </button>
                    <button type="submit" disabled={placing || !quote} className="flex-1 bg-green-600 text-white py-3 rounded-xl font-semibold text-sm hover:bg-green-700 transition-colors disabled:opacity-60">
                      {placing ? "Placing order…" : `Place Order — ${money(quote?.total ?? cartTotal)}`}
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
