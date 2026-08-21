import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { createReadStream } from "fs";
import path from "path";
import { supabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        },
      },
    },
  );

  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("avatar");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Avatar file is required" }, { status: 400 });
  }

  const profile = await prisma.customer.findFirst({ where: { supabaseId: user.id } });
  if (!profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  const filePath = `${user.id}/${Date.now()}-${file.name}`;
  const bytes = Buffer.from(await file.arrayBuffer());
  const { error: uploadError } = await supabaseAdmin.storage.from("avatars").upload(filePath, bytes, {
    contentType: file.type || "image/png",
    upsert: false,
  });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  const { data: publicUrlData } = supabaseAdmin.storage.from("avatars").getPublicUrl(filePath);
  const publicUrl = publicUrlData.publicUrl;

  if (profile.avatar && profile.avatar !== publicUrl) {
    const previousPath = profile.avatar.replace(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/avatars/`, "");
    await supabaseAdmin.storage.from("avatars").remove([decodeURIComponent(previousPath)]).catch(() => undefined);
  }

  const updated = await prisma.customer.update({ where: { id: profile.id }, data: { avatar: publicUrl } });
  return NextResponse.json({ ok: true, avatarUrl: publicUrl, profile: updated });
}
