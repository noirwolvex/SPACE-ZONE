import type { Metadata } from "next";
import { metadataForEntity } from "@/lib/seo";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> { const { slug } = await params; return metadataForEntity("tool", slug, "SPACE ZONE Startup Tool"); }
export default function ToolSlugLayout({ children }: { children: React.ReactNode }) { return children; }
