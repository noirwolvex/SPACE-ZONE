import Link from "next/link";

const ageOptions = [
  { key: "ALL", label: "All ages" },
  { key: "3-5", label: "Ages 3–5" },
  { key: "6-8", label: "Ages 6–8" },
  { key: "9-12", label: "Ages 9–12" },
  { key: "13+", label: "Ages 13+" },
] as const;

const typeOptions = [
  { key: "ALL", label: "All types" },
  { key: "PUZZLE", label: "Puzzle" },
  { key: "ADVENTURE", label: "Adventure" },
  { key: "EDUCATIONAL", label: "Educational" },
  { key: "ARCADE", label: "Arcade" },
  { key: "STRATEGY", label: "Strategy" },
  { key: "CREATIVE", label: "Creative" },
] as const;

type Props = {
  selectedAge: string;
  selectedType: string;
};

function makeHref(age: string, type: string) {
  const params = new URLSearchParams({ category: "GAME" });
  if (age !== "ALL") params.set("age", age);
  if (type !== "ALL") params.set("type", type);
  return `/websites?${params.toString()}`;
}

export default function GameFilters({ selectedAge, selectedType }: Props) {
  return (
    <section className="mt-5 rounded-[28px] border border-sky-200/80 bg-gradient-to-br from-sky-50/90 via-white/80 to-indigo-50/80 p-5 shadow-[0_20px_55px_-30px_rgba(14,116,144,0.42)] backdrop-blur-xl dark:border-sky-500/20 dark:from-sky-950/25 dark:via-slate-950/40 dark:to-indigo-950/25 sm:p-6">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-sky-600 dark:text-sky-300">GAME FILTERS</p>
          <h3 className="mt-2 text-xl font-black tracking-tight text-slate-950 dark:text-white sm:text-2xl">Find the right game faster</h3>
          <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">Choose an age group and a game style. The results update through the URL so the filter can be shared or bookmarked.</p>
        </div>
        <Link href="/websites?category=GAME" className="w-fit rounded-full border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-600 transition hover:border-sky-300 hover:text-sky-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-sky-500/40 dark:hover:text-sky-300">
          Reset filters
        </Link>
      </div>

      <div className="mt-6 grid gap-5 xl:grid-cols-2">
        <div className="rounded-2xl border border-white/80 bg-white/65 p-4 dark:border-white/10 dark:bg-slate-950/30">
          <div className="mb-3 text-xs font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Age</div>
          <div className="flex flex-wrap gap-2">
            {ageOptions.map((option) => {
              const active = selectedAge === option.key;
              return (
                <Link
                  key={option.key}
                  href={makeHref(option.key, selectedType)}
                  aria-current={active ? "page" : undefined}
                  className={`rounded-full border px-3.5 py-2 text-xs font-bold transition-all duration-200 ${
                    active
                      ? "border-sky-600 bg-sky-600 text-white shadow-lg shadow-sky-600/20"
                      : "border-slate-200 bg-white text-slate-600 hover:-translate-y-0.5 hover:border-sky-300 hover:text-sky-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-sky-500/40 dark:hover:text-sky-300"
                  }`}
                >
                  {option.label}
                </Link>
              );
            })}
          </div>
        </div>

        <div className="rounded-2xl border border-white/80 bg-white/65 p-4 dark:border-white/10 dark:bg-slate-950/30">
          <div className="mb-3 text-xs font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Game type</div>
          <div className="flex flex-wrap gap-2">
            {typeOptions.map((option) => {
              const active = selectedType === option.key;
              return (
                <Link
                  key={option.key}
                  href={makeHref(selectedAge, option.key)}
                  aria-current={active ? "page" : undefined}
                  className={`rounded-full border px-3.5 py-2 text-xs font-bold transition-all duration-200 ${
                    active
                      ? "border-indigo-600 bg-indigo-600 text-white shadow-lg shadow-indigo-600/20"
                      : "border-slate-200 bg-white text-slate-600 hover:-translate-y-0.5 hover:border-indigo-300 hover:text-indigo-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-indigo-500/40 dark:hover:text-indigo-300"
                  }`}
                >
                  {option.label}
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
