import { Suspense } from "react";
import { categories, priceRanges, brands } from "@/lib/data";
import ProductsClient from "./ProductsClient";

export const metadata = {
  title: "Shop All Products | GlowByYou",
};

export default function ProductsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-foreground/40">Loading...</div>
      </div>
    }>
      <ProductsClient
        categories={categories}
        priceRanges={priceRanges}
        brands={brands}
      />
    </Suspense>
  );
}
