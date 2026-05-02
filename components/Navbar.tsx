import Link from "next/link";

export default function Navbar() {
  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-white/80 backdrop-blur-md">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="text-xl font-bold tracking-tighter">
          Space Zone Media
        </Link>
        <div className="hidden md:flex items-center gap-6 text-sm font-medium">
          <Link href="/services" className="hover:text-blue-600 transition">Services</Link>
          <Link href="/portfolio" className="hover:text-blue-600 transition">Portfolio</Link>
          <Link href="/tools" className="hover:text-blue-600 transition">Startup Tools</Link>
          <Link href="/blog" className="hover:text-blue-600 transition">Blog</Link>
          <Link href="/about" className="hover:text-blue-600 transition">About</Link>
        </div>
        <div className="flex items-center gap-4">
          <Link
            href="/contact"
            className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 transition"
          >
            Get in Touch
          </Link>
        </div>
      </div>
    </nav>
  );
}
