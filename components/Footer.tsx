import Link from "next/link";
import Image from "next/image";

export default function Footer() {
  return (
    <footer className="bg-slate-50 dark:bg-[#050505] py-12 text-slate-600 dark:text-slate-300 border-t border-slate-200 dark:border-indigo-900/50 mt-auto relative z-10 transition-colors">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div className="md:col-span-1">
            <Link href="/" className="flex items-center gap-2 text-xl font-bold tracking-tighter text-slate-900 dark:text-white mb-4 drop-shadow-sm dark:drop-shadow-md group">
              <div className="relative w-10 h-10 transition-transform group-hover:scale-105">
                <Image
                  src="/spacezone-logo.jfif"
                  alt="Space Zone Media Logo"
                  fill
                  className="object-contain"
                />
              </div>
              Space Zone Media
            </Link>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Empowering startups and businesses with cutting-edge digital solutions and tools.
            </p>
          </div>
          <div>
            <h3 className="text-slate-900 dark:text-white font-semibold mb-4 drop-shadow-sm dark:drop-shadow">Company</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/about" className="text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition">About Us</Link></li>
              <li><Link href="/contact" className="text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition">Contact</Link></li>
              <li><Link href="/blog" className="text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition">Blog</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-slate-900 dark:text-white font-semibold mb-4 drop-shadow-sm dark:drop-shadow">Services</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/services" className="text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition">Web Development</Link></li>
              <li><Link href="/services" className="text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition">SEO Marketing</Link></li>
              <li><Link href="/portfolio" className="text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition">Our Work</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-slate-900 dark:text-white font-semibold mb-4 drop-shadow-sm dark:drop-shadow">Marketplace</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/tools" className="text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition">Startup Tools</Link></li>
              <li><Link href="/tools" className="text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition">SaaS Products</Link></li>
              <li><Link href="/tools" className="text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition">Templates</Link></li>
            </ul>
          </div>
        </div>
        <div className="pt-8 border-t border-slate-200 dark:border-indigo-900/30 text-sm text-slate-500 dark:text-slate-400 flex flex-col md:flex-row items-center justify-between">
          <p>© {new Date().getFullYear()} Space Zone Media. All rights reserved.</p>
          <div className="flex space-x-4 mt-4 md:mt-0">
            <Link href="#" className="hover:text-indigo-400 transition">Privacy Policy</Link>
            <Link href="#" className="hover:text-indigo-400 transition">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
