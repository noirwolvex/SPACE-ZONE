"use client";

import { useEffect, useState, type ChangeEvent } from "react";
import { Trash2, Upload, RefreshCcw } from "lucide-react";

type ToolFile = {
  id: string;
  filename: string;
  size: number;
  contentType: string;
  sortOrder: number;
};

export default function StartupToolFileManager({ toolId }: { toolId: string }) {
  const [files, setFiles] = useState<ToolFile[]>([]);
  const [selected, setSelected] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function load() {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/tools/${toolId}/files`, { cache: "no-store" });
      const data = await response.json().catch(() => []);
      if (!response.ok) throw new Error(data?.error || "Unable to load files.");
      setFiles(Array.isArray(data) ? data : []);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to load files.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, [toolId]);

  function onSelect(event: ChangeEvent<HTMLInputElement>) {
    setSelected(event.target.files?.[0] ?? null);
    setMessage("");
  }

  async function upload() {
    if (!selected || loading) return;
    setLoading(true);
    setMessage("");
    try {
      const formData = new FormData();
      formData.append("file", selected);
      const response = await fetch(`/api/admin/tools/${toolId}/files`, { method: "POST", body: formData });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data?.error || "Unable to upload file.");
      setMessage(`Uploaded ${selected.name}.`);
      setSelected(null);
      const input = document.getElementById(`tool-file-${toolId}`) as HTMLInputElement | null;
      if (input) input.value = "";
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to upload file.");
    } finally {
      setLoading(false);
    }
  }

  async function remove(fileId: string) {
    if (loading) return;
    setLoading(true);
    setMessage("");
    try {
      const response = await fetch(`/api/admin/tools/${toolId}/files?fileId=${encodeURIComponent(fileId)}`, { method: "DELETE" });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data?.error || "Unable to delete file.");
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to delete file.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="mt-4 rounded-2xl border border-indigo-200 bg-indigo-50/60 p-4 dark:border-indigo-500/20 dark:bg-indigo-950/20">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-bold text-slate-900 dark:text-white">Protected product files</h3>
          <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">These files are private and become downloadable only after a verified paid order.</p>
        </div>
        <button type="button" onClick={() => void load()} disabled={loading} className="inline-flex items-center gap-2 rounded-lg border bg-white px-3 py-2 text-xs font-semibold dark:border-slate-700 dark:bg-slate-950">
          <RefreshCcw className="h-3.5 w-3.5" />Refresh
        </button>
      </div>

      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <input id={`tool-file-${toolId}`} type="file" onChange={onSelect} className="block w-full rounded-lg border bg-white p-2 text-sm dark:border-slate-700 dark:bg-slate-950" />
        <button type="button" onClick={() => void upload()} disabled={!selected || loading} className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-bold text-white disabled:opacity-50">
          <Upload className="h-4 w-4" />Upload
        </button>
      </div>

      {message ? <p className="mt-3 text-sm font-semibold text-indigo-700 dark:text-indigo-300">{message}</p> : null}

      <div className="mt-4 space-y-2">
        {files.length === 0 ? <p className="rounded-xl border border-dashed border-slate-300 p-4 text-center text-sm text-slate-500 dark:border-slate-700">No protected files uploaded yet.</p> : files.map((file) => (
          <div key={file.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-white p-3 dark:border-slate-700 dark:bg-slate-950">
            <div className="min-w-0"><p className="truncate text-sm font-semibold text-slate-900 dark:text-white">{file.filename}</p><p className="text-xs text-slate-500">{Math.max(1, Math.round(file.size / 1024))} KB · {file.contentType}</p></div>
            <button type="button" onClick={() => void remove(file.id)} disabled={loading} className="inline-flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-red-600 dark:bg-red-950/30 dark:text-red-300"><Trash2 className="h-3.5 w-3.5" />Delete</button>
          </div>
        ))}
      </div>
    </section>
  );
}
