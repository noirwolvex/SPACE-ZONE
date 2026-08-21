"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Search, SlidersHorizontal, X } from "lucide-react";
import {
  AGE_GROUPS,
  PRICE_FILTERS,
  SORT_OPTIONS,
  buildBooksQueryString,
  hasActiveFilters,
  ageGroupLabel,
  DEFAULT_FILTERS,
  type AgeGroupValue,
  type BookFilters,
  type PriceFilter,
  type SortValue,
} from "@/lib/book-filters";

export interface CategoryOption {
  value: string;
  count: number;
}

interface BookFiltersPanelProps {
  /** Already parsed and validated on the server. */
  filters: BookFilters;
  /** Categories present in the catalogue, so no chip can return zero results. */
  categories: CategoryOption[];
  resultCount: number;
}

const chipBase =
  "rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] disabled:cursor-not-allowed";
const chipIdle =
  "border-slate-200 bg-white text-slate-700 hover:-translate-y-0.5 hover:border-indigo-300 hover:text-indigo-700 hover:shadow-sm dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300 dark:hover:border-indigo-500/50 dark:hover:text-indigo-200";
const chipActive =
  "border-indigo-500 bg-indigo-600 text-white shadow-md shadow-indigo-500/25 hover:-translate-y-0.5 hover:bg-indigo-500 dark:border-indigo-400 dark:bg-indigo-500";

