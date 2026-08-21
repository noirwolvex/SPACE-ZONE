"use client";

import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import {
  BarChart,
  CheckCircle2,
  Edit3,
  Globe,
  ImagePlus,
  Loader2,
  LogOut,
  Mail,
  Package,
  Plus,
  Save,
  ShieldCheck,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";

type AdminService = {
  id?: string;
  slug: string;
  name: string;
  summary: string;
  deliverables: string[];
  process: string[];
};

type AdminTool = {
  id?: string;
  slug: string;
  name: string;
  summary: string;
  description: string;
  price: number;
  category: string;
  thumbnail: string;
  benefits: string[];
  includedFiles: string[];
};

type ServiceForm = {
  id: string;
  name: string;
  slug: string;
  summary: string;
  deliverables: string;
  process: string;
};

type ToolForm = {
  id: string;
  name: string;
  slug: string;
  summary: string;
  description: string;
  price: string;
  category: string;
  thumbnail: string;
  benefits: string;
  includedFiles: string;
};

type ContactMessage = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  message: string;
  status: string;
  createdAt: string;
};

const emptyServiceForm: ServiceForm = {
  id: "",
  name: "",
  slug: "",
  summary: "",
  deliverables: "",
  process: "",
};

const emptyToolForm: ToolForm = {
  id: "",
  name: "",
  slug: "",
  summary: "",
  description: "",
  price: "",
  category: "SaaS",
  thumbnail: "",
  benefits: "",
  includedFiles: "",
};

