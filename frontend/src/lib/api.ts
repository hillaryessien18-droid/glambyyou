import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios";
import type { Product, Category, Testimonial } from "./data";

export const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

const ACCESS_KEY = "glam-access";
const REFRESH_KEY = "glam-refresh";

// --- Token storage --------------------------------------------------------

export const tokens = {
  get access() {
    return typeof window === "undefined" ? null : localStorage.getItem(ACCESS_KEY);
  },
  get refresh() {
    return typeof window === "undefined" ? null : localStorage.getItem(REFRESH_KEY);
  },
  set(access: string, refresh?: string) {
    localStorage.setItem(ACCESS_KEY, access);
    if (refresh) localStorage.setItem(REFRESH_KEY, refresh);
  },
  clear() {
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
  },
};

// --- Axios instance with JWT handling --------------------------------------

export const api = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
  timeout: 20000,
});

api.interceptors.request.use((config) => {
  const access = tokens.access;
  if (access) config.headers.Authorization = `Bearer ${access}`;
  return config;
});

// Concurrent 401s share a single refresh request.
let refreshing: Promise<string> | null = null;

async function refreshAccessToken(): Promise<string> {
  const refresh = tokens.refresh;
  if (!refresh) throw new Error("No refresh token");
  const { data } = await axios.post<{ access: string; refresh?: string }>(`${API_URL}/auth/token/refresh/`, {
    refresh,
  });
  tokens.set(data.access, data.refresh);
  return data.access;
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined;
    const isAuthCall = original?.url?.startsWith("/auth/login") || original?.url?.startsWith("/auth/register");
    if (error.response?.status === 401 && original && !original._retry && !isAuthCall && tokens.refresh) {
      original._retry = true;
      try {
        refreshing ??= refreshAccessToken().finally(() => {
          refreshing = null;
        });
        const access = await refreshing;
        original.headers.Authorization = `Bearer ${access}`;
        return api(original);
      } catch {
        tokens.clear();
        window.dispatchEvent(new Event("glam:logout"));
      }
    }
    return Promise.reject(error);
  }
);

/** Turns a DRF error payload into one readable message. */
export function errorMessage(error: unknown, fallback = "Something went wrong. Please try again."): string {
  if (!axios.isAxiosError(error)) return fallback;
  if (!error.response) return "Can't reach the server. Check your connection and try again.";
  const data = error.response.data as Record<string, unknown> | undefined;
  if (!data || typeof data !== "object") return fallback;
  if (typeof data.detail === "string") return data.detail;
  for (const value of Object.values(data)) {
    if (typeof value === "string") return value;
    if (Array.isArray(value) && value.length) {
      const first = value[0];
      if (typeof first === "string") return first;
      if (first && typeof first === "object") return Object.values(first).flat().join(" ");
    }
    if (value && typeof value === "object") {
      const nested = Object.values(value).flat();
      if (typeof nested[0] === "string") return nested[0];
    }
  }
  return fallback;
}

// --- Types ----------------------------------------------------------------

export interface User {
  id: number;
  email: string;
  name: string;
  phone: string;
  dateJoined: string;
  isStaff: boolean;
}

export interface AuthResponse {
  user: User;
  access: string;
  refresh: string;
}

interface Paginated<T> {
  count: number;
  page: number;
  limit: number;
  totalPages: number;
  results: T[];
}

