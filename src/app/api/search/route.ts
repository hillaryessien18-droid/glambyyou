import { NextRequest } from "next/server";
import { products } from "@/lib/data";
import { successResponse, errorResponse } from "@/lib/api-helpers";

export async function GET(request: NextRequest) {
  try {
    const query = request.nextUrl.searchParams.get("q") || "";
    if (!query.trim()) {
      return successResponse([]);
    }

    const q = query.toLowerCase();
    const results = products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.shortDescription.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q) ||
        (p.ingredients && p.ingredients.toLowerCase().includes(q))
    ).slice(0, 10);

    return successResponse(results);
  } catch (error) {
    return errorResponse("Search failed", 500);
  }
}
