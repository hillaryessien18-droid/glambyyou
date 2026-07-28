import { NextRequest } from "next/server";
import { products } from "@/lib/data";
import { successResponse, errorResponse, parsePagination } from "@/lib/api-helpers";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const { page, limit, sort, skip } = parsePagination(searchParams);

    let filtered = [...products];

    const category = searchParams.get("category");
    if (category) {
      filtered = filtered.filter((p) => p.category === category);
    }

    const brand = searchParams.get("brand");
    if (brand) {
      filtered = filtered.filter((p) => p.brand.toLowerCase() === brand.toLowerCase());
    }

    const minPrice = searchParams.get("minPrice");
    const maxPrice = searchParams.get("maxPrice");
    if (minPrice) filtered = filtered.filter((p) => p.price >= Number(minPrice));
    if (maxPrice) filtered = filtered.filter((p) => p.price <= Number(maxPrice));

    const skinType = searchParams.get("skinType");
    if (skinType) {
      filtered = filtered.filter(
        (p) => p.skinType && p.skinType.some((s) => s.toLowerCase().includes(skinType.toLowerCase()))
      );
    }

    const sale = searchParams.get("sale");
    if (sale === "true") {
      filtered = filtered.filter((p) => p.isOnSale);
    }

    const search = searchParams.get("search");
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.shortDescription.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q) ||
          p.brand.toLowerCase().includes(q)
      );
    }

    switch (sort) {
      case "price-low":
        filtered.sort((a, b) => a.price - b.price);
        break;
      case "price-high":
        filtered.sort((a, b) => b.price - a.price);
        break;
      case "rating":
        filtered.sort((a, b) => b.rating - a.rating);
        break;
      case "newest":
        filtered.sort((a, b) => (a.isNew === b.isNew ? 0 : a.isNew ? -1 : 1));
        break;
      default:
        break;
    }

    const total = filtered.length;
    const paginated = filtered.slice(skip, skip + limit);

    return successResponse({
      products: paginated,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    return errorResponse("Failed to fetch products", 500);
  }
}