export interface ProductsResponse {
  products: Product[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface Review {
  id: number;
  rating: number;
  title: string;
  body: string;
  author: string;
  verifiedPurchase: boolean;
  createdAt: string;
}

export interface Address {
  id?: number;
  label: string;
  firstName: string;
  lastName: string;
  phone: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
}

export type ShippingDetails = Omit<Address, "id" | "label" | "isDefault">;

export interface CartLine {
  productId: string;
  quantity: number;
}

export interface Quote {
  subtotal: number;
  discount: number;
  shipping: number;
  tax: number;
  total: number;
  couponCode: string | null;
  freeShippingThreshold: number;
}

export interface OrderItem {
  productId: string | null;
  name: string;
  slug: string;
  image: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
}

export type OrderStatus = "pending" | "confirmed" | "shipped" | "delivered" | "cancelled";

export interface Order {
  orderNumber: string;
  email: string;
  status: OrderStatus;
  paymentStatus: "unpaid" | "paid" | "refunded";
  paymentMethod: "card" | "cash_on_delivery";
  couponCode: string;
  subtotal: number;
  discount: number;
  shippingCost: number;
  tax: number;
  total: number;
  trackingNumber: string;
  canCancel: boolean;
  createdAt: string;
  shipping: ShippingDetails;
  items: OrderItem[];
}

// --- Catalog --------------------------------------------------------------

export interface ProductQuery {
  category?: string;
  brand?: string;
  minPrice?: number;
  maxPrice?: number;
  skinType?: string;
  sort?: string;
  page?: number;
  limit?: number;
  sale?: boolean;
  bestSeller?: boolean;
  new?: boolean;
  search?: string;
}

export async function getProducts(params: ProductQuery = {}): Promise<ProductsResponse> {
  const { data } = await api.get<Paginated<Product>>("/products/", { params });
  return {
    products: data.results,
    total: data.count,
    page: data.page,
    limit: data.limit,
    totalPages: data.totalPages,
  };
}

export async function getProduct(slug: string): Promise<{ product: Product; related: Product[] }> {
  const [product, related] = await Promise.all([
    api.get<Product>(`/products/${slug}/`),
    api.get<Product[]>(`/products/${slug}/related/`),
  ]);
  return { product: product.data, related: related.data };
}

export async function getCategories(): Promise<Category[]> {
  return (await api.get<Category[]>("/categories/")).data;
}

export async function getBrands(): Promise<string[]> {
  return (await api.get<string[]>("/brands/")).data;
}

export async function getTestimonials(): Promise<Testimonial[]> {
  return (await api.get<Testimonial[]>("/testimonials/")).data;
}

export async function searchProducts(query: string, signal?: AbortSignal): Promise<Product[]> {
  const { data } = await api.get<Paginated<Product>>("/products/", { params: { search: query, limit: 10 }, signal });
  return data.results;
}

export async function getReviews(slug: string, page = 1): Promise<Paginated<Review>> {
  return (await api.get<Paginated<Review>>(`/products/${slug}/reviews/`, { params: { page } })).data;
}

export async function createReview(slug: string, review: { rating: number; title: string; body: string }): Promise<Review> {
  return (await api.post<Review>(`/products/${slug}/reviews/`, review)).data;
}

// --- Auth & account -------------------------------------------------------

export async function login(email: string, password: string): Promise<AuthResponse> {
  return (await api.post<AuthResponse>("/auth/login/", { email, password })).data;
}

export async function signup(name: string, email: string, password: string): Promise<AuthResponse> {
  return (await api.post<AuthResponse>("/auth/register/", { name, email, password })).data;
}

export async function logout(refresh: string): Promise<void> {
  await api.post("/auth/logout/", { refresh });
}

export async function getMe(): Promise<User> {
  return (await api.get<User>("/auth/me/")).data;
}

export async function updateMe(data: Partial<Pick<User, "name" | "phone">>): Promise<User> {
  return (await api.patch<User>("/auth/me/", data)).data;
}

export async function changePassword(currentPassword: string, newPassword: string): Promise<void> {
  await api.post("/auth/change-password/", { currentPassword, newPassword });
}

export async function getAddresses(): Promise<Address[]> {
  return (await api.get<Address[]>("/auth/addresses/")).data;
}

export async function saveAddress(address: Address): Promise<Address> {
  const { data } = address.id
    ? await api.put<Address>(`/auth/addresses/${address.id}/`, address)
    : await api.post<Address>("/auth/addresses/", address);
  return data;
}

export async function deleteAddress(id: number): Promise<void> {
  await api.delete(`/auth/addresses/${id}/`);
}

// --- Wishlist -------------------------------------------------------------

export async function getWishlist(): Promise<Product[]> {
  const { data } = await api.get<Array<{ product: Product }>>("/wishlist/");
  return data.map((item) => item.product);
}

export async function addToWishlist(productId: string): Promise<void> {
  await api.post("/wishlist/", { productId: Number(productId) });
}

export async function removeFromWishlist(productId: string): Promise<void> {
  await api.delete(`/wishlist/${productId}/`);
}

// --- Orders ---------------------------------------------------------------

const toLines = (items: CartLine[]) => items.map((i) => ({ productId: Number(i.productId), quantity: i.quantity }));

export async function getQuote(items: CartLine[], couponCode?: string): Promise<Quote> {
  return (await api.post<Quote>("/orders/quote/", { items: toLines(items), couponCode })).data;
}

export async function createOrder(order: {
  items: CartLine[];
  email: string;
  shipping: ShippingDetails;
  paymentMethod: "card" | "cash_on_delivery";
  couponCode?: string;
  notes?: string;
}): Promise<Order & { paymentUrl?: string }> {
  return (await api.post<Order & { paymentUrl?: string }>("/orders/", { ...order, items: toLines(order.items) })).data;
}

/** Confirms (or abandons) a Flutterwave payment after the shopper is redirected back. */
export async function verifyPayment(params: {
  orderNumber: string;
  email: string;
  transactionId?: string | null;
  status?: string | null;
}): Promise<Order> {
  const { orderNumber, email, transactionId, status } = params;
  return (
    await api.post<Order>("/orders/verify-payment/", {
      orderNumber,
      email,
      ...(transactionId ? { transactionId: Number(transactionId) } : {}),
      ...(status ? { status } : {}),
    })
  ).data;
}

export async function getOrders(page = 1): Promise<Paginated<Order>> {
  return (await api.get<Paginated<Order>>("/orders/", { params: { page } })).data;
}

export async function getOrder(orderNumber: string): Promise<Order> {
  return (await api.get<Order>(`/orders/${orderNumber}/`)).data;
}

export async function cancelOrder(orderNumber: string): Promise<Order> {
  return (await api.post<Order>(`/orders/${orderNumber}/cancel/`)).data;
}

export async function trackOrder(orderNumber: string, email: string): Promise<Order> {
  return (await api.get<Order>("/orders/track/", { params: { orderNumber, email } })).data;
}

// --- Marketing ------------------------------------------------------------

export async function subscribeNewsletter(email: string): Promise<{ message: string }> {
  return (await api.post<{ message: string }>("/newsletter/", { email })).data;
}

export async function sendContactMessage(message: {
  name: string;
  email: string;
  subject: string;
  message: string;
}): Promise<void> {
  await api.post("/contact/", message);
}
