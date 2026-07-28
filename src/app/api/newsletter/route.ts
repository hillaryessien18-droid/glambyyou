import { NextRequest } from "next/server";
import { successResponse, errorResponse } from "@/lib/api-helpers";

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return errorResponse("A valid email address is required");
    }

    // In production, save to database or email service
    console.log(`Newsletter subscription: ${email}`);

    return successResponse({
      message: "Successfully subscribed to the newsletter!",
    });
  } catch (error) {
    return errorResponse("Failed to subscribe", 500);
  }
}