// Admin API routes authorize via the Supabase session cookie, which the browser
// sends automatically on same-origin requests. No credentials live in this bundle.
function adminHeaders() {
  return { "Content-Type": "application/json" };
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

function listToText(items: string[]) {
  return items.join("\n");
}

export default function AdminDashboard() {
  const { signOut } = useAuth();
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"services" | "tools">("services");
  const [services, setServices] = useState<AdminService[]>([]);
  const [tools, setTools] = useState<AdminTool[]>([]);
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [trafficCount, setTrafficCount] = useState(0);
  const [serviceForm, setServiceForm] = useState<ServiceForm>(emptyServiceForm);
  const [toolForm, setToolForm] = useState<ToolForm>(emptyToolForm);

  const stats = useMemo(
    () => [
      { label: "Overall Traffic", value: trafficCount, icon: BarChart },
      { label: "Services", value: services.length, icon: Sparkles },
      { label: "Startup tools", value: tools.length, icon: Package },
    ],
    [services.length, tools.length, trafficCount]
  );

  async function loadContent() {
    setIsLoading(true);
    setStatus("");

    try {
      const [servicesResponse, toolsResponse, trafficResponse] = await Promise.all([
        fetch("/api/admin/services", { headers: adminHeaders() }),
        fetch("/api/admin/tools", { headers: adminHeaders() }),
        fetch("/api/traffic", { headers: adminHeaders() }),
      ]);

      if (!servicesResponse.ok || !toolsResponse.ok || !trafficResponse.ok) {
        throw new Error("Unable to load admin content.");
      }

      setServices(await servicesResponse.json());
      setTools(await toolsResponse.json());
      const trafficData = await trafficResponse.json();
      setTrafficCount(trafficData.count || 0);
    } catch (contentError) {
      setStatus(contentError instanceof Error ? contentError.message : "Unable to load admin content.");
    } finally {
      setIsLoading(false);
    }
  }

  // Access is already enforced server-side by app/admin/layout.tsx, so the
  // dashboard simply loads its content once mounted.
  useEffect(() => {
    void loadContent();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleLogout() {
    await signOut();
  }

  function editService(service: AdminService) {
    setActiveTab("services");
    setServiceForm({
      id: service.id ?? "",
      name: service.name,
      slug: service.slug,
      summary: service.summary,
      deliverables: listToText(service.deliverables),
      process: listToText(service.process),
    });
  }

  function editTool(tool: AdminTool) {
    setActiveTab("tools");
    setToolForm({
      id: tool.id ?? "",
      name: tool.name,
      slug: tool.slug,
      summary: tool.summary,
      description: tool.description,
      price: String(tool.price),
      category: tool.category,
      thumbnail: tool.thumbnail,
      benefits: listToText(tool.benefits),
      includedFiles: listToText(tool.includedFiles),
    });
  }

  async function saveService(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("");
    setIsLoading(true);

    const isEditing = Boolean(serviceForm.id);
    const response = await fetch(isEditing ? `/api/admin/services/${serviceForm.id}` : "/api/admin/services", {
      method: isEditing ? "PUT" : "POST",
      headers: adminHeaders(),
      body: JSON.stringify(serviceForm),
    });

    setIsLoading(false);

    if (!response.ok) {
      setStatus(await getResponseErrorMessage(response));
      return;
    }

    setServiceForm(emptyServiceForm);
    setStatus(isEditing ? "Service updated." : "Service added.");
    await loadContent();
  }

  async function saveTool(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("");

    if (!toolForm.thumbnail) {
      setStatus("Upload a thumbnail image before saving this tool.");
      return;
    }

    setIsLoading(true);

    const isEditing = Boolean(toolForm.id);
    const response = await fetch(isEditing ? `/api/admin/tools/${toolForm.id}` : "/api/admin/tools", {
      method: isEditing ? "PUT" : "POST",
      headers: adminHeaders(),
      body: JSON.stringify(toolForm),
    });

    setIsLoading(false);

    if (!response.ok) {
      setStatus(await getResponseErrorMessage(response));
      return;
    }

    setToolForm(emptyToolForm);
    setStatus(isEditing ? "Tool updated." : "Tool added.");
    await loadContent();
  }

  async function uploadThumbnail(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setStatus("");
    setIsLoading(true);

    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch("/api/admin/upload", {
      method: "POST",
      body: formData,
    });

    setIsLoading(false);
    event.target.value = "";

    if (!response.ok) {
      setStatus(await getResponseErrorMessage(response));
      return;
    }

    const result = await response.json();
    setToolForm((current) => ({ ...current, thumbnail: result.path }));
    setStatus("Thumbnail uploaded. Save the tool to apply it.");
  }

  async function removeService(service: AdminService) {
    if (!service.id || !confirm(`Remove ${service.name}?`)) return;

    setIsLoading(true);
    await fetch(`/api/admin/services/${service.id}`, {
      method: "DELETE",
      headers: adminHeaders(),
    });
    setIsLoading(false);
    setStatus("Service removed.");
    await loadContent();
  }

  async function removeTool(tool: AdminTool) {
    if (!tool.id || !confirm(`Remove ${tool.name}?`)) return;

    setIsLoading(true);
    await fetch(`/api/admin/tools/${tool.id}`, {
      method: "DELETE",
      headers: adminHeaders(),
    });
    setIsLoading(false);
    setStatus("Tool removed.");
    await loadContent();
  }


  return (
    <main className="flex-1 bg-slate-50 px-4 py-10 text-slate-900 transition-colors dark:bg-[#050505] dark:text-white">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8 flex flex-col justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-indigo-500/20 dark:bg-slate-900/40 dark:shadow-none md:flex-row md:items-center">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-sm font-semibold text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-950/30 dark:text-emerald-200">
              <CheckCircle2 className="h-4 w-4" />
              Logged in as admin
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-950 dark:text-white md:text-4xl">
              Admin Dashboard
            </h1>
            <p className="mt-2 text-slate-600 dark:text-slate-300">
              Add, edit, and remove services or startup tools.
            </p>
          </div>
          <button onClick={handleLogout} className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 transition hover:bg-slate-100 dark:border-indigo-500/30 dark:bg-[#0a0f1e] dark:text-slate-200 dark:hover:bg-indigo-950/40">
            <LogOut className="h-4 w-4" />
            Log out
          </button>
        </header>

        <section className="grid gap-4 md:grid-cols-2">
          {stats.map((stat) => (
            <div key={stat.label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-indigo-500/20 dark:bg-slate-900/40 dark:shadow-none">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{stat.label}</p>
                <stat.icon className="h-5 w-5 text-indigo-600 dark:text-indigo-300" />
              </div>
              <p className="mt-4 text-3xl font-extrabold text-slate-950 dark:text-white">{stat.value}</p>
            </div>
          ))}
        </section>

        {status ? (
          <p className="mt-6 rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm font-semibold text-indigo-700 dark:border-indigo-500/30 dark:bg-indigo-950/30 dark:text-indigo-200">
            {status}
          </p>
        ) : null}

        <div className="mt-8 flex gap-3 flex-wrap">
          <button onClick={() => setActiveTab("services")} className={`rounded-lg px-4 py-2 text-sm font-bold transition ${activeTab === "services" ? "bg-indigo-600 text-white" : "border border-slate-300 bg-white text-slate-800 dark:border-indigo-500/30 dark:bg-slate-900 dark:text-slate-200"}`}>
            Services
          </button>
          <button onClick={() => setActiveTab("tools")} className={`rounded-lg px-4 py-2 text-sm font-bold transition ${activeTab === "tools" ? "bg-indigo-600 text-white" : "border border-slate-300 bg-white text-slate-800 dark:border-indigo-500/30 dark:bg-slate-900 dark:text-slate-200"}`}>
            Startup Tools
          </button>
          <a href="/admin/books" className="rounded-lg px-4 py-2 text-sm font-bold transition border border-slate-300 bg-white text-slate-800 dark:border-indigo-500/30 dark:bg-slate-900 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800">
            Books
          </a>
          <a href="/admin/websites" className="rounded-lg px-4 py-2 text-sm font-bold transition border border-slate-300 bg-white text-slate-800 dark:border-indigo-500/30 dark:bg-slate-900 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800">
            Websites
          </a>
          <a href="/admin/messages" className="rounded-lg px-4 py-2 text-sm font-bold transition border border-slate-300 bg-white text-slate-800 dark:border-indigo-500/30 dark:bg-slate-900 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800">
            Messages
          </a>
        </div>

        {activeTab === "services" ? (
          <section className="mt-6 grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
            <form onSubmit={saveService} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-indigo-500/20 dark:bg-slate-900/40 dark:shadow-none">
              <div className="mb-5 flex items-center justify-between gap-4">
                <h2 className="text-xl font-bold text-slate-950 dark:text-white">{serviceForm.id ? "Edit service" : "Add service"}</h2>
                {serviceForm.id ? (
                  <button type="button" onClick={() => setServiceForm(emptyServiceForm)} className="inline-flex items-center gap-1 text-sm font-semibold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white">
                    <X className="h-4 w-4" />
                    Cancel
                  </button>
                ) : null}
              </div>

              <AdminInput label="Name" required value={serviceForm.name} onChange={(value) => setServiceForm({ ...serviceForm, name: value })} placeholder="Designing Store Banners" />
              <AdminInput label="Slug" optional value={serviceForm.slug} onChange={(value) => setServiceForm({ ...serviceForm, slug: value })} placeholder="designing-store-banners" />
              <AdminTextarea label="Summary" required value={serviceForm.summary} onChange={(value) => setServiceForm({ ...serviceForm, summary: value })} rows={3} />
              <AdminTextarea label="Deliverables, one per line" optional value={serviceForm.deliverables} onChange={(value) => setServiceForm({ ...serviceForm, deliverables: value })} rows={5} />
              <AdminTextarea label="Process, one step per line" optional value={serviceForm.process} onChange={(value) => setServiceForm({ ...serviceForm, process: value })} rows={5} />

              <button type="submit" className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-indigo-500">
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Save service
              </button>
            </form>

            <ContentList
              title="Services"
              emptyText="No services yet."
              items={services.map((service) => ({
                id: service.id,
                title: service.name,
                subtitle: service.summary,
                slug: service.slug,
                onEdit: () => editService(service),
                onDelete: () => removeService(service),
              }))}
            />
          </section>
        ) : (
          <section className="mt-6 grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
            <form onSubmit={saveTool} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-indigo-500/20 dark:bg-slate-900/40 dark:shadow-none">
              <div className="mb-5 flex items-center justify-between gap-4">
                <h2 className="text-xl font-bold text-slate-950 dark:text-white">{toolForm.id ? "Edit tool" : "Add tool"}</h2>
                {toolForm.id ? (
                  <button type="button" onClick={() => setToolForm(emptyToolForm)} className="inline-flex items-center gap-1 text-sm font-semibold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white">
                    <X className="h-4 w-4" />
                    Cancel
                  </button>
                ) : null}
              </div>

              <AdminInput label="Name" required value={toolForm.name} onChange={(value) => setToolForm({ ...toolForm, name: value })} placeholder="SEO Audit Pro" />
              <AdminInput label="Slug" optional value={toolForm.slug} onChange={(value) => setToolForm({ ...toolForm, slug: value })} placeholder="seo-audit-pro" />
              <AdminInput label="Category" optional value={toolForm.category} onChange={(value) => setToolForm({ ...toolForm, category: value })} placeholder="SaaS" />
              <AdminInput label="Price" optional value={toolForm.price} onChange={(value) => setToolForm({ ...toolForm, price: value })} placeholder="29" />
              <label className="mt-4 block text-sm font-semibold text-slate-700 dark:text-slate-200">
                <FieldLabel label="Thumbnail image" required />
                <span className="mt-2 flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-indigo-300 bg-indigo-50 px-4 py-4 text-sm font-bold text-indigo-700 transition hover:bg-indigo-100 dark:border-indigo-500/30 dark:bg-indigo-950/30 dark:text-indigo-200 dark:hover:bg-indigo-950/50">
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
                  Choose image
                </span>
                <input type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={uploadThumbnail} className="sr-only" />
              </label>
              {toolForm.thumbnail ? (
                <p className="mt-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-600 dark:border-indigo-500/20 dark:bg-slate-950/40 dark:text-slate-300">
                  Current thumbnail: {toolForm.thumbnail}
                </p>
              ) : null}
              <AdminTextarea label="Summary" required value={toolForm.summary} onChange={(value) => setToolForm({ ...toolForm, summary: value })} rows={3} />
              <AdminTextarea label="Description" optional value={toolForm.description} onChange={(value) => setToolForm({ ...toolForm, description: value })} rows={4} />
              <AdminTextarea label="Benefits, one per line" optional value={toolForm.benefits} onChange={(value) => setToolForm({ ...toolForm, benefits: value })} rows={5} />
              <AdminTextarea label="Included files, one per line" optional value={toolForm.includedFiles} onChange={(value) => setToolForm({ ...toolForm, includedFiles: value })} rows={5} />

              <button type="submit" className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-indigo-500">
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Save tool
              </button>
            </form>

            <ContentList
              title="Startup tools"
              emptyText="No startup tools yet."
              items={tools.map((tool) => ({
                id: tool.id,
                title: tool.name,
                subtitle: tool.summary,
                slug: tool.slug,
                onEdit: () => editTool(tool),
                onDelete: () => removeTool(tool),
              }))}
            />
          </section>
        )}
      </div>
    </main>
  );
}

function AdminInput({
  label,
  required,
  optional,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  required?: boolean;
  optional?: boolean;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="mt-4 block text-sm font-semibold text-slate-700 dark:text-slate-200">
      <FieldLabel label={label} required={required} optional={optional} />
      <input required={required} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-950 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 dark:border-indigo-500/30 dark:bg-slate-950 dark:text-white dark:focus:ring-indigo-950" />
    </label>
  );
}

function AdminTextarea({
  label,
  required,
  optional,
  value,
  onChange,
  rows,
}: {
  label: string;
  required?: boolean;
  optional?: boolean;
  value: string;
  onChange: (value: string) => void;
  rows: number;
}) {
  return (
    <label className="mt-4 block text-sm font-semibold text-slate-700 dark:text-slate-200">
      <FieldLabel label={label} required={required} optional={optional} />
      <textarea required={required} value={value} onChange={(event) => onChange(event.target.value)} rows={rows} className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-950 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 dark:border-indigo-500/30 dark:bg-slate-950 dark:text-white dark:focus:ring-indigo-950" />
    </label>
  );
}

function FieldLabel({
  label,
  required,
  optional,
}: {
  label: string;
  required?: boolean;
  optional?: boolean;
}) {
  return (
    <span className="flex items-center gap-2">
      {label}
      {required ? (
        <span className="rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-red-700 dark:bg-red-950/30 dark:text-red-200">
          Required
        </span>
      ) : null}
      {optional ? (
        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-slate-500 dark:bg-slate-800 dark:text-slate-300">
          Optional
        </span>
      ) : null}
    </span>
  );
}

function ContentList({
  title,
  emptyText,
  items,
}: {
  title: string;
  emptyText: string;
  items: Array<{
    id?: string;
    title: string;
    subtitle: string;
    slug: string;
    onEdit: () => void;
    onDelete: () => void;
  }>;
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-indigo-500/20 dark:bg-slate-900/40 dark:shadow-none">
      <div className="mb-5 flex items-center gap-2">
        <Plus className="h-5 w-5 text-indigo-600 dark:text-indigo-300" />
        <h2 className="text-xl font-bold text-slate-950 dark:text-white">{title}</h2>
      </div>

      {items.length ? (
        <div className="space-y-4">
          {items.map((item) => (
            <article key={item.slug} className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-indigo-500/20 dark:bg-slate-950/40">
              <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-300">{item.slug}</p>
                  <h3 className="mt-1 font-bold text-slate-950 dark:text-white">{item.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{item.subtitle}</p>
                  {!item.id ? (
                    <p className="mt-2 text-xs font-semibold text-amber-700 dark:text-amber-300">
                      Seed the database to edit this default item.
                    </p>
                  ) : null}
                </div>
                <div className="flex shrink-0 gap-2">
                  <button type="button" onClick={item.onEdit} disabled={!item.id} className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-800 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-indigo-500/30 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-indigo-950/40">
                    <Edit3 className="h-4 w-4" />
                    Edit
                  </button>
                  <button type="button" onClick={item.onDelete} disabled={!item.id} className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-red-500/30 dark:bg-red-950/30 dark:text-red-200">
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <p className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-sm font-medium text-slate-500 dark:border-indigo-500/20 dark:text-slate-400">
          {emptyText}
        </p>
      )}
    </section>
  );
}
