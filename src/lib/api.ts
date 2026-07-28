import type { Product, Category, Testimonial } from "./data";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "";

async function fetchAPI<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}/api${endpoint}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.error || "API request failed");
  return json.data as T;
}

export interface ProductsResponse {
  products: Product[];
  total: number;
  page: number;
  limit: number;
}

export async function getProducts(params?: {
  category?: string;
  brand?: string;
  minPrice?: number;
  maxPrice?: number;
  skinType?: string;
  sort?: string;
  page?: number;
  limit?: number;
  sale?: boolean;
  search?: string;
}): Promise<ProductsResponse> {
  const searchParams = new URLSearchParams();
  if (params?.category) searchParams.set("category", params.category);
  if (params?.brand) searchParams.set("brand", params.brand);
  if (params?.minPrice !== undefined) searchParams.set("minPrice", String(params.minPrice));
  if (params?.maxPrice !== undefined) searchParams.set("maxPrice", String(params.maxPrice));
  if (params?.skinType) searchParams.set("skinType", params.skinType);
  if (params?.sort) searchParams.set("sort", params.sort);
  if (params?.page) searchParams.set("page", String(params.page));
  if (params?.limit) searchParams.set("limit", String(params.limit));
  if (params?.sale) searchParams.set("sale", "true");
  if (params?.search) searchParams.set("search", params.search);
  const qs = searchParams.toString();
  return fetchAPI<ProductsResponse>(`/products${qs ? `?${qs}` : ""}`);
}

export interface ProductDetailResponse {
  product: Product;
  related: Product[];
}

export async function getProduct(slug: string): Promise<ProductDetailResponse> {
  return fetchAPI<ProductDetailResponse>(`/products/${slug}`);
}

export async function getCategories(): Promise<Category[]> {
  return fetchAPI<Category[]>("/categories");
}

export async function getTestimonials(): Promise<Testimonial[]> {
  return fetchAPI<Testimonial[]>("/testimonials");
}

export async function searchProducts(query: string): Promise<Product[]> {
  return fetchAPI<Product[]>(`/search?q=${encodeURIComponent(query)}`);
}

export async function login(email: string, password: string): Promise<{ user: { name: string; email: string }; token: string }> {
  return fetchAPI("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export async function signup(name: string, email: string, password: string): Promise<{ user: { name: string; email: string }; token: string }> {
  return fetchAPI("/auth/signup", {
    method: "POST",
    body: JSON.stringify({ name, email, password }),
  });
}

export async function subscribeNewsletter(email: string): Promise<{ message: string }> {
  return fetchAPI("/newsletter", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export async function createOrder(order: {
  items: Array<{ productId: string; quantity: number; price: number }>;
  shipping: Record<string, string>;
  total: number;
}): Promise<{ orderId: string }> {
  return fetchAPI("/orders", {
    method: "POST",
    body: JSON.stringify(order),
  });
}
