import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ChevronRight } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getBookCoverUrl, getBookImageUrls } from "@/lib/book-storage";
import { getCurrentUser } from "@/lib/auth";
import { hasPurchasedBook } from "@/lib/book-access";
import { ageGroupLabel, buildBooksQueryString } from "@/lib/book-filters";
import { formatFileSize } from "@/lib/book-format";
import BookGallery from "@/components/books/BookGallery";
import BookPurchasePanel from "@/components/books/BookPurchasePanel";
import type { BookImageView } from "@/lib/book-types";

export const revalidate = 0;

const BOOK_DETAIL_SELECT = {
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
  images: {
    orderBy: { sortOrder: "asc" },
    select: { id: true, imageUrl: true, sortOrder: true },
  },
} as const;

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const book = await prisma.book.findUnique({ where: { id }, select: { title: true, filename: true, summary: true } });
  if (!book) return { title: "Book not found — Space Zone" };
  return { title: `${book.title ?? book.filename} — Space Zone`, description: book.summary ?? undefined };
}

export default async function BookDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const book = await prisma.book.findUnique({ where: { id }, select: BOOK_DETAIL_SELECT });
  if (!book) notFound();

  const auth = await getCurrentUser();
  const isSignedIn = Boolean(auth);
  const isPurchased = await hasPurchasedBook(auth?.profile?.id, book.id);
  const isFree = Boolean(book.isFree);
  const canRead = isFree || isPurchased || Boolean(auth?.isAdmin);

  const { coverImage, images, ...rest } = book;
  const [coverImageUrl, signedImageUrls] = await Promise.all([
    getBookCoverUrl(coverImage),
    getBookImageUrls(images.map((image) => image.imageUrl)),
  ]);

  const gallery: BookImageView[] = images.flatMap((image) => {
    const url = signedImageUrls.get(image.imageUrl);
    return url ? [{ id: image.id, url, sortOrder: image.sortOrder }] : [];
  });

  const price = rest.price != null ? Number(rest.price) : null;
  const currency = rest.currency ?? "BHD";
  const displayTitle = rest.title ?? rest.filename ?? "Untitled book";
  const displayAge = rest.targetAge ?? ageGroupLabel(rest.ageGroup);

  const facts = [
    { label: "Author", value: rest.author },
    { label: "Category", value: rest.category },
    { label: "Target Age", value: displayAge },
    { label: "File size", value: formatFileSize(rest.size) },
    { label: "Book Size", value: rest.bookSize },
    { label: "Pages", value: rest.pageCount != null ? String(rest.pageCount) : null },
  ].filter((fact) => Boolean(fact.value));

  return (
    <main className="relative flex-1 overflow-hidden bg-linear-to-b from-slate-50 via-indigo-50/40 to-white px-4 py-8 text-slate-900 transition-colors sm:px-6 lg:px-8 dark:from-[#050505] dark:via-[#070b18] dark:to-[#050505] dark:text-white">
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="animate-aurora absolute -right-40 -top-32 h-[26rem] w-[26rem] rounded-full bg-indigo-400/15 blur-3xl dark:bg-indigo-600/12" />
      </div>

      <div className="relative mx-auto flex max-w-7xl flex-col gap-8">
        <nav aria-label="Breadcrumb" className="animate-fade-in flex items-center gap-1.5 text-sm">
          <Link href="/books" className="group inline-flex items-center gap-1.5 font-semibold text-slate-500 transition-colors hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-300">
            <ArrowLeft className="h-4 w-4 transition-transform duration-300 group-hover:-translate-x-0.5" />
            All books
          </Link>
          <ChevronRight className="h-3.5 w-3.5 text-slate-300 dark:text-slate-600" />
          <span className="truncate font-semibold text-slate-800 dark:text-slate-200">{displayTitle}</span>
        </nav>

        <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:gap-12 lg:items-start">
          <BookGallery coverImageUrl={coverImageUrl} images={gallery} title={displayTitle} />

          <div className="flex flex-col gap-6 lg:sticky lg:top-6">
            <header className="animate-fade-up">
              <div className="flex flex-wrap items-center gap-2">
                {rest.category ? (
                  <Link href={`/books${buildBooksQueryString({ categories: [rest.category] })}`} className="rounded-full border border-indigo-200 bg-indigo-50 px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-[0.2em] text-indigo-700 transition-all duration-300 hover:-translate-y-0.5 hover:border-indigo-400 hover:shadow-sm dark:border-indigo-500/30 dark:bg-indigo-950/60 dark:text-indigo-200">
                    {rest.category}
                  </Link>
                ) : null}
                <span className="rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-[0.15em] text-slate-600 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300">
                  {displayAge ?? "All ages"}
                </span>
              </div>

              <h1 className="mt-4 text-4xl font-black leading-[1.1] tracking-tight text-slate-950 sm:text-5xl dark:text-white">{displayTitle}</h1>
              {rest.author ? <p className="mt-3 text-lg text-slate-600 dark:text-slate-300">by <span className="font-bold text-slate-900 dark:text-white">{rest.author}</span></p> : null}
            </header>

            <div className="animate-fade-up" style={{ animationDelay: "0.08s" }}>
              <BookPurchasePanel bookId={rest.id} title={displayTitle} coverImageUrl={coverImageUrl} isFree={isFree} isPurchased={isPurchased} isSignedIn={isSignedIn} canRead={canRead} price={price} currency={currency} />
            </div>

            <section className="animate-fade-up" style={{ animationDelay: "0.14s" }}>
              <h2 className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.25em] text-slate-500 dark:text-slate-400"><span className="h-px w-6 bg-indigo-400" />About this book</h2>
              <p className="mt-3.5 whitespace-pre-line text-base leading-8 text-slate-700 dark:text-slate-300">{rest.summary ?? "A delightful book from the Space Zone library."}</p>
            </section>

            {rest.features ? (
              <section className="animate-fade-up rounded-2xl border border-indigo-100 bg-white/70 p-5 dark:border-indigo-500/20 dark:bg-slate-900/50">
                <h2 className="text-[11px] font-bold uppercase tracking-[0.25em] text-slate-500 dark:text-slate-400">Features</h2>
                <p className="mt-3 whitespace-pre-line text-sm leading-7 text-slate-700 dark:text-slate-300">{rest.features}</p>
              </section>
            ) : null}

            {rest.targetAudience ? (
              <section className="animate-fade-up rounded-2xl border border-indigo-100 bg-white/70 p-5 dark:border-indigo-500/20 dark:bg-slate-900/50">
                <h2 className="text-[11px] font-bold uppercase tracking-[0.25em] text-slate-500 dark:text-slate-400">Target Audience</h2>
                <p className="mt-3 whitespace-pre-line text-sm leading-7 text-slate-700 dark:text-slate-300">{rest.targetAudience}</p>
              </section>
            ) : null}

            {rest.seriesParts ? (
              <section className="animate-fade-up rounded-2xl border border-indigo-100 bg-white/70 p-5 dark:border-indigo-500/20 dark:bg-slate-900/50">
                <h2 className="text-[11px] font-bold uppercase tracking-[0.25em] text-slate-500 dark:text-slate-400">Previous / Upcoming Parts</h2>
                <p className="mt-3 whitespace-pre-line text-sm leading-7 text-slate-700 dark:text-slate-300">{rest.seriesParts}</p>
              </section>
            ) : null}

            {facts.length > 0 ? (
              <dl className="animate-fade-up grid grid-cols-2 gap-3 sm:grid-cols-4" style={{ animationDelay: "0.2s" }}>
                {facts.map((fact) => (
                  <div key={fact.label} className="rounded-2xl border border-slate-200 bg-white/70 p-4 transition-all duration-300 hover:-translate-y-1 hover:border-indigo-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-900/50 dark:hover:border-indigo-500/40">
                    <dt className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">{fact.label}</dt>
                    <dd className="mt-1.5 truncate text-sm font-bold text-slate-900 dark:text-white">{fact.value}</dd>
                  </div>
                ))}
              </dl>
            ) : null}
          </div>
        </div>
      </div>
    </main>
  );
}
