import { NextRequest } from "next/server";
import { successResponse, errorResponse } from "@/lib/api-helpers";
import { userStore } from "@/lib/user-store";

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return errorResponse("Email and password are required");
    }

    const user = userStore.get(email.toLowerCase());
    if (!user || user.password !== password) {
      return errorResponse("Invalid email or password", 401);
    }

    const token = Buffer.from(`${user.email}:${Date.now()}`).toString("base64");

    return successResponse({
      user: { name: user.name, email: user.email },
      token,
    });
  } catch (error) {
    return errorResponse("Login failed", 500);
  }
}
