"use client";

import Link from "next/link";
import Image from "next/image";
import { ShoppingCart } from "lucide-react";
import { useEffect, useState } from "react";
import { ThemeToggle } from "./ThemeToggle";
import { useAuth } from "@/components/auth/AuthProvider";
import { loadCartFromSupabase } from "@/lib/cart";

export default function Navbar() {
  const { user, signOut } = useAuth();
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    const updateCart = async () => {
      const items = await loadCartFromSupabase();
      setCartCount(items.length);
    };

    updateCart();
    window.addEventListener("spacezone-cart-updated", updateCart);

    return () => {
      window.removeEventListener("spacezone-cart-updated", updateCart);
    };
  }, []);

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-indigo-900/10 dark:border-indigo-900/30 bg-white/80 dark:bg-slate-950/50 backdrop-blur-md">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 text-xl font-bold tracking-tighter text-slate-900 dark:text-white drop-shadow-sm dark:drop-shadow-md group">
          <div className="relative w-10 h-10 transition-transform group-hover:scale-105">
            <Image
              src="/spacezone-logo.jfif"
              alt="Space Zone Media Logo"
              fill
              sizes="40px"
              className="object-contain"
            />
          </div>
          Space Zone Media
        </Link>
        <div className="hidden md:flex items-center gap-6 text-sm font-medium">
          <Link href="/services" className="text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition">Services</Link>
          <Link href="/websites" className="text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition">Projects</Link>
          <Link href="/portfolio" className="text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition">Portfolio</Link>
          <Link href="/tools" className="text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition">Startup Tools</Link>
          <Link href="/books" className="text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition">Book</Link>
          <Link href="/ai-chat" className="text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition">AI Chat</Link>
          <Link href="/about" className="text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition">About</Link>
          <Link href="/cart" className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-slate-700 transition hover:border-indigo-400 hover:text-indigo-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
            <ShoppingCart className="h-4 w-4" />
            <span># Shopping Cart</span>
            {cartCount > 0 && (
              <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-indigo-600 px-1.5 py-0.5 text-[10px] font-bold text-white">
                {cartCount}
              </span>
            )}
          </Link>
        </div>
        <div className="flex items-center gap-2 md:gap-4">
          <ThemeToggle />
          {user ? (
            <>
              <Link
                href="/profile"
                className="hidden rounded-md border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-indigo-400 hover:text-indigo-600 dark:border-slate-700 dark:text-slate-200 sm:block"
              >
                Profile
              </Link>
              <button
                type="button"
                onClick={() => signOut()}
                className="hidden rounded-md border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-indigo-400 hover:text-indigo-600 dark:border-slate-700 dark:text-slate-200 sm:block"
              >
                Log Out
              </button>
            </>
          ) : (
            <Link href="/login" className="hidden rounded-md border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-indigo-400 hover:text-indigo-600 dark:border-slate-700 dark:text-slate-200 sm:block">
              Sign In
            </Link>
          )}
          <Link
            href="/contact"
            className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 shadow-[0_0_15px_rgba(79,70,229,0.4)] transition"
          >
            Get in Touch
          </Link>
        </div>
      </div>
    </nav>
  );
}
