import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { prisma } from "@/lib/prisma";
import { getBookCoverUrl } from "@/lib/book-storage";
import { getWebsiteImageUrl } from "@/lib/website-storage";
import ProfilePageClient from "@/components/profile/ProfilePageClient";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll(cookiesToSet) { cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options)); },
      },
    },
  );

  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) redirect("/login?redirectTo=/profile");

  const profile = await prisma.customer.findFirst({ where: { supabaseId: user.id } });
  const customer = profile ?? (await prisma.customer.findFirst({ where: { email: user.email ?? "" } }));
  if (!customer) return <ProfilePageClient user={user} profile={null} stats={{ books: 0, websites: 0, orders: 0 }} purchases={{ books: [], websites: [] }} />;

  const [books, websites, bookCount, websiteCount, orders] = await Promise.all([
    prisma.purchasedBook.findMany({
      where: { customerId: customer.id, status: "COMPLETED" },
      orderBy: { purchasedAt: "desc" }, take: 6,
      include: { book: { select: { id: true, title: true, filename: true, coverImage: true } } },
    }),
    prisma.websitePurchase.findMany({
      where: { customerId: customer.id, status: "PAID" },
      orderBy: { purchasedAt: "desc" }, take: 6,
      include: { website: { select: { id: true, title: true, slug: true, image: true, websiteUrl: true } } },
    }),
    prisma.purchasedBook.count({ where: { customerId: customer.id, status: "COMPLETED" } }),
    prisma.websitePurchase.count({ where: { customerId: customer.id, status: "PAID" } }),
    prisma.order.count({ where: { customerId: customer.id } }),
  ]);

  const bookItems = await Promise.all(books.map(async (purchase) => ({
    id: purchase.id, bookId: purchase.book.id,
    title: purchase.book.title ?? purchase.book.filename,
    purchasedAt: purchase.purchasedAt.toISOString(),
    price: purchase.price != null ? Number(purchase.price) : null,
    currency: purchase.currency,
    coverImageUrl: await getBookCoverUrl(purchase.book.coverImage),
  })));

  const websiteItems = await Promise.all(websites.map(async (purchase) => ({
    id: purchase.id, title: purchase.website.title, slug: purchase.website.slug,
    websiteUrl: purchase.website.websiteUrl,
    purchasedAt: purchase.purchasedAt?.toISOString() ?? purchase.createdAt.toISOString(),
    price: Number(purchase.price), currency: purchase.currency,
    imageUrl: await getWebsiteImageUrl(purchase.website.image),
  })));

  const profileData = { ...customer, createdAt: customer.createdAt.toISOString(), updatedAt: customer.updatedAt.toISOString() };

  return <ProfilePageClient user={user} profile={profileData} stats={{ books: bookCount, websites: websiteCount, orders }} purchases={{ books: bookItems, websites: websiteItems }} />;
}
