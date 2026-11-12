"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import ProductCard from "@/components/ProductCard";
import { useStore } from "@/lib/store";
import { getProducts, getWishlist } from "@/lib/api";
import type { Product } from "@/lib/data";

export default function WishlistPage() {
  const { wishlist, isAuthenticated, authReady } = useStore();
  const [products, setProducts] = useState<Product[] | null>(null);

  useEffect(() => {
    if (!authReady) return;
    // Signed-in: the server is the source of truth. Guests: resolve saved ids against the catalog.
    const load = isAuthenticated
      ? getWishlist()
      : getProducts({ limit: 60 }).then((data) => data.products.filter((p) => wishlist.includes(p.id)));
    load.then(setProducts).catch(() => setProducts([]));
    // Only reload when the session changes; removals are filtered below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authReady, isAuthenticated]);

  const visible = products?.filter((p) => wishlist.includes(p.id)) ?? null;

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-nude-gradient py-12">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h1 className="text-3xl sm:text-5xl font-serif font-bold text-foreground">My Wishlist</h1>
          <p className="mt-2 text-foreground/60">
            {visible ? `${visible.length} saved ${visible.length === 1 ? "item" : "items"}` : "Loading…"}
          </p>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {!isAuthenticated && authReady && (
          <p className="mb-6 text-sm text-foreground/60 text-center">
            <Link href="/auth/login?next=/wishlist" className="text-primary font-semibold">Sign in</Link> to keep your wishlist across devices.
          </p>
        )}
        {visible === null ? (
          <p className="text-center text-foreground/40 animate-pulse">Loading…</p>
        ) : visible.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-foreground/60">Your wishlist is empty.</p>
            <Link href="/products" className="mt-4 inline-block bg-primary text-white px-6 py-3 rounded-xl text-sm font-semibold">
              Discover Products
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
            {visible.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
