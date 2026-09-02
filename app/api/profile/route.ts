import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { prisma } from "@/lib/prisma";
import { supabaseAdmin } from "@/lib/supabase";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

const PROFILE_FIELD_LIMITS = {
  name: 120,
  username: 60,
  phone: 40,
  country: 80,
  city: 80,
  bio: 1000,
} as const;

function createRequestSupabase(cookieStore: Awaited<ReturnType<typeof cookies>>) {
  return createServerClient(
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
}

function optionalText(value: unknown, maxLength: number, field: string) {
  if (value == null) return { value: undefined as string | null | undefined };
  if (typeof value !== "string") return { error: `${field} must be text.` };

  const normalized = value.trim();
  if (normalized.length > maxLength) return { error: `${field} must be ${maxLength} characters or fewer.` };
  return { value: normalized || null };
}

export async function PUT(request: NextRequest) {
  const cookieStore = await cookies();
  const supabase = createRequestSupabase(cookieStore);

  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid profile payload." }, { status: 400 });
  }

  const profile = await prisma.customer.findFirst({ where: { supabaseId: user.id } });
  if (!profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  const parsedFields = {
    name: optionalText((body as Record<string, unknown>).name, PROFILE_FIELD_LIMITS.name, "Name"),
    username: optionalText((body as Record<string, unknown>).username, PROFILE_FIELD_LIMITS.username, "Username"),
    phone: optionalText((body as Record<string, unknown>).phone, PROFILE_FIELD_LIMITS.phone, "Phone"),
    country: optionalText((body as Record<string, unknown>).country, PROFILE_FIELD_LIMITS.country, "Country"),
    city: optionalText((body as Record<string, unknown>).city, PROFILE_FIELD_LIMITS.city, "City"),
    bio: optionalText((body as Record<string, unknown>).bio, PROFILE_FIELD_LIMITS.bio, "Bio"),
  };

  const validationError = Object.values(parsedFields).find((field) => "error" in field)?.error;
  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 });
  }

  const updated = await prisma.customer.update({
    where: { id: profile.id },
    data: {
      name: "value" in parsedFields.name ? parsedFields.name.value : profile.name,
      username: "value" in parsedFields.username ? parsedFields.username.value : profile.username,
      phone: "value" in parsedFields.phone ? parsedFields.phone.value : profile.phone,
      country: "value" in parsedFields.country ? parsedFields.country.value : profile.country,
      city: "value" in parsedFields.city ? parsedFields.city.value : profile.city,
      bio: "value" in parsedFields.bio ? parsedFields.bio.value : profile.bio,
    },
  });

  return NextResponse.json({ ok: true, profile: updated });
}

export async function DELETE(_request: NextRequest) {
  const cookieStore = await cookies();
  const supabase = createRequestSupabase(cookieStore);

  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const profile = await prisma.customer.findFirst({ where: { supabaseId: user.id } });
  if (!profile) {
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(user.id);
    if (deleteError) {
      return NextResponse.json({ error: "Unable to delete the account right now. Please try again later." }, { status: 502 });
    }
    return NextResponse.json({ ok: true });
  }

  const anonymizedEmail = `deleted+${profile.id}@users.spacezone.invalid`;

  await prisma.$transaction(async (tx) => {
    await tx.shoppingCartItem.deleteMany({ where: { customerId: profile.id } });
    await tx.customer.update({
      where: { id: profile.id },
      data: {
        email: anonymizedEmail,
        name: null,
        username: null,
        phone: null,
        country: null,
        city: null,
        bio: null,
        avatar: null,
        supabaseId: null,
        role: "USER",
      },
    });
  });

  try {
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(user.id);
    if (deleteError) throw deleteError;
  } catch (deleteError) {
    try {
      await prisma.customer.update({
        where: { id: profile.id },
        data: {
          email: profile.email,
          name: profile.name,
          username: profile.username,
          phone: profile.phone,
          country: profile.country,
          city: profile.city,
          bio: profile.bio,
          avatar: profile.avatar,
          supabaseId: profile.supabaseId,
          role: profile.role,
        },
      });
    } catch (restoreError) {
      console.error("Failed to restore profile after Auth deletion failure:", restoreError);
    }

    console.error("Supabase Auth account deletion failed:", deleteError);
    return NextResponse.json(
      { error: "Unable to delete the account right now. Please try again later." },
      { status: 502 }
    );
  }

  return NextResponse.json({ ok: true });
}
