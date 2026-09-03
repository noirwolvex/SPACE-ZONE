"use client";

import Link from "next/link";
import Image from "next/image";
import { Menu, ShoppingCart, X } from "lucide-react";
import { useEffect, useState } from "react";
import { ThemeToggle } from "./ThemeToggle";
import { useAuth } from "@/components/auth/AuthProvider";
import { loadCartFromSupabase } from "@/lib/cart";

const navLinks = [
  { href: "/services", label: "Services" },
  { href: "/websites", label: "Projects" },
  { href: "/portfolio", label: "Portfolio" },
  { href: "/tools", label: "Startup Tools" },
  { href: "/books", label: "Book" },
  { href: "/ai-chat", label: "AI Chat" },
  { href: "/about", label: "About" },
];

export default function Navbar() {
  const { user, signOut } = useAuth();
  const [cartCount, setCartCount] = useState(0);
  const [mobileOpen, setMobileOpen] = useState(false);

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

  useEffect(() => {
    const closeMenu = () => setMobileOpen(false);
    window.addEventListener("resize", closeMenu);
    return () => window.removeEventListener("resize", closeMenu);
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-indigo-900/10 bg-white/80 backdrop-blur-md dark:border-indigo-900/30 dark:bg-slate-950/50">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link
          href="/"
          onClick={() => setMobileOpen(false)}
          className="group flex items-center gap-2 text-xl font-bold tracking-tighter text-slate-900 drop-shadow-sm dark:text-white dark:drop-shadow-md"
        >
          <div className="relative h-10 w-10 transition-transform group-hover:scale-105">
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

        <div className="hidden items-center gap-6 text-sm font-medium md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-slate-600 transition hover:text-indigo-600 dark:text-slate-300 dark:hover:text-indigo-400"
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/cart"
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-slate-700 transition hover:border-indigo-400 hover:text-indigo-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
          >
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

          <div className="hidden items-center gap-2 sm:flex">
            {user ? (
              <>
                <Link
                  href="/profile"
                  className="rounded-md border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-indigo-400 hover:text-indigo-600 dark:border-slate-700 dark:text-slate-200"
                >
                  Profile
                </Link>
                <button
                  type="button"
                  onClick={() => signOut()}
                  className="rounded-md border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-indigo-400 hover:text-indigo-600 dark:border-slate-700 dark:text-slate-200"
                >
                  Log Out
                </button>
              </>
            ) : (
              <Link
                href="/login"
                className="rounded-md border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-indigo-400 hover:text-indigo-600 dark:border-slate-700 dark:text-slate-200"
              >
                Sign In
              </Link>
            )}
          </div>

          <Link
            href="/contact"
            className="hidden rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-[0_0_15px_rgba(79,70,229,0.4)] transition hover:bg-indigo-500 sm:inline-flex"
          >
            Get in Touch
          </Link>

          <button
            type="button"
            aria-label={mobileOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen((open) => !open)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 transition hover:border-indigo-400 hover:text-indigo-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 md:hidden"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="border-t border-slate-200 bg-white/95 px-4 pb-5 pt-3 shadow-xl backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/95 md:hidden">
          <div className="container mx-auto flex max-h-[calc(100vh-4rem)] flex-col gap-2 overflow-y-auto">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-indigo-500/40 dark:hover:bg-indigo-950/30"
              >
                {link.label}
              </Link>
            ))}

            <Link
              href="/cart"
              onClick={() => setMobileOpen(false)}
              className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-indigo-500/40 dark:hover:bg-indigo-950/30"
            >
              <span className="inline-flex items-center gap-2">
                <ShoppingCart className="h-4 w-4" />
                Shopping Cart
              </span>
              {cartCount > 0 && (
                <span className="inline-flex min-w-6 items-center justify-center rounded-full bg-indigo-600 px-2 py-1 text-[10px] font-bold text-white">
                  {cartCount}
                </span>
              )}
            </Link>

            {user ? (
              <>
                <Link
                  href="/profile"
                  onClick={() => setMobileOpen(false)}
                  className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-indigo-500/40 dark:hover:bg-indigo-950/30"
                >
                  Profile
                </Link>
                <button
                  type="button"
                  onClick={async () => {
                    setMobileOpen(false);
                    await signOut();
                  }}
                  className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-left text-sm font-semibold text-slate-700 transition hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-indigo-500/40 dark:hover:bg-indigo-950/30"
                >
                  Log Out
                </button>
              </>
            ) : (
              <Link
                href="/login"
                onClick={() => setMobileOpen(false)}
                className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-indigo-500/40 dark:hover:bg-indigo-950/30"
              >
                Sign In
              </Link>
            )}

            <Link
              href="/contact"
              onClick={() => setMobileOpen(false)}
              className="mt-1 inline-flex items-center justify-center rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-[0_0_18px_rgba(79,70,229,0.35)] transition hover:bg-indigo-500"
            >
              Get in Touch
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
