import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth";

/**
 * Admin authorization based on the existing Supabase session.
 *
 * The caller must have a valid Supabase session whose linked Customer row has
 * role === "ADMIN". There are no static credentials and no shared secret, so
 * nothing admin-related is shippable in the client bundle.
 */
export type AdminAuthResult =
  | { ok: true; customerId: string; email: string | null }
  | { ok: false; response: NextResponse };

export async function requireAdmin(request: NextRequest): Promise<AdminAuthResult> {
  const response = NextResponse.next();
  const auth = await getUserFromRequest(request, response);

  if (!auth) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Authentication required.", code: "AUTH_REQUIRED" },
        { status: 401 }
      ),
    };
  }

  if (!auth.isAdmin || !auth.profile) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Administrator access required.", code: "FORBIDDEN" },
        { status: 403 }
      ),
    };
  }

  return { ok: true, customerId: auth.profile.id, email: auth.profile.email ?? null };
}
