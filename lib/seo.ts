import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";

export async function metadataForEntity(kind:"service"|"tool"|"blog"|"portfolio", slug:string, fallbackTitle:string):Promise<Metadata>{
  const relation = kind === "service" ? { service:{ slug } } : kind === "tool" ? { startupTool:{ slug } } : kind === "blog" ? { blogPost:{ slug } } : { portfolioProject:{ slug } };
  const seo = await prisma.seoMetadata.findFirst({ where: relation as never, select:{ title:true, description:true, ogImage:true } }).catch(()=>null);
  if (!seo) return { title: fallbackTitle };
  return { title: seo.title || fallbackTitle, description: seo.description || undefined, openGraph: seo.ogImage ? { images:[seo.ogImage] } : undefined };
}
