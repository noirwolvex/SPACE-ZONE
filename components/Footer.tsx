import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-gray-900 py-12 text-gray-300 border-t border-gray-800 mt-auto">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div className="md:col-span-1">
            <Link href="/" className="text-xl font-bold tracking-tighter text-white mb-4 block">
              Space Zone Media
            </Link>
            <p className="text-sm text-gray-400">
              Empowering startups and businesses with cutting-edge digital solutions and tools.
            </p>
          </div>
          <div>
            <h3 className="text-white font-semibold mb-4">Company</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/about" className="hover:text-white transition">About Us</Link></li>
              <li><Link href="/contact" className="hover:text-white transition">Contact</Link></li>
              <li><Link href="/blog" className="hover:text-white transition">Blog</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-white font-semibold mb-4">Services</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/services" className="hover:text-white transition">Web Development</Link></li>
              <li><Link href="/services" className="hover:text-white transition">SEO Marketing</Link></li>
              <li><Link href="/portfolio" className="hover:text-white transition">Our Work</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-white font-semibold mb-4">Marketplace</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/tools" className="hover:text-white transition">Startup Tools</Link></li>
              <li><Link href="/tools" className="hover:text-white transition">SaaS Products</Link></li>
              <li><Link href="/tools" className="hover:text-white transition">Templates</Link></li>
            </ul>
          </div>
        </div>
        <div className="pt-8 border-t border-gray-800 text-sm text-gray-400 flex flex-col md:flex-row items-center justify-between">
          <p>© {new Date().getFullYear()} Space Zone Media. All rights reserved.</p>
          <div className="flex space-x-4 mt-4 md:mt-0">
            <Link href="#" className="hover:text-white transition">Privacy Policy</Link>
            <Link href="#" className="hover:text-white transition">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
