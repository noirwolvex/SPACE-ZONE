import Link from "next/link";
import { ArrowLeft, BookX } from "lucide-react";

/** Shown when notFound() fires for an unknown book id. */
export default function BookNotFound() {
  return (
    <main className="flex flex-1 items-center justify-center bg-linear-to-b from-slate-50 via-indigo-50/40 to-white px-4 py-20 dark:from-[#050505] dark:via-[#070b18] dark:to-[#050505]">
      <div className="animate-fade-up flex max-w-md flex-col items-center rounded-[28px] border border-slate-200 bg-white/80 p-10 text-center shadow-[0_30px_90px_-45px_rgba(15,23,42,0.45)] backdrop-blur-xl dark:border-indigo-500/20 dark:bg-slate-900/70">
        <div className="rounded-2xl bg-indigo-50 p-4 dark:bg-indigo-950/60">
          <BookX className="h-8 w-8 text-indigo-500 dark:text-indigo-300" />
        </div>

        <h1 className="mt-6 text-2xl font-black tracking-tight text-slate-950 dark:text-white">
          We couldn&apos;t find that book
        </h1>
        <p className="mt-2.5 text-sm leading-6 text-slate-600 dark:text-slate-300">
          It may have been removed from the library, or the link might be out of date.
        </p>

        <Link
          href="/books"
          className="group mt-7 inline-flex items-center gap-2 rounded-full bg-slate-950 px-6 py-3 text-sm font-bold text-white transition-all duration-300 hover:-translate-y-0.5 hover:bg-indigo-600 dark:bg-white dark:text-slate-950 dark:hover:bg-indigo-500 dark:hover:text-white"
        >
          <ArrowLeft className="h-4 w-4 transition-transform duration-300 group-hover:-translate-x-0.5" />
          Browse all books
        </Link>
      </div>
    </main>
  );
}
