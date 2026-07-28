"use client";

import Link from "next/link";
import { useStore } from "@/lib/store";
import type { Product } from "@/lib/data";

interface ProductCardProps {
  product: Product;
  featured?: boolean;
}

export default function ProductCard({ product, featured }: ProductCardProps) {
  const { addToCart, toggleWishlist, isInWishlist } = useStore();

  return (
    <div className={`product-card group bg-white rounded-xl overflow-hidden border border-nude-light/50 ${featured ? '' : ''}`}>
      <Link href={`/products/${product.slug}`} className="block relative aspect-[3/4] overflow-hidden bg-nude-light/30">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />
        {product.discount && (
          <span className="absolute top-3 left-3 bg-primary text-white text-xs font-bold px-2.5 py-1 rounded-full">
            -{product.discount}%
          </span>
        )}
        {product.isNew && (
          <span className="absolute top-3 left-3 bg-secondary text-white text-xs font-bold px-2.5 py-1 rounded-full">
            New
          </span>
        )}
        <button
          onClick={(e) => {
            e.preventDefault();
            toggleWishlist(product.id);
          }}
          className={`absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 ${
            isInWishlist(product.id)
              ? "bg-primary text-white"
              : "bg-white/80 text-foreground/60 hover:bg-white hover:text-primary"
          }`}
          aria-label="Add to wishlist"
        >
          <svg className="w-4 h-4" fill={isInWishlist(product.id) ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        </button>
        {product.originalPrice && (
          <div className="absolute top-3 right-14 bg-secondary/90 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
            SALE
          </div>
        )}
      </Link>

      <div className="p-4">
        <Link href={`/products?category=${product.category}`} className="text-[11px] uppercase tracking-widest text-warm-brown/70 font-medium">
          {product.category.replace("-", " ")}
        </Link>
        <Link href={`/products/${product.slug}`}>
          <h3 className="mt-1 text-sm font-semibold text-foreground leading-tight hover:text-primary transition-colors line-clamp-1">
            {product.name}
          </h3>
        </Link>
        <p className="mt-1 text-xs text-foreground/50 line-clamp-1">{product.shortDescription}</p>

        <div className="mt-2 flex items-center gap-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <svg
              key={i}
              className={`w-3 h-3 ${i < Math.floor(product.rating) ? "text-secondary" : "text-gray-200"}`}
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          ))}
          <span className="text-[11px] text-foreground/50 ml-1">({product.reviewCount})</span>
        </div>

        <div className="mt-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-base font-bold text-foreground">${product.price}</span>
            {product.originalPrice && (
              <span className="text-sm text-foreground/40 line-through">${product.originalPrice}</span>
            )}
          </div>
          <button
            onClick={() => addToCart(product)}
            className="bg-primary/10 hover:bg-primary text-primary hover:text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200"
          >
            Add to Cart
          </button>
        </div>
      </div>
    </div>
  );
}
