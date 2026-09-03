import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function PurchasedToolsPage() {
  const auth = await getCurrentUser();
  if (!auth?.profile) redirect("/login?redirectTo=/purchased-tools");

  const orders = await prisma.order.findMany({
    where: { customerId: auth.profile.id, status: "PAID" },
    orderBy: { createdAt: "desc" },
    include: {
      items: {
        include: {
          tool: { select: { id: true, name: true, slug: true, summary: true, thumbnail: true } },
          downloads: {
            where: { fileId: { not: null } },
            include: { file: { select: { id: true, filename: true, size: true, contentType: true } } },
          },
        },
      },
    },
  });

  const items = orders.flatMap((order) =>
    order.items.map((item) => ({
      orderNo: order.orderNo,
      tool: item.tool,
      downloads: item.downloads.filter((download) => Boolean(download.file)),
    }))
  );

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-16 dark:bg-[#050505]">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8">
          <p className="text-xs font-bold uppercase tracking-[0.28em] text-indigo-500">Your account</p>
          <h1 className="mt-3 text-4xl font-extrabold tracking-tight">Purchased tools</h1>
          <p className="mt-3 text-slate-600 dark:text-slate-300">Download files from your verified paid Startup Tool orders.</p>
        </div>

        {items.length === 0 ? (
          <div className="rounded-[32px] border border-dashed border-slate-300 bg-white/80 p-12 text-center shadow-sm dark:border-indigo-500/20 dark:bg-slate-900/70">
            <p className="font-semibold text-slate-600 dark:text-slate-300">No paid tools yet.</p>
            <Link href="/tools" className="mt-5 inline-flex rounded-full bg-indigo-600 px-5 py-3 text-sm font-semibold text-white hover:bg-indigo-500">Browse Startup Tools</Link>
          </div>
        ) : (
          <div className="space-y-6">
            {items.map((item) => (
              <article key={`${item.orderNo}-${item.tool.id}`} className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm dark:border-indigo-500/20 dark:bg-slate-900/70 sm:p-8">
                <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-500">Order {item.orderNo}</p>
                    <h2 className="mt-2 text-2xl font-bold text-slate-950 dark:text-white">{item.tool.name}</h2>
                    <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-600 dark:text-slate-300">{item.tool.summary}</p>
                  </div>
                  <Link href={`/tools/${item.tool.slug}`} className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold dark:border-slate-700">View tool</Link>
                </div>

                <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {item.downloads.length === 0 ? (
                    <p className="rounded-2xl border border-dashed border-slate-300 p-4 text-sm text-slate-500 dark:border-slate-700">No downloadable files have been attached to this product yet.</p>
                  ) : item.downloads.map((download) => (
                    <a key={download.id} href={`/api/tools/download/${download.token}`} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 transition hover:border-indigo-300 hover:bg-indigo-50 dark:border-slate-800 dark:bg-slate-950/60 dark:hover:border-indigo-500/40 dark:hover:bg-indigo-950/30">
                      <p className="truncate text-sm font-bold text-slate-900 dark:text-white">{download.file?.filename}</p>
                      <p className="mt-1 text-xs text-slate-500">{Math.max(1, Math.round((download.file?.size ?? 0) / 1024))} KB · {download.file?.contentType}</p>
                    </a>
                  ))}
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
