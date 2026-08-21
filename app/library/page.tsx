import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { getPurchasedBookIds } from "@/lib/book-access";

export const revalidate = 0;

/** Everything the signed-in user can read: all free books plus what they own. */
export default async function LibraryPage() {
  const auth = await getCurrentUser();

  if (!auth?.profile) {
    redirect("/login?redirectTo=/library");
  }

  const purchasedIds = await getPurchasedBookIds(auth.profile.id);

  const books = await prisma.book.findMany({
    where: {
      OR: [{ isFree: true }, { id: { in: Array.from(purchasedIds) } }],
    },
    orderBy: { uploadedAt: "desc" },
    select: { id: true, title: true, filename: true, category: true, isFree: true },
  });

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-16 dark:bg-[#050505]">
      <div className="mx-auto max-w-4xl rounded-[32px] border border-slate-200/80 bg-white/80 p-8 shadow-[0_25px_80px_rgba(15,23,42,0.12)] backdrop-blur-2xl dark:border-slate-800 dark:bg-slate-900/70">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-950 dark:text-white">My library</h1>
        <p className="mt-3 text-slate-600 dark:text-slate-300">
          Everything you can read right now — free titles and books you own.
        </p>

        {books.length === 0 ? (
          <div className="mt-8 rounded-2xl border border-dashed border-slate-300 p-10 text-center dark:border-slate-700">
            <p className="text-slate-500 dark:text-slate-400">Your library is empty.</p>
            <Link
              href="/books"
              className="mt-4 inline-block rounded-full bg-indigo-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500"
            >
              Browse books
            </Link>
          </div>
        ) : (
          <ul className="mt-8 space-y-3">
            {books.map((book) => (
              <li
                key={book.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-950/60"
              >
                <div>
                  <p className="font-semibold text-slate-950 dark:text-white">{book.title ?? book.filename}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {book.category ?? "General"} · {book.isFree ? "Free" : "Owned"}
                  </p>
                </div>
                <div className="flex gap-2">
                  <a
                    href={`/api/books/${book.id}/access?mode=read`}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-600"
                  >
                    Read
                  </a>
                  <a
                    href={`/api/books/${book.id}/access?mode=download`}
                    className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200"
                  >
                    Download
                  </a>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
