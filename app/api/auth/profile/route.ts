import { NextRequest, NextResponse } from "next/server";
import { ensureProfileForUser } from "@/lib/auth";
import { createServerSupabaseClient, supabaseAdmin } from "@/lib/supabase";

const MAX_FULL_NAME_LENGTH = 120;

function getFullName(body: unknown, fallback: string) {
  const value =
    typeof body === "object" && body !== null
      ? (body as Record<string, unknown>).fullName ??
        (body as Record<string, unknown>).name ??
        (body as Record<string, unknown>).full_name
      : undefined;

  if (typeof value !== "string") return fallback;
  const normalized = value.trim();
  return normalized.slice(0, MAX_FULL_NAME_LENGTH) || fallback;
}

export async function POST(request: NextRequest) {
  const response = NextResponse.json({ ok: true });

  try {
    const body = await request.json();
    const accessToken = request.headers.get("x-access-token");
    const supabase = createServerSupabaseClient(request, response);

    if (!accessToken) {
      const { data, error } = await supabase.auth.getUser();
      if (error || !data.user) {
        return NextResponse.json({ error: "Invalid authentication session" }, { status: 401 });
      }

      const email = data.user.email;
      if (!email) {
        return NextResponse.json({ error: "Missing email" }, { status: 400 });
      }

      const fallbackName = email.split("@")[0] || "User";
      const fullName = getFullName(body, data.user.user_metadata?.full_name || fallbackName);

      await ensureProfileForUser({
        id: data.user.id,
        email,
        user_metadata: {
          full_name: fullName,
        },
      });

      return response;
    }

    const { data, error } = await supabaseAdmin.auth.getUser(accessToken);
    if (error || !data.user) {
      return NextResponse.json({ error: "Invalid authentication session" }, { status: 401 });
    }

    const email = data.user.email;
    if (!email) {
      return NextResponse.json({ error: "Missing email" }, { status: 400 });
    }

    const fallbackName = email.split("@")[0] || "User";
    const fullName = getFullName(body, data.user.user_metadata?.full_name || fallbackName);

    await ensureProfileForUser({
      id: data.user.id,
      email,
      user_metadata: {
        full_name: fullName,
      },
    });

    return response;
  } catch {
    return NextResponse.json({ error: "Unable to create profile" }, { status: 500 });
  }
}
