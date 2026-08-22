"use client";

import { ChangeEvent, useEffect, useRef, useState } from "react";
import { ShieldCheck, Trash2, RefreshCcw } from "lucide-react";
import { BOOK_CATEGORIES, validateGalleryCount, type BookGalleryPlan } from "@/lib/book-validation";
import { AGE_GROUPS } from "@/lib/book-filters";
import BookImageManager, { type GalleryItem } from "@/components/admin/BookImageManager";
import type { BookFormValues, BookRecord } from "@/lib/book-types";

const initialForm: BookFormValues = {
  title: "",
  author: "",
  targetAge: "",
  ageGroup: "",
  category: "",
  summary: "",
  features: "",
  targetAudience: "",
  bookSize: "",
  pageCount: "",
  seriesParts: "",
  price: "",
  currency: "BHD",
  isFree: false,
};

function authHeaders(): Record<string, string> { return {}; }

async function parseErrorResponse(response: Response) {
  try { return await response.json(); } catch { return null; }
}

async function getResponseErrorMessage(response: Response) {
  const result = await parseErrorResponse(response);
  if (result?.error) return String(result.error);
  if (response.statusText) return `${response.status} ${response.statusText}`;
  try {
    const text = await response.text();
    return text ? text : `HTTP ${response.status}`;
  } catch {
    return `HTTP ${response.status}`;
  }
}

