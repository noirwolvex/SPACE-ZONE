import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { prisma } from "@/lib/prisma";
import ProfilePageClient from "@/components/profile/ProfilePageClient";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
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
    redirect("/login?redirectTo=/profile");
  }

  const profile = await prisma.customer.findFirst({
    where: { supabaseId: user.id },
    include: {
      orders: {
        include: {
          items: {
            include: {
              tool: true,
            },
          },
        },
      },
    },
  });

  const customer = profile ?? (await prisma.customer.findFirst({ where: { email: user.email ?? "" } }));

  const profileData = customer
    ? {
        ...customer,
        createdAt: customer.createdAt.toISOString(),
        updatedAt: customer.updatedAt.toISOString(),
      }
    : null;

  return <ProfilePageClient user={user} profile={profileData} />;
}
