import { prisma } from "@/lib/prisma";
import { createServerComponentSupabaseClient, createServerSupabaseClient } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";

export async function ensureProfileForUser(user: { id: string; email?: string | null; user_metadata?: { full_name?: string; name?: string; avatar_url?: string } }) {
  if (!user.email) {
    return null;
  }

  const existing = await prisma.customer.findFirst({ where: { email: user.email } });

  if (existing) {
    if (!existing.supabaseId && user.id) {
      await prisma.customer.update({
        where: { id: existing.id },
        data: { supabaseId: user.id, avatar: user.user_metadata?.avatar_url ?? existing.avatar ?? null },
      });
    }
    return existing;
  }

  return prisma.customer.create({
    data: {
      email: user.email,
      name: user.user_metadata?.full_name || user.user_metadata?.name || user.email.split("@")[0],
      supabaseId: user.id,
      avatar: user.user_metadata?.avatar_url ?? null,
      role: "USER",
    },
  });
}

export async function getUserFromRequest(request: NextRequest, response: NextResponse) {
  const supabase = createServerSupabaseClient(request, response);
  const { data: userData, error } = await supabase.auth.getUser();
  if (error || !userData.user) {
    return null;
  }

  const profile = await ensureProfileForUser(userData.user);
  const role = profile?.role === "ADMIN" ? "ADMIN" : "USER";

  return {
    user: userData.user,
    profile,
    role,
    isAdmin: role === "ADMIN",
  };
}

/**
 * Session lookup for Server Components / pages.
 * Returns null when there is no authenticated Supabase user.
 */
export async function getCurrentUser() {
  const supabase = await createServerComponentSupabaseClient();
  const { data: userData, error } = await supabase.auth.getUser();
  if (error || !userData.user) {
    return null;
  }

  const profile = await ensureProfileForUser(userData.user);
  const role = profile?.role === "ADMIN" ? "ADMIN" : "USER";

  return {
    user: userData.user,
    profile,
    role,
    isAdmin: role === "ADMIN",
  };
}
