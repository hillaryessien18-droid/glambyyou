"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const isCheckout = (pathname: string | null) => !!pathname?.startsWith("/checkout");

/** Minimal header shown during checkout so shoppers can pay without distractions. */
function CheckoutHeader() {
  return (
    <header className="bg-white border-b border-nude-light/60">
      <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="text-2xl font-serif font-bold text-primary tracking-wide">
          GlowByYou
        </Link>
        <span className="flex items-center gap-1.5 text-sm text-foreground/60">
          <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          Secure checkout
        </span>
      </div>
    </header>
  );
}

/** The full site header, swapped for the minimal checkout header on /checkout. */
export function SiteHeader({ children }: { children: React.ReactNode }) {
  return isCheckout(usePathname()) ? <CheckoutHeader /> : <>{children}</>;
}

/** Hides footer, cart drawer, search and other extras during checkout. */
export function HideDuringCheckout({ children }: { children: React.ReactNode }) {
  return isCheckout(usePathname()) ? null : <>{children}</>;
}
