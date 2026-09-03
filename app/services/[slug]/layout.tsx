import type { Metadata } from "next";
import { metadataForEntity } from "@/lib/seo";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  return metadataForEntity("service", slug, "SPACE ZONE Service");
}

export default function ServiceSlugLayout({ children }: { children: React.ReactNode }) { return children; }
