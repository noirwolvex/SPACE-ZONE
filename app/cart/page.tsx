"use client";

import Link from "next/link";
import Image from "next/image";
import { Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { loadCartFromSupabase, readToolCart, removeToolFromCart, type CartItem } from "@/lib/cart";

export default function Cart() {
  const [items, setItems] = useState<CartItem[]>([]);

  const refreshCart = () => setItems(readToolCart());

  useEffect(() => {
    const loadCart = async () => {
      const nextItems = await loadCartFromSupabase();
      setItems(nextItems);
    };

    loadCart();

    const handleCartUpdate = () => {
      loadCart();
    };

    window.addEventListener("spacezone-cart-updated", handleCartUpdate);

    return () => {
      window.removeEventListener("spacezone-cart-updated", handleCartUpdate);
    };
  }, []);

  const handleRemove = async (slug: string, kind = "TOOL") => {
    removeToolFromCart(slug);
    try {
      await fetch(`/api/cart?kind=${encodeURIComponent(kind)}&slug=${encodeURIComponent(slug)}`, { method: "DELETE" });
    } catch {
      // Ignore delete sync issues.
    }
    refreshCart();
  };

  const handleCheckout = async () => {
    if (!items.length) return;

    try {
      const response = await fetch("/api/tools/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: items.map((item) => ({ toolId: item.id ?? item.slug, price: Number(item.priceLabel.replace(/[^\d.]/g, "")) || 0 })) }),
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        window.alert(result?.error || "Unable to start checkout.");
        return;
      }

      if (result?.paymentUrl) {
        window.location.href = result.paymentUrl;
        return;
      }

      if (result?.status === "payment_required") {
        window.alert(result.message || "Payment is required to complete your order.");
      }
    } catch {
      window.alert("Unable to start checkout right now. Please try again.");
    }
  };

  return (
    <main className="flex-1 flex flex-col pt-24 pb-16 bg-slate-50 dark:bg-[#050505] min-h-[90vh] text-slate-900 dark:text-white">
      <div className="container mx-auto px-4 max-w-5xl relative z-10">
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-8 drop-shadow-md text-center"># Shopping Cart</h1>

        {items.length === 0 ? (
          <div className="mt-8 text-center py-20 bg-white dark:bg-slate-900/40 backdrop-blur-md rounded-2xl border border-slate-200 dark:border-indigo-500/20 shadow-[0_0_15px_rgba(79,70,229,0.1)]">
            <p className="text-slate-600 dark:text-slate-300 font-medium mb-4">Your payload is empty.</p>
            <Link href="/tools" className="inline-flex rounded-lg bg-indigo-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-indigo-500 transition shadow-[0_0_15px_rgba(79,70,229,0.4)]">
              Explore Marketplace
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {items.map((item) => (
              <div key={item.slug} className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-indigo-500/20 dark:bg-slate-900/40 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-4">
                  <div className="relative h-20 w-20 overflow-hidden rounded-xl border border-slate-200 bg-slate-100 dark:border-indigo-500/20 dark:bg-slate-800">
                    <Image src={item.thumbnail} alt={item.name} fill className="object-cover" sizes="80px" />
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-700 dark:text-indigo-300">{item.category}</p>
                    <h2 className="mt-1 text-xl font-bold">{item.name}</h2>
                    <p className="text-sm text-slate-600 dark:text-slate-300">{item.priceLabel}</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleRemove(item.slug, item.kind ?? "TOOL")}
                  className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-100 dark:border-red-500/30 dark:bg-red-950/30 dark:text-red-300"
                >
                  <Trash2 className="h-4 w-4" />
                  Remove
                </button>
              </div>
            ))}

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={handleCheckout}
                className="rounded-lg bg-indigo-600 px-6 py-3 text-sm font-bold text-white hover:bg-indigo-500 shadow-[0_4px_15px_rgba(79,70,229,0.3)] transition"
              >
                Proceed to Checkout
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
