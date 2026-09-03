"use client";

import { useState, FormEvent, ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { Loader2, CheckCircle2, Lock, AlertCircle } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";

export default function Contact() {
  const router = useRouter();
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
    details: "",
    contactType: "Inquiry",
    attachmentName: "",
  });
  const [attachment, setAttachment] = useState<File | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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
      body.append("message", formData.message);
      body.append("details", formData.details);
      body.append("contactType", formData.contactType);
      if (attachment) body.append("attachment", attachment);

      const response = await fetch("/api/contact", {
        method: "POST",
        body,
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Failed to send message");

      setStatus("success");
      setFormData({ name: "", email: "", message: "", details: "", contactType: "Inquiry", attachmentName: "" });
      setAttachment(null);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Failed to send message");
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
      <main className="flex-1 flex flex-col pt-24 pb-16 bg-slate-50 dark:bg-[#050505] min-h-[90vh] transition-colors">
        <div className="container mx-auto px-4 max-w-2xl relative z-10">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-4 drop-shadow-sm dark:drop-shadow-md">Contact Us</h1>
            <p className="text-xl text-slate-600 dark:text-slate-300">Get in touch with our team to start your next mission.</p>
          </div>
          <div className="bg-white dark:bg-slate-900/40 backdrop-blur-md p-8 md:p-10 rounded-2xl shadow-md dark:shadow-none border border-slate-200 dark:border-indigo-500/20">
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Lock className="h-16 w-16 text-slate-400 mb-4" />
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Sign In Required</h2>
              <p className="text-slate-600 dark:text-slate-300 mb-6">You must be signed in to contact us.</p>
              <button onClick={() => router.push(`/login?redirectTo=${encodeURIComponent("/contact")}`)} className="rounded-lg bg-indigo-600 px-6 py-3 text-sm font-bold text-white hover:bg-indigo-500 shadow-[0_4px_15px_rgba(79,70,229,0.3)] dark:shadow-[0_0_15px_rgba(79,70,229,0.4)] transition">Sign In</button>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 flex flex-col pt-24 pb-16 bg-slate-50 dark:bg-[#050505] min-h-[90vh] transition-colors">
      <div className="container mx-auto px-4 max-w-2xl relative z-10">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-4 drop-shadow-sm dark:drop-shadow-md">Contact Us</h1>
          <p className="text-xl text-slate-600 dark:text-slate-300">Get in touch with our team to start your next mission.</p>
        </div>

        <div className="bg-white dark:bg-slate-900/40 backdrop-blur-md p-8 md:p-10 rounded-2xl shadow-md dark:shadow-none border border-slate-200 dark:border-indigo-500/20">
          {status === "success" ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <CheckCircle2 className="h-16 w-16 text-emerald-500 mb-4" />
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Message Sent!</h2>
              <p className="text-slate-600 dark:text-slate-300">We've received your message and will get back to you shortly.</p>
              <button onClick={() => setStatus("idle")} className="mt-8 text-indigo-600 dark:text-indigo-400 font-semibold hover:underline">Send another message</button>
            </div>
          ) : (
            <form className="space-y-6" onSubmit={handleSubmit}>
              {errorMessage && <div className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg"><AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" /><p className="text-red-700 dark:text-red-300 text-sm">{errorMessage}</p></div>}

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Name</label>
                <input required type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full bg-slate-50 dark:bg-slate-950/50 border border-slate-300 dark:border-indigo-500/30 rounded-lg px-4 py-3 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 dark:focus:border-indigo-400 focus:ring-1 focus:ring-indigo-500 dark:focus:ring-indigo-400 transition" placeholder="Your Name" />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Email</label>
                <input required type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="w-full bg-slate-50 dark:bg-slate-950/50 border border-slate-300 dark:border-indigo-500/30 rounded-lg px-4 py-3 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 dark:focus:border-indigo-400 focus:ring-1 focus:ring-indigo-500 dark:focus:ring-indigo-400 transition" placeholder="you@example.com" />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Contact Type</label>
                <select value={formData.contactType} onChange={(e) => setFormData({ ...formData, contactType: e.target.value })} className="w-full bg-slate-50 dark:bg-slate-950/50 border border-slate-300 dark:border-indigo-500/30 rounded-lg px-4 py-3 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 dark:focus:border-indigo-400 focus:ring-1 focus:ring-indigo-500 dark:focus:ring-indigo-400 transition">
                  <option value="Inquiry">Inquiry</option>
                  <option value="Problem">Problem</option>
                  <option value="Suggestion">Suggestion</option>
                  <option value="Offer">Offer</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Upload Image</label>
                <input type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={handleAttachmentChange} className="w-full rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-700 file:mr-4 file:rounded-full file:border-0 file:bg-indigo-600 file:px-3 file:py-2 file:text-xs file:font-bold file:text-white hover:file:bg-indigo-500 dark:border-indigo-500/30 dark:bg-slate-950/50 dark:text-slate-200" />
                {formData.attachmentName && <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">Selected file: {formData.attachmentName}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Other Details</label>
                <textarea rows={3} value={formData.details} onChange={(e) => setFormData({ ...formData, details: e.target.value })} className="w-full bg-slate-50 dark:bg-slate-950/50 border border-slate-300 dark:border-indigo-500/30 rounded-lg px-4 py-3 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 dark:focus:border-indigo-400 focus:ring-1 focus:ring-indigo-500 dark:focus:ring-indigo-400 transition" placeholder="Add any extra information, timeline, budget, or context..." />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Message</label>
                <textarea required rows={4} value={formData.message} onChange={(e) => setFormData({ ...formData, message: e.target.value })} className="w-full bg-slate-50 dark:bg-slate-950/50 border border-slate-300 dark:border-indigo-500/30 rounded-lg px-4 py-3 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 dark:focus:border-indigo-400 focus:ring-1 focus:ring-indigo-500 dark:focus:ring-indigo-400 transition" placeholder="Tell us about your project..." />
              </div>

              <button disabled={status === "loading"} type="submit" className="w-full rounded-lg bg-indigo-600 px-4 py-3 text-sm font-bold text-white hover:bg-indigo-500 shadow-[0_4px_15px_rgba(79,70,229,0.3)] dark:shadow-[0_0_15px_rgba(79,70,229,0.4)] transition flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                {status === "loading" && <Loader2 className="h-4 w-4 animate-spin" />}
                Send Message
              </button>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}
