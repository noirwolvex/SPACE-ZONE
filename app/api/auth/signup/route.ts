import { NextRequest, NextResponse } from "next/server";
import { ensureProfileForUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = typeof body?.password === "string" ? body.password : "";
    const fullName =
      (typeof body?.fullName === "string" ? body.fullName.trim() : "") ||
      (typeof body?.name === "string" ? body.name.trim() : "") ||
      "User";

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: false,
      user_metadata: {
        full_name: fullName,
      },
    });

    if (error || !data.user) {
      return NextResponse.json({ error: error?.message ?? "Unable to create account." }, { status: 400 });
    }

    await ensureProfileForUser({
      id: data.user.id,
      email: data.user.email ?? email,
      user_metadata: {
        full_name: fullName,
      },
    });

    return NextResponse.json({
      ok: true,
      userId: data.user.id,
      requiresEmailVerification: true,
    });
  } catch (error) {
    console.error("Signup route error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to create account right now." },
      { status: 500 }
    );
  }
}
