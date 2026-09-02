import Hero from "@/components/Hero";
import FeaturedServices from "@/components/FeaturedServices";
import FeaturedPlatforms from "@/components/FeaturedPlatforms";
import FeaturedTools from "@/components/FeaturedTools";

export default function Home() {
  return (
    <>
      <main className="flex-1 flex flex-col bg-slate-50 dark:bg-[#050505] transition-colors">
        <Hero />
        <FeaturedServices />
        <FeaturedPlatforms />
        <FeaturedTools />
      </main>
    </>
  );
}
