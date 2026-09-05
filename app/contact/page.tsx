"use client";

import { useState, FormEvent, ChangeEvent, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Loader2,
  CheckCircle2,
  Lock,
  AlertCircle,
  ArrowRight,
  BriefcaseBusiness,
  Building2,
  Clock3,
  FileUp,
  Mail,
  Phone,
  Sparkles,
  WalletCards,
} from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 dark:border-white/10 dark:bg-white/[0.04] dark:text-white dark:placeholder:text-slate-500 dark:focus:border-indigo-400 dark:focus:bg-white/[0.06]";

const selectClass = `${inputClass} appearance-none`;

const serviceOptions = [
  "Website / Web App",
  "Branding & Design",
  "Digital Product",
  "Startup Tool",
  "E-commerce",
  "Custom Development",
  "Website Improvement",
  "Other",
];

const budgetOptions = [
  "Under 500 BHD",
  "500 – 1,000 BHD",
  "1,000 – 2,500 BHD",
  "2,500 – 5,000 BHD",
  "5,000+ BHD",
  "Not sure yet",
];

const timelineOptions = ["ASAP", "1–2 weeks", "Within 1 month", "1–3 months", "Flexible"];

type FormState = {
  name: string;
  email: string;
  company: string;
  phone: string;
  service: string;
  budget: string;
  timeline: string;
  projectDetails: string;
  attachmentName: string;
};

const emptyForm: FormState = {
  name: "",
  email: "",
  company: "",
  phone: "",
  service: "",
  budget: "",
  timeline: "",
  projectDetails: "",
  attachmentName: "",
};

