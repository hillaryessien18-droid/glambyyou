"use client";

import Link from "next/link";

export default function PromoBanner() {
  return (
    <section className="py-20 bg-nude-gradient overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative bg-foreground rounded-3xl overflow-hidden">
          <div className="absolute inset-0">
            <img
              src="https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=1200&q=80"
              alt=""
              className="w-full h-full object-cover opacity-20"
            />
          </div>
          <div className="relative px-6 sm:px-12 lg:px-16 py-14 sm:py-20 text-center sm:text-left">
            <div className="max-w-2xl mx-auto sm:mx-0">
              <div className="inline-flex items-center gap-2 bg-secondary/20 text-secondary text-xs font-bold uppercase tracking-widest px-4 py-1.5 rounded-full mb-5">
                Limited Time Offer
              </div>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-white leading-tight">
                Spring Glow Sale — <br />
                <span className="text-secondary">Up to 30% Off</span>
              </h2>
              <p className="mt-4 text-white/70 text-base sm:text-lg max-w-md mx-auto sm:mx-0">
                Celebrate the season of renewal with exclusive discounts on our best-selling skincare and makeup collections.
              </p>
              <div className="mt-3 flex flex-wrap justify-center sm:justify-start gap-4 text-sm text-white/50">
                <span className="flex items-center gap-1.5">
                  <svg className="w-4 h-4 text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Free Shipping
                </span>
                <span className="flex items-center gap-1.5">
                  <svg className="w-4 h-4 text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Secure Checkout
                </span>
                <span className="flex items-center gap-1.5">
                  <svg className="w-4 h-4 text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Easy Returns
                </span>
              </div>
              <div className="mt-8 flex flex-wrap justify-center sm:justify-start gap-3">
                <Link
                  href="/products?sale=true"
                  className="bg-secondary text-foreground px-8 py-3.5 rounded-full text-sm font-bold hover:bg-secondary-light transition-colors shadow-lg shadow-secondary/25"
                >
                  Shop the Sale
                </Link>
                <Link
                  href="/products?category=skincare"
                  className="bg-white/10 backdrop-blur-sm text-white border border-white/30 px-8 py-3.5 rounded-full text-sm font-semibold hover:bg-white/20 transition-all"
                >
                  Explore Skincare
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
