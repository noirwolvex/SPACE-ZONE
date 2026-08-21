import Link from "next/link";

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-slate-50 px-4 py-16 dark:bg-[#050505]">
      <div className="mx-auto max-w-4xl rounded-[32px] border border-slate-200/80 bg-white/80 p-8 shadow-[0_25px_80px_rgba(15,23,42,0.12)] backdrop-blur-2xl dark:border-slate-800 dark:bg-slate-900/70">
        <h1 className="text-3xl font-semibold tracking-tight">Your dashboard</h1>
        <p className="mt-3 text-slate-600 dark:text-slate-300">This area is protected and only visible to authenticated users.</p>
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <Link href="/library" className="rounded-2xl border border-slate-200 bg-slate-50 p-4 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-950/60 dark:hover:bg-slate-800">
            My library
          </Link>
          <Link href="/purchased-books" className="rounded-2xl border border-slate-200 bg-slate-50 p-4 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-950/60 dark:hover:bg-slate-800">
            Purchased books
          </Link>
        </div>
      </div>
    </div>
  );
}
