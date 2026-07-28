import { testimonials } from "@/lib/data";
import { successResponse, errorResponse } from "@/lib/api-helpers";

export async function GET() {
  try {
    return successResponse(testimonials);
  } catch (error) {
    return errorResponse("Failed to fetch testimonials", 500);
  }
}
