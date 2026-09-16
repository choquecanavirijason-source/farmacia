"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { ICartItem } from "@/lib/types/marketplace";

const STORAGE_KEY = "marketplace_cart";

export interface CartContextType {
  items: ICartItem[];
  totalItems: number;
  totalPrice: number;
  addItem: (item: Omit<ICartItem, "quantity">, quantity?: number) => void;
  updateQuantity: (medicamentId: number, quantity: number) => void;
  removeItem: (medicamentId: number) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

function readStoredCart(): ICartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as ICartItem[]) : [];
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ICartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setItems(readStoredCart());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // Almacenamiento no disponible (modo privado, cuota llena, etc.) — el
      // carrito sigue funcionando en memoria durante la sesión.
    }
  }, [items, hydrated]);

  function addItem(item: Omit<ICartItem, "quantity">, quantity = 1) {
    setItems((prev) => {
      const existing = prev.find((i) => i.medicament_id === item.medicament_id);
      if (existing) {
        const newQuantity = Math.min(existing.quantity + quantity, item.max_stock);
        return prev.map((i) =>
          i.medicament_id === item.medicament_id ? { ...i, quantity: newQuantity } : i
        );
      }
      return [...prev, { ...item, quantity: Math.min(quantity, item.max_stock) }];
    });
  }

  function updateQuantity(medicamentId: number, quantity: number) {
    setItems((prev) =>
      prev
        .map((i) =>
          i.medicament_id === medicamentId
            ? { ...i, quantity: Math.max(1, Math.min(quantity, i.max_stock)) }
            : i
        )
        .filter((i) => i.quantity > 0)
    );
  }

  function removeItem(medicamentId: number) {
    setItems((prev) => prev.filter((i) => i.medicament_id !== medicamentId));
  }

  function clearCart() {
    setItems([]);
  }

  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);
  const totalPrice = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  return (
    <CartContext.Provider
      value={{ items, totalItems, totalPrice, addItem, updateQuantity, removeItem, clearCart }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextType {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart debe usarse dentro de un CartProvider");
  }
  return context;
}
