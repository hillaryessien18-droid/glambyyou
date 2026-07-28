"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";

export default function SignupPage() {
  const router = useRouter();
  const { login } = useStore();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    login(name || "User", email);
    router.push("/");
  };

  return (
    <div className="min-h-screen bg-background flex">
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <Link href="/" className="text-2xl font-serif font-bold text-primary block text-center mb-8">
            GlowByYou
          </Link>
          <h1 className="text-2xl font-serif font-bold text-foreground text-center">Create Account</h1>
          <p className="text-sm text-foreground/50 text-center mt-1">Join the GlowByYou beauty community</p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-foreground/70 mb-1.5">Full Name</label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl border border-nude-dark/30 bg-white focus:outline-none focus:border-primary/50 transition-colors text-sm"
                placeholder="Your name"
              />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-foreground/70 mb-1.5">Email Address</label>
              <input
                id="email"
                type="email"
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
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl border border-nude-dark/30 bg-white focus:outline-none focus:border-primary/50 transition-colors text-sm"
                placeholder="At least 8 characters"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-primary text-white py-3 rounded-xl font-semibold text-sm hover:bg-primary-dark transition-colors shadow-lg shadow-primary/20"
            >
              Create Account
            </button>

            <p className="text-xs text-foreground/40 text-center">
              By creating an account, you agree to our{" "}
              <a href="#" className="text-primary hover:underline">Terms of Service</a> and{" "}
              <a href="#" className="text-primary hover:underline">Privacy Policy</a>
            </p>
          </form>

          <p className="mt-6 text-center text-sm text-foreground/50">
            Already have an account?{" "}
            <Link href="/auth/login" className="text-primary font-semibold hover:text-primary-dark transition-colors">
              Sign In
            </Link>
          </p>
        </div>
      </div>

      <div className="hidden lg:block relative w-1/2 bg-nude-gradient">
        <img
          src="https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=800&q=80"
          alt="Beauty"
          className="absolute inset-0 w-full h-full object-cover opacity-50"
        />
        <div className="absolute inset-0 flex items-center justify-center p-12">
          <div className="text-center max-w-sm">
            <h2 className="text-4xl font-serif font-bold text-foreground">Start Your Glow</h2>
            <p className="mt-3 text-foreground/70">Join thousands who trust GlowByYou for their beauty routine</p>
          </div>
        </div>
      </div>
    </div>
  );
}
