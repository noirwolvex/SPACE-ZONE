"use client";

import { FormEvent, useState } from "react";

export default function NewsletterSignup() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setLoading(true); setStatus("");
    try {
      const response = await fetch("/api/newsletter", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result?.error ?? "Unable to subscribe.");
      setEmail(""); setStatus("Subscribed successfully.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Unable to subscribe.");
    } finally { setLoading(false); }
  }

  return <div><h3 className="text-slate-900 dark:text-white font-semibold mb-2">Newsletter</h3><p className="mb-3 text-sm text-slate-500 dark:text-slate-400">Get SPACE ZONE updates and new releases.</p><form onSubmit={submit} className="flex gap-2"><input type="email" required value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com" className="min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500 dark:border-indigo-500/30 dark:bg-slate-950 dark:text-white"/><button disabled={loading} className="rounded-lg bg-indigo-600 px-3 py-2 text-sm font-bold text-white disabled:opacity-60">{loading?"…":"Join"}</button></form>{status?<p className="mt-2 text-xs font-semibold text-indigo-600 dark:text-indigo-300">{status}</p>:null}</div>;
}
