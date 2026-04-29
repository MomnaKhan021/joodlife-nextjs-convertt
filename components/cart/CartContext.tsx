"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

/**
 * Storefront cart state. Lives in React context + mirrored to
 * localStorage so the cart survives page reloads. Server doesn't
 * read it directly — checkout/orders is a separate flow.
 *
 * One CartItem represents (productId, dose) pair, so the same
 * product at two different dosages stacks as two rows.
 */
export type CartItem = {
  productId: number;
  slug: string;
  title: string;
  /** "5 mg" / "0.25 mg" — null if the product has no variants. */
  dose: string | null;
  price: number;
  quantity: number;
  imageUrl?: string | null;
};

type CartState = {
  items: CartItem[];
  drawerOpen: boolean;
};

type CartActions = {
  addItem: (item: Omit<CartItem, "quantity">, quantity?: number) => void;
  setQuantity: (productId: number, dose: string | null, quantity: number) => void;
  removeItem: (productId: number, dose: string | null) => void;
  clear: () => void;
  openDrawer: () => void;
  closeDrawer: () => void;
};

type CartDerived = {
  itemCount: number;
  subtotal: number;
};

type CartShape = CartState & CartActions & CartDerived;

const CartCtx = createContext<CartShape | null>(null);

const LS_KEY = "jood:cart:v1";

function sameRow(a: CartItem, productId: number, dose: string | null): boolean {
  return a.productId === productId && (a.dose ?? null) === (dose ?? null);
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Hydrate from localStorage on mount
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(LS_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as { items?: CartItem[] };
      if (Array.isArray(parsed?.items)) setItems(parsed.items);
    } catch {
      // ignore
    }
  }, []);

  // Mirror to localStorage on change
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(LS_KEY, JSON.stringify({ items }));
    } catch {
      // ignore
    }
  }, [items]);

  const addItem = useCallback<CartActions["addItem"]>(
    (input, quantity = 1) => {
      setItems((prev) => {
        const idx = prev.findIndex((p) =>
          sameRow(p, input.productId, input.dose ?? null)
        );
        if (idx >= 0) {
          const copy = [...prev];
          copy[idx] = { ...copy[idx], quantity: copy[idx].quantity + quantity };
          return copy;
        }
        return [...prev, { ...input, quantity }];
      });
    },
    []
  );

  const setQuantity = useCallback<CartActions["setQuantity"]>(
    (productId, dose, quantity) => {
      setItems((prev) =>
        prev
          .map((p) =>
            sameRow(p, productId, dose)
              ? { ...p, quantity: Math.max(0, quantity) }
              : p
          )
          .filter((p) => p.quantity > 0)
      );
    },
    []
  );

  const removeItem = useCallback<CartActions["removeItem"]>(
    (productId, dose) => {
      setItems((prev) => prev.filter((p) => !sameRow(p, productId, dose)));
    },
    []
  );

  const clear = useCallback(() => setItems([]), []);
  const openDrawer = useCallback(() => setDrawerOpen(true), []);
  const closeDrawer = useCallback(() => setDrawerOpen(false), []);

  const derived = useMemo<CartDerived>(() => {
    const itemCount = items.reduce((acc, p) => acc + p.quantity, 0);
    const subtotal =
      Math.round(
        items.reduce((acc, p) => acc + p.price * p.quantity, 0) * 100
      ) / 100;
    return { itemCount, subtotal };
  }, [items]);

  const value = useMemo<CartShape>(
    () => ({
      items,
      drawerOpen,
      addItem,
      setQuantity,
      removeItem,
      clear,
      openDrawer,
      closeDrawer,
      ...derived,
    }),
    [items, drawerOpen, addItem, setQuantity, removeItem, clear, openDrawer, closeDrawer, derived]
  );

  return <CartCtx.Provider value={value}>{children}</CartCtx.Provider>;
}

export function useCart(): CartShape {
  const ctx = useContext(CartCtx);
  if (!ctx) {
    throw new Error("useCart must be used inside <CartProvider />");
  }
  return ctx;
}
