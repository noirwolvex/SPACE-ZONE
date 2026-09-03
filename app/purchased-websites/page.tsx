import { redirect } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { getWebsiteImageUrl } from "@/lib/website-storage";

export const dynamic = "force-dynamic";

export default async function PurchasedWebsitesPage() {
  const auth = await getCurrentUser();
  if (!auth?.profile) redirect("/login?redirectTo=/purchased-websites");

  const purchases = await prisma.websitePurchase.findMany({
    where: { customerId: auth.profile.id, status: "PAID" },
    include: { website: true },
    orderBy: { purchasedAt: "desc" },
  });

  const items = await Promise.all(purchases.map(async (purchase) => ({
    ...purchase,
    imageUrl: await getWebsiteImageUrl(purchase.website.image),
  })));

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-16 dark:bg-[#050505]">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8"><p className="text-xs font-bold uppercase tracking-[0.28em] text-indigo-500">Your account</p><h1 className="mt-3 text-4xl font-extrabold tracking-tight">Purchased websites</h1><p className="mt-3 text-slate-600 dark:text-slate-300">Websites you have purchased and completed payments for are stored here.</p></div>
        {items.length === 0 ? (
          <div className="rounded-[32px] border border-dashed border-slate-300 bg-white/80 p-12 text-center shadow-sm dark:border-indigo-500/20 dark:bg-slate-900/70"><p className="font-semibold text-slate-600 dark:text-slate-300">No purchased websites yet.</p><Link href="/websites" className="mt-5 inline-flex rounded-full bg-indigo-600 px-5 py-3 text-sm font-semibold text-white hover:bg-indigo-500">Browse websites</Link></div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">{items.map((purchase) => <article key={purchase.id} className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm dark:border-indigo-500/20 dark:bg-slate-900/70"><div className="relative h-48 bg-slate-100 dark:bg-slate-950">{purchase.imageUrl ? <Image src={purchase.imageUrl} alt={purchase.website.title} fill sizes="(max-width: 1024px) 50vw, 33vw" className="object-cover" /> : null}</div><div className="p-6"><p className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-500">{purchase.website.category ?? "Website"}</p><h2 className="mt-2 text-xl font-bold">{purchase.website.title}</h2><p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">{purchase.website.summary ?? "Purchased website."}</p><p className="mt-4 text-sm font-semibold">{purchase.currency} {purchase.price.toString()}</p><div className="mt-5 flex gap-3"><Link href={`/websites/${purchase.website.slug}`} className="rounded-full bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500">View project</Link>{purchase.website.websiteUrl ? <a href={purchase.website.websiteUrl} target="_blank" rel="noreferrer" className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold dark:border-slate-700">Open site</a> : null}</div></div></article>)}</div>
        )}
      </div>
    </main>
  );
}
