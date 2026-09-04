import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getWebsiteImageUrl } from "@/lib/website-storage";
import GameFilters from "@/components/GameFilters";

export const revalidate = 0;

const categoryCards = [
  { key: "ALL", label: "ALL", subtitle: "Every project in one view" },
  { key: "KIDS", label: "Kids", subtitle: "Kid-friendly digital experiences" },
  { key: "GAME", label: "GAMES", subtitle: "Interactive game experiences" },
  { key: "LEARNING", label: "Learning", subtitle: "Educational experiences" },
  { key: "BUSINESS", label: "Business", subtitle: "Business & professional work" },
  { key: "OTHER", label: "other", subtitle: "Everything beyond the core" },
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

function searchableGameText(site: {
  title: string;
  summary: string | null;
  description: string | null;
  details: string | null;
  features: string | null;
  targetAudience: string | null;
}) {
  return [
    site.title,
    site.summary,
    site.description,
    site.details,
    site.features,
    site.targetAudience,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function matchesGameAge(site: Parameters<typeof searchableGameText>[0] & { age: string | null }, age: string) {
  if (age === "ALL") return true;
  return site.age?.trim().toUpperCase() === age;
}

function matchesGameType(site: Parameters<typeof searchableGameText>[0] & { gameType: string | null }, type: string) {
  if (type === "ALL") return true;
  return site.gameType?.trim().toUpperCase() === type;
}

export default async function WebsitesPage({
  searchParams,
}: {
  searchParams?: Promise<{ category?: string; age?: string; type?: string }> | { category?: string; age?: string; type?: string };
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
  const selectedAge = (resolvedSearchParams?.age ?? "ALL").trim().toUpperCase();
  const selectedType = (resolvedSearchParams?.type ?? "ALL").trim().toUpperCase();

  const categoryFilteredSites =
    selectedCategory === "ALL"
      ? sitesWithImages
      : sitesWithImages.filter(
          (site) => normalizeCategory(site.category) === selectedCategory
        );

  const filteredSites =
    selectedCategory === "GAME"
      ? categoryFilteredSites.filter(
          (site) =>
            matchesGameAge(site, selectedAge) &&
            matchesGameType(site, selectedType)
        )
      : categoryFilteredSites;

  const highlights = [
    { title: "Elegant storytelling", text: "Every experience is shaped to feel premium, calm, and easy to trust." },
    { title: "Conversion focused", text: "We design interfaces that guide visitors with clarity and confidence." },
    { title: "Built to impress", text: "Modern visuals, polished layout, and strong identity from the first glance." },
  ];

  return (
    <main className="flex-1 bg-[radial-gradient(circle_at_top_left,rgba(99,102,241,0.16),transparent_32%),linear-gradient(135deg,#f8fafc_0%,#eef2ff_100%)] px-4 py-10 text-slate-900 transition-colors sm:px-6 lg:px-8 dark:bg-[#050505] dark:text-white">
      <div className="mx-auto flex max-w-7xl flex-col gap-8">
        <section className="overflow-hidden rounded-[32px] border border-slate-200/80 bg-white/80 shadow-[0_30px_90px_-35px_rgba(15,23,42,0.35)] backdrop-blur-xl dark:border-indigo-500/20 dark:bg-slate-900/70">
          <div className="grid gap-0 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="p-8 sm:p-10 lg:p-12">
              <div className="inline-flex items-center rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-sm font-semibold text-indigo-700 dark:border-indigo-500/30 dark:bg-indigo-950/60 dark:text-indigo-200">Projects</div>
              <h1 className="mt-5 text-4xl font-black tracking-tight text-slate-950 sm:text-5xl dark:text-white">Digital brands that feel polished, modern, and memorable.</h1>
              <p className="mt-4 max-w-2xl text-lg leading-8 text-slate-600 dark:text-slate-300">We craft refined web experiences that combine strong visual identity with thoughtful structure, clarity, and impact.</p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row"><a href="#showcase" className="rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-600">Explore showcase</a><a href="/contact" className="rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-indigo-300 hover:text-indigo-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">Start a project</a></div>
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

        <section className="rounded-[32px] border border-slate-200/80 bg-white/80 p-5 shadow-[0_24px_70px_-35px_rgba(15,23,42,0.28)] backdrop-blur-xl dark:border-indigo-500/20 dark:bg-slate-900/60 sm:p-8">
          <div className="mb-6 flex flex-col gap-4 px-1 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.32em] text-slate-500 dark:text-slate-400">Project categories</p>
              <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950 dark:text-white sm:text-3xl">Choose your world</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300">A cleaner five-part navigation with larger touch targets, stronger hierarchy, and more breathing room.</p>
            </div>
            <span className="w-fit rounded-full border border-indigo-200 bg-indigo-50 px-3.5 py-1.5 text-[10px] font-black uppercase tracking-[0.24em] text-indigo-700 dark:border-indigo-500/30 dark:bg-indigo-950/60 dark:text-indigo-200">
              {selectedCategory === "GAME" ? "GAMES" : selectedCategory}
            </span>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
            {categoryCards.map(({ key, label, subtitle }) => {
              const isActive = selectedCategory === key;
              const href = key === "ALL"
                ? "/websites"
                : `/websites?category=${encodeURIComponent(key)}`;

              return (
                <Link
                  key={key}
                  href={href}
                  aria-current={isActive ? "page" : undefined}
                  className={`group relative min-h-[176px] overflow-hidden rounded-[28px] border p-5 text-left transition-all duration-300 sm:min-h-[190px] sm:p-6 ${
                    isActive
                      ? "border-indigo-600 bg-gradient-to-br from-indigo-600 via-violet-600 to-indigo-500 text-white shadow-[0_24px_55px_-20px_rgba(79,70,229,0.72)]"
                      : "border-slate-200 bg-slate-50 text-slate-700 shadow-sm hover:-translate-y-1.5 hover:border-indigo-300 hover:bg-white hover:shadow-[0_24px_45px_-24px_rgba(79,70,229,0.5)] dark:border-slate-700 dark:bg-slate-950/60 dark:text-slate-200 dark:hover:border-indigo-500/40 dark:hover:bg-slate-900"
                  }`}
                >
                  <span className={`absolute -right-10 -top-10 h-24 w-24 rounded-full blur-2xl transition-all duration-500 group-hover:scale-125 ${isActive ? "bg-white/20" : "bg-indigo-400/10"}`} />
                  <span className={`absolute bottom-4 left-5 h-1 w-10 rounded-full transition-all duration-500 group-hover:w-16 ${isActive ? "bg-white/80" : "bg-indigo-500/50"}`} />

                  <div className="relative flex h-full flex-col justify-between gap-6">
                    <span className={`inline-flex w-fit items-center rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.24em] ${
                      isActive
                        ? "bg-white/15 text-white/90"
                        : "border border-slate-200 bg-white text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
                    }`}>
                      {key === "ALL" ? "Overview" : "Explore"}
                    </span>

                    <div>
                      <div className={`text-[1.65rem] font-black tracking-tight sm:text-[1.8rem] ${isActive ? "text-white" : "text-slate-950 dark:text-white"}`}>
                        {label}
                      </div>
                      <p className={`mt-2 max-w-[15rem] text-sm leading-6 ${isActive ? "text-indigo-50" : "text-slate-600 dark:text-slate-300"}`}>
                        {subtitle}
                      </p>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>

          {selectedCategory === "GAME" && (
            <GameFilters selectedAge={selectedAge} selectedType={selectedType} />
          )}
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
                  <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-slate-950/45 to-transparent" />
                </div>
                <div className="p-6">
                  <div className="flex items-center justify-between gap-3">
                    <span className="rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-indigo-700 dark:border-indigo-500/30 dark:bg-indigo-950/60 dark:text-indigo-200">{normalizeCategory(site.category)}</span>
                    <span className="text-xs font-semibold text-slate-400">#{String(index + 1).padStart(2, "0")}</span>
                  </div>
                  <h3 className="mt-4 text-2xl font-black tracking-tight text-slate-950 dark:text-white">{site.title}</h3>
                  <p className="mt-3 line-clamp-3 text-sm leading-7 text-slate-600 dark:text-slate-300">{site.summary || site.description || "A refined digital experience created by Space Zone Media."}</p>
                  <div className="mt-6 flex items-center justify-between gap-3"><span className="text-sm font-semibold text-slate-500 dark:text-slate-400">{site.currency} {Number(site.price).toFixed(3)}</span><Link href={`/websites/${site.slug}`} className="inline-flex items-center rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-600 dark:bg-white dark:text-slate-950 dark:hover:bg-indigo-400">View project</Link></div>
                </div>
              </article>
            ))
          )}
        </section>
      </div>
    </main>
  );
}
