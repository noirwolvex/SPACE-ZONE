import { BookOpen, Search, Sparkles } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getBookCoverUrls } from "@/lib/book-storage";
import { getCurrentUser } from "@/lib/auth";
import { getPurchasedBookIds } from "@/lib/book-access";
import BookCard from "@/components/books/BookCard";
import BookFiltersPanel from "@/components/books/BookFilters";
import {
  buildBookOrderBy,
  buildBookWhere,
  hasActiveFilters,
  parseBookFilters,
  type RawSearchParams,
} from "@/lib/book-filters";
import type { BookWithAccess } from "@/lib/book-types";

export const revalidate = 0;

export default async function BooksPage({
  searchParams,
}: {
  searchParams: Promise<RawSearchParams>;
}) {
  const filters = parseBookFilters(await searchParams);

  // Keep the primary catalogue query isolated. Optional analytics, auth, and
  // cover signing must never take the whole books page down.
  let books: Awaited<ReturnType<typeof prisma.book.findMany>> = [] as never;
  try {
    books = await prisma.book.findMany({
      where: buildBookWhere(filters),
      orderBy: buildBookOrderBy(filters.sort),
      select: {
        id: true,
        filename: true,
        size: true,
        uploadedAt: true,
        coverImage: true,
        title: true,
        author: true,
        targetAge: true,
        ageGroup: true,
        category: true,
        summary: true,
        features: true,
        targetAudience: true,
        bookSize: true,
        pageCount: true,
        seriesParts: true,
        price: true,
        currency: true,
        isFree: true,
      },
    });
  } catch (error) {
    console.error("Failed to load books:", error);
  }

  let categoryOptions: Array<{ value: string; count: number }> = [];
  let totalBooks = books.length;
  let freeBooks = books.filter((book) => Boolean(book.isFree)).length;
  try {
    const [categoryGroups, totalCount, freeCount] = await Promise.all([
      prisma.book.groupBy({ by: ["category"], _count: { _all: true } }),
      prisma.book.count(),
      prisma.book.count({ where: { isFree: true } }),
    ]);

    categoryOptions = categoryGroups
      .flatMap((group) =>
        group.category ? [{ value: group.category, count: group._count._all }] : []
      )
      .sort((a, b) => a.value.localeCompare(b.value));
    totalBooks = totalCount;
    freeBooks = freeCount;
  } catch (error) {
    console.warn("Book catalogue stats unavailable:", error);
  }

  let purchasedIds = new Set<string>();
  try {
    const auth = await getCurrentUser();
    purchasedIds = await getPurchasedBookIds(auth?.profile?.id);
  } catch (error) {
    console.warn("Book access lookup unavailable:", error);
  }

  let coverUrls = new Map<string, string>();
  try {
    coverUrls = await getBookCoverUrls(books.map((book) => book.coverImage));
  } catch (error) {
    console.warn("Book cover signing unavailable:", error);
  }

  const booksWithAccess = books.map(({ coverImage, ...book }) => ({
    ...book,
    price: book.price != null ? Number(book.price) : null,
    currency: book.currency ?? "BHD",
    isFree: Boolean(book.isFree),
    isPurchased: purchasedIds.has(book.id),
    coverImageUrl: coverImage ? (coverUrls.get(coverImage) ?? null) : null,
  })) as BookWithAccess[];

  const stats = [
    { label: "Titles in library", value: totalBooks, icon: BookOpen },
    { label: "Free to read", value: freeBooks, icon: Sparkles },
    { label: "Categories", value: categoryOptions.length, icon: Search },
  ];

  return (
    <main className="relative flex-1 overflow-hidden bg-linear-to-b from-slate-50 via-indigo-50/40 to-white px-4 py-10 text-slate-900 transition-colors sm:px-6 lg:px-8 dark:from-[#050505] dark:via-[#070b18] dark:to-[#050505] dark:text-white">
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="animate-aurora absolute -left-32 -top-40 h-[28rem] w-[28rem] rounded-full bg-indigo-400/20 blur-3xl dark:bg-indigo-600/15" />
        <div
          className="animate-aurora absolute -right-24 top-32 h-[24rem] w-[24rem] rounded-full bg-violet-400/20 blur-3xl dark:bg-violet-600/15"
          style={{ animationDelay: "-6s" }}
        />
      </div>

      <div className="relative mx-auto flex max-w-7xl flex-col gap-8">
        <section className="animate-fade-up overflow-hidden rounded-[32px] border border-slate-200/80 bg-white/80 shadow-[0_30px_90px_-45px_rgba(15,23,42,0.45)] backdrop-blur-xl dark:border-indigo-500/20 dark:bg-slate-900/70">
          <div className="grid gap-0 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="p-8 sm:p-10 lg:p-12">
              <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50/80 px-3.5 py-1.5 text-xs font-bold uppercase tracking-[0.2em] text-indigo-700 backdrop-blur dark:border-indigo-500/30 dark:bg-indigo-950/60 dark:text-indigo-200">
                <Sparkles className="h-3.5 w-3.5" />
                Our Books
              </div>
              <h1 className="mt-6 text-4xl font-black leading-[1.08] tracking-tight text-slate-950 sm:text-5xl lg:text-6xl dark:text-white">
                Stories that feel{" "}
                <span className="bg-linear-to-r from-indigo-500 via-violet-500 to-indigo-500 bg-clip-text text-transparent">inviting</span>
                , inspiring, and easy to explore.
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-8 text-slate-600 sm:text-lg dark:text-slate-300">
                Discover a carefully selected collection of books with elegant presentation and a smooth reading experience.
              </p>
              <dl className="mt-8 grid grid-cols-3 gap-3 sm:max-w-lg">
                {stats.map((stat) => (
                  <div key={stat.label} className="group rounded-2xl border border-slate-200 bg-white/70 p-4 transition-all duration-300 hover:-translate-y-1 hover:border-indigo-300 hover:shadow-lg dark:border-slate-800 dark:bg-slate-950/50 dark:hover:border-indigo-500/40">
                    <stat.icon className="h-4 w-4 text-indigo-500 transition-transform duration-300 group-hover:scale-110 dark:text-indigo-400" />
                    <dd className="mt-2 text-2xl font-black tabular-nums text-slate-950 dark:text-white">{stat.value}</dd>
                    <dt className="mt-0.5 text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">{stat.label}</dt>
                  </div>
                ))}
              </dl>
            </div>
            <div className="relative hidden overflow-hidden bg-slate-950 p-8 sm:p-10 lg:block lg:p-12">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.35),transparent_45%)]" />
              <div className="animate-aurora absolute -bottom-16 -left-10 h-64 w-64 rounded-full bg-violet-500/25 blur-3xl" />
              <div className="relative rounded-[28px] border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur-md">
                <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-indigo-200">Library experience</p>
                <div className="mt-5 space-y-3">
                  {["Beautiful cover presentation that gives each title presence","Clear details for age, category, and reading access","A calm, premium feel that makes browsing enjoyable"].map((item) => (
                    <div key={item} className="flex items-start gap-3 rounded-2xl border border-white/10 bg-slate-900/50 p-3.5 transition-all duration-300 hover:translate-x-1 hover:border-indigo-400/40 hover:bg-slate-900/80">
                      <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-indigo-400 shadow-[0_0_12px_rgba(129,140,248,0.9)]" />
                      <p className="text-sm leading-6 text-slate-300">{item}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <BookFiltersPanel filters={filters} categories={categoryOptions} resultCount={booksWithAccess.length} />

        {booksWithAccess.length === 0 ? (
          <div className="animate-fade-up flex flex-col items-center rounded-[28px] border border-dashed border-slate-300 bg-white/70 p-14 text-center shadow-sm dark:border-indigo-500/20 dark:bg-slate-900/50">
            <div className="rounded-2xl bg-slate-100 p-4 dark:bg-slate-800"><Search className="h-7 w-7 text-slate-400" /></div>
            <p className="mt-5 text-lg font-bold text-slate-800 dark:text-slate-100">{hasActiveFilters(filters) ? "No books match these filters" : "No books available yet"}</p>
            <p className="mt-2 max-w-sm text-sm text-slate-500 dark:text-slate-400">{hasActiveFilters(filters) ? "Try removing one of the active filters above, or clear them all to see the full library." : "New titles are on their way — check back soon."}</p>
          </div>
        ) : (
          <section className="stagger-children grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {booksWithAccess.map((book) => <BookCard key={book.id} book={book} />)}
          </section>
        )}
      </div>
    </main>
  );
}
