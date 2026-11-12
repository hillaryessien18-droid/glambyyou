"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { errorMessage } from "@/lib/api";
import { nextPath } from "@/lib/redirect";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      await login(email, password);
      router.push(nextPath());
    } catch (err) {
      setError(errorMessage(err, "Invalid email or password."));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      <div className="hidden lg:block relative w-1/2 bg-nude-gradient">
        <img
          src="https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=800&q=80"
          alt="Beauty"
          className="absolute inset-0 w-full h-full object-cover opacity-50"
        />
        <div className="absolute inset-0 flex items-center justify-center p-12">
          <div className="text-center max-w-sm">
            <h2 className="text-4xl font-serif font-bold text-foreground">Welcome Back</h2>
            <p className="mt-3 text-foreground/70">Continue your beauty journey with us</p>
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <Link href="/" className="text-2xl font-serif font-bold text-primary block text-center mb-8">
            GlowByYou
          </Link>
          <h1 className="text-2xl font-serif font-bold text-foreground text-center">Sign In</h1>
          <p className="text-sm text-foreground/50 text-center mt-1">Welcome back to your beauty account</p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-foreground/70 mb-1.5">Email Address</label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl border border-nude-dark/30 bg-white focus:outline-none focus:border-primary/50 transition-colors text-sm"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-foreground/70 mb-1.5">Password</label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl border border-nude-dark/30 bg-white focus:outline-none focus:border-primary/50 transition-colors text-sm"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 rounded-xl px-4 py-3" role="alert">{error}</p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-primary text-white py-3 rounded-xl font-semibold text-sm hover:bg-primary-dark transition-colors shadow-lg shadow-primary/20 disabled:opacity-60"
            >
              {submitting ? "Signing in…" : "Sign In"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-foreground/50">
            Don&apos;t have an account?{" "}
            <Link href="/auth/signup" className="text-primary font-semibold hover:text-primary-dark transition-colors">
              Create Account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
