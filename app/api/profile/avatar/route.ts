import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { supabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

const MAX_AVATAR_SIZE = 5 * 1024 * 1024;
const ALLOWED_AVATAR_TYPES = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
]);

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

  const extension = ALLOWED_AVATAR_TYPES.get(file.type);
  if (!extension) {
    return NextResponse.json({ error: "Only JPG, PNG, and WebP avatars are supported" }, { status: 415 });
  }

  if (file.size <= 0 || file.size > MAX_AVATAR_SIZE) {
    return NextResponse.json({ error: "Avatar must be between 1 byte and 5 MB" }, { status: 413 });
  }

  const profile = await prisma.customer.findFirst({ where: { supabaseId: user.id } });
  if (!profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  const filePath = `${user.id}/${crypto.randomUUID()}.${extension}`;
  const bytes = Buffer.from(await file.arrayBuffer());
  const { error: uploadError } = await supabaseAdmin.storage.from("avatars").upload(filePath, bytes, {
    contentType: file.type,
    upsert: false,
  });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  const { data: publicUrlData } = supabaseAdmin.storage.from("avatars").getPublicUrl(filePath);
  const publicUrl = publicUrlData.publicUrl;

  if (profile.avatar && profile.avatar !== publicUrl) {
    const prefix = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/avatars/`;
    const previousPath = profile.avatar.startsWith(prefix) ? profile.avatar.slice(prefix.length) : "";
    if (previousPath) {
      await supabaseAdmin.storage.from("avatars").remove([decodeURIComponent(previousPath)]).catch(() => undefined);
    }
  }

  try {
    const updated = await prisma.customer.update({
      where: { id: profile.id },
      data: { avatar: publicUrl },
    });
    return NextResponse.json({ ok: true, avatarUrl: publicUrl, profile: updated });
  } catch (updateError) {
    await supabaseAdmin.storage.from("avatars").remove([filePath]).catch(() => undefined);
    console.error("Failed to save avatar URL:", updateError);
    return NextResponse.json({ error: "Avatar upload could not be completed" }, { status: 500 });
  }
}
