"use client";

import {
  createContext,
  useCallback,
  useContext,
  useState,
  useTransition,
} from "react";
import { toast } from "sonner";
import {
  addToCart,
  removeFromCart,
  updateLineQuantity,
} from "@/lib/cart";
import type { Cart } from "@/lib/types";

type CartContextValue = {
  cart: Cart;
  isPending: boolean;
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  addItem: (variantId: string, quantity?: number) => void;
  addItems: (variantIds: string[], quantityEach?: number) => void;
  updateItem: (lineId: string, quantity: number) => void;
  removeItem: (lineId: string) => void;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({
  initialCart,
  children,
}: {
  initialCart: Cart;
  children: React.ReactNode;
}) {
  const [cart, setCart] = useState<Cart>(initialCart);
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const openCart = useCallback(() => setIsOpen(true), []);
  const closeCart = useCallback(() => setIsOpen(false), []);

  const run = useCallback(
    (action: () => Promise<Cart>, onError: string) => {
      startTransition(async () => {
        try {
          setCart(await action());
        } catch (error) {
          console.error(error);
          toast.error(onError);
        }
      });
    },
    [],
  );

  const addItem = useCallback(
    (variantId: string, quantity = 1) => {
      run(() => addToCart(variantId, quantity), "Toevoegen aan winkelmand mislukt.");
      setIsOpen(true);
      toast.success("Toegevoegd aan je winkelmand");
    },
    [run],
  );

  const addItems = useCallback(
    (variantIds: string[], quantityEach = 1) => {
      if (variantIds.length === 0) return;
      run(async () => {
        let result: Cart | null = null;
        for (const id of variantIds) {
          result = await addToCart(id, quantityEach);
        }
        return result as Cart;
      }, "Bundel toevoegen mislukt.");
      setIsOpen(true);
      toast.success("Bundel toegevoegd aan je winkelmand");
    },
    [run],
  );

  const updateItem = useCallback(
    (lineId: string, quantity: number) => {
      run(
        () => updateLineQuantity(lineId, quantity),
        "Aantal aanpassen mislukt.",
      );
    },
    [run],
  );

  const removeItem = useCallback(
    (lineId: string) => {
      run(() => removeFromCart(lineId), "Verwijderen mislukt.");
    },
    [run],
  );

  return (
    <CartContext.Provider
      value={{
        cart,
        isPending,
        isOpen,
        openCart,
        closeCart,
        addItem,
        addItems,
        updateItem,
        removeItem,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart moet binnen een CartProvider gebruikt worden.");
  }
  return context;
}
