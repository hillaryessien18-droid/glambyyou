import { NextRequest } from "next/server";
import { products } from "@/lib/data";
import { successResponse, errorResponse } from "@/lib/api-helpers";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const product = products.find((p) => p.slug === slug);

    if (!product) {
      return errorResponse("Product not found", 404);
    }

    const related = products.filter(
      (p) => p.category === product.category && p.id !== product.id
    ).slice(0, 4);

    return successResponse({ product, related });
  } catch (error) {
    return errorResponse("Failed to fetch product", 500);
  }
}
