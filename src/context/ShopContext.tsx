"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useDealer } from "@/context/DealerContext";
import {
  cartItemKey,
  type CartItem,
  type FavoriteItem,
  type ShopDrawer,
} from "@/lib/shopTypes";

const CART_KEY = "hq_cart_v1";
const FAV_KEY = "hq_favorites_v1";

type AddCartInput = Omit<CartItem, "key" | "quantity"> & {
  quantity?: number;
};

type ShopContextValue = {
  cart: CartItem[];
  favorites: FavoriteItem[];
  drawer: ShopDrawer;
  hydrated: boolean;
  cartCount: number;
  favoritesCount: number;
  cartSubtotal: number;
  openDrawer: (drawer: ShopDrawer) => void;
  closeDrawer: () => void;
  addToCart: (item: AddCartInput, opts?: { open?: boolean }) => void;
  updateQty: (key: string, quantity: number) => void;
  removeFromCart: (key: string) => void;
  clearCart: () => void;
  toggleFavorite: (item: FavoriteItem) => void;
  isFavorite: (productId: string) => boolean;
  removeFavorite: (productId: string) => void;
  clearFavorites: () => void;
  moveFavoriteToCart: (productId: string) => void;
  moveAllFavoritesToCart: () => void;
};

const ShopContext = createContext<ShopContextValue | null>(null);

function readStorage<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function ShopProvider({ children }: { children: ReactNode }) {
  const { isReseller, loading: dealerLoading } = useDealer();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [drawer, setDrawer] = useState<ShopDrawer>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setCart(readStorage<CartItem[]>(CART_KEY, []));
    setFavorites(readStorage<FavoriteItem[]>(FAV_KEY, []));
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(CART_KEY, JSON.stringify(cart));
  }, [cart, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(FAV_KEY, JSON.stringify(favorites));
  }, [favorites, hydrated]);

  /** CPF / visitante não mantém preço, mínimo nem modo de atacado no carrinho. */
  useEffect(() => {
    if (!hydrated || dealerLoading || isReseller) return;
    setCart((prev) => {
      let changed = false;
      const next = prev.map((item) => {
        if (item.mode !== "wholesale") return item;
        changed = true;
        return {
          ...item,
          mode: "retail" as const,
          unitPrice: item.retailUnitPrice ?? item.unitPrice,
          minQty: 1,
        };
      });
      return changed ? next : prev;
    });
  }, [hydrated, dealerLoading, isReseller]);

  const openDrawer = useCallback((next: ShopDrawer) => setDrawer(next), []);
  const closeDrawer = useCallback(() => setDrawer(null), []);

  const addToCart = useCallback(
    (item: AddCartInput, opts?: { open?: boolean }) => {
      // Bloqueia modo atacado se a sessão não for de revendedor
      const safe: AddCartInput =
        item.mode === "wholesale" && !isReseller
          ? {
              ...item,
              mode: "retail",
              unitPrice: item.retailUnitPrice ?? item.unitPrice,
              minQty: 1,
            }
          : item;

      const key = cartItemKey(safe);
      const floor = safe.minQty && safe.minQty > 1 ? safe.minQty : 1;
      const qty = Math.max(floor, safe.quantity ?? floor);
      setCart((prev) => {
        const existing = prev.find((p) => p.key === key);
        if (existing) {
          return prev.map((p) =>
            p.key === key
              ? {
                  ...p,
                  ...safe,
                  key,
                  quantity: p.quantity + qty,
                  minQty: safe.minQty ?? p.minQty,
                }
              : p,
          );
        }
        return [...prev, { ...safe, key, quantity: qty }];
      });
      if (opts?.open !== false) setDrawer("cart");
    },
    [isReseller],
  );

  const updateQty = useCallback((key: string, quantity: number) => {
    setCart((prev) => {
      const item = prev.find((p) => p.key === key);
      if (!item) return prev;
      const floor = item.minQty && item.minQty > 1 ? item.minQty : 1;
      if (quantity < floor) {
        return prev.filter((p) => p.key !== key);
      }
      return prev.map((p) => (p.key === key ? { ...p, quantity } : p));
    });
  }, []);

  const removeFromCart = useCallback((key: string) => {
    setCart((prev) => prev.filter((p) => p.key !== key));
  }, []);

  const clearCart = useCallback(() => setCart([]), []);

  const toggleFavorite = useCallback(
    (item: FavoriteItem) => {
      const exists = favorites.some((f) => f.productId === item.productId);
      if (exists) {
        setFavorites((prev) =>
          prev.filter((f) => f.productId !== item.productId),
        );
        return;
      }
      setFavorites((prev) => [...prev, item]);
      setDrawer("favorites");
    },
    [favorites],
  );

  const isFavorite = useCallback(
    (productId: string) => favorites.some((f) => f.productId === productId),
    [favorites],
  );

  const removeFavorite = useCallback((productId: string) => {
    setFavorites((prev) => prev.filter((f) => f.productId !== productId));
  }, []);

  const clearFavorites = useCallback(() => setFavorites([]), []);

  const moveFavoriteToCart = useCallback(
    (productId: string) => {
      const fav = favorites.find((f) => f.productId === productId);
      if (!fav) return;
      addToCart(
        {
          productId: fav.productId,
          name: fav.name,
          image: fav.image,
          unitPrice: fav.price,
          size: fav.sizeLabel,
          category: fav.category,
        },
        { open: true },
      );
      removeFavorite(productId);
    },
    [addToCart, favorites, removeFavorite],
  );

  const moveAllFavoritesToCart = useCallback(() => {
    favorites.forEach((fav) => {
      addToCart(
        {
          productId: fav.productId,
          name: fav.name,
          image: fav.image,
          unitPrice: fav.price,
          size: fav.sizeLabel,
          category: fav.category,
        },
        { open: false },
      );
    });
    setFavorites([]);
    setDrawer("cart");
  }, [addToCart, favorites]);

  const cartCount = useMemo(
    () => cart.reduce((sum, i) => sum + i.quantity, 0),
    [cart],
  );
  const favoritesCount = favorites.length;
  const cartSubtotal = useMemo(
    () => cart.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0),
    [cart],
  );

  const value = useMemo<ShopContextValue>(
    () => ({
      cart,
      favorites,
      drawer,
      hydrated,
      cartCount,
      favoritesCount,
      cartSubtotal,
      openDrawer,
      closeDrawer,
      addToCart,
      updateQty,
      removeFromCart,
      clearCart,
      toggleFavorite,
      isFavorite,
      removeFavorite,
      clearFavorites,
      moveFavoriteToCart,
      moveAllFavoritesToCart,
    }),
    [
      cart,
      favorites,
      drawer,
      hydrated,
      cartCount,
      favoritesCount,
      cartSubtotal,
      openDrawer,
      closeDrawer,
      addToCart,
      updateQty,
      removeFromCart,
      clearCart,
      toggleFavorite,
      isFavorite,
      removeFavorite,
      clearFavorites,
      moveFavoriteToCart,
      moveAllFavoritesToCart,
    ],
  );

  return <ShopContext.Provider value={value}>{children}</ShopContext.Provider>;
}

export function useShop() {
  const ctx = useContext(ShopContext);
  if (!ctx) throw new Error("useShop must be used within ShopProvider");
  return ctx;
}
