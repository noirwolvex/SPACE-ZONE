"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function PurchaseWebsiteButton({ websiteId }: { websiteId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handlePurchase() {
    if (loading) return;
    setLoading(true);

    try {
      const response = await fetch("/api/websites/buy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ websiteId }),
      });
      const result = await response.json().catch(() => ({}));

      if (response.status === 401 || result?.code === "AUTH_REQUIRED") {
        router.push(`/login?redirectTo=${encodeURIComponent(window.location.pathname)}`);
        return;
      }

      if (!response.ok) {
        window.alert(result?.error || result?.message || "Unable to start the purchase.");
        return;
      }

      if (result?.paymentUrl) {
        window.location.href = result.paymentUrl;
        return;
      }

      if (result?.alreadyOwned || result?.status === "owned") {
        router.push("/purchased-websites");
        return;
      }

      window.alert(result?.message || "Payment is required to complete the purchase.");
    } catch {
      window.alert("Unable to start the purchase right now. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handlePurchase}
      disabled={loading}
      className="rounded-full bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-[0_12px_30px_-14px_rgba(79,70,229,0.75)] transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {loading ? "Starting checkout…" : "Purchase website"}
    </button>
  );
}
