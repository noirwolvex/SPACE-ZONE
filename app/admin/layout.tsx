import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";

/**
 * Server-side gate for every /admin route.
 *
 * Authorization is decided here, on the server, from the Supabase session and
 * the linked Customer.role. The admin pages below are plain UI and hold no
 * credentials of their own.
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const auth = await getCurrentUser();

  if (!auth) {
    redirect("/login?redirectTo=/admin");
  }

  if (!auth.isAdmin) {
    redirect("/?error=admin_access_required");
  }

  return (
    <>
      <nav className="border-b border-slate-200 bg-white px-4 py-3 dark:border-indigo-500/20 dark:bg-[#080b14]">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-2">
          <Link
            href="/admin/portfolio"
            className="group rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-2 transition hover:border-indigo-400 hover:bg-indigo-100 dark:border-indigo-500/30 dark:bg-indigo-950/30 dark:hover:bg-indigo-950/50"
          >
            <span className="block text-[11px] font-bold uppercase tracking-[0.16em] text-indigo-600 dark:text-indigo-300">
              Admin · Portfolio
            </span>
            <span className="mt-0.5 block text-sm font-extrabold text-slate-950 dark:text-white">
              Selected Work
            </span>
          </Link>
        </div>
      </nav>
      {children}
    </>
  );
}
