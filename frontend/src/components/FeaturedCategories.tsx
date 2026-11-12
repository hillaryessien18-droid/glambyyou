"use client";

import Link from "next/link";
import { categories } from "@/lib/data";

const categoryIcons: Record<string, string> = {
  skincare: "✦",
  perfumes: "♢",
  lipsticks: "♡",
  "makeup-kits": "◇",
};

export default function FeaturedCategories() {
  return (
    <section className="py-20 bg-soft-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <p className="text-primary text-sm font-medium uppercase tracking-[0.2em] mb-3">Categories</p>
          <h2 className="text-3xl sm:text-4xl font-serif font-bold text-foreground">
            Shop by Category
          </h2>
          <p className="mt-3 text-foreground/60 max-w-md mx-auto">
            Discover your perfect match from our carefully curated collections
          </p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {categories.map((category) => (
            <Link
              key={category.id}
              href={`/products?category=${category.slug}`}
              className="group relative rounded-2xl overflow-hidden aspect-[4/5] bg-nude-light/30"
            >
              <img
                src={category.image}
                alt={category.name}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                loading="lazy"
              />
              <div className="absolute inset-0 gradient-overlay" />
              <div className="absolute bottom-0 left-0 right-0 p-5 text-white">
                <span className="text-2xl mb-2 block opacity-70">{categoryIcons[category.slug]}</span>
                <h3 className="text-lg font-serif font-bold">{category.name}</h3>
                <p className="text-sm text-white/70">{category.itemCount} Products</p>
              </div>
              <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/10 transition-colors duration-300" />
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