export default function AdminBooksPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [books, setBooks] = useState<BookRecord[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedCoverImageFile, setSelectedCoverImageFile] = useState<File | null>(null);
  const [editingBookId, setEditingBookId] = useState<string | null>(null);
  const [form, setForm] = useState<BookFormValues>(initialForm);
  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const coverInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => { void loadBooks(); }, []);

  async function loadBooks() {
    setIsLoading(true);
    setStatus("");
    try {
      const response = await fetch("/api/admin/books/list", { headers: authHeaders() });
      if (!response.ok) throw new Error(await getResponseErrorMessage(response));
      setBooks(await response.json());
    } catch (error) {
      setStatus(String(error));
    } finally {
      setIsLoading(false);
    }
  }

  function handleFieldChange(event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    const { name, type } = event.target;
    const value = type === "checkbox" ? (event.target as HTMLInputElement).checked : event.target.value;
    setForm((current) => ({ ...current, [name]: value }));
  }

  function replaceGallery(next: GalleryItem[]) {
    setGalleryItems((current) => {
      const keptKeys = new Set(next.map((item) => item.key));
      for (const item of current) {
        if (item.kind === "new" && !keptKeys.has(item.key)) URL.revokeObjectURL(item.previewUrl);
      }
      return next;
    });
  }

  function onFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    setStatus("");
  }

  function onCoverImageChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setSelectedCoverImageFile(file);
    setStatus("");
  }

  async function submitUpload() {
    if (!form.title.trim()) return setStatus("Book title is required.");
    if (!form.category.trim()) return setStatus("Book category is required.");
    if (!selectedFile && !editingBookId) return setStatus("Please select a PDF file first.");

    if (!form.isFree) {
      const price = Number(form.price);
      if (!form.price.trim() || !Number.isFinite(price) || price <= 0) return setStatus("Paid books require a price greater than 0.");
    }

    const galleryError = validateGalleryCount(galleryItems.length, { required: !editingBookId });
    if (galleryError) return setStatus(galleryError);

    if (form.pageCount.trim()) {
      const pageCount = Number(form.pageCount);
      if (!Number.isInteger(pageCount) || pageCount < 1) return setStatus("Page count must be a whole number greater than 0.");
    }

    setIsLoading(true);
    setStatus("");

    const formData = new FormData();
    if (selectedFile) formData.append("file", selectedFile);
    if (selectedCoverImageFile) formData.append("coverImage", selectedCoverImageFile);
    formData.append("title", form.title);
    formData.append("author", form.author);
    formData.append("targetAge", form.targetAge);
    formData.append("ageGroup", form.ageGroup);
    formData.append("category", form.category);
    formData.append("summary", form.summary);
    formData.append("features", form.features);
    formData.append("targetAudience", form.targetAudience);
    formData.append("bookSize", form.bookSize);
    formData.append("pageCount", form.pageCount);
    formData.append("seriesParts", form.seriesParts);
    formData.append("accessType", form.isFree ? "FREE" : "PAID");
    formData.append("price", form.isFree ? "" : form.price);
    formData.append("currency", form.currency);
    if (editingBookId) formData.append("bookId", editingBookId);

    const galleryPlan: BookGalleryPlan = galleryItems.flatMap((item): BookGalleryPlan => {
      if (item.kind === "existing" && item.id) return [{ kind: "existing", id: item.id }];
      if (!item.file) return [];
      const fileIndex = formData.getAll("previewImages").length;
      formData.append("previewImages", item.file);
      return [{ kind: "new", fileIndex }];
    });
    formData.append("gallery", JSON.stringify(galleryPlan));

    try {
      const response = await fetch("/api/admin/books/upload", { method: "POST", headers: authHeaders(), body: formData });
      if (!response.ok) throw new Error(await getResponseErrorMessage(response));
      const result = await response.json();
      setStatus(`Saved "${result.title}" as ${result.isFree ? "FREE" : `PAID (${result.price} ${result.currency})`}.`);
      setSelectedFile(null);
      setSelectedCoverImageFile(null);
      setEditingBookId(null);
      setForm(initialForm);
      replaceGallery([]);
      await loadBooks();
    } catch (error) {
      setStatus(String(error));
    } finally {
      setIsLoading(false);
    }
  }

  function prepareReplacement(book: BookRecord) {
    setEditingBookId(book.id);
    setForm({
      title: book.title ?? "",
      author: book.author ?? "",
      targetAge: book.targetAge ?? "",
      ageGroup: book.ageGroup ?? "",
      category: book.category ?? "",
      summary: book.summary ?? "",
      features: book.features ?? "",
      targetAudience: book.targetAudience ?? "",
      bookSize: book.bookSize ?? "",
      pageCount: book.pageCount != null ? String(book.pageCount) : "",
      seriesParts: book.seriesParts ?? "",
      price: book.price != null ? String(book.price) : "",
      currency: book.currency ?? "BHD",
      isFree: Boolean(book.isFree),
    });
    replaceGallery((book.images ?? []).map((image) => ({ key: `existing-${image.id}`, kind: "existing" as const, id: image.id, previewUrl: image.url })));
    setStatus("Edit the book metadata and optionally choose a new PDF or cover image.");
  }

  async function deleteBook(id: string) {
    setIsLoading(true);
    setStatus("");
    try {
      const response = await fetch("/api/admin/books/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ id }),
      });
      if (!response.ok) throw new Error(await getResponseErrorMessage(response));
      setStatus("Book deleted successfully.");
      await loadBooks();
    } catch (error) {
      setStatus(String(error));
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="flex-1 bg-slate-50 px-4 py-10 text-slate-900 transition-colors dark:bg-[#050505] dark:text-white">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-white px-3 py-1.5 text-sm font-semibold text-indigo-700 shadow-sm dark:border-indigo-500/30 dark:bg-slate-900/60 dark:text-indigo-300">
          <ShieldCheck className="h-4 w-4" />Space Zone Admin — Books
        </div>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-indigo-500/20 dark:bg-slate-900/40 dark:shadow-none">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-950 dark:text-white">Manage Books</h2>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">Create, replace, or remove books with rich metadata for the public Books page. PDF uploads up to 600 MB are supported.</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button type="button" onClick={() => fileInputRef.current?.click()} className="inline-flex items-center justify-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 transition">Choose PDF</button>
              <button type="button" onClick={() => coverInputRef.current?.click()} className="inline-flex items-center justify-center rounded-md bg-slate-200 px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-300 transition disabled:cursor-not-allowed disabled:opacity-60 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700">Choose Cover Image</button>
              <button type="button" onClick={submitUpload} disabled={isLoading || (!selectedFile && !editingBookId)} className="inline-flex items-center justify-center rounded-md bg-slate-200 px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-300 transition disabled:cursor-not-allowed disabled:opacity-60 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700">{editingBookId ? "Save Changes" : "Create Book"}</button>
              <button type="button" onClick={() => void loadBooks()} className="inline-flex items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-50 transition dark:border-indigo-500/30 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"><RefreshCcw className="h-4 w-4" />Refresh</button>
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300"><span className="mb-2 block">Book Title</span><input name="title" value={form.title} onChange={handleFieldChange} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500 dark:border-indigo-500/30 dark:bg-slate-950" placeholder="Enter the book title" /></label>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300"><span className="mb-2 block">Author</span><input name="author" value={form.author} onChange={handleFieldChange} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500 dark:border-indigo-500/30 dark:bg-slate-950" placeholder="Optional author" /></label>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300"><span className="mb-2 block">Target Age</span><input name="targetAge" value={form.targetAge} onChange={handleFieldChange} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500 dark:border-indigo-500/30 dark:bg-slate-950" placeholder="e.g. 4-6 years" /></label>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300"><span className="mb-2 block">Age Group</span><select name="ageGroup" value={form.ageGroup} onChange={handleFieldChange} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500 dark:border-indigo-500/30 dark:bg-slate-950"><option value="">Unclassified</option>{AGE_GROUPS.map((group) => <option key={group.value} value={group.value}>{group.label}</option>)}</select></label>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300"><span className="mb-2 block">Book Category</span><select name="category" value={form.category} onChange={handleFieldChange} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500 dark:border-indigo-500/30 dark:bg-slate-950"><option value="">Select a category</option>{BOOK_CATEGORIES.map((category) => <option key={category} value={category}>{category}</option>)}</select></label>

            <div className="md:col-span-2 text-sm font-medium text-slate-700 dark:text-slate-300">
              <span className="mb-2 block">Access Type</span>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className={`flex cursor-pointer items-start gap-3 rounded-lg border px-4 py-3 transition ${form.isFree ? "border-emerald-500 bg-emerald-50 dark:border-emerald-500/60 dark:bg-emerald-950/30" : "border-slate-300 bg-white dark:border-indigo-500/30 dark:bg-slate-950"}`}>
                  <input type="radio" name="accessType" value="FREE" checked={form.isFree} onChange={() => setForm((current) => ({ ...current, isFree: true, price: "" }))} className="mt-1 h-4 w-4 text-emerald-600 focus:ring-emerald-500" />
                  <span><span className="block font-semibold text-slate-900 dark:text-white">Free Book</span><span className="mt-1 block text-xs text-slate-500 dark:text-slate-400">Anyone can read and download it. No price.</span></span>
                </label>
                <label className={`flex cursor-pointer items-start gap-3 rounded-lg border px-4 py-3 transition ${!form.isFree ? "border-indigo-500 bg-indigo-50 dark:border-indigo-500/60 dark:bg-indigo-950/30" : "border-slate-300 bg-white dark:border-indigo-500/30 dark:bg-slate-950"}`}>
                  <input type="radio" name="accessType" value="PAID" checked={!form.isFree} onChange={() => setForm((current) => ({ ...current, isFree: false }))} className="mt-1 h-4 w-4 text-indigo-600 focus:ring-indigo-500" />
                  <span><span className="block font-semibold text-slate-900 dark:text-white">Paid Book</span><span className="mt-1 block text-xs text-slate-500 dark:text-slate-400">Requires purchase. Price and currency are required.</span></span>
                </label>
              </div>
            </div>

            {!form.isFree ? (
              <>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300"><span className="mb-2 block">Price <span className="text-red-500">*</span></span><input name="price" value={form.price} onChange={handleFieldChange} type="number" min="0" step="0.001" className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500 dark:border-indigo-500/30 dark:bg-slate-950" placeholder="0.000" /></label>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300"><span className="mb-2 block">Currency <span className="text-red-500">*</span></span><select name="currency" value={form.currency} onChange={handleFieldChange} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500 dark:border-indigo-500/30 dark:bg-slate-950"><option value="BHD">BHD</option><option value="USD">USD</option><option value="EUR">EUR</option></select></label>
              </>
            ) : null}

            <label className="md:col-span-2 text-sm font-medium text-slate-700 dark:text-slate-300"><span className="mb-2 block">Book Summary</span><textarea name="summary" value={form.summary} onChange={handleFieldChange} rows={4} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500 dark:border-indigo-500/30 dark:bg-slate-950" placeholder="Write a short description of the book" /></label>
            <label className="md:col-span-2 text-sm font-medium text-slate-700 dark:text-slate-300"><span className="mb-2 block">Features</span><textarea name="features" value={form.features} onChange={handleFieldChange} rows={5} className="min-h-32 w-full resize-y rounded-lg border border-slate-300 bg-white px-3 py-3 text-sm leading-7 outline-none focus:border-indigo-500 dark:border-indigo-500/30 dark:bg-slate-950" placeholder="Main features, topics, benefits, or highlights..." /></label>
            <label className="md:col-span-2 text-sm font-medium text-slate-700 dark:text-slate-300"><span className="mb-2 block">Target Audience</span><textarea name="targetAudience" value={form.targetAudience} onChange={handleFieldChange} rows={4} className="min-h-28 w-full resize-y rounded-lg border border-slate-300 bg-white px-3 py-3 text-sm leading-7 outline-none focus:border-indigo-500 dark:border-indigo-500/30 dark:bg-slate-950" placeholder="Who is this book intended for?" /></label>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300"><span className="mb-2 block">Book Size</span><input name="bookSize" value={form.bookSize} onChange={handleFieldChange} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500 dark:border-indigo-500/30 dark:bg-slate-950" placeholder="e.g. A4, 21 × 29.7 cm" /></label>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300"><span className="mb-2 block">Number of Pages</span><input name="pageCount" value={form.pageCount} onChange={handleFieldChange} type="number" min="1" step="1" className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500 dark:border-indigo-500/30 dark:bg-slate-950" placeholder="e.g. 120" /></label>
            <label className="md:col-span-2 text-sm font-medium text-slate-700 dark:text-slate-300"><span className="mb-2 block">Previous / Upcoming Parts</span><textarea name="seriesParts" value={form.seriesParts} onChange={handleFieldChange} rows={4} className="min-h-28 w-full resize-y rounded-lg border border-slate-300 bg-white px-3 py-3 text-sm leading-7 outline-none focus:border-indigo-500 dark:border-indigo-500/30 dark:bg-slate-950" placeholder="e.g. Previous: Part 1 • Current: Part 2 • Upcoming: Part 3" /></label>

            <BookImageManager items={galleryItems} onChange={replaceGallery} disabled={isLoading} />
          </div>

          <input ref={fileInputRef} type="file" accept="application/pdf" onChange={onFileChange} className="hidden" />
          <input ref={coverInputRef} type="file" accept="image/*" onChange={onCoverImageChange} className="hidden" />

          {selectedFile ? <p className="mt-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 dark:border-indigo-500/30 dark:bg-slate-950/30 dark:text-slate-200">Selected PDF: <span className="font-semibold">{selectedFile.name}</span></p> : null}
          {selectedCoverImageFile ? <p className="mt-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 dark:border-indigo-500/30 dark:bg-slate-950/30 dark:text-slate-200">Selected cover: <span className="font-semibold">{selectedCoverImageFile.name}</span></p> : null}
          {status ? <p className="mt-4 rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm font-semibold text-indigo-700 dark:border-indigo-500/30 dark:bg-indigo-950/30 dark:text-indigo-200">{status}</p> : null}
          {isLoading ? <p className="mt-4 text-sm text-slate-600 dark:text-slate-300">Saving...</p> : null}
        </section>

        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-indigo-500/20 dark:bg-slate-900/40 dark:shadow-none">
          <h3 className="text-lg font-bold text-slate-950 dark:text-white">Current Books</h3>
          {books.length === 0 ? (
            <p className="mt-4 rounded-xl border border-dashed border-slate-300 p-8 text-center text-sm font-medium text-slate-500 dark:border-indigo-500/20 dark:text-slate-400">No books created yet.</p>
          ) : (
            <div className="mt-4 space-y-4">
              {books.map((book) => (
                <article key={book.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-indigo-500/20 dark:bg-slate-950">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-white">{book.title ?? book.filename}</p>
                      <p className="text-sm text-slate-600 dark:text-slate-300">{book.category ?? "Uncategorized"}</p>
                      <p className="text-sm text-slate-600 dark:text-slate-300">{book.targetAge ?? "Age not specified"}</p>
                      {book.pageCount ? <p className="text-sm text-slate-600 dark:text-slate-300">{book.pageCount} pages{book.bookSize ? ` · ${book.bookSize}` : ""}</p> : null}
                      <p className="mt-1"><span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${book.isFree ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200" : "bg-indigo-100 text-indigo-800 dark:bg-indigo-950/50 dark:text-indigo-200"}`}>{book.isFree ? "FREE" : `PAID — ${book.price ?? 0} ${book.currency}`}</span></p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Uploaded: {new Date(book.uploadedAt ?? Date.now()).toLocaleString()}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <a href={`/api/books/${book.id}/access?mode=read`} target="_blank" rel="noreferrer" className="rounded-md bg-white px-4 py-2 text-sm font-semibold text-slate-900 ring-1 ring-slate-300 hover:bg-slate-100 transition dark:bg-slate-800 dark:text-slate-100 dark:ring-indigo-500/20 dark:hover:bg-slate-700">View</a>
                      <button type="button" onClick={() => prepareReplacement(book)} className="rounded-md bg-yellow-500 px-4 py-2 text-sm font-semibold text-white hover:bg-yellow-400 transition">Edit</button>
                      <button type="button" onClick={() => void deleteBook(book.id)} className="inline-flex items-center gap-2 rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-500 transition"><Trash2 className="h-4 w-4" />Delete</button>
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
