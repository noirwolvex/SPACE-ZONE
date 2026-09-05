"use client";

import { ChangeEvent, useEffect, useRef, useState } from "react";
import { RefreshCcw, ShieldCheck, Trash2 } from "lucide-react";
import { WEBSITE_CATEGORIES, WEBSITE_GAME_AGES, WEBSITE_GAME_TYPES, WEBSITE_RESPONSIVE_OPTIONS } from "@/lib/website-validation";
import type { WebsiteFormValues, WebsiteRecord } from "@/lib/website-types";

const initialForm: WebsiteFormValues = {
  title: "", summary: "", description: "", system: "", details: "", features: "", targetAudience: "",
  responsive: "Fully Responsive", age: "", customAge: "", gameType: "", customGameType: "", category: "", customCategory: "",
  price: "0", currency: "BHD", websiteUrl: "", isPublished: true,
};

const inputClass = "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 dark:border-indigo-500/30 dark:bg-slate-950";

function authHeaders(): Record<string, string> { return {}; }
async function getResponseErrorMessage(response: Response) {
  try { const result = await response.json(); if (result?.error) return String(result.error); } catch {}
  return response.statusText ? `${response.status} ${response.statusText}` : `HTTP ${response.status}`;
}
function splitPresetOrCustom(value: string | null | undefined, presets: readonly string[]) {
  const normalized = value?.trim() ?? "";
  return presets.includes(normalized) ? { preset: normalized, custom: "" } : { preset: "", custom: normalized };
}

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

  const effectiveCategory = (form.customCategory?.trim() || form.category?.trim() || "").trim();
  const effectiveAge = (form.customAge?.trim() || form.age?.trim() || "").trim();
  const effectiveGameType = (form.gameType === "CUSTOM" ? form.customGameType?.trim() : form.gameType?.trim() || "").trim();
  const isGame = effectiveCategory.toUpperCase() === "GAME";

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

  function handleFieldChange(event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    const target = event.target as HTMLInputElement;
    setForm((current) => ({ ...current, [target.name]: target.type === "checkbox" ? target.checked : target.value }));
  }
  function onImagesChange(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []).slice(0, 5);
    setSelectedImageFiles(files); setImagePreviews(files.map((file) => URL.createObjectURL(file)));
    setStatus(files.length > 5 ? "Only the first 5 images were selected." : "");
  }

  async function submit() {
    const category = effectiveCategory; const age = effectiveAge; const gameType = effectiveGameType;
    if (!form.title?.trim()) return setStatus("Title is required.");
    if (!category) return setStatus("Category is required.");
    if (!form.websiteUrl?.trim()) return setStatus("Website URL is required.");
    if (category.toUpperCase() === "GAME" && !age) return setStatus("Age is required for game websites.");
    if (category.toUpperCase() === "GAME" && !gameType) return setStatus("Game type is required for game websites.");
    setIsLoading(true); setStatus("");
    try {
      const data = new FormData();
      for (const file of selectedImageFiles.slice(0, 5)) data.append("images", file);
      data.append("title", form.title); data.append("summary", form.summary || ""); data.append("description", form.description || "");
      data.append("system", form.system || ""); data.append("details", form.details || ""); data.append("features", form.features || "");
      data.append("targetAudience", form.targetAudience || ""); data.append("responsive", form.responsive || ""); data.append("age", age);
      data.append("gameType", gameType); data.append("category", category); data.append("price", String(form.price || "0"));
      data.append("currency", form.currency || "BHD"); data.append("websiteUrl", form.websiteUrl); data.append("isPublished", String(Boolean(form.isPublished)));
      if (editingId) data.append("websiteId", editingId);
      const response = await fetch("/api/admin/websites/upload", { method: "POST", headers: authHeaders(), body: data });
      if (!response.ok) throw new Error(await getResponseErrorMessage(response));
      setStatus(editingId ? "Updated." : "Created."); setSelectedImageFiles([]); setImagePreviews([]); setEditingId(null); setForm(initialForm);
      if (fileInputRef.current) fileInputRef.current.value = "";
      await loadWebsites();
    } catch (err) { setStatus(String(err)); } finally { setIsLoading(false); }
  }

  function prepareEdit(w: WebsiteRecord) {
    const categoryParts = splitPresetOrCustom(w.category, WEBSITE_CATEGORIES);
    const ageParts = splitPresetOrCustom(w.age, WEBSITE_GAME_AGES);
    const storedGameType = w.gameType?.trim() ?? "";
    const presetTypes = WEBSITE_GAME_TYPES.filter((type) => type !== "CUSTOM");
    const gameTypeParts = storedGameType.toUpperCase() === "CUSTOM" ? { preset: "CUSTOM", custom: "" } : splitPresetOrCustom(storedGameType, presetTypes);
    setEditingId(w.id);
    setForm({
      title: w.title || "", summary: w.summary || "", description: w.description || "", system: w.system || "", details: w.details || "",
      features: w.features || "", targetAudience: w.targetAudience || "", responsive: w.responsive || "Fully Responsive",
      age: ageParts.preset, customAge: ageParts.custom, gameType: gameTypeParts.preset || (gameTypeParts.custom ? "CUSTOM" : ""), customGameType: gameTypeParts.custom,
      category: categoryParts.preset, customCategory: categoryParts.custom,
      price: String(w.price ?? 0), currency: w.currency || "BHD", websiteUrl: w.websiteUrl || "", isPublished: Boolean(w.isPublished),
    });
    setSelectedImageFiles([]); setImagePreviews([]); setStatus("Editing website. Custom Game Type can be used for your own game type.");
  }

  async function remove(id: string) {
    if (!confirm("Delete this website?")) return;
    setIsLoading(true);
    try {
      const response = await fetch("/api/admin/websites/delete", { method: "POST", headers: { "Content-Type": "application/json", ...authHeaders() }, body: JSON.stringify({ id }) });
      if (!response.ok) throw new Error(await getResponseErrorMessage(response));
      setStatus("Deleted."); await loadWebsites();
    } catch (err) { setStatus(String(err)); } finally { setIsLoading(false); }
  }

  return (
    <main className="flex-1 bg-slate-50 px-4 py-10 text-slate-900 transition-colors dark:bg-[#050505] dark:text-white">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-white px-3 py-1.5 text-sm font-semibold text-indigo-700 dark:border-indigo-500/30 dark:bg-slate-900/60 dark:text-indigo-300"><ShieldCheck className="h-4 w-4" />Space Zone Admin — Websites</div>
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-indigo-500/20 dark:bg-slate-900/40 dark:shadow-none">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><h2 className="text-xl font-bold">Manage Websites</h2><p className="mt-2 text-sm text-slate-600 dark:text-slate-300">Create, edit, publish, and manage website details shown on the public page.</p></div><div className="flex flex-wrap gap-3"><button type="button" onClick={() => fileInputRef.current?.click()} className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500">Choose up to 5 Images</button><button type="button" onClick={submit} disabled={isLoading} className="rounded-md bg-slate-200 px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-300 disabled:opacity-60 dark:bg-slate-800 dark:text-white">{editingId ? "Save Changes" : "Create Website"}</button><button type="button" onClick={() => void loadWebsites()} className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold dark:border-indigo-500/30 dark:bg-slate-900"><RefreshCcw className="h-4 w-4" />Refresh</button></div></div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <label className="text-sm font-medium"><span className="mb-2 block">Title</span><input name="title" value={form.title} onChange={handleFieldChange} className={inputClass} /></label>
            <label className="text-sm font-medium"><span className="mb-2 block">Website Category</span><select name="category" value={form.category} onChange={handleFieldChange} className={inputClass}><option value="">Select a category</option>{WEBSITE_CATEGORIES.map((category) => <option key={category} value={category}>{category}</option>)}</select></label>
            <label className="text-sm font-medium"><span className="mb-2 block">Custom Category</span><input name="customCategory" value={form.customCategory || ""} onChange={handleFieldChange} placeholder="Type your own category, e.g. Kids Learning Games" className={inputClass} /><span className="mt-1 block text-xs text-slate-500">When filled, this value replaces the selected category.</span></label>
            <label className="text-sm font-medium"><span className="mb-2 block">Age</span><select name="age" value={form.age || ""} onChange={handleFieldChange} disabled={!isGame} className={`${inputClass} disabled:cursor-not-allowed disabled:opacity-50`}><option value="">Select age</option>{WEBSITE_GAME_AGES.map((age) => <option key={age} value={age}>{age === "3-5" ? "Ages 3–5" : age === "6-8" ? "Ages 6–8" : age === "9-12" ? "Ages 9–12" : "Ages 13+"}</option>)}</select></label>
            <label className="text-sm font-medium"><span className="mb-2 block">Custom Age</span><input name="customAge" value={form.customAge || ""} onChange={handleFieldChange} disabled={!isGame} placeholder="Type any age, e.g. Ages 4–7 or 10+" className={`${inputClass} disabled:cursor-not-allowed disabled:opacity-50`} /><span className="mt-1 block text-xs text-slate-500">Use this for any custom age range. It replaces the preset age.</span></label>
            <div className="text-sm font-medium"><span className="mb-2 block">Game Type</span><select name="gameType" value={form.gameType || ""} onChange={handleFieldChange} disabled={!isGame} className={`${inputClass} disabled:cursor-not-allowed disabled:opacity-50`}><option value="">Select game type</option>{WEBSITE_GAME_TYPES.map((type) => <option key={type} value={type}>{type.charAt(0) + type.slice(1).toLowerCase()}</option>)}</select>{form.gameType === "CUSTOM" ? <input name="customGameType" value={form.customGameType || ""} onChange={handleFieldChange} disabled={!isGame} placeholder="Type your own game type, e.g. Math Challenge" className={`${inputClass} mt-3 disabled:cursor-not-allowed disabled:opacity-50`} /> : null}<span className="mt-1 block text-xs text-slate-500">Custom Game Type appears in the Games type filter.</span></div>
            <label className="text-sm font-medium"><span className="mb-2 block">Price</span><input name="price" value={form.price} onChange={handleFieldChange} className={inputClass} /></label>
            <label className="text-sm font-medium"><span className="mb-2 block">Currency</span><input name="currency" value={form.currency} onChange={handleFieldChange} className={inputClass} /></label>
            <label className="md:col-span-2 text-sm font-medium"><span className="mb-2 block">Website URL</span><input name="websiteUrl" value={form.websiteUrl} onChange={handleFieldChange} className={inputClass} /></label>
            <label className="md:col-span-2 text-sm font-medium"><span className="mb-2 block">Summary</span><textarea name="summary" value={form.summary} onChange={handleFieldChange} rows={3} className={inputClass} /></label>
            <label className="md:col-span-2 text-sm font-medium"><span className="mb-2 block">Description</span><textarea name="description" value={form.description} onChange={handleFieldChange} rows={10} className={`${inputClass} min-h-64 resize-y`} /></label>
            <label className="md:col-span-2 text-sm font-medium"><span className="mb-2 block">Features</span><textarea name="features" value={form.features} onChange={handleFieldChange} rows={7} className={`${inputClass} min-h-52 resize-y`} /></label>
            <label className="md:col-span-2 text-sm font-medium"><span className="mb-2 block">Other Details</span><textarea name="details" value={form.details} onChange={handleFieldChange} rows={7} className={`${inputClass} min-h-52 resize-y`} /></label>
            <label className="text-sm font-medium"><span className="mb-2 block">Target Audience</span><input name="targetAudience" value={form.targetAudience} onChange={handleFieldChange} placeholder="Businesses, creators, startups..." className={inputClass} /></label>
            <label className="text-sm font-medium"><span className="mb-2 block">Responsive</span><select name="responsive" value={form.responsive} onChange={handleFieldChange} className={inputClass}>{WEBSITE_RESPONSIVE_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}</select></label>
            <label className="text-sm font-medium"><span className="mb-2 block">System / Technologies</span><input name="system" value={form.system} onChange={handleFieldChange} placeholder="Next.js, Supabase, etc." className={inputClass} /></label>
            <label className="flex items-center gap-3"><input type="checkbox" name="isPublished" checked={Boolean(form.isPublished)} onChange={handleFieldChange} /><span className="text-sm">Published</span></label>
          </div>

          <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={onImagesChange} className="hidden" />
          {imagePreviews.length ? <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-5">{imagePreviews.map((src, index) => <img key={src} src={src} alt={`preview ${index + 1}`} className="h-28 w-full rounded-xl object-cover" />)}</div> : null}
          {status ? <p className="mt-4 rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm font-semibold text-indigo-700 dark:border-indigo-500/30 dark:bg-indigo-950/30 dark:text-indigo-200">{status}</p> : null}
        </section>

        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-indigo-500/20 dark:bg-slate-900/40 dark:shadow-none"><div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between"><h3 className="text-lg font-bold">Websites</h3><div className="flex flex-wrap gap-3"><input placeholder="Search title or category" value={query} onChange={(e) => setQuery(e.target.value)} className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm dark:bg-slate-950" /><select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm dark:bg-slate-950"><option value="">All categories</option>{WEBSITE_CATEGORIES.map((category) => <option key={category} value={category}>{category}</option>)}</select><select value={filterPublished} onChange={(e) => setFilterPublished(e.target.value as "all" | "published" | "draft")} className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm dark:bg-slate-950"><option value="all">All</option><option value="published">Published</option><option value="draft">Drafts</option></select><button type="button" onClick={() => void loadWebsites()} className="rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold dark:border-slate-700">Apply Filters</button></div></div><div className="mt-5 grid gap-3">{websites.map((website) => <article key={website.id} className="rounded-xl border border-slate-200 p-4 dark:border-slate-800"><div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h4 className="font-bold">{website.title}</h4><span className="rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300">{website.category || "Uncategorized"}</span>{website.age ? <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200">{website.age}</span> : null}{website.gameType ? <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200">{website.gameType}</span> : null}</div><p className="mt-1 truncate text-sm text-slate-500">{website.websiteUrl}</p></div><div className="flex shrink-0 gap-2"><button type="button" onClick={() => prepareEdit(website)} className="rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold dark:border-slate-700">Edit</button><button type="button" onClick={() => void remove(website.id)} disabled={isLoading} className="inline-flex items-center gap-2 rounded-md border border-red-200 px-3 py-2 text-sm font-semibold text-red-600 disabled:opacity-60 dark:border-red-500/30"><Trash2 className="h-4 w-4" />Delete</button></div></div></article>)}{!websites.length ? <p className="py-10 text-center text-sm text-slate-500">No websites found.</p> : null}</div></section>
      </div>
    </main>
  );
}
