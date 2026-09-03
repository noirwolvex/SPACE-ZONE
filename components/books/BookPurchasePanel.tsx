"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BookOpen, Check, Download, Info, Lock, ShieldCheck, ShoppingCart, Zap } from "lucide-react";
import { formatBookPrice } from "@/lib/book-format";

interface BookPurchasePanelProps {
  bookId: string;
  title?: string;
  coverImageUrl?: string | null;
  isFree: boolean;
  isPurchased: boolean;
  isSignedIn: boolean;
  /** True for free books, owners, and admins — presentation only. */
  canRead: boolean;
  price: number | null;
  currency: string;
}

/**
 * Purchase / access actions for the details page.
 *
 * Read and Download always go through /api/books/[id]/access, which re-verifies
 * entitlement server-side and hands back a short-lived signed URL. Nothing here
 * ever receives or exposes a storage path.
 */
export default function BookPurchasePanel({
  bookId,
  title,
  coverImageUrl,
  isFree,
  isPurchased,
  isSignedIn,
  canRead,
  price,
  currency,
}: BookPurchasePanelProps) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [isBuying, setIsBuying] = useState(false);

  const accessUrl = `/api/books/${bookId}/access`;
  const redirectTo = `/books/${bookId}`;

  const handleBuyNow = async () => {
    if (!isSignedIn) {
      router.push(`/login?redirectTo=${encodeURIComponent(redirectTo)}`);
      return;
    }

    setIsBuying(true);
    setMessage(null);

    try {
      const response = await fetch("/api/books/buy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookId }),
      });

      const result = await response.json().catch(() => ({}));

      if (response.status === 401) {
        router.push(`/login?redirectTo=${encodeURIComponent(redirectTo)}`);
        return;
      }

      if (!response.ok && response.status !== 402) {
        throw new Error(result?.error || "Unable to start checkout.");
      }

      if (result?.alreadyOwned) {
        setMessage("You already own this book.");
        router.refresh();
        return;
      }

      // Hand off to the provider's hosted checkout. Ownership is granted by the
      // webhook afterwards, never by this redirect completing.
      if (typeof result?.paymentUrl === "string" && result.paymentUrl) {
        window.location.href = result.paymentUrl;
        return;
      }

      // Payment provider is not connected yet: a pending order was recorded and
      // access stays locked until the payment webhook confirms it.
      setMessage(result?.message || result?.error || "Checkout is not available yet. Your order was saved as pending.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to start checkout.");
    } finally {
      setIsBuying(false);
    }
  };

  const status = isFree
    ? { label: "Free to read", icon: Zap, className: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-200" }
    : isPurchased
      ? { label: "Purchased", icon: Check, className: "bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-200" }
      : { label: "Not purchased", icon: Lock, className: "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-200" };

  const StatusIcon = status.icon;

  return (
    <div className="relative overflow-hidden rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_24px_70px_-45px_rgba(15,23,42,0.55)] transition-shadow duration-500 hover:shadow-[0_30px_80px_-40px_rgba(79,70,229,0.4)] dark:border-indigo-500/20 dark:bg-slate-900/80">
      {/* Accent hairline along the top edge. */}
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-1 bg-linear-to-r from-indigo-500 via-violet-500 to-indigo-500"
      />

      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-slate-400">Price</p>
          <span className="mt-1 block text-4xl font-black tracking-tight text-slate-950 dark:text-white">
            {formatBookPrice(price, currency)}
          </span>
        </div>

        <span
          className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold ${status.className}`}
        >
          <StatusIcon className="h-3.5 w-3.5" />
          {status.label}
        </span>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        {canRead ? (
          <>
            <a
              href={`${accessUrl}?mode=read`}
              target="_blank"
              rel="noreferrer"
              className="group inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-slate-950 px-5 py-3.5 text-sm font-bold text-white shadow-lg transition-all duration-300 hover:-translate-y-0.5 hover:bg-indigo-600 hover:shadow-indigo-500/30 dark:bg-white dark:text-slate-950 dark:hover:bg-indigo-500 dark:hover:text-white"
            >
              <BookOpen className="h-4 w-4 transition-transform duration-300 group-hover:scale-110" />
              Read
            </a>
            <a
              href={`${accessUrl}?mode=download`}
              className="group inline-flex flex-1 items-center justify-center gap-2 rounded-full border border-slate-300 px-5 py-3.5 text-sm font-bold text-slate-700 transition-all duration-300 hover:-translate-y-0.5 hover:border-indigo-400 hover:bg-slate-50 hover:text-indigo-700 dark:border-slate-700 dark:text-slate-200 dark:hover:border-indigo-500/60 dark:hover:bg-slate-800"
            >
              <Download className="h-4 w-4 transition-transform duration-300 group-hover:translate-y-0.5" />
              Download
            </a>
          </>
        ) : (
          <button
            type="button"
            onClick={handleBuyNow}
            disabled={isBuying}
            className="group inline-flex w-full items-center justify-center gap-2 rounded-full bg-linear-to-r from-indigo-600 to-violet-600 px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-indigo-500/25 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-indigo-500/35 disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0"
          >
            <ShoppingCart className="h-4 w-4 transition-transform duration-300 group-hover:scale-110" />
            {isBuying ? "Processing…" : isSignedIn ? "Buy Now" : "Sign in to buy"}
          </button>
        )}
      </div>

      <ul className="mt-5 grid gap-2 border-t border-slate-200 pt-5 dark:border-slate-800">
        {[
          { icon: ShieldCheck, text: "Secure, authorized access on every read" },
          { icon: Zap, text: canRead ? "Instant access — read online or download" : "Instant access after purchase" },
        ].map((item) => (
          <li key={item.text} className="flex items-center gap-2.5 text-xs font-medium text-slate-500 dark:text-slate-400">
            <item.icon className="h-3.5 w-3.5 shrink-0 text-indigo-500 dark:text-indigo-400" />
            {item.text}
          </li>
        ))}
      </ul>

      {message ? (
        <p className="animate-scale-in mt-4 flex items-start gap-2.5 rounded-2xl border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm font-medium text-indigo-900 dark:border-indigo-500/30 dark:bg-indigo-950/40 dark:text-indigo-100">
          <Info className="mt-0.5 h-4 w-4 shrink-0" />
          {message}
        </p>
      ) : null}
    </div>
  );
}
