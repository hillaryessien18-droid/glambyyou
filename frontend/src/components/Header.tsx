"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useStore } from "@/lib/store";

export default function Header() {
  const { cartCount, wishlist, isAuthenticated, user, setCartOpen, setSearchOpen, logout } = useStore();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled ? "bg-white/95 backdrop-blur-md shadow-sm" : "bg-transparent"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 lg:h-20">
            <button
              className="lg:hidden p-2 -ml-2 text-foreground"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>

            <Link href="/" className="flex items-center gap-2">
              <span className="text-2xl lg:text-3xl font-serif font-bold text-primary tracking-wide">
                GlowByYou
              </span>
            </Link>

            <nav className="hidden lg:flex items-center gap-8">
              <Link href="/" className="text-sm font-medium uppercase tracking-wider text-foreground/80 hover:text-primary transition-colors">
                Home
              </Link>
              <Link href="/products" className="text-sm font-medium uppercase tracking-wider text-foreground/80 hover:text-primary transition-colors">
                Shop
              </Link>
              <Link href="/products?category=skincare" className="text-sm font-medium uppercase tracking-wider text-foreground/80 hover:text-primary transition-colors">
                Skincare
              </Link>
              <Link href="/products?category=perfumes" className="text-sm font-medium uppercase tracking-wider text-foreground/80 hover:text-primary transition-colors">
                Perfumes
              </Link>
              <Link href="/products?category=lipsticks" className="text-sm font-medium uppercase tracking-wider text-foreground/80 hover:text-primary transition-colors">
                Lipsticks
              </Link>
              <Link href="/products?category=makeup-kits" className="text-sm font-medium uppercase tracking-wider text-foreground/80 hover:text-primary transition-colors">
                Makeup Kits
              </Link>
            </nav>

            <div className="flex items-center gap-3 lg:gap-4">
              <button
                onClick={() => setSearchOpen(true)}
                className="p-2 text-foreground/70 hover:text-primary transition-colors"
                aria-label="Search"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>

              {isAuthenticated ? (
                <div className="relative group">
                  <button className="p-2 text-foreground/70 hover:text-primary transition-colors" aria-label="Account">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </button>
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-nude-light opacity-0 invisible group-hover:opacity-100 group-hover:visible group-focus-within:opacity-100 group-focus-within:visible transition-all duration-200 py-2">
                    <p className="px-4 py-2 text-sm text-warm-brown font-medium truncate">{user?.name}</p>
                    <hr className="border-nude-light" />
                    <Link href="/account" className="block px-4 py-2 text-sm text-foreground/70 hover:text-primary transition-colors">
                      My Account &amp; Orders
                    </Link>
                    <Link href="/wishlist" className="block px-4 py-2 text-sm text-foreground/70 hover:text-primary transition-colors">
                      Wishlist
                    </Link>
                    <button onClick={logout} className="w-full text-left px-4 py-2 text-sm text-foreground/70 hover:text-primary transition-colors">
                      Sign Out
                    </button>
                  </div>
                </div>
              ) : (
                <Link href="/auth/login" className="p-2 text-foreground/70 hover:text-primary transition-colors" aria-label="Account">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </Link>
              )}

              <Link href="/wishlist" className="relative p-2 text-foreground/70 hover:text-primary transition-colors" aria-label="Wishlist">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                {wishlist.length > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-primary text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {wishlist.length}
                  </span>
                )}
              </Link>

              <button
                onClick={() => setCartOpen(true)}
                className="relative p-2 text-foreground/70 hover:text-primary transition-colors"
                aria-label="Cart"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
                {cartCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-primary text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>

        <div
          className={`lg:hidden transition-all duration-300 overflow-hidden ${
            mobileMenuOpen ? "max-h-[32rem] opacity-100" : "max-h-0 opacity-0"
          }`}
        >
          <nav className="bg-white border-t border-nude-light px-4 py-4 space-y-3">
            <Link href="/" onClick={() => setMobileMenuOpen(false)} className="block text-sm font-medium uppercase tracking-wider text-foreground/80 hover:text-primary">
              Home
            </Link>
            <Link href="/products" onClick={() => setMobileMenuOpen(false)} className="block text-sm font-medium uppercase tracking-wider text-foreground/80 hover:text-primary">
              Shop All
            </Link>
            <Link href="/products?category=skincare" onClick={() => setMobileMenuOpen(false)} className="block text-sm font-medium uppercase tracking-wider text-foreground/80 hover:text-primary">
              Skincare
            </Link>
            <Link href="/products?category=perfumes" onClick={() => setMobileMenuOpen(false)} className="block text-sm font-medium uppercase tracking-wider text-foreground/80 hover:text-primary">
              Perfumes
            </Link>
            <Link href="/products?category=lipsticks" onClick={() => setMobileMenuOpen(false)} className="block text-sm font-medium uppercase tracking-wider text-foreground/80 hover:text-primary">
              Lipsticks
            </Link>
            <Link href="/products?category=makeup-kits" onClick={() => setMobileMenuOpen(false)} className="block text-sm font-medium uppercase tracking-wider text-foreground/80 hover:text-primary">
              Makeup Kits
            </Link>
            <hr className="border-nude-light" />
            <Link href={isAuthenticated ? "/account" : "/auth/login"} onClick={() => setMobileMenuOpen(false)} className="block text-sm font-medium uppercase tracking-wider text-foreground/80 hover:text-primary">
              {isAuthenticated ? "My Account" : "Sign In"}
            </Link>
            <Link href="/track-order" onClick={() => setMobileMenuOpen(false)} className="block text-sm font-medium uppercase tracking-wider text-foreground/80 hover:text-primary">
              Track Order
            </Link>
          </nav>
        </div>
      </header>
      <div className="h-16 lg:h-20" />
    </>
  );
}