export default function BookFiltersPanel({ filters, categories, resultCount }: BookFiltersPanelProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [query, setQuery] = useState(filters.q);
  const [syncedQuery, setSyncedQuery] = useState(filters.q);

  // Re-sync when navigation changes the URL from outside this input (back
  // button, "Clear all", a shared link). Adjusting during render rather than in
  // an effect avoids a cascading second render — and keeps focus while typing,
  // which remounting via `key` would not.
  if (filters.q !== syncedQuery) {
    setSyncedQuery(filters.q);
    setQuery(filters.q);
  }

  // Debounce typing so a keystroke does not become a database round trip.
  useEffect(() => {
    if (query === filters.q) return;

    const timer = setTimeout(() => {
      const next = buildBooksQueryString({ ...filters, q: query });
      startTransition(() => router.push(`/books${next}`, { scroll: false }));
    }, 350);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  function apply(patch: Partial<BookFilters>) {
    const next = buildBooksQueryString({ ...filters, ...patch });
    startTransition(() => router.push(`/books${next}`, { scroll: false }));
  }

  function toggleCategory(value: string) {
    apply({
      categories: filters.categories.includes(value)
        ? filters.categories.filter((entry) => entry !== value)
        : [...filters.categories, value],
    });
  }

  function toggleAgeGroup(value: AgeGroupValue) {
    apply({
      ageGroups: filters.ageGroups.includes(value)
        ? filters.ageGroups.filter((entry) => entry !== value)
        : [...filters.ageGroups, value],
    });
  }

  function clearAll() {
    setQuery("");
    startTransition(() => router.push("/books", { scroll: false }));
  }

  const isFiltered = hasActiveFilters(filters);

  /** Every narrowing filter as an individually removable pill. */
  const activePills = [
    ...(filters.q ? [{ key: "q", label: `“${filters.q}”`, remove: () => { setQuery(""); apply({ q: "" }); } }] : []),
    ...filters.categories.map((category) => ({
      key: `category-${category}`,
      label: category,
      remove: () => toggleCategory(category),
    })),
    ...filters.ageGroups.map((group) => ({
      key: `age-${group}`,
      label: ageGroupLabel(group) ?? group,
      remove: () => toggleAgeGroup(group),
    })),
    ...(filters.price !== "all"
      ? [{ key: "price", label: filters.price === "free" ? "Free" : "Paid", remove: () => apply({ price: "all" }) }]
      : []),
  ];

  return (
    <section
      aria-label="Book filters"
      className="sticky top-4 z-20 overflow-hidden rounded-[26px] border border-slate-200/80 bg-white/85 shadow-[0_20px_60px_-42px_rgba(15,23,42,0.5)] backdrop-blur-xl transition-shadow dark:border-indigo-500/20 dark:bg-slate-900/80"
    >
      {/* Indeterminate bar: navigation feedback without shifting any layout. */}
      <div
        aria-hidden
        className={`h-0.5 w-full origin-left bg-linear-to-r from-indigo-500 via-violet-500 to-indigo-500 transition-all duration-500 ${
          isPending ? "scale-x-100 opacity-100" : "scale-x-0 opacity-0"
        }`}
      />

      <div className="p-5 sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
          <div className="group relative flex-1">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-indigo-500" />
            <input
              type="text"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              maxLength={100}
              placeholder="Search by title, author or category"
              aria-label="Search books"
              className="w-full rounded-full border border-slate-200 bg-white py-3 pl-11 pr-10 text-sm text-slate-900 shadow-sm outline-none transition-all duration-300 placeholder:text-slate-400 focus:border-indigo-500 focus:shadow-md focus:ring-4 focus:ring-indigo-500/10 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
            />
            {query ? (
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  apply({ q: "" });
                }}
                aria-label="Clear search"
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-white"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            ) : null}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="inline-flex rounded-full border border-slate-200 bg-white p-1 shadow-sm dark:border-slate-700 dark:bg-slate-950">
              {PRICE_FILTERS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => apply({ price: option.value as PriceFilter })}
                  aria-pressed={filters.price === option.value}
                  className={`rounded-full px-4 py-1.5 text-xs font-bold transition-all duration-300 ${
                    filters.price === option.value
                      ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/25 dark:bg-indigo-500"
                      : "text-slate-600 hover:text-indigo-700 dark:text-slate-300 dark:hover:text-indigo-200"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>

            <label className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white py-1.5 pl-3 pr-1.5 shadow-sm dark:border-slate-700 dark:bg-slate-950">
              <SlidersHorizontal className="h-3.5 w-3.5 text-slate-400" />
              <span className="sr-only">Sort books</span>
              <select
                value={filters.sort}
                onChange={(event) => apply({ sort: event.target.value as SortValue })}
                className="cursor-pointer rounded-full bg-transparent py-1 pr-2 text-xs font-bold text-slate-800 outline-none dark:text-slate-100"
              >
                {SORT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>

        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          {categories.length > 0 ? (
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-slate-500 dark:text-slate-400">
                Category
              </p>
              <div className="mt-2.5 flex flex-wrap gap-2">
                {categories.map((category) => {
                  const isActive = filters.categories.includes(category.value);
                  return (
                    <button
                      key={category.value}
                      type="button"
                      onClick={() => toggleCategory(category.value)}
                      aria-pressed={isActive}
                      className={`${chipBase} ${isActive ? chipActive : chipIdle}`}
                    >
                      {category.value}
                      <span className={`ml-1.5 tabular-nums ${isActive ? "text-indigo-100" : "text-slate-400"}`}>
                        {category.count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}

          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-slate-500 dark:text-slate-400">
              Age group
            </p>
            <div className="mt-2.5 flex flex-wrap gap-2">
              {AGE_GROUPS.map((group) => {
                const isActive = filters.ageGroups.includes(group.value);
                return (
                  <button
                    key={group.value}
                    type="button"
                    onClick={() => toggleAgeGroup(group.value)}
                    aria-pressed={isActive}
                    className={`${chipBase} ${isActive ? chipActive : chipIdle}`}
                  >
                    {group.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {activePills.length > 0 ? (
          <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-slate-200 pt-4 dark:border-slate-800">
            <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">Active</span>
            {activePills.map((pill) => (
              <button
                key={pill.key}
                type="button"
                onClick={pill.remove}
                className="animate-scale-in inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700 transition hover:bg-indigo-100 dark:bg-indigo-950/60 dark:text-indigo-200 dark:hover:bg-indigo-900/60"
              >
                {pill.label}
                <X className="h-3 w-3" />
              </button>
            ))}
          </div>
        ) : null}

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-4 dark:border-slate-800">
          <p className="text-sm font-medium text-slate-600 dark:text-slate-300" aria-live="polite">
            {isPending ? (
              "Updating results…"
            ) : (
              <>
                <span className="font-black text-slate-900 tabular-nums dark:text-white">{resultCount}</span>{" "}
                {resultCount === 1 ? "book" : "books"}
                {isFiltered ? " match your filters" : " available"}
              </>
            )}
          </p>

          {isFiltered || filters.sort !== DEFAULT_FILTERS.sort ? (
            <button
              type="button"
              onClick={clearAll}
              className="inline-flex items-center gap-1.5 rounded-full border border-slate-300 px-4 py-1.5 text-xs font-bold text-slate-700 transition-all duration-300 hover:-translate-y-0.5 hover:border-indigo-400 hover:text-indigo-700 dark:border-slate-700 dark:text-slate-200 dark:hover:border-indigo-500/60 dark:hover:text-indigo-200"
            >
              <X className="h-3.5 w-3.5" />
              Clear all
            </button>
          ) : null}
        </div>
      </div>
    </section>
  );
}
