import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getWebsiteImageUrl } from "@/lib/website-storage";
import { PurchaseWebsiteButton } from "@/components/websites/PurchaseWebsiteButton";

export const revalidate = 0;

type Props = { params: Promise<{ slug: string }> };

export default async function WebsiteDetailsPage({ params }: Props) {
  const { slug } = await params;
  const site = await prisma.website.findFirst({ where: { slug, isPublished: true } });
  if (!site) notFound();

  const galleryPaths = Array.from(new Set([site.image, ...(site.gallery ?? [])].filter(Boolean))) as string[];
  const gallery = await Promise.all(galleryPaths.slice(0, 5).map((path) => getWebsiteImageUrl(path)));
  const features = site.features?.split(/\r?\n/).map((item) => item.trim()).filter(Boolean) ?? [];

  return (
    <main className="flex-1 bg-[radial-gradient(circle_at_top_left,rgba(99,102,241,0.14),transparent_32%),linear-gradient(135deg,#f8fafc_0%,#eef2ff_100%)] px-4 py-10 text-slate-900 dark:bg-[#050505] dark:text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <Link href="/websites" className="inline-flex rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:border-indigo-300 hover:text-indigo-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200">
          ← Back to Projects
        </Link>

        <section className="mt-6 overflow-hidden rounded-[32px] border border-slate-200 bg-white/85 shadow-[0_30px_90px_-35px_rgba(15,23,42,0.35)] backdrop-blur-xl dark:border-indigo-500/20 dark:bg-slate-900/70">
          <div className="grid gap-0 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="p-6 sm:p-8 lg:p-10">
              {gallery.length ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  {gallery.map((src, index) => (
                    <div key={`${src}-${index}`} className={index === 0 ? "sm:col-span-2 overflow-hidden rounded-2xl bg-slate-100 dark:bg-slate-950" : "overflow-hidden rounded-2xl bg-slate-100 dark:bg-slate-950"}>
                      <img src={src ?? undefined} alt={`${site.title} preview ${index + 1}`} className={index === 0 ? "h-72 w-full object-cover" : "h-44 w-full object-cover"} />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex h-72 items-end rounded-2xl bg-linear-to-br from-indigo-600 via-violet-600 to-slate-950 p-6 text-white">
                  <span className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold backdrop-blur">Website Preview</span>
                </div>
              )}
            </div>

            <div className="border-t border-slate-200 p-6 sm:p-8 lg:border-l lg:border-t-0 lg:p-10 dark:border-slate-800">
              <span className="text-xs font-semibold uppercase tracking-[0.3em] text-indigo-500 dark:text-indigo-300">{site.category ?? "Website"}</span>
              <h1 className="mt-3 text-4xl font-black tracking-tight text-slate-950 dark:text-white">{site.title}</h1>
              <p className="mt-4 text-base leading-8 text-slate-600 dark:text-slate-300">{site.summary ?? "A polished website experience built for a strong first impression."}</p>

              <div className="mt-7 grid gap-3">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/60"><p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">Website Category</p><p className="mt-2 font-semibold text-slate-900 dark:text-white">{site.category ?? "Not specified"}</p></div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/60"><p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">Target Audience</p><p className="mt-2 font-semibold text-slate-900 dark:text-white">{site.targetAudience ?? "Not specified"}</p></div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-950/60 dark:bg-slate-950/60"><p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">Responsive</p><p className="mt-2 font-semibold text-slate-900 dark:text-white">{site.responsive ?? "Not specified"}</p></div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/60"><p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">System</p><p className="mt-2 font-semibold text-slate-900 dark:text-white">{site.system ?? "Custom website system"}</p></div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/60"><p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">Price</p><p className="mt-2 font-semibold text-slate-900 dark:text-white">{site.currency} {site.price.toString()}</p></div>
              </div>

              <div className="mt-7 flex flex-wrap gap-3">
                <PurchaseWebsiteButton websiteId={site.id} />
                <a href={site.websiteUrl} target="_blank" rel="noreferrer" className="rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white hover:bg-indigo-600">Visit live website</a>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-6 grid gap-6">
          <article className="min-h-64 rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/70 sm:p-8"><p className="text-xs font-semibold uppercase tracking-[0.3em] text-indigo-500 dark:text-indigo-300">Description</p><div className="mt-4 min-h-64 whitespace-pre-line text-base leading-8 text-slate-600 dark:text-slate-300">{site.description ?? site.summary ?? "No additional description has been added yet."}</div></article>

          <article className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/70 sm:p-8"><p className="text-xs font-semibold uppercase tracking-[0.3em] text-indigo-500 dark:text-indigo-300">Features</p>{features.length ? <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{features.map((feature) => <div key={feature} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-200">{feature}</div>)}</div> : <p className="mt-4 min-h-24 text-base leading-8 text-slate-600 dark:text-slate-300">No features have been added yet.</p>}</article>

          <article className="min-h-52 rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/70 sm:p-8"><p className="text-xs font-semibold uppercase tracking-[0.3em] text-indigo-500 dark:text-indigo-300">Details</p><div className="mt-4 min-h-52 whitespace-pre-line text-base leading-8 text-slate-600 dark:text-slate-300">{site.details ?? "Project details will appear here."}</div></article>
        </section>
      </div>
    </main>
  );
}
