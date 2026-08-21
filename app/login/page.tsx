import { Suspense } from "react";
import { AuthShell } from "@/components/auth/AuthShell";
import { LoginForm } from "@/components/auth/LoginForm";

export default function LoginPage() {
  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to access your library, saved tools, and customer dashboard."
      footerText="New here?"
      footerLink="/signup"
      footerLinkText="Create an account"
    >
      <Suspense fallback={<div className="rounded-2xl bg-slate-100/70 p-4 text-sm text-slate-600 dark:bg-slate-800/70 dark:text-slate-300">Preparing login form…</div>}>
        <LoginForm />
      </Suspense>
    </AuthShell>
  );
}
