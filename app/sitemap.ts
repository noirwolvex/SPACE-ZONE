import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type SitemapRecord = { slug: string; updatedAt: Date };

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");
  let services: SitemapRecord[] = [];
  let tools: SitemapRecord[] = [];
  let blogs: SitemapRecord[] = [];
  let portfolio: SitemapRecord[] = [];

  try {
    [services, tools, blogs, portfolio] = await Promise.all([
      prisma.service.findMany({ select: { slug: true, updatedAt: true } }),
      prisma.startupTool.findMany({ select: { slug: true, updatedAt: true } }),
      prisma.blogPost.findMany({ select: { slug: true, updatedAt: true } }),
      prisma.portfolioProject.findMany({ select: { slug: true, updatedAt: true } }),
    ]);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn(`[SpaceZone] Dynamic sitemap records could not be loaded; returning static routes only. ${message}`);
  }

  const staticRoutes = ["/", "/about", "/services", "/portfolio", "/tools", "/blog", "/contact", "/websites", "/books"];
  const entries: MetadataRoute.Sitemap = staticRoutes.map((path) => ({
    url: `${baseUrl}${path}`,
    changeFrequency: "weekly",
    priority: path === "/" ? 1 : 0.7,
  }));

  return [
    ...entries,
    ...services.map((item) => ({ url: `${baseUrl}/services/${item.slug}`, lastModified: item.updatedAt, changeFrequency: "weekly" as const, priority: 0.8 })),
    ...tools.map((item) => ({ url: `${baseUrl}/tools/${item.slug}`, lastModified: item.updatedAt, changeFrequency: "weekly" as const, priority: 0.8 })),
    ...blogs.map((item) => ({ url: `${baseUrl}/blog/${item.slug}`, lastModified: item.updatedAt, changeFrequency: "weekly" as const, priority: 0.7 })),
    ...portfolio.map((item) => ({ url: `${baseUrl}/portfolio/${item.slug}`, lastModified: item.updatedAt, changeFrequency: "monthly" as const, priority: 0.7 })),
  ];
}
