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
  const [selectedVideoFile, setSelectedVideoFile] = useState<File | null>(null);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string>("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<WebsiteFormValues>(initialForm);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const videoInputRef = useRef<HTMLInputElement | null>(null);
  const [query, setQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterPublished, setFilterPublished] = useState<"all" | "published" | "draft">("all");

  const effectiveCategory = form.category?.trim() ?? "";
  const effectiveAge = (form.customAge?.trim() || form.age?.trim() || "").trim();
  const effectiveGameType = form.gameType === "CUSTOM"
    ? (form.customGameType?.trim() ?? "")
    : (form.gameType?.trim() ?? "");
  const isGame = effectiveCategory.toUpperCase() === "GAME";

  useEffect(() => { void loadWebsites(); }, []);
  useEffect(() => () => { if (videoPreviewUrl) URL.revokeObjectURL(videoPreviewUrl); }, [videoPreviewUrl]);

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
  function onVideoChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    if (videoPreviewUrl) URL.revokeObjectURL(videoPreviewUrl);
    setSelectedVideoFile(file);
    setVideoPreviewUrl(file ? URL.createObjectURL(file) : "");
    if (file && file.size > 25 * 1024 * 1024) setStatus("The video must be smaller than 25MB.");
    else setStatus("");
  }

  async function submit() {
    const category = effectiveCategory; const age = effectiveAge; const gameType = effectiveGameType;
    if (!form.title?.trim()) return setStatus("Title is required.");
    if (!category) return setStatus("Category is required.");
    if (!form.websiteUrl?.trim()) return setStatus("Website URL is required.");
    if (category.toUpperCase() === "GAME" && !age) return setStatus("Age is required for game websites.");
    if (category.toUpperCase() === "GAME" && !gameType) return setStatus("Game type is required for game websites.");
    if (selectedVideoFile && selectedVideoFile.size > 25 * 1024 * 1024) return setStatus("The video must be smaller than 25MB.");
    setIsLoading(true); setStatus("");
    try {
      const data = new FormData();
      for (const file of selectedImageFiles.slice(0, 5)) data.append("images", file);
      if (selectedVideoFile) data.append("video", selectedVideoFile);
      data.append("title", form.title); data.append("summary", form.summary || ""); data.append("description", form.description || "");
      data.append("system", form.system || ""); data.append("details", form.details || ""); data.append("features", form.features || "");
      data.append("targetAudience", form.targetAudience || ""); data.append("responsive", form.responsive || ""); data.append("age", age);
      data.append("gameType", gameType); data.append("category", category); data.append("price", String(form.price || "0"));
      data.append("currency", form.currency || "BHD"); data.append("websiteUrl", form.websiteUrl); data.append("isPublished", String(Boolean(form.isPublished)));
      if (editingId) data.append("websiteId", editingId);
      const response = await fetch("/api/admin/websites/upload", { method: "POST", headers: authHeaders(), body: data });
      if (!response.ok) throw new Error(await getResponseErrorMessage(response));
      setStatus(editingId ? "Updated." : "Created."); setSelectedImageFiles([]); setImagePreviews([]); setSelectedVideoFile(null); setVideoPreviewUrl(""); setEditingId(null); setForm(initialForm);
      if (fileInputRef.current) fileInputRef.current.value = "";
      if (videoInputRef.current) videoInputRef.current.value = "";
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
      category: categoryParts.preset, customCategory: "",
      price: String(w.price ?? 0), currency: w.currency || "BHD", websiteUrl: w.websiteUrl || "", isPublished: Boolean(w.isPublished),
    });
    setSelectedImageFiles([]); setImagePreviews([]); setSelectedVideoFile(null); if (videoPreviewUrl) URL.revokeObjectURL(videoPreviewUrl); setVideoPreviewUrl("");
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (videoInputRef.current) videoInputRef.current.value = "";
    setStatus("Editing website. Choose a new video only if you want to replace the current one.");
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
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><h2 className="text-xl font-bold">Manage Websites</h2><p className="mt-2 text-sm text-slate-600 dark:text-slate-300">Create, edit, publish, and manage website details shown on the public page.</p></div><div className="flex flex-wrap gap-3"><button type="button" onClick={() => fileInputRef.current?.click()} className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500">Choose up to 5 Images</button><button type="button" onClick={() => videoInputRef.current?.click()} className="rounded-md bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-500">Choose Video</button><button type="button" onClick={submit} disabled={isLoading} className="rounded-md bg-slate-200 px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-300 disabled:opacity-60 dark:bg-slate-800 dark:text-white">{editingId ? "Save Changes" : "Create Website"}</button><button type="button" onClick={() => void loadWebsites()} className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold dark:border-indigo-500/30 dark:bg-slate-900"><RefreshCcw className="h-4 w-4" />Refresh</button></div></div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <label className="text-sm font-medium"><span className="mb-2 block">Title</span><input name="title" value={form.title} onChange={handleFieldChange} className={inputClass} /></label>
            <label className="text-sm font-medium"><span className="mb-2 block">Website Category</span><select name="category" value={form.category} onChange={handleFieldChange} className={inputClass}><option value="">Select a category</option>{WEBSITE_CATEGORIES.map((category) => <option key={category} value={category}>{category}</option>)}</select></label>
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
          <input ref={videoInputRef} type="file" accept="video/mp4,video/webm,video/ogg,video/quicktime" onChange={onVideoChange} className="hidden" />
          {imagePreviews.length ? <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-5">{imagePreviews.map((src, index) => <img key={src} src={src} alt={`preview ${index + 1}`} className="h-28 w-full rounded-xl object-cover" />)}</div> : null}
          {videoPreviewUrl ? <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200 bg-slate-950 dark:border-slate-800"><div className="border-b border-white/10 px-4 py-3 text-sm font-semibold text-white">Selected Video</div><video src={videoPreviewUrl} controls className="aspect-video w-full bg-black" /></div> : null}
          <p className="mt-3 text-xs text-slate-500">Video: MP4, WEBM, OGG, or MOV. Maximum 25MB.</p>
          {status ? <div className="mt-4 rounded-lg bg-slate-100 px-3 py-2 text-sm dark:bg-slate-800">{status}</div> : null}
        </section>

        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-indigo-500/20 dark:bg-slate-900/40 dark:shadow-none">
          <div className="flex flex-col gap-3 sm:flex-row"><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search websites..." className={inputClass} /><select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className={inputClass}><option value="">All categories</option>{WEBSITE_CATEGORIES.map((category) => <option key={category} value={category}>{category}</option>)}</select><select value={filterPublished} onChange={(e) => setFilterPublished(e.target.value as "all" | "published" | "draft")} className={inputClass}><option value="all">All</option><option value="published">Published</option><option value="draft">Drafts</option></select><button type="button" onClick={() => void loadWebsites()} className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500">Search</button></div>
          <div className="mt-6 overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr className="border-b border-slate-200 dark:border-slate-700"><th className="px-3 py-2">Title</th><th className="px-3 py-2">Category</th><th className="px-3 py-2">Published</th><th className="px-3 py-2">Actions</th></tr></thead><tbody>{websites.map((website) => <tr key={website.id} className="border-b border-slate-100 dark:border-slate-800"><td className="px-3 py-3 font-medium">{website.title}</td><td className="px-3 py-3">{website.category || "-"}</td><td className="px-3 py-3">{website.isPublished ? "Yes" : "No"}</td><td className="px-3 py-3"><div className="flex gap-2"><button type="button" onClick={() => prepareEdit(website)} className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-semibold dark:border-slate-700">Edit</button><button type="button" onClick={() => void remove(website.id)} className="inline-flex items-center gap-1 rounded-md bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-500"><Trash2 className="h-3.5 w-3.5" />Delete</button></div></td></tr>)}</tbody></table></div>
        </section>
      </div>
    </main>
  );
}
