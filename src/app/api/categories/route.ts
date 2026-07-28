import { categories, products } from "@/lib/data";
import { successResponse, errorResponse } from "@/lib/api-helpers";

export async function GET() {
  try {
    const categoriesWithCounts = categories.map((cat) => ({
      ...cat,
      itemCount: products.filter((p) => p.category === cat.slug).length,
    }));
    return successResponse(categoriesWithCounts);
  } catch (error) {
    return errorResponse("Failed to fetch categories", 500);
  }
}
