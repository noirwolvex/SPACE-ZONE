"use client";

import { FormEvent, useEffect, useState } from "react";
import { Loader2, Save } from "lucide-react";
import type { EditableAboutPage } from "@/lib/content-store";

function adminHeaders() { return { "Content-Type": "application/json" }; }
async function errorMessage(response: Response) { try { const json = await response.json(); if (json?.error) return String(json.error); } catch {} return `${response.status} ${response.statusText}`; }

export default function AdminAboutPage() {
  const [form, setForm] = useState<EditableAboutPage | null>(null);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  async function load() {
    setLoading(true); setStatus("");
    try {
      const response = await fetch("/api/admin/about", { headers: adminHeaders() });
      if (!response.ok) throw new Error(await errorMessage(response));
      setForm(await response.json());
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Unable to load About page.");
    } finally { setLoading(false); }
  }

  useEffect(() => { void load(); }, []);

  function update<K extends keyof EditableAboutPage>(key: K, value: EditableAboutPage[K]) {
    setForm((current) => current ? { ...current, [key]: value } : current);
  }

  function updateStat(index: number, key: "label" | "value", value: string) {
    if (!form) return;
    const stats = form.stats.map((item, itemIndex) => itemIndex === index ? { ...item, [key]: value } : item);
    update("stats", stats);
  }

  function updateOffering(index: number, key: "icon" | "title" | "text", value: string) {
    if (!form) return;
    const offerings = form.offerings.map((item, itemIndex) => itemIndex === index ? { ...item, [key]: value } : item);
    update("offerings", offerings as EditableAboutPage["offerings"]);
  }

  function updateValue(index: number, key: "title" | "text", value: string) {
    if (!form) return;
    const values = form.values.map((item, itemIndex) => itemIndex === index ? { ...item, [key]: value } : item);
    update("values", values);
  }

  function updateWorkflow(index: number, value: string) {
    if (!form) return;
    const workflow = form.workflow.map((item, itemIndex) => itemIndex === index ? value : item);
    update("workflow", workflow);
  }

  async function save(event: FormEvent) {
    event.preventDefault();
    if (!form) return;
    setLoading(true); setStatus("");
    try {
      const response = await fetch("/api/admin/about", { method: "PUT", headers: adminHeaders(), body: JSON.stringify(form) });
      if (!response.ok) throw new Error(await errorMessage(response));
      setForm(await response.json());
      setStatus("About page updated successfully.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Unable to save About page.");
    } finally { setLoading(false); }
  }

  if (!form) {
    return <main className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-900 dark:bg-[#050505] dark:text-white"><Loader2 className="h-8 w-8 animate-spin text-indigo-500" /></main>;
  }

  const inputClass = "mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-indigo-500 dark:border-indigo-500/30 dark:bg-slate-950";
  const cardClass = "rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-indigo-500/20 dark:bg-slate-900/50";

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 text-slate-900 dark:bg-[#050505] dark:text-white">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <span className="inline-flex rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-indigo-700 dark:border-indigo-500/30 dark:bg-indigo-950/30 dark:text-indigo-300">Admin · About</span>
            <h1 className="mt-3 text-4xl font-extrabold tracking-tight">Edit About Page</h1>
            <p className="mt-2 max-w-3xl text-slate-600 dark:text-slate-300">Edit the public About page content without changing the design or code.</p>
          </div>
          <a href="/admin" className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-bold text-slate-800 hover:bg-slate-100 dark:border-indigo-500/30 dark:bg-slate-900 dark:text-slate-200">Back to Admin</a>
        </header>

        {status ? <p className="mb-6 rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm font-semibold text-indigo-700 dark:border-indigo-500/30 dark:bg-indigo-950/30 dark:text-indigo-200">{status}</p> : null}

        <form onSubmit={save} className="space-y-8">
          <section className={cardClass}>
            <h2 className="text-xl font-bold">Hero</h2>
            <div className="mt-5 grid gap-5 lg:grid-cols-2">
              <label className="block text-sm font-semibold">Badge<input className={inputClass} value={form.badge} onChange={(e) => update("badge", e.target.value)} /></label>
              <label className="block text-sm font-semibold lg:col-span-2">Headline<textarea className={inputClass} rows={3} value={form.heroTitle} onChange={(e) => update("heroTitle", e.target.value)} /></label>
              <label className="block text-sm font-semibold lg:col-span-2">Description<textarea className={inputClass} rows={5} value={form.heroDescription} onChange={(e) => update("heroDescription", e.target.value)} /></label>
            </div>
          </section>

          <section className={cardClass}>
            <h2 className="text-xl font-bold">Top stats</h2>
            <div className="mt-5 grid gap-5 md:grid-cols-3">
              {form.stats.map((stat, index) => <div key={index} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/60">
                <label className="block text-sm font-semibold">Label<input className={inputClass} value={stat.label} onChange={(e) => updateStat(index, "label", e.target.value)} /></label>
                <label className="mt-4 block text-sm font-semibold">Value<input className={inputClass} value={stat.value} onChange={(e) => updateStat(index, "value", e.target.value)} /></label>
              </div>)}
            </div>
          </section>

          <section className={cardClass}>
            <h2 className="text-xl font-bold">What we do</h2>
            <div className="mt-5 grid gap-5 lg:grid-cols-2">
              <label className="block text-sm font-semibold">Section title<input className={inputClass} value={form.whatWeDoTitle} onChange={(e) => update("whatWeDoTitle", e.target.value)} /></label>
              <label className="block text-sm font-semibold lg:row-span-2">Section text<textarea className={inputClass} rows={6} value={form.whatWeDoText} onChange={(e) => update("whatWeDoText", e.target.value)} /></label>
              <div className="grid gap-4 sm:grid-cols-2">
                {form.offerings.map((item, index) => <div key={index} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/60">
                  <label className="block text-sm font-semibold">Icon<select className={inputClass} value={item.icon} onChange={(e) => updateOffering(index, "icon", e.target.value)}><option value="printer">Printing</option><option value="megaphone">Marketing</option><option value="layers">Brand</option><option value="rocket">Digital</option></select></label>
                  <label className="mt-4 block text-sm font-semibold">Title<input className={inputClass} value={item.title} onChange={(e) => updateOffering(index, "title", e.target.value)} /></label>
                  <label className="mt-4 block text-sm font-semibold">Text<textarea className={inputClass} rows={4} value={item.text} onChange={(e) => updateOffering(index, "text", e.target.value)} /></label>
                </div>)}
              </div>
            </div>
          </section>

          <section className={cardClass}>
            <h2 className="text-xl font-bold">How we think</h2>
            <div className="mt-5 grid gap-5 lg:grid-cols-2">
              <label className="block text-sm font-semibold">Section title<input className={inputClass} value={form.howWeThinkTitle} onChange={(e) => update("howWeThinkTitle", e.target.value)} /></label>
              <label className="block text-sm font-semibold">Section text<textarea className={inputClass} rows={5} value={form.howWeThinkText} onChange={(e) => update("howWeThinkText", e.target.value)} /></label>
            </div>
            <div className="mt-6 grid gap-4 lg:grid-cols-3">
              {form.values.map((item, index) => <div key={index} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/60">
                <label className="block text-sm font-semibold">Value title<input className={inputClass} value={item.title} onChange={(e) => updateValue(index, "title", e.target.value)} /></label>
                <label className="mt-4 block text-sm font-semibold">Value text<textarea className={inputClass} rows={5} value={item.text} onChange={(e) => updateValue(index, "text", e.target.value)} /></label>
              </div>)}
            </div>
          </section>

          <section className={cardClass}>
            <h2 className="text-xl font-bold">Workflow & services</h2>
            <label className="mt-5 block text-sm font-semibold">Workflow title<input className={inputClass} value={form.workflowTitle} onChange={(e) => update("workflowTitle", e.target.value)} /></label>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              {form.workflow.map((step, index) => <label key={index} className="block text-sm font-semibold">Step {index + 1}<textarea className={inputClass} rows={3} value={step} onChange={(e) => updateWorkflow(index, e.target.value)} /></label>)}
            </div>
            <label className="mt-5 block text-sm font-semibold">Services section title<input className={inputClass} value={form.servicesTitle} onChange={(e) => update("servicesTitle", e.target.value)} /></label>
          </section>

          <section className={cardClass}>
            <h2 className="text-xl font-bold">Call to action</h2>
            <div className="mt-5 grid gap-5 lg:grid-cols-2">
              <label className="block text-sm font-semibold">CTA title<input className={inputClass} value={form.ctaTitle} onChange={(e) => update("ctaTitle", e.target.value)} /></label>
              <label className="block text-sm font-semibold">CTA text<textarea className={inputClass} rows={4} value={form.ctaText} onChange={(e) => update("ctaText", e.target.value)} /></label>
            </div>
          </section>

          <button type="submit" disabled={loading} className="sticky bottom-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-6 py-4 text-sm font-extrabold text-white shadow-xl hover:bg-indigo-500 disabled:opacity-60">
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
            {loading ? "Saving..." : "Save About Page"}
          </button>
        </form>
      </div>
    </main>
  );
}
