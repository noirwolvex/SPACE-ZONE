import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getWebsiteImageUrl } from "@/lib/website-storage";

export const revalidate = 0;

export default async function WebsitesPage() {
  const sites = await prisma.website.findMany({ where: { isPublished: true }, orderBy: { createdAt: "desc" } });
  const sitesWithImages = await Promise.all(sites.map(async (site) => ({ ...site, imageUrl: await getWebsiteImageUrl(site.image) })));

  const highlights = [
    { title: "Elegant storytelling", text: "Every experience is shaped to feel premium, calm, and easy to trust." },
    { title: "Conversion focused", text: "We design interfaces that guide visitors with clarity and confidence." },
    { title: "Built to impress", text: "Modern visuals, polished layout, and strong identity from the first glance." },
  ];

  return (
    <main className="flex-1 bg-[radial-gradient(circle_at_top_left,rgba(99,102,241,0.16),transparent_32%),linear-gradient(135deg,#f8fafc_0%,#eef2ff_100%)] px-4 py-10 text-slate-900 transition-colors sm:px-6 lg:px-8 dark:bg-[#050505] dark:text-white">
      <div className="mx-auto flex max-w-7xl flex-col gap-8">
        <section className="overflow-hidden rounded-4xl border border-slate-200/80 bg-white/80 shadow-[0_30px_90px_-35px_rgba(15,23,42,0.35)] backdrop-blur-xl dark:border-indigo-500/20 dark:bg-slate-900/70">
          <div className="grid gap-0 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="p-8 sm:p-10 lg:p-12">
              <div className="inline-flex items-center rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-sm font-semibold text-indigo-700 dark:border-indigo-500/30 dark:bg-indigo-950/60 dark:text-indigo-200">OUR WEBSITE</div>
              <h1 className="mt-5 text-4xl font-black tracking-tight text-slate-950 sm:text-5xl dark:text-white">Digital brands that feel polished, modern, and memorable.</h1>
              <p className="mt-4 max-w-2xl text-lg leading-8 text-slate-600 dark:text-slate-300">We craft refined web experiences that combine strong visual identity with thoughtful structure, clarity, and impact.</p>
              <div className="mt-8 flex flex-wrap gap-3">
                <a href="#showcase" className="rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-600">Explore showcase</a>
                <a href="/contact" className="rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-indigo-300 hover:text-indigo-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">Start a project</a>
              </div>
              <div className="mt-8 grid gap-3 sm:grid-cols-3">
                {highlights.map((item) => (
                  <div key={item.title} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/60">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">{item.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{item.text}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative bg-slate-950 p-8 sm:p-10 lg:p-12">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.35),transparent_36%)]" />
              <div className="relative rounded-[28px] border border-white/10 bg-white/10 p-6 shadow-2xl backdrop-blur-md">
                <p className="text-sm font-semibold uppercase tracking-[0.3em] text-indigo-200">Why it stands out</p>
                <div className="mt-5 space-y-3">
                  {["Beautiful structure that makes every message easier to absorb","Design systems that feel premium across desktop and mobile","A refined balance of creativity, speed, and user trust"].map((item) => (
                    <div key={item} className="flex items-start gap-3 rounded-2xl border border-white/10 bg-slate-900/40 p-3">
                      <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-indigo-400" />
                      <p className="text-sm leading-7 text-slate-300">{item}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="showcase" className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {sites.length === 0 ? (
            <div className="col-span-full rounded-[28px] border border-dashed border-slate-300 bg-white/70 p-10 text-center text-slate-500 shadow-sm dark:border-indigo-500/20 dark:bg-slate-900/50 dark:text-slate-400">No websites available yet.</div>
          ) : (
            sitesWithImages.map((site, index) => (
              <article key={site.id} className="group overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_20px_60px_-30px_rgba(15,23,42,0.35)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_28px_75px_-28px_rgba(79,70,229,0.35)] dark:border-slate-800 dark:bg-slate-900/70">
                <div className="relative h-48 overflow-hidden">
                  {site.imageUrl ? (
                    <img src={site.imageUrl} alt={site.title} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                  ) : (
                    <div className="flex h-full items-end bg-linear-to-br from-indigo-600 via-violet-600 to-slate-900 p-5"><div className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-white">Featured</div></div>
                  )}
                  <div className="absolute inset-0 bg-linear-to-t from-slate-950/80 via-slate-950/10 to-transparent" />
                  <div className="absolute left-4 top-4 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-white backdrop-blur">#{String(index + 1).padStart(2, "0")}</div>
                  <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                    <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-white backdrop-blur">{site.category ?? "Digital launch"}</span>
                    <span className="rounded-full bg-emerald-500/90 px-3 py-1 text-xs font-semibold text-white">Live</span>
                  </div>
                </div>
                <div className="p-6">
                  <div className="flex items-start justify-between gap-3">
                    <div><p className="text-xs font-semibold uppercase tracking-[0.3em] text-indigo-500 dark:text-indigo-300">Project</p><h2 className="mt-1 text-xl font-bold text-slate-950 dark:text-white">{site.title}</h2></div>
                    <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200">{site.currency} {site.price}</span>
                  </div>
                  <p className="mt-3 min-h-18 text-sm leading-7 text-slate-600 dark:text-slate-300">{site.summary ?? "A polished digital experience designed to communicate clearly and convert with confidence."}</p>
                  <div className="mt-5 flex flex-wrap gap-2">
                    <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200">{site.category ?? "Brand"}</span>
                    <span className="rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700 dark:border-indigo-500/30 dark:bg-indigo-950/60 dark:text-indigo-200">Premium experience</span>
                  </div>
                  <Link href={`/websites/${site.slug}`} className="mt-6 inline-flex rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-600">View details</Link>
                </div>
              </article>
            ))
          )}
        </section>
      </div>
    </main>
  );
}
