"use client";

import { createContext, useContext, useState, useEffect, useCallback, useMemo, type ReactNode } from "react";
import type { Product } from "./data";
import * as apiClient from "./api";
import { tokens, type AuthResponse, type User } from "./api";

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface Toast {
  id: number;
  message: string;
  kind: "success" | "error";
}

interface StoreContextType {
  cart: CartItem[];
  wishlist: string[];
  isCartOpen: boolean;
  isSearchOpen: boolean;
  isAuthenticated: boolean;
  authReady: boolean;
  user: User | null;
  toasts: Toast[];
  addToCart: (product: Product, quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  cartTotal: number;
  cartCount: number;
  toggleWishlist: (productId: string) => void;
  isInWishlist: (productId: string) => boolean;
  setCartOpen: (open: boolean) => void;
  setSearchOpen: (open: boolean) => void;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: User) => void;
  notify: (message: string, kind?: Toast["kind"]) => void;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

const MAX_PER_ITEM = 20;

function readJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function maxQuantity(product: Product) {
  return Math.min(MAX_PER_ITEM, product.stock ?? MAX_PER_ITEM);
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [isCartOpen, setCartOpen] = useState(false);
  const [isSearchOpen, setSearchOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const notify = useCallback((message: string, kind: Toast["kind"] = "success") => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, kind }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3500);
  }, []);

  // Restore cart, wishlist and session on first load.
  useEffect(() => {
    setCart(readJSON<CartItem[]>("glam-cart", []));
    setWishlist(readJSON<string[]>("glam-wishlist", []));
    setMounted(true);

    if (!tokens.access) {
      setAuthReady(true);
      return;
    }
    apiClient
      .getMe()
      .then(setUser)
      .catch(() => tokens.clear())
      .finally(() => setAuthReady(true));
  }, []);

  // The API client fires this when a refresh token is rejected.
  useEffect(() => {
    const onLogout = () => setUser(null);
    window.addEventListener("glam:logout", onLogout);
    return () => window.removeEventListener("glam:logout", onLogout);
  }, []);

  useEffect(() => {
    if (mounted) localStorage.setItem("glam-cart", JSON.stringify(cart));
  }, [cart, mounted]);

  useEffect(() => {
    if (mounted) localStorage.setItem("glam-wishlist", JSON.stringify(wishlist));
  }, [wishlist, mounted]);

  // Signed-in users keep their wishlist on the server; merge any local picks into it.
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      try {
        const remote = (await apiClient.getWishlist()).map((p) => p.id);
        const local = readJSON<string[]>("glam-wishlist", []);
        const missing = local.filter((id) => !remote.includes(id));
        await Promise.allSettled(missing.map((id) => apiClient.addToWishlist(id)));
        if (!cancelled) setWishlist([...remote, ...missing]);
      } catch {
        // Keep the local wishlist if the server is unreachable.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const addToCart = useCallback(
    (product: Product, quantity = 1) => {
      if (product.inStock === false) {
        notify(`${product.name} is out of stock`, "error");
        return;
      }
      setCart((prev) => {
        const existing = prev.find((item) => item.product.id === product.id);
        const limit = maxQuantity(product);
        if (existing) {
          return prev.map((item) =>
            item.product.id === product.id
              ? { ...item, product, quantity: Math.min(limit, item.quantity + quantity) }
              : item
          );
        }
        return [...prev, { product, quantity: Math.min(limit, quantity) }];
      });
      setCartOpen(true);
    },
    [notify]
  );

  const removeFromCart = useCallback((productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  }, []);

  const updateQuantity = useCallback(
    (productId: string, quantity: number) => {
      if (quantity <= 0) {
        removeFromCart(productId);
        return;
      }
      setCart((prev) =>
        prev.map((item) =>
          item.product.id === productId
            ? { ...item, quantity: Math.min(maxQuantity(item.product), quantity) }
            : item
        )
      );
    },
    [removeFromCart]
  );

  const clearCart = useCallback(() => {
    setCart([]);
  }, []);

  const cartTotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const toggleWishlist = useCallback(
    (productId: string) => {
      const adding = !wishlist.includes(productId);
      setWishlist((prev) => (adding ? [...prev, productId] : prev.filter((id) => id !== productId)));
      if (!user) return;
      const request = adding ? apiClient.addToWishlist(productId) : apiClient.removeFromWishlist(productId);
      request.catch(() => {
        // Roll back the optimistic update.
        setWishlist((prev) => (adding ? prev.filter((id) => id !== productId) : [...prev, productId]));
        notify("Couldn't update your wishlist", "error");
      });
    },
    [wishlist, user, notify]
  );

  const isInWishlist = useCallback((productId: string) => wishlist.includes(productId), [wishlist]);

  const startSession = useCallback((auth: AuthResponse) => {
    tokens.set(auth.access, auth.refresh);
    setUser(auth.user);
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      startSession(await apiClient.login(email, password));
    },
    [startSession]
  );

  const signup = useCallback(
    async (name: string, email: string, password: string) => {
      startSession(await apiClient.signup(name, email, password));
    },
    [startSession]
  );

  const logout = useCallback(async () => {
    const refresh = tokens.refresh;
    if (refresh) await apiClient.logout(refresh).catch(() => undefined);
    tokens.clear();
    setUser(null);
    setWishlist([]);
    notify("You've been signed out");
  }, [notify]);

  const value = useMemo(
    () => ({
      cart,
      wishlist,
      isCartOpen,
      isSearchOpen,
      isAuthenticated: user !== null,
      authReady,
      user,
      toasts,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      cartTotal,
      cartCount,
      toggleWishlist,
      isInWishlist,
      setCartOpen,
      setSearchOpen,
      login,
      signup,
      logout,
      setUser,
      notify,
    }),
    [
      cart, wishlist, isCartOpen, isSearchOpen, user, authReady, toasts, addToCart, removeFromCart,
      updateQuantity, clearCart, cartTotal, cartCount, toggleWishlist, isInWishlist, login, signup, logout, notify,
    ]
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const context = useContext(StoreContext);
  if (!context) throw new Error("useStore must be used within StoreProvider");
  return context;
}
