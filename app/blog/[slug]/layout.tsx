import type { Metadata } from "next";
import { metadataForEntity } from "@/lib/seo";
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> { const { slug } = await params; return metadataForEntity("blog", slug, "SPACE ZONE Journal"); }
export default function BlogSlugLayout({ children }: { children: React.ReactNode }) { return children; }
