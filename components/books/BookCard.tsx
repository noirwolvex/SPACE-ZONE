import Link from "next/link";
import { ArrowRight, BookOpen, Check, Sparkles } from "lucide-react";
import { ageGroupLabel } from "@/lib/book-filters";
import { formatBookPrice } from "@/lib/book-format";
import type { BookWithAccess } from "@/lib/book-types";

interface BookCardProps {
  book: BookWithAccess;
}

/** Status pill styling, kept in one place so the three states stay consistent. */
function statusBadge(book: BookWithAccess) {
  if (book.isFree) {
    return { label: "Free", icon: Sparkles, className: "bg-emerald-500/95 ring-emerald-300/40" };
  }
  if (book.isPurchased) {
    return { label: "Owned", icon: Check, className: "bg-indigo-500/95 ring-indigo-300/40" };
  }
  return { label: "Paid", icon: BookOpen, className: "bg-amber-500/95 ring-amber-300/40" };
}

/**
 * Storefront card. The entire card is a single link to the details page — the
 * PDF is never opened from here, so no file location or action button appears
 * in the listing.
 */
export default function BookCard({ book }: BookCardProps) {
  const badge = statusBadge(book);
  const BadgeIcon = badge.icon;
  const title = book.title ?? book.filename ?? "Untitled book";

  return (
    <Link
      href={`/books/${book.id}`}
      aria-label={`View details for ${title}`}
      className="group relative flex h-full flex-col overflow-hidden rounded-[26px] border border-slate-200/90 bg-white shadow-[0_18px_50px_-32px_rgba(15,23,42,0.5)] transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-2 hover:border-indigo-300 hover:shadow-[0_36px_80px_-32px_rgba(79,70,229,0.45)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 dark:border-slate-800 dark:bg-slate-900/70 dark:hover:border-indigo-500/50 dark:focus-visible:ring-offset-slate-950"
    >
      {/* Cover ------------------------------------------------------------ */}
      <div className="shine-on-hover relative aspect-16/11 overflow-hidden">
        {book.coverImageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={book.coverImageUrl}
            alt=""
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-110"
          />
        ) : (
          <div className="relative flex h-full items-center justify-center bg-linear-to-br from-indigo-600 via-violet-600 to-slate-900">
            <div className="absolute inset-0 opacity-40 [background-image:radial-gradient(circle_at_25%_20%,rgba(255,255,255,0.35),transparent_45%)]" />
            <BookOpen className="h-12 w-12 text-white/70 transition-transform duration-700 group-hover:scale-110" />
          </div>
        )}

        <div className="absolute inset-0 bg-linear-to-t from-slate-950/85 via-slate-950/15 to-transparent" />

        <span
          className={`absolute right-3 top-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold text-white shadow-lg ring-1 backdrop-blur transition-transform duration-500 group-hover:scale-105 ${badge.className}`}
        >
          <BadgeIcon className="h-3.5 w-3.5" />
          {badge.label}
        </span>

        <div className="absolute inset-x-4 bottom-3 flex items-center gap-2">
          <span className="truncate rounded-full bg-white/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-white backdrop-blur-md">
            {book.category ?? "Story"}
          </span>
          <span className="ml-auto shrink-0 rounded-full bg-slate-950/55 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur-md">
            {book.targetAge ?? ageGroupLabel(book.ageGroup) ?? "All ages"}
          </span>
        </div>
      </div>

      {/* Body ------------------------------------------------------------- */}
      <div className="flex flex-1 flex-col p-5 sm:p-6">
        <h2 className="text-lg font-bold leading-snug text-slate-950 transition-colors duration-300 group-hover:text-indigo-600 sm:text-xl dark:text-white dark:group-hover:text-indigo-300">
          {title}
        </h2>

        <p className="mt-1 text-sm font-medium text-slate-500 dark:text-slate-400">
          {book.author ? `by ${book.author}` : "Space Zone Library"}
        </p>

        <p className="mt-3 line-clamp-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
          {book.summary ?? "A delightful book from the Space Zone library."}
        </p>

        {/* Footer pinned to the bottom so cards align on a mixed-height row. */}
        <div className="mt-auto flex items-center justify-between gap-3 pt-5">
          <span className="text-lg font-black tracking-tight text-slate-950 dark:text-white">
            {formatBookPrice(book.price, book.currency)}
          </span>

          <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3.5 py-2 text-xs font-bold text-slate-700 transition-all duration-300 group-hover:bg-indigo-600 group-hover:text-white dark:bg-slate-800 dark:text-slate-200 dark:group-hover:bg-indigo-500">
            View details
            <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-0.5" />
          </span>
        </div>
      </div>
    </Link>
  );
}
