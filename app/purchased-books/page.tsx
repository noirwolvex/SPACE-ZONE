import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { getBookCoverUrl } from "@/lib/book-storage";

export const revalidate = 0;

/**
 * Outcome banner for the `?order=` the payment provider redirects back with.
 *
 * The redirect proves nothing on its own — it is the webhook that settles an
 * order — so this reads the order's real status rather than trusting the URL.
 */
async function resolveReturnedOrder(customerId: string, orderNo: string | undefined) {
  if (!orderNo) return null;

  const order = await prisma.bookOrder.findFirst({
    // Scoped to the caller so an order number cannot be used to probe others.
    where: { orderNo, customerId },
    select: { status: true, book: { select: { title: true, filename: true } } },
  });

  if (!order) return null;

  const title = order.book.title ?? order.book.filename;

  switch (order.status) {
    case "PAID":
      return { tone: "success" as const, text: `Payment confirmed — “${title}” is now in your library.` };
    case "FAILED":
    case "CANCELLED":
      return { tone: "error" as const, text: `Payment for “${title}” did not complete. You have not been charged.` };
    default:
      return {
        tone: "pending" as const,
        text: `We are still waiting for confirmation of your payment for “${title}”. Access unlocks automatically once it clears.`,
      };
  }
}

const BANNER_STYLES = {
  success: "border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-500/30 dark:bg-emerald-950/30 dark:text-emerald-100",
  pending: "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-500/30 dark:bg-amber-950/30 dark:text-amber-100",
  error: "border-rose-200 bg-rose-50 text-rose-900 dark:border-rose-500/30 dark:bg-rose-950/30 dark:text-rose-100",
} as const;

/** Books the signed-in user owns, plus their pending orders. */
export default async function PurchasedBooksPage({
  searchParams,
}: {
  searchParams: Promise<{ order?: string }>;
}) {
  const auth = await getCurrentUser();

  if (!auth) {
    redirect("/login?redirectTo=/purchased-books");
  }

  if (!auth.profile) {
    redirect("/login?redirectTo=/purchased-books");
  }

  const { order: returnedOrderNo } = await searchParams;
  const banner = await resolveReturnedOrder(auth.profile.id, returnedOrderNo);

  const [purchases, pendingOrders] = await Promise.all([
    prisma.purchasedBook.findMany({
      where: { customerId: auth.profile.id, status: "COMPLETED" },
      orderBy: { purchasedAt: "desc" },
      include: {
        book: {
          select: { id: true, title: true, filename: true, coverImage: true, category: true, summary: true },
        },
      },
    }),
    prisma.bookOrder.findMany({
      where: { customerId: auth.profile.id, status: "PENDING" },
      orderBy: { createdAt: "desc" },
      include: { book: { select: { id: true, title: true, filename: true } } },
    }),
  ]);

  const items = await Promise.all(
    purchases.map(async (purchase) => ({
      id: purchase.id,
      bookId: purchase.book.id,
      title: purchase.book.title ?? purchase.book.filename,
      category: purchase.book.category,
      summary: purchase.book.summary,
      price: purchase.price != null ? Number(purchase.price) : null,
      currency: purchase.currency,
      purchasedAt: purchase.purchasedAt,
      coverImageUrl: await getBookCoverUrl(purchase.book.coverImage),
    }))
  );

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-16 dark:bg-[#050505]">
      <div className="mx-auto max-w-5xl">
        {banner ? (
          <div
            role="status"
            className={`mb-6 rounded-2xl border px-5 py-4 text-sm font-medium ${BANNER_STYLES[banner.tone]}`}
          >
            {banner.text}
          </div>
        ) : null}

        <div className="rounded-[32px] border border-slate-200/80 bg-white/80 p-8 shadow-[0_25px_80px_rgba(15,23,42,0.12)] backdrop-blur-2xl dark:border-slate-800 dark:bg-slate-900/70">
          <h1 className="text-3xl font-semibold tracking-tight text-slate-950 dark:text-white">Purchased books</h1>
          <p className="mt-3 text-slate-600 dark:text-slate-300">
            Books you own. Reading and downloading is authorized on every request.
          </p>

          {items.length === 0 ? (
            <div className="mt-8 rounded-2xl border border-dashed border-slate-300 p-10 text-center dark:border-slate-700">
              <p className="text-slate-500 dark:text-slate-400">You have not purchased any books yet.</p>
              <Link
                href="/books"
                className="mt-4 inline-block rounded-full bg-indigo-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500"
              >
                Browse books
              </Link>
            </div>
          ) : (
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {items.map((item) => (
                <article
                  key={item.id}
                  className="flex gap-4 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-950/60"
                >
                  {item.coverImageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.coverImageUrl} alt={item.title ?? "Book cover"} className="h-24 w-18 rounded-lg object-cover" />
                  ) : (
                    <div className="h-24 w-18 rounded-lg bg-linear-to-br from-indigo-600 to-slate-900" />
                  )}
                  <div className="min-w-0 flex-1">
                    <h2 className="truncate font-bold text-slate-950 dark:text-white">{item.title}</h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {item.price != null ? `${item.price} ${item.currency}` : "—"} ·{" "}
                      {new Date(item.purchasedAt).toLocaleDateString()}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <a
                        href={`/api/books/${item.bookId}/access?mode=read`}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-full bg-slate-950 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-indigo-600"
                      >
                        Read
                      </a>
                      <a
                        href={`/api/books/${item.bookId}/access?mode=download`}
                        className="rounded-full border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200"
                      >
                        Download
                      </a>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}

          {pendingOrders.length > 0 ? (
            <section className="mt-10">
              <h2 className="text-lg font-bold text-slate-950 dark:text-white">Pending orders</h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                These orders are awaiting payment confirmation and do not grant access yet.
              </p>
              <ul className="mt-4 space-y-2">
                {pendingOrders.map((order) => (
                  <li
                    key={order.id}
                    className="flex items-center justify-between rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm dark:border-amber-500/30 dark:bg-amber-950/20"
                  >
                    <span className="font-medium text-slate-800 dark:text-slate-100">
                      {order.book.title ?? order.book.filename}
                    </span>
                    <span className="text-xs font-semibold text-amber-700 dark:text-amber-300">
                      {Number(order.amount)} {order.currency} · {order.orderNo}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>
      </div>
    </div>
  );
}
