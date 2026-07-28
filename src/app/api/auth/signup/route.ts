import { NextRequest } from "next/server";
import { successResponse, errorResponse } from "@/lib/api-helpers";
import { userStore } from "@/lib/user-store";

export async function POST(request: NextRequest) {
  try {
    const { name, email, password } = await request.json();

    if (!name || !email || !password) {
      return errorResponse("Name, email, and password are required");
    }

    if (password.length < 6) {
      return errorResponse("Password must be at least 6 characters");
    }

    const emailKey = email.toLowerCase();
    if (userStore.has(emailKey)) {
      return errorResponse("An account with this email already exists", 409);
    }

    userStore.set(emailKey, { name, email, password });

    const token = Buffer.from(`${email}:${Date.now()}`).toString("base64");

    return successResponse({
      user: { name, email },
      token,
    });
  } catch (error) {
    return errorResponse("Signup failed", 500);
  }
}
