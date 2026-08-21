"use client";

import { ChangeEvent, useEffect, useRef, useState } from "react";
import { ShieldCheck, Trash2, RefreshCcw } from "lucide-react";
import { WEBSITE_CATEGORIES } from "@/lib/website-validation";
import type { WebsiteFormValues, WebsiteRecord } from "@/lib/website-types";


const initialForm: WebsiteFormValues = {
  title: "",
  summary: "",
  category: "",
  price: "0",
  currency: "USD",
  websiteUrl: "",
  isPublished: true,
};

// Admin routes authorize via the Supabase session cookie sent automatically
// on same-origin requests. No credentials are shipped to the browser.
function authHeaders(): Record<string, string> {
  return {};
}

async function parseErrorResponse(response: Response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

async function getResponseErrorMessage(response: Response) {
  const result = await parseErrorResponse(response);
  if (result?.error) {
    return String(result.error);
  }

  if (response.statusText) {
    return `${response.status} ${response.statusText}`;
  }

  try {
    const text = await response.text();
    return text ? text : `HTTP ${response.status}`;
  } catch {
    return `HTTP ${response.status}`;
  }
}

export default function AdminWebsitesPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [websites, setWebsites] = useState<WebsiteRecord[]>([]);
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<WebsiteFormValues>(initialForm);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [query, setQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterPublished, setFilterPublished] = useState<"all" | "published" | "draft">("all");

  useEffect(() => {
    void loadWebsites();
  }, []);

  async function loadWebsites() {
    setIsLoading(true);
    setStatus("");
    try {
      const params = new URLSearchParams();
      if (query) params.set("q", query);
      if (filterCategory) params.set("category", filterCategory);
      if (filterPublished) params.set("published", filterPublished);

      const response = await fetch(`/api/admin/websites/list?${params.toString()}`, { headers: authHeaders() });
      if (!response.ok) throw new Error(await getResponseErrorMessage(response));
      const result = await response.json();
      setWebsites(result);
    } catch (err) {
      setStatus(String(err));
    } finally {
      setIsLoading(false);
    }
  }

  function handleFieldChange(event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    const { name, value, type } = event.target as HTMLInputElement;
    setForm((current) => ({ ...current, [name]: type === "checkbox" ? (event.target as HTMLInputElement).checked : value }));
  }

  async function onImageChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setSelectedImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setStatus("");
  }

  async function submit() {
    if (!form.title.trim()) { setStatus("Title is required."); return; }
    if (!form.category.trim()) { setStatus("Category is required."); return; }
    if (!form.websiteUrl.trim()) { setStatus("Website URL is required."); return; }

    setIsLoading(true);
    setStatus("");
    try {
      const formData = new FormData();
      if (selectedImageFile) formData.append("image", selectedImageFile);
      formData.append("title", form.title);
      formData.append("summary", form.summary || "");
      formData.append("category", form.category);
      formData.append("price", String(form.price || "0"));
      formData.append("currency", form.currency || "USD");
      formData.append("websiteUrl", form.websiteUrl);
      formData.append("isPublished", String(Boolean(form.isPublished)));
      if (editingId) formData.append("websiteId", editingId);

      const resp = await fetch('/api/admin/websites/upload', { method: 'POST', headers: authHeaders(), body: formData });
      if (!resp.ok) throw new Error(await getResponseErrorMessage(resp));
      const result = await resp.json();
      setStatus(editingId ? 'Updated.' : 'Created.');
      setSelectedImageFile(null);
      setImagePreview(null);
      setEditingId(null);
      setForm(initialForm);
      await loadWebsites();
    } catch (err) {
      setStatus(String(err));
    } finally { setIsLoading(false); }
  }

  function prepareEdit(w: WebsiteRecord) {
    setEditingId(w.id);
    setForm({
      title: w.title || "",
      summary: w.summary || "",
      category: w.category || "",
      price: String(w.price ?? 0),
      currency: w.currency || "USD",
      websiteUrl: w.websiteUrl || "",
      isPublished: Boolean(w.isPublished),
    });
    setImagePreview(w.image || null);
    setStatus("Editing website. Change fields and save.");
  }

  async function remove(id: string) {
    if (!confirm('Delete this website?')) return;
    setIsLoading(true);
    try {
      const resp = await fetch('/api/admin/websites/delete', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify({ id }) });
      if (!resp.ok) throw new Error(await getResponseErrorMessage(resp));
      setStatus('Deleted.');
      await loadWebsites();
    } catch (err) { setStatus(String(err)); } finally { setIsLoading(false); }
  }

  return (
    <main className="flex-1 bg-slate-50 px-4 py-10 text-slate-900 transition-colors dark:bg-[#050505] dark:text-white">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-white px-3 py-1.5 text-sm font-semibold text-indigo-700 shadow-sm dark:border-indigo-500/30 dark:bg-slate-900/60 dark:text-indigo-300">
          <ShieldCheck className="h-4 w-4" />
          Space Zone Admin — Websites
        </div>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-indigo-500/20 dark:bg-slate-900/40 dark:shadow-none">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-950 dark:text-white">Manage Websites</h2>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">Create, edit, publish, and remove websites shown on the public websites page.</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button type="button" onClick={() => fileInputRef.current?.click()} className="inline-flex items-center justify-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 transition">Choose Image</button>
              <button type="button" onClick={submit} disabled={isLoading} className="inline-flex items-center justify-center rounded-md bg-slate-200 px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-300 transition disabled:cursor-not-allowed disabled:opacity-60 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700">{editingId ? 'Save Changes' : 'Create Website'}</button>
              <button type="button" onClick={() => void loadWebsites()} className="inline-flex items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-50 transition dark:border-indigo-500/30 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"><RefreshCcw className="h-4 w-4" />Refresh</button>
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
              <span className="mb-2 block">Title</span>
              <input name="title" value={form.title} onChange={handleFieldChange} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500 dark:border-indigo-500/30 dark:bg-slate-950" placeholder="Site title" />
            </label>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
              <span className="mb-2 block">Category</span>
              <select name="category" value={form.category} onChange={handleFieldChange} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500 dark:border-indigo-500/30 dark:bg-slate-950">
                <option value="">Select a category</option>
                {WEBSITE_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </label>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
              <span className="mb-2 block">Price</span>
              <input name="price" value={form.price} onChange={handleFieldChange} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500 dark:border-indigo-500/30 dark:bg-slate-950" placeholder="0" />
            </label>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
              <span className="mb-2 block">Currency</span>
              <input name="currency" value={form.currency} onChange={handleFieldChange} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500 dark:border-indigo-500/30 dark:bg-slate-950" placeholder="USD" />
            </label>
            <label className="md:col-span-2 text-sm font-medium text-slate-700 dark:text-slate-300">
              <span className="mb-2 block">Website URL</span>
              <input name="websiteUrl" value={form.websiteUrl} onChange={handleFieldChange} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500 dark:border-indigo-500/30 dark:bg-slate-950" placeholder="https://example.com" />
            </label>
            <label className="md:col-span-2 text-sm font-medium text-slate-700 dark:text-slate-300">
              <span className="mb-2 block">Summary</span>
              <textarea name="summary" value={form.summary} onChange={handleFieldChange} rows={4} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500 dark:border-indigo-500/30 dark:bg-slate-950" placeholder="Short summary" />
            </label>
            <label className="flex items-center gap-3">
              <input type="checkbox" name="isPublished" checked={Boolean(form.isPublished)} onChange={handleFieldChange} />
              <span className="text-sm text-slate-700 dark:text-slate-300">Published</span>
            </label>
          </div>

          <input ref={fileInputRef} type="file" accept="image/*" onChange={onImageChange} className="hidden" />

          {imagePreview ? (
            <div className="mt-4">
              <p className="mb-2 text-sm font-medium text-slate-700 dark:text-slate-300">Image preview</p>
              <img src={imagePreview} alt="preview" className="max-h-40 rounded-lg object-cover" />
            </div>
          ) : null}

          {status ? <p className="mt-4 rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm font-semibold text-indigo-700 dark:border-indigo-500/30 dark:bg-indigo-950/30 dark:text-indigo-200">{status}</p> : null}
        </section>

        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-indigo-500/20 dark:bg-slate-900/40 dark:shadow-none">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-slate-950 dark:text-white">Websites</h3>
            <div className="flex items-center gap-3">
              <input placeholder="Search title or category" value={query} onChange={(e) => setQuery(e.target.value)} className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none" />
              <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none">
                <option value="">All categories</option>
                {WEBSITE_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
              <select value={filterPublished} onChange={(e) => setFilterPublished(e.target.value as any)} className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none">
                <option value="all">All</option>
                <option value="published">Published</option>
                <option value="draft">Draft</option>
              </select>
              <button onClick={() => void loadWebsites()} className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white">Filter</button>
            </div>
          </div>

          {websites.length === 0 ? (
            <p className="mt-4 rounded-xl border border-dashed border-slate-300 p-8 text-center text-sm font-medium text-slate-500 dark:border-indigo-500/20 dark:text-slate-400">No websites.</p>
          ) : (
            <div className="mt-4 space-y-4">
              {websites.map((w) => (
                <article key={w.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-indigo-500/20 dark:bg-slate-950">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-white">{w.title}</p>
                      <p className="text-sm text-slate-600 dark:text-slate-300">{w.category ?? 'Uncategorized'}</p>
                      <p className="text-sm text-slate-600 dark:text-slate-300">{w.currency} {w.price}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Created: {new Date(w.createdAt).toLocaleString()}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <a href={w.websiteUrl} target="_blank" rel="noreferrer" className="rounded-md bg-white px-4 py-2 text-sm font-semibold text-slate-900 ring-1 ring-slate-300 hover:bg-slate-100 transition">Visit</a>
                      <button type="button" onClick={() => prepareEdit(w)} className="rounded-md bg-yellow-500 px-4 py-2 text-sm font-semibold text-white">Edit</button>
                      <button type="button" onClick={() => void remove(w.id)} className="inline-flex items-center gap-2 rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-500 transition"><Trash2 className="h-4 w-4" />Delete</button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
