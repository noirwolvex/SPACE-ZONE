/**
 * Skeleton for the Books listing. The page is dynamic (filters run in SQL on
 * every request), so a shaped placeholder keeps navigation from flashing empty.
 */
export default function BooksLoading() {
  return (
    <main className="flex-1 bg-linear-to-b from-slate-50 via-indigo-50/40 to-white px-4 py-10 sm:px-6 lg:px-8 dark:from-[#050505] dark:via-[#070b18] dark:to-[#050505]">
      <div className="mx-auto flex max-w-7xl flex-col gap-8">
        <div className="skeleton-shimmer h-72 rounded-[32px] border border-slate-200/80 bg-slate-200/60 dark:border-slate-800 dark:bg-slate-800/50" />
        <div className="skeleton-shimmer h-44 rounded-[26px] border border-slate-200/80 bg-slate-200/60 dark:border-slate-800 dark:bg-slate-800/50" />

        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={index}
              className="overflow-hidden rounded-[26px] border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900/70"
            >
              <div className="skeleton-shimmer aspect-16/11 bg-slate-200/70 dark:bg-slate-800/60" />
              <div className="space-y-3 p-6">
                <div className="skeleton-shimmer h-5 w-3/4 rounded-full bg-slate-200/70 dark:bg-slate-800/60" />
                <div className="skeleton-shimmer h-3 w-1/3 rounded-full bg-slate-200/70 dark:bg-slate-800/60" />
                <div className="skeleton-shimmer h-3 w-full rounded-full bg-slate-200/70 dark:bg-slate-800/60" />
                <div className="flex items-center justify-between pt-3">
                  <div className="skeleton-shimmer h-6 w-20 rounded-full bg-slate-200/70 dark:bg-slate-800/60" />
                  <div className="skeleton-shimmer h-8 w-28 rounded-full bg-slate-200/70 dark:bg-slate-800/60" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
