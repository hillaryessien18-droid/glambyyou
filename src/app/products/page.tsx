import { Suspense } from "react";
import { products as allProducts, categories, priceRanges, brands } from "@/lib/data";
import ProductsClient from "./ProductsClient";

export default function ProductsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-foreground/40">Loading...</div>
      </div>
    }>
      <ProductsClient
        initialProducts={allProducts}
        initialTotal={allProducts.length}
        categories={categories}
        priceRanges={priceRanges}
        brands={brands}
      />
    </Suspense>
  );
}
