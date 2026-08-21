import { NextRequest, NextResponse } from "next/server";
import { ensureProfileForUser } from "@/lib/auth";
import { createServerSupabaseClient, supabaseAdmin } from "@/lib/supabase";

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

      const fullName = body?.fullName || body?.name || body?.full_name || body?.email?.split("@")[0] || "User";
      const email = body?.email || data.user.email;

      if (!email) {
        return NextResponse.json({ error: "Missing email" }, { status: 400 });
      }

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

    const fullName = body?.fullName || body?.name || body?.full_name || data.user.user_metadata?.full_name || data.user.email?.split("@")[0] || "User";
    const email = body?.email || data.user.email;

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
