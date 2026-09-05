import { useSyncExternalStore } from "react";

export type CartItem = {
  product_id: string;
  variant_id: string;
  name: string;
  image: string | null;
  size: string;
  color: string;
  price: number;
  quantity: number;
  stock: number;
};

const KEY = "mv-carrinho";
const listeners = new Set<() => void>();
let cache: CartItem[] = [];
let cacheRaw = "";

function read(): CartItem[] {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(KEY) ?? "[]";
  if (raw !== cacheRaw) {
    cacheRaw = raw;
    try {
      const parsed = JSON.parse(raw);
      cache = Array.isArray(parsed) ? parsed : [];
    } catch {
      cache = [];
    }
  }
  return cache;
}

function write(items: CartItem[]) {
  cacheRaw = JSON.stringify(items);
  cache = items;
  window.localStorage.setItem(KEY, cacheRaw);
  listeners.forEach((l) => l());
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  window.addEventListener("storage", cb);
  return () => {
    listeners.delete(cb);
    window.removeEventListener("storage", cb);
  };
}

const EMPTY: CartItem[] = [];

export function useCart(): CartItem[] {
  return useSyncExternalStore(
    subscribe,
    () => read(),
    () => EMPTY,
  );
}

export const cart = {
  items: read,
  add(item: CartItem) {
    const items = [...read()];
    const found = items.find((i) => i.variant_id === item.variant_id);
    if (found) {
      found.quantity = Math.min(item.stock, found.quantity + item.quantity);
      found.stock = item.stock;
      found.price = item.price;
      found.image = item.image;
    } else {
      items.push({ ...item, quantity: Math.min(item.stock, item.quantity) });
    }
    write(items);
  },
  setQuantity(variantId: string, quantity: number) {
    const items = read().map((i) =>
      i.variant_id === variantId
        ? { ...i, quantity: Math.max(1, Math.min(i.stock, quantity)) }
        : i,
    );
    write(items);
  },
  remove(variantId: string) {
    write(read().filter((i) => i.variant_id !== variantId));
  },
  clear() {
    write([]);
  },
};

export function cartTotal(items: CartItem[]) {
  return items.reduce((s, i) => s + i.price * i.quantity, 0);
}

export function cartCount(items: CartItem[]) {
  return items.reduce((s, i) => s + i.quantity, 0);
}
