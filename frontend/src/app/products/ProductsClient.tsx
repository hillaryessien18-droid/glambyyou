"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import type { Product, Category } from "@/lib/data";
import { getProducts, type ProductQuery } from "@/lib/api";
import ProductCard from "@/components/ProductCard";
import Link from "next/link";

interface ProductsClientProps {
  categories: Category[];
  priceRanges: { label: string; min: number; max: number }[];
  brands: string[];
}

export default function ProductsClient({
  categories,
  priceRanges,
  brands,
}: ProductsClientProps) {
  const searchParams = useSearchParams();
  const categoryFilter = searchParams.get("category") || "";
  const saleFilter = searchParams.get("sale") === "true";
  const searchFilter = searchParams.get("search") || "";
  const newFilter = searchParams.get("new") === "true";

  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(categoryFilter);
  const [selectedBrand, setSelectedBrand] = useState("");
  const [selectedPriceRange, setSelectedPriceRange] = useState("");
  const [selectedSkinType, setSelectedSkinType] = useState("");
  const [sortBy, setSortBy] = useState("featured");
  const [showFilters, setShowFilters] = useState(false);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError("");

    const params: ProductQuery = { limit: 60 };
    if (selectedCategory) params.category = selectedCategory;
    if (selectedBrand) params.brand = selectedBrand;
    if (selectedPriceRange) {
      const range = priceRanges.find((r) => r.label === selectedPriceRange);
      if (range) {
        params.minPrice = range.min;
        params.maxPrice = range.max;
      }
    }
    if (selectedSkinType) params.skinType = selectedSkinType;
    if (saleFilter) params.sale = true;
    if (newFilter) params.new = true;
    if (searchFilter) params.search = searchFilter;
    params.sort = sortBy;

    try {
      const data = await getProducts(params);
      setProducts(data.products);
      setTotal(data.total);
    } catch {
      setError("Failed to load products");
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, selectedBrand, selectedPriceRange, selectedSkinType, sortBy, saleFilter, newFilter, searchFilter, priceRanges]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Keep the selected category in sync when header links change the URL.
  useEffect(() => {
    setSelectedCategory(categoryFilter);
  }, [categoryFilter]);

  const clearFilters = () => {
    setSelectedCategory("");
    setSelectedBrand("");
    setSelectedPriceRange("");
    setSelectedSkinType("");
    setSortBy("featured");
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-nude-gradient py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-3xl sm:text-5xl font-serif font-bold text-foreground">
            {searchFilter ? `Results for “${searchFilter}”` : newFilter ? "New Arrivals" : saleFilter ? "Sale" : selectedCategory ? `${selectedCategory.replace("-", " ")}` : "All Products"}
          </h1>
          <p className="mt-2 text-foreground/60 text-sm sm:text-base">
            {total} {total === 1 ? "product" : "products"} found
          </p>
          <div className="flex items-center justify-center gap-2 mt-4 text-sm">
            <Link href="/" className="text-foreground/50 hover:text-primary transition-colors">Home</Link>
            <span className="text-foreground/30">/</span>
            <span className="text-foreground/80 font-medium">Products</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="lg:hidden flex items-center gap-2 text-sm font-medium text-foreground/70 hover:text-primary transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            Filters
          </button>

          <div className="flex items-center gap-3">
            <span className="text-xs text-foreground/50 hidden sm:inline">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="text-sm bg-white border border-nude-light rounded-lg px-3 py-2 focus:outline-none focus:border-primary/30"
            >
              <option value="featured">Featured</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="rating">Highest Rated</option>
              <option value="newest">Newest</option>
            </select>
          </div>
        </div>

        <div className="flex gap-8">
          <aside
            className={`lg:w-64 shrink-0 ${showFilters ? "block" : "hidden"} lg:block`}
          >
            <div className="bg-white rounded-2xl border border-nude-light/50 p-6 space-y-6 sticky top-28">
              <div>
                <button
                  onClick={() => setShowFilters(false)}
                  className="lg:hidden absolute top-4 right-4 text-foreground/50 hover:text-foreground"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
                <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground mb-4">Categories</h3>
                <div className="space-y-2">
                  <button
                    onClick={() => setSelectedCategory("")}
                    className={`block w-full text-left text-sm px-3 py-2 rounded-lg transition-colors ${
                      !selectedCategory ? "bg-primary/10 text-primary font-medium" : "text-foreground/70 hover:bg-nude-light/50"
                    }`}
                  >
                    All Categories
                  </button>
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat.slug)}
                      className={`block w-full text-left text-sm px-3 py-2 rounded-lg transition-colors capitalize ${
                        selectedCategory === cat.slug ? "bg-primary/10 text-primary font-medium" : "text-foreground/70 hover:bg-nude-light/50"
                      }`}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>
              </div>

              <hr className="border-nude-light" />

              <div>
                <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground mb-4">Price Range</h3>
                <div className="space-y-2">
                  {priceRanges.map((range) => (
                    <button
                      key={range.label}
                      onClick={() => setSelectedPriceRange(selectedPriceRange === range.label ? "" : range.label)}
                      className={`block w-full text-left text-sm px-3 py-2 rounded-lg transition-colors ${
                        selectedPriceRange === range.label ? "bg-primary/10 text-primary font-medium" : "text-foreground/70 hover:bg-nude-light/50"
                      }`}
                    >
                      {range.label}
                    </button>
                  ))}
                </div>
              </div>

              <hr className="border-nude-light" />

              <div>
                <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground mb-4">Brand</h3>
                <div className="space-y-2">
                  <button
                    onClick={() => setSelectedBrand("")}
                    className={`block w-full text-left text-sm px-3 py-2 rounded-lg transition-colors ${
                      !selectedBrand ? "bg-primary/10 text-primary font-medium" : "text-foreground/70 hover:bg-nude-light/50"
                    }`}
                  >
                    All Brands
                  </button>
                  {brands.map((brand) => (
                    <button
                      key={brand}
                      onClick={() => setSelectedBrand(selectedBrand === brand ? "" : brand)}
                      className={`block w-full text-left text-sm px-3 py-2 rounded-lg transition-colors ${
                        selectedBrand === brand ? "bg-primary/10 text-primary font-medium" : "text-foreground/70 hover:bg-nude-light/50"
                      }`}
                    >
                      {brand}
                    </button>
                  ))}
                </div>
              </div>

              <hr className="border-nude-light" />

              <div>
                <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground mb-4">Skin Type</h3>
                <div className="space-y-2">
                  {["All Skin Types", "Dry", "Normal", "Sensitive", "Combination"].map((type) => (
                    <button
                      key={type}
                      onClick={() => setSelectedSkinType(selectedSkinType === type ? "" : type)}
                      className={`block w-full text-left text-sm px-3 py-2 rounded-lg transition-colors ${
                        selectedSkinType === type ? "bg-primary/10 text-primary font-medium" : "text-foreground/70 hover:bg-nude-light/50"
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </aside>

          {loading ? (
            <div className="flex-1 grid grid-cols-2 md:grid-cols-3 gap-4 sm:gap-5">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="bg-white rounded-xl border border-nude-light/50 overflow-hidden animate-pulse">
                  <div className="aspect-[3/4] bg-nude-light/50" />
                  <div className="p-4 space-y-3">
                    <div className="h-3 bg-nude-light/50 rounded w-1/3" />
                    <div className="h-4 bg-nude-light/50 rounded w-2/3" />
                    <div className="h-3 bg-nude-light/50 rounded w-full" />
                    <div className="h-4 bg-nude-light/50 rounded w-1/4" />
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="flex-1 flex flex-col items-center justify-center py-20">
              <svg className="w-16 h-16 text-primary mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <p className="text-lg font-medium text-foreground">Failed to load products</p>
              <button onClick={() => window.location.reload()} className="mt-4 text-sm text-primary font-semibold hover:text-primary-dark transition-colors">
                Try Again
              </button>
            </div>
          ) : products.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center py-20">
              <svg className="w-16 h-16 text-nude-dark mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-lg font-medium text-foreground">No products found</p>
              <p className="text-sm text-foreground/50 mt-1">Try adjusting your filters</p>
              <button onClick={clearFilters} className="mt-4 text-sm text-primary font-semibold hover:text-primary-dark transition-colors">
                Clear all filters
              </button>
            </div>
          ) : (
            <div className="flex-1">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 sm:gap-5">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
