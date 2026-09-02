import { ArrowUpRight, BriefcaseBusiness, Gamepad2, Layers3, Sparkles } from "lucide-react";

const businessHubUrl = process.env.NEXT_PUBLIC_BUSINESS_HUB_URL || "http://localhost:3001";
const kidsPlatformUrl = process.env.NEXT_PUBLIC_KIDS_PLATFORM_URL || "http://localhost:3002";

const cardBase =
  "group relative block overflow-hidden rounded-3xl border bg-white/80 p-8 shadow-md backdrop-blur-xl transition duration-500 hover:-translate-y-1 sm:p-10";

export default function FeaturedPlatforms() {
  return (
    <section className="relative z-10 py-24 transition-colors" aria-labelledby="platforms-heading">
      <div className="container mx-auto px-4">
        <div className="mx-auto mb-12 max-w-3xl text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-indigo-200/70 bg-indigo-50/80 px-4 py-2 text-sm font-medium text-indigo-700 backdrop-blur dark:border-indigo-400/20 dark:bg-indigo-500/10 dark:text-indigo-300">
            <Layers3 className="h-4 w-4" />
            SPACE-ZONE PLATFORMS
          </div>
          <h2
            id="platforms-heading"
            className="text-3xl font-bold tracking-tight text-slate-900 drop-shadow-sm dark:text-white dark:drop-shadow-md sm:text-4xl"
          >
            Platforms built for bigger worlds
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-600 dark:text-slate-300">
            Launch dedicated platforms from one central SPACE-ZONE experience. Each platform can keep its own apps, data, and business logic.
          </p>
        </div>

        <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-2">
          <a
            href={businessHubUrl}
            className={`${cardBase} border-slate-200 hover:border-indigo-400/50 hover:shadow-[0_20px_60px_rgba(79,70,229,0.18)] dark:border-indigo-400/15 dark:bg-slate-900/55 dark:hover:border-indigo-400/35 dark:hover:bg-slate-900/75`}
            aria-label="Open SZ BUSINESS HUB"
          >
            <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-indigo-500/15 blur-3xl transition duration-500 group-hover:bg-indigo-400/25" />
            <div className="pointer-events-none absolute -bottom-24 left-1/3 h-56 w-56 rounded-full bg-cyan-400/10 blur-3xl transition duration-500 group-hover:bg-cyan-300/20" />

            <div className="relative flex h-full flex-col justify-between gap-8">
              <div className="flex items-start gap-5">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-indigo-200 bg-indigo-50 text-indigo-600 shadow-sm transition duration-500 group-hover:scale-105 group-hover:rotate-1 dark:border-indigo-400/20 dark:bg-indigo-500/10 dark:text-indigo-300">
                  <BriefcaseBusiness className="h-8 w-8" />
                </div>

                <div>
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <span className="text-xs font-semibold uppercase tracking-[0.22em] text-indigo-600 dark:text-indigo-300">
                      Business Platform
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-500/10 dark:text-emerald-300">
                      <Sparkles className="h-3 w-3" />
                      Available
                    </span>
                  </div>

                  <h3 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
                    SZ BUSINESS HUB
                  </h3>
                  <p className="mt-3 text-base leading-7 text-slate-600 dark:text-slate-300 sm:text-lg">
                    A dedicated hub for business applications, operational tools, AI systems, and future products — organized as one scalable platform.
                  </p>
                </div>
              </div>

              <div className="inline-flex w-fit items-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50 px-5 py-3 font-semibold text-indigo-700 transition duration-300 group-hover:gap-3 group-hover:bg-indigo-100 dark:border-indigo-400/20 dark:bg-indigo-500/10 dark:text-indigo-300 dark:group-hover:bg-indigo-500/15">
                Open Platform
                <ArrowUpRight className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </div>
            </div>
          </a>

          <a
            href={kidsPlatformUrl}
            className={`${cardBase} border-slate-200 hover:border-sky-400/50 hover:shadow-[0_20px_60px_rgba(14,165,233,0.16)] dark:border-sky-400/15 dark:bg-slate-900/55 dark:hover:border-sky-400/35 dark:hover:bg-slate-900/75`}
            aria-label="Open SZ KIDS"
          >
            <div className="pointer-events-none absolute -left-20 -top-20 h-56 w-56 rounded-full bg-sky-400/15 blur-3xl transition duration-500 group-hover:bg-sky-300/25" />
            <div className="pointer-events-none absolute -bottom-24 right-1/3 h-56 w-56 rounded-full bg-violet-400/10 blur-3xl transition duration-500 group-hover:bg-violet-300/20" />

            <div className="relative flex h-full flex-col justify-between gap-8">
              <div className="flex items-start gap-5">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-sky-200 bg-sky-50 text-sky-600 shadow-sm transition duration-500 group-hover:scale-105 group-hover:-rotate-1 dark:border-sky-400/20 dark:bg-sky-500/10 dark:text-sky-300">
                  <Gamepad2 className="h-8 w-8" />
                </div>

                <div>
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <span className="text-xs font-semibold uppercase tracking-[0.22em] text-sky-600 dark:text-sky-300">
                      Kids Platform
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-500/10 dark:text-emerald-300">
                      <Sparkles className="h-3 w-3" />
                      Available
                    </span>
                  </div>

                  <h3 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
                    SZ KIDS
                  </h3>
                  <p className="mt-3 text-base leading-7 text-slate-600 dark:text-slate-300 sm:text-lg">
                    A dedicated world for kids, combining games, learning experiences, rewards, profiles, and future interactive experiences in one platform.
                  </p>
                </div>
              </div>

              <div className="inline-flex w-fit items-center gap-2 rounded-xl border border-sky-200 bg-sky-50 px-5 py-3 font-semibold text-sky-700 transition duration-300 group-hover:gap-3 group-hover:bg-sky-100 dark:border-sky-400/20 dark:bg-sky-500/10 dark:text-sky-300 dark:group-hover:bg-sky-500/15">
                Open Platform
                <ArrowUpRight className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </div>
            </div>
          </a>
        </div>
      </div>
    </section>
  );
}
