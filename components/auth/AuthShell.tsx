"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";

interface AuthShellProps {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footerText: string;
  footerLink: string;
  footerLinkText: string;
}

export function AuthShell({
  title,
  subtitle,
  children,
  footerText,
  footerLink,
  footerLinkText,
}: AuthShellProps) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(99,102,241,0.18),_transparent_38%),radial-gradient(circle_at_bottom_right,_rgba(16,185,129,0.18),_transparent_32%),linear-gradient(135deg,_rgba(255,255,255,0.98),_rgba(239,246,255,0.95))] px-4 py-10 text-slate-900 transition-colors dark:bg-[radial-gradient(circle_at_top_left,_rgba(99,102,241,0.2),_transparent_35%),radial-gradient(circle_at_bottom_right,_rgba(16,185,129,0.2),_transparent_30%),linear-gradient(135deg,_rgba(2,6,23,0.98),_rgba(15,23,42,0.96))] dark:text-slate-100 sm:px-6 lg:px-8">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -left-10 top-12 h-40 w-40 rounded-full bg-indigo-500/20 blur-3xl" />
        <div className="absolute bottom-10 right-0 h-56 w-56 rounded-full bg-emerald-500/20 blur-3xl" />
      </div>

      <div className="relative mx-auto flex max-w-6xl flex-col gap-8">
        <Link href="/" className="inline-flex w-fit items-center gap-2 rounded-full border border-white/50 bg-white/70 px-4 py-2 text-sm font-medium text-slate-700 shadow-lg backdrop-blur-xl transition hover:-translate-y-0.5 hover:bg-white dark:border-slate-800 dark:bg-slate-900/70 dark:text-slate-200">
          <ArrowLeft className="h-4 w-4" />
          Back to home
        </Link>

        <div className="grid items-center gap-8 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="hidden rounded-[32px] border border-white/60 bg-white/60 p-8 shadow-[0_25px_80px_rgba(15,23,42,0.12)] backdrop-blur-2xl lg:block dark:border-slate-800/70 dark:bg-slate-900/60">
            <div className="space-y-5">
              <span className="inline-flex rounded-full border border-indigo-500/20 bg-indigo-500/10 px-3 py-1 text-sm font-medium text-indigo-700 dark:text-indigo-300">
                Secure, modern authentication
              </span>
              <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
                Welcome back to <span className="text-indigo-600 dark:text-indigo-400">Space Zone</span>
              </h1>
              <p className="max-w-xl text-lg leading-8 text-slate-600 dark:text-slate-300">
                Sign in securely, keep your library and purchases in sync, and access premium tools with confidence.
              </p>
            </div>
            <div className="mt-10 space-y-4 text-sm text-slate-600 dark:text-slate-300">
              <div className="rounded-2xl border border-slate-200/80 bg-white/70 p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950/50">
                <p className="font-semibold text-slate-900 dark:text-white">Protected access</p>
                <p className="mt-1">Every session is validated server-side and redirected safely when access is not permitted.</p>
              </div>
              <div className="rounded-2xl border border-slate-200/80 bg-white/70 p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950/50">
                <p className="font-semibold text-slate-900 dark:text-white">Instant recovery</p>
                <p className="mt-1">Forgot your password? We’ll send you a secure reset link in seconds.</p>
              </div>
            </div>
          </div>

          <div className="rounded-[32px] border border-white/70 bg-white/70 p-6 shadow-[0_25px_80px_rgba(15,23,42,0.16)] backdrop-blur-2xl sm:p-8 dark:border-slate-800/70 dark:bg-slate-900/70">
            <div className="mb-8 space-y-2">
              <h2 className="text-3xl font-semibold tracking-tight text-slate-900 dark:text-white">{title}</h2>
              <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">{subtitle}</p>
            </div>
            {children}
            <p className="mt-6 text-center text-sm text-slate-600 dark:text-slate-300">
              {footerText}{" "}
              <Link href={footerLink} className="font-semibold text-indigo-600 transition hover:text-indigo-500 dark:text-indigo-400">
                {footerLinkText}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
