import type { Metadata } from "next";
import { metadataForEntity } from "@/lib/seo";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  return metadataForEntity("portfolio", slug, "Portfolio Project | Space Zone Media");
}

export default function PortfolioProjectLayout({ children }: { children: React.ReactNode }) {
  return children;
}
