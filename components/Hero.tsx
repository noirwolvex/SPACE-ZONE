import Link from "next/link";

export default function Hero() {
  return (
    <section className="relative overflow-hidden bg-white dark:bg-gray-950 pt-24 pb-32 transition-colors">
      <div className="container mx-auto px-4 text-center">
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-gray-900 dark:text-gray-50 mb-6">
          Launch Your Digital Journey <br className="hidden md:block" />
          <span className="text-blue-600 dark:text-blue-500">to the Next Orbit</span>
        </h1>
        <p className="mt-4 text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto mb-10">
          Space Zone Media is a premium corporate agency and digital tools marketplace designed to accelerate your startup's growth and online presence.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/services"
            className="rounded-full bg-blue-600 px-8 py-3.5 text-lg font-medium text-white hover:bg-blue-700 dark:hover:bg-blue-600 transition w-full sm:w-auto shadow-lg shadow-blue-500/30"
          >
            Explore Services
          </Link>
          <Link
            href="/tools"
            className="rounded-full border-2 border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 px-8 py-3.5 text-lg font-medium text-gray-900 dark:text-gray-100 hover:border-gray-300 dark:hover:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-900 transition w-full sm:w-auto"
          >
            Browse Startup Tools
          </Link>
        </div>
      </div>
      
      {/* Background decoration */}
      <div className="absolute top-0 -translate-y-12 -z-10 left-1/2 -translate-x-1/2 w-[800px] h-[400px] opacity-30 dark:opacity-20 rounded-[100%] bg-gradient-to-b from-blue-100 dark:from-blue-900 to-transparent blur-3xl pointer-events-none" />
    </section>
  );
}
