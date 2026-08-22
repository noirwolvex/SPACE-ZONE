import Link from "next/link";

/**
 * Admin is rendered as a client-authenticated workspace. Authorization for all
 * mutations and data APIs remains enforced by the server-side admin API routes.
 */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <nav className="border-b border-slate-200 bg-white px-4 py-3 dark:border-indigo-500/20 dark:bg-[#080b14]">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-2">
          <Link
            href="/admin"
            className="group rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-2 transition hover:border-indigo-400 hover:bg-indigo-100 dark:border-indigo-500/30 dark:bg-indigo-950/30 dark:hover:bg-indigo-950/50"
          >
            <span className="block text-[11px] font-bold uppercase tracking-[0.16em] text-indigo-600 dark:text-indigo-300">
              Admin
            </span>
            <span className="mt-0.5 block text-sm font-extrabold text-slate-950 dark:text-white">
              Dashboard
            </span>
          </Link>
        </div>
      </nav>
      {children}
    </>
  );
}
