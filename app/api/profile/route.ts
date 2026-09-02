import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { prisma } from "@/lib/prisma";
import { supabaseAdmin } from "@/lib/supabase";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

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

export async function PUT(request: NextRequest) {
  const cookieStore = await cookies();
  const supabase = createRequestSupabase(cookieStore);

  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const profile = await prisma.customer.findFirst({ where: { supabaseId: user.id } });
  if (!profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  const updated = await prisma.customer.update({
    where: { id: profile.id },
    data: {
      name: body.name ?? profile.name,
      username: body.username ?? profile.username,
      phone: body.phone ?? profile.phone,
      country: body.country ?? profile.country,
      city: body.city ?? profile.city,
      bio: body.bio ?? profile.bio,
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
    await supabaseAdmin.auth.admin.deleteUser(user.id);
    return NextResponse.json({ ok: true });
  }

  // Preserve historical orders/payments while removing the account identity.
  // Deleting Customer directly would violate the existing foreign keys for users
  // who have purchases, so the profile is anonymized instead of destroying history.
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
    // Restore the profile so a failed Auth deletion does not strand the user in
    // an anonymized state while still retaining an active Supabase account.
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
