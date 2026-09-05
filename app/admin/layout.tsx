import Link from "next/link";

/**
 * Admin is rendered as a client-authenticated workspace. Authorization for all
 * mutations and data APIs remains enforced by the server-side admin API routes.
 */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const links = [
    ["Services", "/admin/services"],
    ["Tools", "/admin"],
    ["About", "/admin/about"],
    ["Books", "/admin/books"],
    ["Websites", "/admin/websites"],
    ["Portfolio", "/admin/portfolio"],
    ["Messages", "/admin/messages"],
  ] as const;

  return (
    <>
      <nav className="border-b border-slate-200 bg-white px-4 py-3 dark:border-indigo-500/20 dark:bg-[#080b14]">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-2">
          {links.map(([label, href]) => (
            <Link
              key={href}
              href={href}
              className="group rounded-xl border border-slate-200 bg-white px-4 py-2 transition hover:border-indigo-400 hover:bg-indigo-50 dark:border-indigo-500/30 dark:bg-slate-900 dark:hover:bg-indigo-950/40"
            >
              <span className="block text-[11px] font-bold uppercase tracking-[0.16em] text-indigo-600 dark:text-indigo-300">
                Admin
              </span>
              <span className="mt-0.5 block text-sm font-extrabold text-slate-950 dark:text-white">
                {label}
              </span>
            </Link>
          ))}
        </div>
      </nav>
      {children}
    </>
  );
}
