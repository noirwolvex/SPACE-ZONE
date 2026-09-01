import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getWebsiteImageUrl } from "@/lib/website-storage";

export const revalidate = 0;

const filterOptions = ["ALL", "KIDS", "LEARNING", "GAME", "BUSINESS"] as const;
const categoryCards = [
  { key: "ALL", label: "All", subtitle: "See every project" },
  { key: "KIDS", label: "Kids", subtitle: "Playful & engaging" },
  { key: "LEARNING", label: "Learning", subtitle: "Educational & clear" },
  { key: "GAME", label: "Games", subtitle: "Immersive experiences" },
  { key: "BUSINESS", label: "Business", subtitle: "Brand-focused growth" },
  { key: "OTHER", label: "Other", subtitle: "Custom & unique" },

] as const;

function normalizeCategory(value?: string | null) {
  if (!value) return "ALL";

  const normalized = value.trim().toUpperCase();
  if (normalized === "KID" || normalized === "KIDS") return "KIDS";
  if (normalized === "LEARN" || normalized === "LEARNING") return "LEARNING";
  if (normalized === "GAMES" || normalized === "GAME") return "GAME";
  if (normalized === "BUSINESSES" || normalized === "BUSINESS") return "BUSINESS";
  if (normalized === "OTHERS" || normalized === "OTHER") return "OTHER";


  return normalized;
}

export default async function WebsitesPage({
  searchParams,
}: {
  searchParams?: Promise<{ category?: string }> | { category?: string };
}) {
  const resolvedSearchParams =
    searchParams instanceof Promise ? await searchParams : searchParams;

  let sites: Awaited<ReturnType<typeof prisma.website.findMany>> = [];
  let sitesWithImages: Array<(typeof sites)[number] & { imageUrl: string | null }> = [];

  try {
    sites = await prisma.website.findMany({
      where: { isPublished: true },
      orderBy: { createdAt: "desc" },
    });
    sitesWithImages = await Promise.all(
      sites.map(async (site) => ({
        ...site,
        imageUrl: await getWebsiteImageUrl(site.image),
      }))
    );
  } catch (error) {
    console.error("Failed to load published websites:", error);
  }

  const selectedCategory = normalizeCategory(resolvedSearchParams?.category ?? "ALL");
  const filteredSites =
    selectedCategory === "ALL"
      ? sitesWithImages
      : sitesWithImages.filter(
          (site) => normalizeCategory(site.category) === selectedCategory
        );

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
              <div className="inline-flex items-center rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-sm font-semibold text-indigo-700 dark:border-indigo-500/30 dark:bg-indigo-950/60 dark:text-indigo-200">Projects</div>
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

        <section className="rounded-[32px] border border-slate-200/80 bg-white/80 p-5 shadow-[0_24px_70px_-35px_rgba(15,23,42,0.28)] backdrop-blur-xl dark:border-indigo-500/20 dark:bg-slate-900/60 sm:p-6">
          <div className="mb-4 flex items-center justify-between gap-3 px-1">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.32em] text-slate-500 dark:text-slate-400">Categories</p>
              <h2 className="mt-2 text-xl font-black tracking-tight text-slate-950 dark:text-white sm:text-2xl">Choose the type of project you want to explore</h2>
            </div>
            <span className="rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.24em] text-indigo-700 dark:border-indigo-500/30 dark:bg-indigo-950/60 dark:text-indigo-200">
              {selectedCategory}
            </span>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            {categoryCards.map(({ key, label, subtitle }) => {
              const isActive = selectedCategory === key;
              const href = key === "ALL" ? "/websites" : `/websites?category=${encodeURIComponent(key)}`;

              return (
                <Link
                  key={key}
                  href={href}
                  aria-pressed={isActive}
                  className={`group rounded-[26px] border p-4 text-left transition-all duration-200 ease-out ${
                    isActive
                      ? "border-indigo-600 bg-gradient-to-br from-indigo-600 via-violet-600 to-indigo-500 text-white shadow-[0_22px_45px_-18px_rgba(79,70,229,0.75)]"
                      : "border-slate-200 bg-slate-50 text-slate-700 hover:-translate-y-1 hover:border-indigo-300 hover:bg-white hover:shadow-[0_18px_32px_-24px_rgba(79,70,229,0.45)] dark:border-slate-700 dark:bg-slate-950/60 dark:text-slate-200 dark:hover:border-indigo-500/40 dark:hover:bg-slate-900"
                  }`}
                >
                  <div className="flex h-full min-h-[132px] flex-col justify-between">
                    <span className={`inline-flex w-fit rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.24em] ${
                      isActive
                        ? "bg-white/15 text-white/90"
                        : "border border-slate-200 bg-white text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
                    }`}>
                      {key === "ALL" ? "Overview" : "Category"}
                    </span>

                    <div>
                      <div className={`text-2xl font-black tracking-tight sm:text-[2rem] ${isActive ? "text-white" : "text-slate-950 dark:text-white"}`}>
                        {label}
                      </div>
                      <p className={`mt-2 text-sm leading-6 ${isActive ? "text-indigo-50" : "text-slate-600 dark:text-slate-300"}`}>
                        {subtitle}
                      </p>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        <section id="showcase" className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {filteredSites.length === 0 ? (
            <div className="col-span-full rounded-[28px] border border-dashed border-slate-300 bg-white/70 p-10 text-center text-slate-500 shadow-sm dark:border-indigo-500/20 dark:bg-slate-900/50 dark:text-slate-400">
              No websites available in this category yet.
            </div>
          ) : (
            filteredSites.map((site, index) => (
              <article key={site.id} className="group overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_24px_70px_-32px_rgba(15,23,42,0.4)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_30px_80px_-28px_rgba(79,70,229,0.38)] dark:border-slate-800 dark:bg-slate-900/70">
                <div className="relative h-52 overflow-hidden">
                  {site.imageUrl ? (
                    <img src={site.imageUrl} alt={site.title} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                  ) : (
                    <div className="flex h-full items-end bg-gradient-to-br from-indigo-600 via-violet-600 to-slate-900 p-5">
                      <div className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-white">Featured</div>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/15 to-transparent" />
                  <div className="absolute left-4 top-4 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.28em] text-white backdrop-blur-sm">#{String(index + 1).padStart(2, "0")}</div>
                  <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                    <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.22em] text-white backdrop-blur-sm">{site.category ?? "Digital launch"}</span>
                    <span className="rounded-full bg-emerald-500/90 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.22em] text-white">Live</span>
                  </div>
                </div>

                <div className="p-6">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-indigo-500 dark:text-indigo-300">Project</p>
                      <h2 className="mt-2 text-xl font-extrabold text-slate-950 dark:text-white">{site.title}</h2>
                    </div>
                    <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-bold text-slate-700 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200">{site.currency} {site.price}</span>
                  </div>

                  <p className="mt-3 min-h-[72px] text-sm leading-7 text-slate-600 dark:text-slate-300">{site.summary ?? "A polished digital experience designed to communicate clearly and convert with confidence."}</p>

                  <div className="mt-5 flex flex-wrap gap-2">
                    <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-700 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200">{site.category ?? "Brand"}</span>
                    <span className="rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-indigo-700 dark:border-indigo-500/30 dark:bg-indigo-950/60 dark:text-indigo-200">Premium</span>
                  </div>

                  <div className="mt-6 flex items-center justify-between gap-3">
                    <Link href={`/websites/${site.slug}`} className="inline-flex rounded-full bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-600">View details</Link>
                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{site.slug}</span>
                  </div>
                </div>
              </article>
            ))
          )}
        </section>
      </div>
    </main>
  );
}
