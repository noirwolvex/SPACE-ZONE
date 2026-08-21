import { supabase } from "@/lib/supabase";

export type CartItem = {
  id?: string;
  kind?: string;
  slug: string;
  name: string;
  category: string;
  priceLabel: string;
  thumbnail: string;
};

export const CART_STORAGE_KEY = "spacezone-tools-cart";
const CART_USER_ID_KEY = "spacezone-current-user-id";

export function getCartStorageKeyForUser(userId?: string | null): string {
  return userId ? `${CART_STORAGE_KEY}:user:${userId}` : `${CART_STORAGE_KEY}:guest`;
}

export function getActiveCartStorageKey(): string {
  if (typeof window === "undefined") return getCartStorageKeyForUser();

  const savedUserId = window.localStorage.getItem(CART_USER_ID_KEY);
  return getCartStorageKeyForUser(savedUserId || null);
}

export function syncCartKeyForCurrentUser(userId?: string | null) {
  if (typeof window === "undefined") return;

  if (userId) {
    window.localStorage.setItem(CART_USER_ID_KEY, userId);
    return;
  }

  window.localStorage.removeItem(CART_USER_ID_KEY);
}

export async function syncCartToSupabase(items: CartItem[]) {
  if (typeof window === "undefined" || !items.length) return;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  try {
    await Promise.all(
      items.map((item) =>
        fetch("/api/cart", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            kind: item.kind ?? "TOOL",
            slug: item.slug,
            name: item.name,
            category: item.category,
            priceLabel: item.priceLabel,
            thumbnail: item.thumbnail,
          }),
        })
      )
    );
  } catch {
    // Ignore sync failures; the cart stays available in local storage as fallback.
  }
}

async function persistCartItemToSupabase(item: CartItem, mode: "create" | "delete") {
  if (typeof window === "undefined") return;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  try {
    if (mode === "create") {
      await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: item.kind ?? "TOOL",
          slug: item.slug,
          name: item.name,
          category: item.category,
          priceLabel: item.priceLabel,
          thumbnail: item.thumbnail,
        }),
      });
      return;
    }

    await fetch(`/api/cart?kind=${encodeURIComponent(item.kind ?? "TOOL")}&slug=${encodeURIComponent(item.slug)}`, {
      method: "DELETE",
    });
  } catch {
    // Ignore server-side cart sync failures.
  }
}

export async function loadCartFromSupabase(): Promise<CartItem[]> {
  try {
    const response = await fetch("/api/cart", { cache: "no-store" });
    if (!response.ok) return readToolCart();

    const data = await response.json();
    const apiItems = Array.isArray(data?.items) ? data.items : [];

    if (apiItems.length) {
      const mapped = apiItems.map((item: any) => ({
        id: item.id,
        kind: item.kind,
        slug: item.slug,
        name: item.name,
        category: item.category,
        priceLabel: item.priceLabel,
        thumbnail: item.thumbnail ?? "",
      }));

      if (typeof window !== "undefined") {
        const cartKey = getActiveCartStorageKey();
        window.localStorage.setItem(cartKey, JSON.stringify(mapped));
      }

      return mapped;
    }

    return readToolCart();
  } catch {
    return readToolCart();
  }
}

function isCartItem(value: unknown): value is CartItem {
  if (!value || typeof value !== "object") return false;

  const item = value as Record<string, unknown>;

  return (
    typeof item.slug === "string" &&
    typeof item.name === "string" &&
    typeof item.category === "string" &&
    typeof item.priceLabel === "string" &&
    typeof item.thumbnail === "string"
  );
}

export function readToolCart(): CartItem[] {
  if (typeof window === "undefined") return [];

  try {
    const key = getActiveCartStorageKey();
    const raw = window.localStorage.getItem(key);
    if (!raw) return [];

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed.filter(isCartItem);
  } catch {
    return [];
  }
}

export function addToolToCart(item: CartItem): CartItem[] {
  if (typeof window === "undefined") return [item];

  const current = readToolCart();
  const next = [item, ...current.filter((existing) => existing.slug !== item.slug)];

  const cartKey = getActiveCartStorageKey();
  window.localStorage.setItem(cartKey, JSON.stringify(next));
  void persistCartItemToSupabase(item, "create");
  window.dispatchEvent(new CustomEvent("spacezone-cart-updated"));

  return next;
}

export function removeToolFromCart(slug: string): CartItem[] {
  if (typeof window === "undefined") return [];

  const current = readToolCart();
  const next = current.filter((item) => item.slug !== slug);

  const cartKey = getActiveCartStorageKey();
  window.localStorage.setItem(cartKey, JSON.stringify(next));

  const itemToDelete = current.find((item) => item.slug === slug);
  if (itemToDelete) {
    void persistCartItemToSupabase(itemToDelete, "delete");
  }

  window.dispatchEvent(new CustomEvent("spacezone-cart-updated"));

  return next;
}

export function getToolCartCount(): number {
  return readToolCart().length;
}
