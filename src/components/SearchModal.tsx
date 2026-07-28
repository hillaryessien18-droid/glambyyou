"use client";

import { useState, useEffect, useRef } from "react";
import { useStore } from "@/lib/store";
import { searchProducts } from "@/lib/api";
import type { Product } from "@/lib/data";
import Link from "next/link";

export default function SearchModal() {
  const { isSearchOpen, setSearchOpen } = useStore();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    if (isSearchOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      setQuery("");
      setResults([]);
    }
  }, [isSearchOpen]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query.trim()) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    debounceRef.current = setTimeout(() => {
      searchProducts(query)
        .then(setResults)
        .catch(() => setResults([]))
        .finally(() => setLoading(false));
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  return (
    <>
      {isSearchOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-[60] animate-fade-in"
          onClick={() => setSearchOpen(false)}
        />
      )}
      <div
        className={`fixed top-0 left-0 right-0 z-[70] bg-white shadow-xl transform transition-transform duration-300 ${
          isSearchOpen ? "translate-y-0" : "-translate-y-full"
        }`}
      >
        <div className="max-w-3xl mx-auto px-4 py-6">
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search products, categories, brands..."
                className="w-full pl-12 pr-4 py-3.5 bg-nude-light/50 rounded-xl border border-nude-light focus:outline-none focus:border-primary/30 focus:bg-white transition-all text-sm"
              />
            </div>
            <button
              onClick={() => setSearchOpen(false)}
              className="p-3 text-foreground/50 hover:text-foreground transition-colors"
              aria-label="Close search"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {query && (
            <div className="mt-4 max-h-96 overflow-y-auto">
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-pulse text-foreground/40 text-sm">Searching...</div>
                </div>
              ) : results.length > 0 ? (
                <div className="space-y-1">
                  {results.map((product) => (
                    <Link
                      key={product.id}
                      href={`/products/${product.slug}`}
                      onClick={() => setSearchOpen(false)}
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-nude-light/50 transition-colors"
                    >
                      <div className="w-12 h-12 rounded-lg overflow-hidden bg-nude-light/50 shrink-0">
                        <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{product.name}</p>
                        <p className="text-xs text-foreground/50 truncate">{product.category.replace("-", " ")}</p>
                      </div>
                      <span className="text-sm font-bold text-primary">${product.price}</span>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-foreground/50 text-sm">No products found for &ldquo;{query}&rdquo;</p>
                </div>
              )}
            </div>
          )}

          {!query && (
            <div className="mt-4">
              <p className="text-xs uppercase tracking-wider text-foreground/40 font-semibold mb-3">Popular Searches</p>
              <div className="flex flex-wrap gap-2">
                {["Serum", "Lipstick", "Perfume", "Moisturizer", "Foundation", "Highlighter"].map((term) => (
                  <button
                    key={term}
                    onClick={() => setQuery(term)}
                    className="px-4 py-2 bg-nude-light/50 rounded-full text-xs text-foreground/60 hover:bg-nude-light hover:text-foreground transition-colors"
                  >
                    {term}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