export default function Contact() {
  const router = useRouter();
  const { user } = useAuth();
  const [formData, setFormData] = useState<FormState>(emptyForm);
  const [attachment, setAttachment] = useState<File | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (user?.email) {
      setFormData((current) => ({ ...current, email: current.email || user.email || "" }));
    }
  }, [user?.email]);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!user) {
      setErrorMessage("Please sign in first.");
      router.push(`/login?redirectTo=${encodeURIComponent("/contact")}`);
      return;
    }

    setStatus("loading");
    setErrorMessage(null);

    try {
      const body = new FormData();
      body.append("name", formData.name);
      body.append("email", formData.email);
      body.append("company", formData.company);
      body.append("phone", formData.phone);
      body.append("service", formData.service);
      body.append("budget", formData.budget);
      body.append("timeline", formData.timeline);
      body.append("projectDetails", formData.projectDetails);
      if (attachment) body.append("attachment", attachment);

      const response = await fetch("/api/contact", { method: "POST", body });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Failed to send project request");

      setStatus("success");
      setFormData(emptyForm);
      setAttachment(null);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Failed to send project request");
      setStatus("error");
    }
  }

  function handleAttachmentChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    setAttachment(file);
    setFormData((current) => ({ ...current, attachmentName: file?.name ?? "" }));
  }

  if (!user) {
    return (
      <main className="min-h-[90vh] flex-1 bg-slate-50 px-4 py-20 dark:bg-[#050505]">
        <div className="mx-auto max-w-3xl">
          <div className="mb-10 text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-indigo-700 dark:border-indigo-500/30 dark:bg-indigo-950/30 dark:text-indigo-300">
              <Sparkles className="h-3.5 w-3.5" /> Project Intake
            </span>
            <h1 className="mt-5 text-4xl font-black tracking-tight text-slate-950 dark:text-white md:text-6xl">Tell us what you're building.</h1>
            <p className="mx-auto mt-5 max-w-2xl text-base leading-8 text-slate-600 dark:text-slate-300 md:text-lg">
              Give us the context, goals, and constraints. We'll use your request to understand the project before the first conversation.
            </p>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-xl shadow-slate-200/50 dark:border-white/10 dark:bg-slate-900/50 dark:shadow-none md:p-12">
            <Lock className="mx-auto mb-5 h-14 w-14 text-slate-400" />
            <h2 className="text-2xl font-extrabold text-slate-950 dark:text-white">Sign in to send a request</h2>
            <p className="mx-auto mt-3 max-w-md leading-7 text-slate-600 dark:text-slate-300">Your project request is tied to your account so the team can follow up with you.</p>
            <button onClick={() => router.push(`/login?redirectTo=${encodeURIComponent("/contact")}`)} className="mt-7 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3.5 text-sm font-bold text-white transition hover:bg-indigo-500">
              Sign In <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-[90vh] flex-1 overflow-hidden bg-slate-50 px-4 py-16 dark:bg-[#050505] md:py-24">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-80 bg-[radial-gradient(circle_at_top,rgba(99,102,241,0.16),transparent_62%)] dark:bg-[radial-gradient(circle_at_top,rgba(99,102,241,0.18),transparent_60%)]" />
      <div className="relative mx-auto max-w-6xl">
        <div className="mb-12 max-w-4xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-indigo-700 dark:border-indigo-500/30 dark:bg-indigo-950/30 dark:text-indigo-300">
            <Sparkles className="h-3.5 w-3.5" /> Project Intake
          </span>
          <h1 className="mt-6 text-4xl font-black tracking-tight text-slate-950 dark:text-white md:text-6xl">Tell us what you're building.</h1>
          <p className="mt-5 max-w-3xl text-base leading-8 text-slate-600 dark:text-slate-300 md:text-lg">
            Skip the generic contact form. Share the direction, goals, budget, and timeline behind your project so we can start with useful context.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl shadow-slate-200/50 dark:border-white/10 dark:bg-slate-900/55 dark:shadow-none md:p-9">
            {status === "success" ? (
              <div className="flex min-h-[520px] flex-col items-center justify-center px-4 py-12 text-center">
                <div className="flex h-20 w-20 items-center justify-center rounded-3xl border border-emerald-200 bg-emerald-50 dark:border-emerald-500/20 dark:bg-emerald-500/10">
                  <CheckCircle2 className="h-10 w-10 text-emerald-500" />
                </div>
                <h2 className="mt-7 text-3xl font-black text-slate-950 dark:text-white">Request received.</h2>
                <p className="mt-4 max-w-lg leading-8 text-slate-600 dark:text-slate-300">
                  Your project details are now in our inbox. The next step is a focused conversation around scope, priorities, and what should happen first.
                </p>
                <button onClick={() => setStatus("idle")} className="mt-8 text-sm font-bold text-indigo-600 hover:underline dark:text-indigo-300">Start another request</button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-9">
                {errorMessage && (
                  <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 dark:border-red-900/60 dark:bg-red-950/30">
                    <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />
                    <p className="text-sm leading-6 text-red-700 dark:text-red-300">{errorMessage}</p>
                  </div>
                )}

                <div>
                  <div className="mb-5 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-300"><BriefcaseBusiness className="h-5 w-5" /></div>
                    <div><h2 className="font-extrabold text-slate-950 dark:text-white">About you</h2><p className="text-xs text-slate-500 dark:text-slate-400">Who should we coordinate with?</p></div>
                  </div>
                  <div className="grid gap-5 md:grid-cols-2">
                    <label className="space-y-2"><span className="text-sm font-bold text-slate-700 dark:text-slate-200">Name <span className="text-indigo-500">*</span></span><input required maxLength={120} value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className={inputClass} placeholder="Your name" /></label>
                    <label className="space-y-2"><span className="text-sm font-bold text-slate-700 dark:text-slate-200">Email <span className="text-indigo-500">*</span></span><div className="relative"><Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input required type="email" maxLength={254} value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className={`${inputClass} pl-11`} placeholder="you@example.com" /></div></label>
                    <label className="space-y-2"><span className="text-sm font-bold text-slate-700 dark:text-slate-200">Company <span className="font-normal text-slate-400">(optional)</span></span><div className="relative"><Building2 className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input maxLength={160} value={formData.company} onChange={(e) => setFormData({ ...formData, company: e.target.value })} className={`${inputClass} pl-11`} placeholder="Company or brand" /></div></label>
                    <label className="space-y-2"><span className="text-sm font-bold text-slate-700 dark:text-slate-200">Phone <span className="font-normal text-slate-400">(optional)</span></span><div className="relative"><Phone className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input maxLength={40} value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className={`${inputClass} pl-11`} placeholder="+973 ..." /></div></label>
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-8 dark:border-white/10">
                  <div className="mb-5 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-300"><Sparkles className="h-5 w-5" /></div>
                    <div><h2 className="font-extrabold text-slate-950 dark:text-white">Project direction</h2><p className="text-xs text-slate-500 dark:text-slate-400">Help us understand what you're looking for.</p></div>
                  </div>
                  <div className="grid gap-5 md:grid-cols-2">
                    <label className="space-y-2"><span className="text-sm font-bold text-slate-700 dark:text-slate-200">Service <span className="text-indigo-500">*</span></span><select required value={formData.service} onChange={(e) => setFormData({ ...formData, service: e.target.value })} className={selectClass}><option value="">Choose a service</option>{serviceOptions.map((item) => <option key={item}>{item}</option>)}</select></label>
                    <label className="space-y-2"><span className="text-sm font-bold text-slate-700 dark:text-slate-200">Budget <span className="font-normal text-slate-400">(optional)</span></span><div className="relative"><WalletCards className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><select value={formData.budget} onChange={(e) => setFormData({ ...formData, budget: e.target.value })} className={`${selectClass} pl-11`}><option value="">Choose a range</option>{budgetOptions.map((item) => <option key={item}>{item}</option>)}</select></div></label>
                    <label className="space-y-2 md:col-span-2"><span className="text-sm font-bold text-slate-700 dark:text-slate-200">Timeline <span className="font-normal text-slate-400">(optional)</span></span><div className="relative"><Clock3 className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><select value={formData.timeline} onChange={(e) => setFormData({ ...formData, timeline: e.target.value })} className={`${selectClass} pl-11`}><option value="">How soon are you looking to start?</option>{timelineOptions.map((item) => <option key={item}>{item}</option>)}</select></div></label>
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-8 dark:border-white/10">
                  <div className="mb-5"><h2 className="font-extrabold text-slate-950 dark:text-white">Project Details <span className="text-indigo-500">*</span></h2><p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Goals, audience, current situation, features, references, or anything we should know.</p></div>
                  <textarea required maxLength={5000} rows={9} value={formData.projectDetails} onChange={(e) => setFormData({ ...formData, projectDetails: e.target.value })} className={`${inputClass} resize-y leading-7`} placeholder="Example: We are launching a new product and need a high-conversion website with a strong visual identity. Our priority is mobile performance and a clear way to explain the product..." />
                  <div className="mt-2 flex justify-end text-xs text-slate-400">{formData.projectDetails.length}/5000</div>
                </div>

                <div className="border-t border-slate-100 pt-8 dark:border-white/10">
                  <div className="mb-5"><h2 className="font-extrabold text-slate-950 dark:text-white">Attachment <span className="font-normal text-slate-400">(optional)</span></h2><p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Add one useful reference image, screenshot, or visual direction. PNG, JPG, WEBP, or GIF up to 5MB.</p></div>
                  <label className="block cursor-pointer rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 transition hover:border-indigo-400 hover:bg-indigo-50/50 dark:border-white/15 dark:bg-white/[0.03] dark:hover:border-indigo-400/50 dark:hover:bg-indigo-500/5">
                    <div className="flex items-center gap-4"><div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white text-indigo-600 shadow-sm dark:bg-white/10 dark:text-indigo-300"><FileUp className="h-5 w-5" /></div><div className="min-w-0"><p className="text-sm font-bold text-slate-800 dark:text-slate-100">Choose a file</p><p className="truncate text-xs text-slate-500 dark:text-slate-400">{formData.attachmentName || "No file selected"}</p></div></div>
                    <input type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={handleAttachmentChange} className="sr-only" />
                  </label>
                </div>

                <div className="border-t border-slate-100 pt-8 dark:border-white/10">
                  <button disabled={status === "loading"} type="submit" className="group inline-flex w-full items-center justify-center gap-3 rounded-2xl bg-indigo-600 px-6 py-4 text-sm font-black text-white shadow-lg shadow-indigo-500/20 transition hover:-translate-y-0.5 hover:bg-indigo-500 disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50">
                    {status === "loading" ? <Loader2 className="h-5 w-5 animate-spin" /> : <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />}
                    {status === "loading" ? "Sending Request..." : "Send Request"}
                  </button>
                  <p className="mt-4 text-center text-xs leading-6 text-slate-500 dark:text-slate-400">We only use these details to understand and respond to your project request.</p>
                </div>
              </form>
            )}
          </section>

          <aside className="space-y-5 lg:sticky lg:top-28 lg:self-start">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/40 dark:border-white/10 dark:bg-slate-900/55 dark:shadow-none">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-indigo-600 dark:text-indigo-300">What happens next</p>
              <div className="mt-6 space-y-5">
                {[
                  ["01", "We review", "We look at your goals, scope, and constraints before replying."],
                  ["02", "We clarify", "We identify the important questions and shape the right direction."],
                  ["03", "We plan", "We can then discuss scope, priorities, deliverables, and next steps."],
                ].map(([number, title, text]) => (
                  <div key={number} className="flex gap-4"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-xs font-black text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-300">{number}</span><div><h3 className="text-sm font-extrabold text-slate-900 dark:text-white">{title}</h3><p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">{text}</p></div></div>
                ))}
              </div>
            </div>
            <div className="rounded-3xl border border-indigo-200 bg-gradient-to-br from-indigo-50 via-white to-sky-50 p-6 dark:border-indigo-500/20 dark:from-indigo-950/40 dark:via-slate-900/60 dark:to-sky-950/20">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-indigo-600 shadow-sm dark:bg-white/10 dark:text-indigo-300"><BriefcaseBusiness className="h-5 w-5" /></div>
              <h3 className="mt-5 text-lg font-black text-slate-950 dark:text-white">Better brief, better first conversation.</h3>
              <p className="mt-2 text-sm leading-7 text-slate-600 dark:text-slate-300">You don't need a perfect specification. A clear problem and a little context is enough to start.</p>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
