"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { products, type Product } from "@/lib/data";
import { getProducts } from "@/lib/api";
import ProductCard from "./ProductCard";

export default function BestSellers() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [bestSellers, setBestSellers] = useState<Product[]>(() => products.filter((p) => p.isBestSeller));

  useEffect(() => {
    getProducts({ bestSeller: true, limit: 12 })
      .then((data) => data.products.length && setBestSellers(data.products))
      .catch(() => undefined);
  }, []);

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const amount = scrollRef.current.clientWidth * 0.8;
      scrollRef.current.scrollBy({
        left: direction === "left" ? -amount : amount,
        behavior: "smooth",
      });
    }
  };

  return (
    <section className="py-20 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-10">
          <div>
            <p className="text-primary text-sm font-medium uppercase tracking-[0.2em] mb-3">Best Sellers</p>
            <h2 className="text-3xl sm:text-4xl font-serif font-bold text-foreground">
              Our Most Loved Products
            </h2>
            <p className="mt-2 text-foreground/60">
              Curated favorites that our customers can&apos;t stop raving about
            </p>
          </div>
          <div className="hidden sm:flex gap-2">
            <button
              onClick={() => scroll("left")}
              className="w-10 h-10 rounded-full border border-nude-dark/30 flex items-center justify-center hover:bg-primary hover:text-white hover:border-primary transition-all duration-200"
              aria-label="Scroll left"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={() => scroll("right")}
              className="w-10 h-10 rounded-full border border-nude-dark/30 flex items-center justify-center hover:bg-primary hover:text-white hover:border-primary transition-all duration-200"
              aria-label="Scroll right"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>

        <div
          ref={scrollRef}
          className="flex gap-5 overflow-x-auto scrollbar-hide -mx-4 px-4 pb-4 snap-x snap-mandatory"
        >
          {bestSellers.map((product) => (
            <div key={product.id} className="min-w-[260px] sm:min-w-[280px] snap-start">
              <ProductCard product={product} />
            </div>
          ))}
        </div>

        <div className="text-center mt-10">
          <Link
            href="/products"
            className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:text-primary-dark transition-colors"
          >
            View All Products
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  );
}
