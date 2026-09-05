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

type FilterOption = { key: string; label: string };

type Props = {
  selectedAge: string;
  selectedType: string;
  selectedCategory: string;
  dynamicAgeOptions?: FilterOption[];
  dynamicCategoryOptions?: FilterOption[];
};

function makeHref(age: string, type: string, category: string) {
  const params = new URLSearchParams({ category: "GAME" });
  if (age !== "ALL") params.set("age", age);
  if (type !== "ALL") params.set("type", type);
  if (category !== "ALL") params.set("gameCategory", category);
  return `/websites?${params.toString()}`;
}

function labelForAge(value: string) {
  if (value === "3-5") return "Ages 3–5";
  if (value === "6-8") return "Ages 6–8";
  if (value === "9-12") return "Ages 9–12";
  if (value === "13+") return "Ages 13+";
  return value;
}

export default function GameFilters({ selectedAge, selectedType, selectedCategory, dynamicAgeOptions = [], dynamicCategoryOptions = [] }: Props) {
  const mergedAges = [
    { key: "ALL", label: "All ages" },
    ...[...ageOptions.slice(1), ...dynamicAgeOptions]
      .filter((option, index, all) => all.findIndex((item) => item.key.trim().toUpperCase() === option.key.trim().toUpperCase()) === index)
      .map((option) => ({ ...option, label: option.label || labelForAge(option.key) })),
  ];

  const mergedCategories = [
    { key: "ALL", label: "All categories" },
    ...dynamicCategoryOptions.filter((option, index, all) => all.findIndex((item) => item.key.trim().toUpperCase() === option.key.trim().toUpperCase()) === index),
  ];

  return (
    <section className="mt-5 rounded-[28px] border border-sky-200/80 bg-gradient-to-br from-sky-50/90 via-white/80 to-indigo-50/80 p-5 shadow-[0_20px_55px_-30px_rgba(14,116,144,0.42)] backdrop-blur-xl dark:border-sky-500/20 dark:from-sky-950/25 dark:via-slate-950/40 dark:to-indigo-950/25 sm:p-6">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-sky-600 dark:text-sky-300">GAME FILTERS</p>
          <h3 className="mt-2 text-xl font-black tracking-tight text-slate-950 dark:text-white sm:text-2xl">Find the right game faster</h3>
          <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">Choose an age group, category, and game style. The results update through the URL so the filter can be shared or bookmarked.</p>
        </div>
        <Link href="/websites?category=GAME" className="w-fit rounded-full border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-600 transition hover:border-sky-300 hover:text-sky-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-sky-500/40 dark:hover:text-sky-300">Reset filters</Link>
      </div>

      <div className="mt-6 grid gap-5 xl:grid-cols-3">
        <div className="rounded-2xl border border-white/80 bg-white/65 p-4 dark:border-white/10 dark:bg-slate-950/30">
          <div className="mb-3 text-xs font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Age</div>
          <div className="flex flex-wrap gap-2">
            {mergedAges.map((option) => {
              const active = selectedAge === option.key.trim().toUpperCase();
              return <Link key={`age-${option.key}`} href={makeHref(option.key, selectedType, selectedCategory)} aria-current={active ? "page" : undefined} className={`rounded-full border px-3.5 py-2 text-xs font-bold transition-all duration-200 ${active ? "border-sky-600 bg-sky-600 text-white shadow-lg shadow-sky-600/20" : "border-slate-200 bg-white text-slate-600 hover:-translate-y-0.5 hover:border-sky-300 hover:text-sky-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-sky-500/40 dark:hover:text-sky-300"}`}>{option.label}</Link>;
            })}
          </div>
        </div>

        <div className="rounded-2xl border border-white/80 bg-white/65 p-4 dark:border-white/10 dark:bg-slate-950/30">
          <div className="mb-3 text-xs font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Category</div>
          <div className="flex flex-wrap gap-2">
            {mergedCategories.length > 1 ? mergedCategories.map((option) => {
              const active = selectedCategory === option.key.trim().toUpperCase();
              return <Link key={`category-${option.key}`} href={makeHref(selectedAge, selectedType, option.key)} aria-current={active ? "page" : undefined} className={`rounded-full border px-3.5 py-2 text-xs font-bold transition-all duration-200 ${active ? "border-violet-600 bg-violet-600 text-white shadow-lg shadow-violet-600/20" : "border-slate-200 bg-white text-slate-600 hover:-translate-y-0.5 hover:border-violet-300 hover:text-violet-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-violet-500/40 dark:hover:text-violet-300"}`}>{option.label}</Link>;
            }) : <span className="text-sm text-slate-500 dark:text-slate-400">Custom game categories will appear here when added.</span>}
          </div>
        </div>

        <div className="rounded-2xl border border-white/80 bg-white/65 p-4 dark:border-white/10 dark:bg-slate-950/30">
          <div className="mb-3 text-xs font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Game type</div>
          <div className="flex flex-wrap gap-2">
            {typeOptions.map((option) => {
              const active = selectedType === option.key;
              return <Link key={option.key} href={makeHref(selectedAge, option.key, selectedCategory)} aria-current={active ? "page" : undefined} className={`rounded-full border px-3.5 py-2 text-xs font-bold transition-all duration-200 ${active ? "border-indigo-600 bg-indigo-600 text-white shadow-lg shadow-indigo-600/20" : "border-slate-200 bg-white text-slate-600 hover:-translate-y-0.5 hover:border-indigo-300 hover:text-indigo-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-indigo-500/40 dark:hover:text-indigo-300"}`}>{option.label}</Link>;
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
