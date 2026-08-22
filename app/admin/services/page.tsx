"use client";

import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import { ImagePlus, Loader2, Save, Trash2, X } from "lucide-react";

type AdminService = {
  id?: string;
  slug: string;
  name: string;
  summary: string;
  image?: string | null;
  deliverables: string[];
  process: string[];
};

type ServiceForm = {
  id: string;
  name: string;
  slug: string;
  summary: string;
  image: string;
  deliverables: string;
  process: string;
};

const emptyForm: ServiceForm = {
  id: "",
  name: "",
  slug: "",
  summary: "",
  image: "",
  deliverables: "",
  process: "",
};

function adminHeaders() {
  return { "Content-Type": "application/json" };
}

async function errorMessage(response: Response) {
  try {
    const json = await response.json();
    if (json?.error) return String(json.error);
  } catch {}
  return `${response.status} ${response.statusText}`;
}

function listToText(items: string[]) {
  return items.join("\n");
}

export default function AdminServicesPage() {
  const [services, setServices] = useState<AdminService[]>([]);
  const [form, setForm] = useState<ServiceForm>(emptyForm);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);

  async function loadServices() {
    setLoading(true);
    setStatus("");
    try {
      const response = await fetch("/api/admin/services", { headers: adminHeaders() });
      if (!response.ok) throw new Error(await errorMessage(response));
      setServices(await response.json());
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Unable to load services.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadServices();
  }, []);

  function edit(service: AdminService) {
    setForm({
      id: service.id ?? "",
      name: service.name,
      slug: service.slug,
      summary: service.summary,
      image: service.image ?? "",
      deliverables: listToText(service.deliverables),
      process: listToText(service.process),
    });
    setStatus("Editing service.");
  }

  async function uploadImage(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setImageUploading(true);
    setStatus("");
    try {
      const data = new FormData();
      data.append("file", file);
      data.append("directory", "services");
      const response = await fetch("/api/admin/upload", { method: "POST", body: data });
      if (!response.ok) throw new Error(await errorMessage(response));
      const result = await response.json();
      setForm((current) => ({ ...current, image: String(result.path ?? "") }));
      setStatus("Service image uploaded. Save the service to apply it.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Unable to upload image.");
    } finally {
      setImageUploading(false);
    }
  }

  async function save(event: FormEvent) {
    event.preventDefault();
    if (!form.name.trim() || !form.summary.trim()) {
      setStatus("Name and summary are required.");
      return;
    }

    setLoading(true);
    setStatus("");
    try {
      const isEditing = Boolean(form.id);
      const response = await fetch(isEditing ? `/api/admin/services/${form.id}` : "/api/admin/services", {
        method: isEditing ? "PUT" : "POST",
        headers: adminHeaders(),
        body: JSON.stringify(form),
      });
      if (!response.ok) throw new Error(await errorMessage(response));
      setForm(emptyForm);
      setStatus(isEditing ? "Service updated." : "Service created.");
      await loadServices();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Unable to save service.");
    } finally {
      setLoading(false);
    }
  }

  async function remove(service: AdminService) {
    if (!service.id || !confirm(`Delete ${service.name}?`)) return;
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/services/${service.id}`, { method: "DELETE" });
      if (!response.ok) throw new Error(await errorMessage(response));
      if (form.id === service.id) setForm(emptyForm);
      setStatus("Service deleted.");
      await loadServices();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Unable to delete service.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 text-slate-900 dark:bg-[#050505] dark:text-white">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <span className="inline-flex rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-indigo-700 dark:border-indigo-500/30 dark:bg-indigo-950/30 dark:text-indigo-300">Admin · Services</span>
            <h1 className="mt-3 text-4xl font-extrabold tracking-tight">Manage Services</h1>
            <p className="mt-2 max-w-2xl text-slate-600 dark:text-slate-300">Add a service image, edit the service content, and control what appears on the public Services page.</p>
          </div>
          <a href="/admin" className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-bold text-slate-800 hover:bg-slate-100 dark:border-indigo-500/30 dark:bg-slate-900 dark:text-slate-200">Back to Admin</a>
        </div>

        {status ? <p className="mb-6 rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm font-semibold text-indigo-700 dark:border-indigo-500/30 dark:bg-indigo-950/30 dark:text-indigo-200">{status}</p> : null}

        <div className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr]">
          <form onSubmit={save} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-indigo-500/20 dark:bg-slate-900/50">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-xl font-bold">{form.id ? "Edit service" : "Add service"}</h2>
              {form.id ? <button type="button" onClick={() => setForm(emptyForm)} className="inline-flex items-center gap-1 text-sm font-semibold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"><X className="h-4 w-4" />Cancel</button> : null}
            </div>

            <label className="mt-5 block text-sm font-semibold">Name<input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-indigo-500 dark:border-indigo-500/30 dark:bg-slate-950" /></label>
            <label className="mt-4 block text-sm font-semibold">Slug<input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="auto-from-name" className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-indigo-500 dark:border-indigo-500/30 dark:bg-slate-950" /></label>
            <label className="mt-4 block text-sm font-semibold">Summary<textarea required value={form.summary} onChange={(e) => setForm({ ...form, summary: e.target.value })} rows={4} className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-indigo-500 dark:border-indigo-500/30 dark:bg-slate-950" /></label>

            <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-indigo-500/20 dark:bg-slate-950/60">
              <p className="text-sm font-bold">Service Image</p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Recommended: landscape image suitable for a card banner.</p>
              {form.image ? (
                <div className="mt-3 overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={form.image} alt="Service preview" className="h-44 w-full object-cover" />
                </div>
              ) : null}
              <label className="mt-3 flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-indigo-300 bg-indigo-50 px-4 py-4 text-sm font-bold text-indigo-700 hover:bg-indigo-100 dark:border-indigo-500/30 dark:bg-indigo-950/30 dark:text-indigo-200">
                {imageUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
                {form.image ? "Replace image" : "Choose image"}
                <input type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={uploadImage} disabled={imageUploading} className="sr-only" />
              </label>
            </div>

            <label className="mt-4 block text-sm font-semibold">Deliverables, one per line<textarea value={form.deliverables} onChange={(e) => setForm({ ...form, deliverables: e.target.value })} rows={5} className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-indigo-500 dark:border-indigo-500/30 dark:bg-slate-950" /></label>
            <label className="mt-4 block text-sm font-semibold">Process, one step per line<textarea value={form.process} onChange={(e) => setForm({ ...form, process: e.target.value })} rows={5} className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-indigo-500 dark:border-indigo-500/30 dark:bg-slate-950" /></label>

            <button type="submit" disabled={loading || imageUploading} className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white hover:bg-indigo-500 disabled:opacity-60"><Save className="h-4 w-4" />{form.id ? "Save Changes" : "Create Service"}</button>
          </form>

          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-indigo-500/20 dark:bg-slate-900/50">
            <div className="flex items-center justify-between"><h2 className="text-xl font-bold">Current Services</h2><span className="text-sm text-slate-500">{services.length} services</span></div>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              {services.map((service) => (
                <article key={service.id ?? service.slug} className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950">
                  <div className="h-32 bg-gradient-to-br from-indigo-100 to-slate-100 dark:from-indigo-950/60 dark:to-slate-950">
                    {service.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={service.image} alt={service.name} className="h-full w-full object-cover" />
                    ) : <div className="flex h-full items-center justify-center text-xs font-bold uppercase tracking-wider text-slate-400">No image</div>}
                  </div>
                  <div className="p-4">
                    <p className="font-bold">{service.name}</p>
                    <p className="mt-1 line-clamp-2 text-sm text-slate-600 dark:text-slate-300">{service.summary}</p>
                    <div className="mt-4 flex gap-2"><button type="button" onClick={() => edit(service)} className="flex-1 rounded-lg bg-indigo-600 px-3 py-2 text-xs font-bold text-white hover:bg-indigo-500">Edit</button><button type="button" onClick={() => void remove(service)} className="inline-flex items-center justify-center rounded-lg bg-red-600 px-3 py-2 text-white hover:bg-red-500"><Trash2 className="h-4 w-4" /></button></div>
                  </div>
                </article>
              ))}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
