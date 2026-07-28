import { NextRequest } from "next/server";
import { successResponse, errorResponse } from "@/lib/api-helpers";
import { products } from "@/lib/data";

interface OrderItem {
  productId: string;
  quantity: number;
  price: number;
}

interface OrderRequest {
  items: OrderItem[];
  shipping: Record<string, string>;
  total: number;
}

// In-memory order store (in production, use a real database)
const orders: Array<{ id: string; data: OrderRequest; createdAt: string }> = [];

export async function POST(request: NextRequest) {
  try {
    const body: OrderRequest = await request.json();

    if (!body.items || body.items.length === 0) {
      return errorResponse("Order must contain at least one item");
    }

    if (!body.shipping || !body.shipping.address) {
      return errorResponse("Shipping information is required");
    }

    // Validate items exist
    for (const item of body.items) {
      const product = products.find((p) => p.id === item.productId);
      if (!product) {
        return errorResponse(`Product ${item.productId} not found`, 404);
      }
    }

    const orderId = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

    orders.push({
      id: orderId,
      data: body,
      createdAt: new Date().toISOString(),
    });

    return successResponse({
      orderId,
      message: "Order placed successfully!",
    });
  } catch (error) {
    return errorResponse("Failed to create order", 500);
  }
}
