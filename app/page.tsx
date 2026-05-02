import Hero from "@/components/Hero";
import FeaturedServices from "@/components/FeaturedServices";
import FeaturedTools from "@/components/FeaturedTools";

export default function Home() {
  return (
    <main className="flex-1 flex flex-col">
      <Hero />
      <FeaturedServices />
      <FeaturedTools />
    </main>
  );
}
