import Link from "next/link";

export default function VerifyEmailPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top_left,_rgba(99,102,241,0.18),_transparent_38%),radial-gradient(circle_at_bottom_right,_rgba(16,185,129,0.18),_transparent_32%),linear-gradient(135deg,_rgba(255,255,255,0.98),_rgba(239,246,255,0.95))] px-4 py-10 text-slate-900 dark:bg-[radial-gradient(circle_at_top_left,_rgba(99,102,241,0.2),_transparent_35%),radial-gradient(circle_at_bottom_right,_rgba(16,185,129,0.2),_transparent_30%),linear-gradient(135deg,_rgba(2,6,23,0.98),_rgba(15,23,42,0.96))] dark:text-slate-100">
      <div className="w-full max-w-xl rounded-[32px] border border-white/70 bg-white/70 p-8 shadow-[0_25px_80px_rgba(15,23,42,0.16)] backdrop-blur-2xl dark:border-slate-800/70 dark:bg-slate-900/70">
        <h1 className="text-3xl font-semibold tracking-tight">Verify your email</h1>
        <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">
          We’ve sent an email confirmation request. Please open the email and verify your address before logging in.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/login" className="rounded-2xl bg-indigo-600 px-4 py-3 font-semibold text-white transition hover:bg-indigo-500">
            Back to login
          </Link>
          <Link href="/forgot-password" className="rounded-2xl border border-slate-300 px-4 py-3 font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800">
            Resend link
          </Link>
        </div>
      </div>
    </div>
  );
}
