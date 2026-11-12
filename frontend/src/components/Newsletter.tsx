"use client";

import { useState } from "react";
import { subscribeNewsletter, errorMessage } from "@/lib/api";

export default function Newsletter() {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setSubmitting(true);
    setError("");
    try {
      await subscribeNewsletter(email);
      setSubscribed(true);
      setEmail("");
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="py-20 bg-foreground relative overflow-hidden">
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-10 left-10 w-72 h-72 bg-primary rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-secondary rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <p className="text-primary-light text-sm font-medium uppercase tracking-[0.2em] mb-3">
          Stay Connected
        </p>
        <h2 className="text-3xl sm:text-4xl font-serif font-bold text-white">
          Join Our Beauty Circle
        </h2>
        <p className="mt-3 text-white/60 max-w-md mx-auto">
          Subscribe for exclusive offers, new arrivals, beauty tips, and 10% off your first order.
        </p>

        {subscribed ? (
          <div className="mt-8 p-6 bg-white/10 rounded-2xl backdrop-blur-sm animate-scale-in">
            <svg className="w-10 h-10 mx-auto text-secondary mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-white font-semibold">You&apos;re subscribed!</p>
            <p className="text-white/60 text-sm mt-1">Welcome to the GlowByYou family. Use code <span className="font-semibold text-white">WELCOME10</span> for 10% off your first order.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-8 flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email address"
              required
              className="flex-1 px-5 py-3.5 rounded-xl bg-white/10 border border-white/20 text-white placeholder:text-white/40 text-sm focus:outline-none focus:border-primary-light/50 transition-all"
            />
            <button
              type="submit"
              disabled={submitting}
              className="px-8 py-3.5 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary-dark transition-colors whitespace-nowrap disabled:opacity-60"
            >
              {submitting ? "Subscribing…" : "Subscribe"}
            </button>
          </form>
        )}
        {error && <p className="mt-3 text-sm text-primary-light" role="alert">{error}</p>}

        <p className="mt-4 text-xs text-white/30">
          By subscribing, you agree to our Privacy Policy. Unsubscribe anytime.
        </p>
      </div>
    </section>
  );
}
