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

  return children;
}
