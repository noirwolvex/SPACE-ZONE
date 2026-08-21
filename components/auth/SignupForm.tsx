"use client";

import { useMemo, useState } from "react";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { PasswordField } from "@/components/auth/PasswordField";
import { useAuth } from "@/components/auth/AuthProvider";

const passwordChecks = [
  { label: "At least 8 characters", test: (value: string) => value.length >= 8 },
  { label: "One uppercase letter", test: (value: string) => /[A-Z]/.test(value) },
  { label: "One number", test: (value: string) => /\d/.test(value) },
];

export function SignupForm() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { signUp } = useAuth();

  const strength = useMemo(() => {
    const checks = passwordChecks.map((check) => check.test(password));
    const met = checks.filter(Boolean).length;
    if (!password) return { label: "Enter a password", score: 0, checks };
    if (met < 2) return { label: "Weak", score: 1, checks };
    if (met < 3) return { label: "Fair", score: 2, checks };
    return { label: "Strong", score: 3, checks };
  }, [password]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setMessage(null);

    if (!fullName.trim()) {
      setError("Please enter your full name.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (strength.score < 2) {
      setError("Use a stronger password with at least 8 characters and a number.");
      return;
    }

    setLoading(true);
    const result = await signUp(fullName.trim(), email.trim().toLowerCase(), password);
    setLoading(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setMessage(result.message ?? "Account created successfully.");
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {message ? (
        <div className="flex items-start gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300">
          <CheckCircle2 className="mt-0.5 h-4 w-4" />
          <span>{message}</span>
        </div>
      ) : null}
      {error ? (
        <div className="flex items-start gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300">
          <AlertCircle className="mt-0.5 h-4 w-4" />
          <span>{error}</span>
        </div>
      ) : null}

      <div className="space-y-2">
        <label htmlFor="fullName" className="text-sm font-medium text-slate-700 dark:text-slate-200">
          Full Name
        </label>
        <input
          id="fullName"
          type="text"
          value={fullName}
          onChange={(event) => setFullName(event.target.value)}
          className="w-full rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 text-sm shadow-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-950/60 dark:text-white"
          placeholder="Alex Morgan"
          required
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="email" className="text-sm font-medium text-slate-700 dark:text-slate-200">
          Email Address
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="w-full rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 text-sm shadow-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-950/60 dark:text-white"
          placeholder="you@example.com"
          required
        />
      </div>

      <PasswordField
        label="Password"
        id="password"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        placeholder="Create a secure password"
        required
      />

      <PasswordField
        label="Confirm Password"
        id="confirmPassword"
        value={confirmPassword}
        onChange={(event) => setConfirmPassword(event.target.value)}
        placeholder="Confirm your password"
        required
      />

      <div className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-3 dark:border-slate-700 dark:bg-slate-950/50">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium text-slate-700 dark:text-slate-200">Password strength</span>
          <span className="font-semibold text-indigo-600 dark:text-indigo-400">{strength.label}</span>
        </div>
        <div className="mt-3 grid gap-2">
          {passwordChecks.map((check, index) => {
            const passed = check.test(password);
            return (
              <div key={check.label} className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                <span className={`h-2.5 w-2.5 rounded-full ${passed ? "bg-emerald-500" : "bg-slate-300 dark:bg-slate-600"}`} />
                {check.label}
              </div>
            );
          })}
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="flex w-full items-center justify-center rounded-2xl bg-indigo-600 px-4 py-3 font-semibold text-white shadow-lg transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
        {loading ? "Creating account" : "Create account"}
      </button>
    </form>
  );
}
