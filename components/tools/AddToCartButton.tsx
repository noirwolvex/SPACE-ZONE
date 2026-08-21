"use client";

import { ShoppingCart, Lock } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { addToolToCart, readToolCart } from "@/lib/cart";
import { useAuth } from "@/components/auth/AuthProvider";

type ToolSummary = {
  slug: string;
  name: string;
  category: string;
  priceLabel: string;
  thumbnail: string;
};

export function AddToCartButton({ tool }: { tool: ToolSummary }) {
  const router = useRouter();
  const { user } = useAuth(); // ✅ Get auth state
  const [isAdded, setIsAdded] = useState(false);

  useEffect(() => {
    const exists = readToolCart().some((item) => item.slug === tool.slug);
    setIsAdded(exists);
  }, [tool.slug]);

  const handleAddToCart = () => {
    // ✅ Require authentication
    if (!user) {
      router.push("/login?redirectTo=/tools");
      return;
    }

    addToolToCart({
      slug: tool.slug,
      name: tool.name,
      category: tool.category,
      priceLabel: tool.priceLabel,
      thumbnail: tool.thumbnail,
    });
    setIsAdded(true);
  };

  // ✅ Show lock icon if not authenticated
  const isDisabled = isAdded || !user;

  return (
    <button
      type="button"
      onClick={handleAddToCart}
      className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-[0_4px_15px_rgba(79,70,229,0.2)] transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:bg-indigo-400 dark:shadow-[0_0_15px_rgba(79,70,229,0.3)]"
      disabled={isDisabled}
      title={!user ? "Sign in required to add tools to cart" : isAdded ? "Already in cart" : "Add to cart"}
    >
      {!user ? <Lock className="h-4 w-4" /> : <ShoppingCart className="h-4 w-4" />}
      {!user ? "Sign in to Add" : isAdded ? "Added to Cart" : "Add to Cart"}
    </button>
  );
}
