import { createServerComponentSupabaseClient, createServerSupabaseClient } from "@/lib/supabase";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function ensureProfileForUser(user: { id: string; email?: string | null; user_metadata?: { full_name?: string; name?: string; avatar_url?: string } }) {
  if (!user.email) {
    return null;
  }

  const bySupabaseId = await prisma.customer.findUnique({ where: { supabaseId: user.id } });
  if (bySupabaseId) {
    return bySupabaseId;
  }

  const existing = await prisma.customer.findUnique({ where: { email: user.email } });

  if (existing) {
    if (!existing.supabaseId) {
      try {
        return await prisma.customer.update({
          where: { id: existing.id },
          data: {
            supabaseId: user.id,
            avatar: user.user_metadata?.avatar_url ?? existing.avatar ?? null,
          },
        });
      } catch (error) {
        console.warn("Unable to link existing customer profile to Supabase user:", error);
        return prisma.customer.findUnique({ where: { supabaseId: user.id } });
      }
    }
    return existing;
  }

  try {
    return await prisma.customer.create({
      data: {
        email: user.email,
        name: user.user_metadata?.full_name || user.user_metadata?.name || user.email.split("@")[0],
        supabaseId: user.id,
        avatar: user.user_metadata?.avatar_url ?? null,
        role: "USER",
      },
    });
  } catch (error) {
    // Another request may have created the profile between find and create.
    console.warn("Customer profile creation raced with another request:", error);
    return prisma.customer.findUnique({ where: { supabaseId: user.id } }) ??
      prisma.customer.findUnique({ where: { email: user.email } });
  }
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
 * Authentication failures must not take public storefront pages down.
 */
export async function getCurrentUser() {
  try {
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
  } catch (error) {
    console.warn("Server session lookup failed; continuing as signed out:", error);
    return null;
  }
}
