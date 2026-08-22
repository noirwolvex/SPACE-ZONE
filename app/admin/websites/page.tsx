"use client";

import { ChangeEvent, useEffect, useRef, useState } from "react";
import { ShieldCheck, Trash2, RefreshCcw } from "lucide-react";
import { WEBSITE_CATEGORIES, WEBSITE_RESPONSIVE_OPTIONS } from "@/lib/website-validation";
import type { WebsiteFormValues, WebsiteRecord } from "@/lib/website-types";

const initialForm: WebsiteFormValues = {
  title: "", summary: "", description: "", system: "", details: "", features: "", targetAudience: "", responsive: "Fully Responsive", category: "", price: "0", currency: "BHD", websiteUrl: "", isPublished: true
};
function authHeaders(): Record<string, string> { return {}; }
async function getResponseErrorMessage(response: Response) { try { const result = await response.json(); if (result?.error) return String(result.error); } catch {} return response.statusText ? `${response.status} ${response.statusText}` : `HTTP ${response.status}`; }

export default function AdminWebsitesPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [websites, setWebsites] = useState<WebsiteRecord[]>([]);
  const [selectedImageFiles, setSelectedImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<WebsiteFormValues>(initialForm);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [query, setQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterPublished, setFilterPublished] = useState<"all" | "published" | "draft">("all");

  useEffect(() => { void loadWebsites(); }, []);
  async function loadWebsites() {
    setIsLoading(true); setStatus("");
    try {
      const params = new URLSearchParams();
      if (query) params.set("q", query);
      if (filterCategory) params.set("category", filterCategory);
      params.set("published", filterPublished);
      const response = await fetch(`/api/admin/websites/list?${params.toString()}`, { headers: authHeaders() });
      if (!response.ok) throw new Error(await getResponseErrorMessage(response));
      setWebsites(await response.json());
    } catch (err) { setStatus(String(err)); } finally { setIsLoading(false); }
  }
  function handleFieldChange(event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) { const target = event.target as HTMLInputElement; setForm((current) => ({ ...current, [target.name]: target.type === "checkbox" ? target.checked : target.value })); }
  function onImagesChange(event: ChangeEvent<HTMLInputElement>) { const files = Array.from(event.target.files ?? []).slice(0, 5); setSelectedImageFiles(files); setImagePreviews(files.map((file) => URL.createObjectURL(file))); setStatus(files.length > 5 ? "Only the first 5 images were selected." : ""); }
  async function submit() {
    if (!form.title?.trim()) return setStatus("Title is required.");
    if (!form.category?.trim()) return setStatus("Category is required.");
    if (!form.websiteUrl?.trim()) return setStatus("Website URL is required.");
    setIsLoading(true); setStatus("");
    try {
      const data = new FormData();
      for (const file of selectedImageFiles.slice(0, 5)) data.append("images", file);
      data.append("title", form.title); data.append("summary", form.summary || ""); data.append("description", form.description || ""); data.append("system", form.system || ""); data.append("details", form.details || ""); data.append("features", form.features || ""); data.append("targetAudience", form.targetAudience || ""); data.append("responsive", form.responsive || ""); data.append("category", form.category); data.append("price", String(form.price || "0")); data.append("currency", form.currency || "BHD"); data.append("websiteUrl", form.websiteUrl); data.append("isPublished", String(Boolean(form.isPublished)));
      if (editingId) data.append("websiteId", editingId);
      const response = await fetch("/api/admin/websites/upload", { method: "POST", headers: authHeaders(), body: data });
      if (!response.ok) throw new Error(await getResponseErrorMessage(response));
      setStatus(editingId ? "Updated." : "Created."); setSelectedImageFiles([]); setImagePreviews([]); setEditingId(null); setForm(initialForm); if (fileInputRef.current) fileInputRef.current.value = ""; await loadWebsites();
    } catch (err) { setStatus(String(err)); } finally { setIsLoading(false); }
  }
  function prepareEdit(w: WebsiteRecord) { setEditingId(w.id); setForm({ title: w.title || "", summary: w.summary || "", description: w.description || "", system: w.system || "", details: w.details || "", features: w.features || "", targetAudience: w.targetAudience || "", responsive: w.responsive || "Fully Responsive", category: w.category || "", price: String(w.price ?? 0), currency: w.currency || "BHD", websiteUrl: w.websiteUrl || "", isPublished: Boolean(w.isPublished) }); setSelectedImageFiles([]); setImagePreviews([]); setStatus("Editing website. Choose images only if you want to replace the gallery."); }
  async function remove(id: string) { if (!confirm("Delete this website?")) return; setIsLoading(true); try { const response = await fetch("/api/admin/websites/delete", { method: "POST", headers: { "Content-Type": "application/json", ...authHeaders() }, body: JSON.stringify({ id }) }); if (!response.ok) throw new Error(await getResponseErrorMessage(response)); setStatus("Deleted."); await loadWebsites(); } catch (err) { setStatus(String(err)); } finally { setIsLoading(false); } }

  return (
    <main className="flex-1 bg-slate-50 px-4 py-10 text-slate-900 transition-colors dark:bg-[#050505] dark:text-white">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-white px-3 py-1.5 text-sm font-semibold text-indigo-700 dark:border-indigo-500/30 dark:bg-slate-900/60 dark:text-indigo-300"><ShieldCheck className="h-4 w-4" />Space Zone Admin — Websites</div>
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-indigo-500/20 dark:bg-slate-900/40 dark:shadow-none">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><h2 className="text-xl font-bold">Manage Websites</h2><p className="mt-2 text-sm text-slate-600 dark:text-slate-300">Create, edit, publish, and manage website details shown on the public page.</p></div><div className="flex flex-wrap gap-3"><button type="button" onClick={() => fileInputRef.current?.click()} className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500">Choose up to 5 Images</button><button type="button" onClick={submit} disabled={isLoading} className="rounded-md bg-slate-200 px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-300 disabled:opacity-60 dark:bg-slate-800 dark:text-white">{editingId ? "Save Changes" : "Create Website"}</button><button type="button" onClick={() => void loadWebsites()} className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold dark:border-indigo-500/30 dark:bg-slate-900"><RefreshCcw className="h-4 w-4" />Refresh</button></div></div>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <label className="text-sm font-medium"><span className="mb-2 block">Title</span><input name="title" value={form.title} onChange={handleFieldChange} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 dark:border-indigo-500/30 dark:bg-slate-950" /></label>
            <label className="text-sm font-medium"><span className="mb-2 block">Website Category</span><select name="category" value={form.category} onChange={handleFieldChange} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 dark:border-indigo-500/30 dark:bg-slate-950"><option value="">Select a category</option>{WEBSITE_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}</select></label>
            <label className="text-sm font-medium"><span className="mb-2 block">Price</span><input name="price" value={form.price} onChange={handleFieldChange} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 dark:border-indigo-500/30 dark:bg-slate-950" /></label>
            <label className="text-sm font-medium"><span className="mb-2 block">Currency</span><input name="currency" value={form.currency} onChange={handleFieldChange} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 dark:border-indigo-500/30 dark:bg-slate-950" /></label>
            <label className="md:col-span-2 text-sm font-medium"><span className="mb-2 block">Website URL</span><input name="websiteUrl" value={form.websiteUrl} onChange={handleFieldChange} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 dark:border-indigo-500/30 dark:bg-slate-950" /></label>
            <label className="md:col-span-2 text-sm font-medium"><span className="mb-2 block">Summary</span><textarea name="summary" value={form.summary} onChange={handleFieldChange} rows={3} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 dark:border-indigo-500/30 dark:bg-slate-950" /></label>
            <label className="md:col-span-2 text-sm font-medium"><span className="mb-2 block">Description</span><textarea name="description" value={form.description} onChange={handleFieldChange} rows={10} placeholder="Full project description" className="min-h-64 w-full resize-y rounded-lg border border-slate-300 bg-white px-3 py-3 leading-7 dark:border-indigo-500/30 dark:bg-slate-950" /></label>
            <label className="md:col-span-2 text-sm font-medium"><span className="mb-2 block">Features</span><textarea name="features" value={form.features} onChange={handleFieldChange} rows={7} placeholder="List the main website features, one per line." className="min-h-52 w-full resize-y rounded-lg border border-slate-300 bg-white px-3 py-3 leading-7 dark:border-indigo-500/30 dark:bg-slate-950" /></label>
            <label className="md:col-span-2 text-sm font-medium"><span className="mb-2 block">Other Details</span><textarea name="details" value={form.details} onChange={handleFieldChange} rows={7} placeholder="Additional pages, included services, notes..." className="min-h-52 w-full resize-y rounded-lg border border-slate-300 bg-white px-3 py-3 leading-7 dark:border-indigo-500/30 dark:bg-slate-950" /></label>
            <label className="text-sm font-medium"><span className="mb-2 block">Target Audience</span><input name="targetAudience" value={form.targetAudience} onChange={handleFieldChange} placeholder="Businesses, creators, startups..." className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 dark:border-indigo-500/30 dark:bg-slate-950" /></label>
            <label className="text-sm font-medium"><span className="mb-2 block">Responsive</span><select name="responsive" value={form.responsive} onChange={handleFieldChange} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 dark:border-indigo-500/30 dark:bg-slate-950">{WEBSITE_RESPONSIVE_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}</select></label>
            <label className="text-sm font-medium"><span className="mb-2 block">System / Technologies</span><input name="system" value={form.system} onChange={handleFieldChange} placeholder="Next.js, Supabase, etc." className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 dark:border-indigo-500/30 dark:bg-slate-950" /></label>
            <label className="flex items-center gap-3"><input type="checkbox" name="isPublished" checked={Boolean(form.isPublished)} onChange={handleFieldChange} /><span className="text-sm">Published</span></label>
          </div>
          <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={onImagesChange} className="hidden" />
          {imagePreviews.length ? <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-5">{imagePreviews.map((src, index) => <img key={src} src={src} alt={`preview ${index + 1}`} className="h-28 w-full rounded-xl object-cover" />)}</div> : null}
          {status ? <p className="mt-4 rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm font-semibold text-indigo-700 dark:border-indigo-500/30 dark:bg-indigo-950/30 dark:text-indigo-200">{status}</p> : null}
        </section>
        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-indigo-500/20 dark:bg-slate-900/40 dark:shadow-none">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between"><h3 className="text-lg font-bold">Websites</h3><div className="flex flex-wrap gap-3"><input placeholder="Search title or category" value={query} onChange={(e) => setQuery(e.target.value)} className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm dark:bg-slate-950" /><select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm dark:bg-slate-950"><option value="">All categories</option>{WEBSITE_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}</select><select value={filterPublished} onChange={(e) => setFilterPublished(e.target.value as "all" | "published" | "draft")} className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm dark:bg-slate-950"><option value="all">All</option><option value="published">Published</option><option value="draft">Draft</option></select><button onClick={() => void loadWebsites()} className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white">Filter</button></div></div>
          {websites.length === 0 ? <p className="mt-4 rounded-xl border border-dashed border-slate-300 p-8 text-center text-sm font-medium text-slate-500">No websites.</p> : <div className="mt-4 space-y-4">{websites.map((w) => <article key={w.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-indigo-500/20 dark:bg-slate-950"><div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between"><div><p className="font-semibold">{w.title}</p><p className="text-sm text-slate-600 dark:text-slate-300">{w.category ?? "Uncategorized"} · {w.currency} {w.price}</p><p className="text-sm text-slate-600 dark:text-slate-300">Gallery: {w.gallery?.length ?? 0}/5</p><p className="text-xs text-slate-500">Created: {new Date(w.createdAt).toLocaleString()}</p></div><div className="flex flex-wrap gap-2"><a href={`/websites/${w.slug}`} target="_blank" rel="noreferrer" className="rounded-md bg-white px-4 py-2 text-sm font-semibold ring-1 ring-slate-300 hover:bg-slate-100 dark:bg-slate-900 dark:ring-slate-700">Preview</a><a href={w.websiteUrl} target="_blank" rel="noreferrer" className="rounded-md bg-white px-4 py-2 text-sm font-semibold ring-1 ring-slate-300 hover:bg-slate-100 dark:bg-slate-900 dark:ring-slate-700">Visit</a><button type="button" onClick={() => prepareEdit(w)} className="rounded-md bg-yellow-500 px-4 py-2 text-sm font-semibold text-white">Edit</button><button type="button" onClick={() => void remove(w.id)} className="inline-flex items-center gap-2 rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white"><Trash2 className="h-4 w-4" />Delete</button></div></div></article>)}</div>}
        </section>
      </div>
    </main>
  );
}
