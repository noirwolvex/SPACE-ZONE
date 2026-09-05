"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Inbox, Loader2, MessageSquare, ExternalLink, Building2, BriefcaseBusiness, WalletCards, Clock3, Phone } from "lucide-react";

type ContactMessage = {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  company?: string | null;
  service?: string | null;
  budget?: string | null;
  timeline?: string | null;
  contactType?: string | null;
  message: string;
  details?: string | null;
  attachmentUrl?: string | null;
  attachmentName?: string | null;
  status: string;
  createdAt: string;
};

export default function AdminMessages() {
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadMessages() {
    try {
      const response = await fetch("/api/admin/messages");
      if (!response.ok) throw new Error("Failed to load messages");
      setMessages(await response.json());
    } catch {
      setError("Unable to load messages.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadMessages();
  }, []);

  async function setStatus(id: string, status: string) {
    const response = await fetch(`/api/admin/messages/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (!response.ok) {
      setError("Unable to update message status.");
      return;
    }
    const updated = await response.json();
    setMessages((current) => current.map((item) => item.id === id ? { ...item, status: updated.status } : item));
  }

  const projectRequests = messages.filter((message) => message.contactType === "Project Request");

  return (
    <main className="min-h-[90vh] flex-1 bg-slate-50 px-4 py-10 text-slate-900 dark:bg-[#050505] dark:text-white">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-indigo-500/20 dark:bg-slate-900/50">
          <div className="bg-gradient-to-r from-indigo-50 via-white to-sky-50 p-6 dark:from-indigo-950/40 dark:via-slate-900/70 dark:to-sky-950/20 md:p-8">
            <div className="flex items-center gap-4">
              <Link href="/admin" className="rounded-full p-2 transition hover:bg-white/80 dark:hover:bg-slate-800"><ArrowLeft className="h-5 w-5" /></Link>
              <span className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-white px-3 py-1 text-sm font-semibold text-indigo-700 dark:border-indigo-500/30 dark:bg-indigo-950/30 dark:text-indigo-200"><Inbox className="h-4 w-4" />Inbox</span>
            </div>
            <div className="mt-7 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div><h1 className="text-3xl font-black tracking-tight md:text-4xl">Project Requests</h1><p className="mt-2 max-w-2xl leading-7 text-slate-600 dark:text-slate-300">Structured briefs from the Contact page. Review scope, service, budget, timeline, and project details from one place.</p></div>
              <div className="rounded-2xl border border-indigo-200 bg-white/80 px-5 py-3 text-center dark:border-indigo-500/20 dark:bg-slate-950/40"><p className="text-2xl font-black text-indigo-600 dark:text-indigo-300">{projectRequests.length}</p><p className="text-xs font-bold uppercase tracking-widest text-slate-400">Project requests</p></div>
            </div>
          </div>
        </header>

        {isLoading ? <div className="flex justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-indigo-500" /></div> : error ? <p className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-700">{error}</p> : messages.length === 0 ? <div className="rounded-2xl border border-dashed p-12 text-center"><MessageSquare className="mx-auto mb-4 h-12 w-12 text-slate-300" /><h3 className="text-xl font-bold">No messages yet</h3></div> : (
          <div className="grid gap-5">
            {messages.map((msg) => (
              <article key={msg.id} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-indigo-500/20 dark:bg-slate-900/40 md:p-7">
                <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div><h3 className="text-xl font-black">{msg.name}</h3><p className="mt-1 break-all text-sm text-slate-500">{msg.email}</p></div>
                      <span className={`rounded-full px-3 py-1 text-xs font-black uppercase tracking-wider ${msg.status === "UNREAD" ? "bg-indigo-600 text-white" : msg.status === "ARCHIVED" ? "bg-slate-800 text-white" : "border border-slate-200 text-slate-600 dark:border-slate-700 dark:text-slate-300"}`}>{msg.status}</span>
                    </div>

                    <p className="mt-2 text-xs uppercase tracking-widest text-slate-400">{new Date(msg.createdAt).toLocaleString()}</p>

                    <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                      {[[Building2, "Company", msg.company], [BriefcaseBusiness, "Service", msg.service], [WalletCards, "Budget", msg.budget], [Clock3, "Timeline", msg.timeline]].map(([Icon, label, value]) => value ? (
                        <div key={String(label)} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/50">
                          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400"><Icon className="h-3.5 w-3.5" />{label}</div>
                          <p className="mt-2 text-sm font-bold text-slate-800 dark:text-slate-100">{String(value)}</p>
                        </div>
                      ) : null)}
                    </div>

                    {msg.phone || msg.contactType ? <div className="mt-3 flex flex-wrap gap-2">{msg.contactType ? <span className="rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-700 dark:border-indigo-500/30 dark:bg-indigo-950/30 dark:text-indigo-200">{msg.contactType}</span> : null}{msg.phone ? <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 dark:border-slate-700 dark:text-slate-300"><Phone className="h-3.5 w-3.5" />{msg.phone}</span> : null}</div> : null}

                    <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-950/70">
                      <p className="text-xs font-black uppercase tracking-widest text-slate-400">Project Details</p>
                      <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-7 text-slate-700 dark:text-slate-300">{msg.message}</p>
                    </div>

                    {msg.details ? <div className="mt-4 rounded-2xl border border-slate-200 p-4 dark:border-slate-800"><p className="text-xs font-black uppercase tracking-widest text-slate-400">Additional Details</p><p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700 dark:text-slate-300">{msg.details}</p></div> : null}

                    {msg.attachmentUrl ? <a href={msg.attachmentUrl} target="_blank" rel="noreferrer" className="mt-4 inline-flex items-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm font-bold text-indigo-700 transition hover:bg-indigo-100 dark:border-indigo-500/30 dark:bg-indigo-950/30 dark:text-indigo-200"><ExternalLink className="h-4 w-4" />{msg.attachmentName || "View attachment"}</a> : null}
                  </div>

                  <div className="flex shrink-0 flex-wrap gap-2 lg:w-28 lg:flex-col">
                    <button onClick={() => void setStatus(msg.id, "READ")} className="rounded-lg bg-indigo-600 px-3 py-2 text-xs font-bold text-white transition hover:bg-indigo-500">Read</button>
                    <button onClick={() => void setStatus(msg.id, "UNREAD")} className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold dark:border-slate-700">Unread</button>
                    <button onClick={() => void setStatus(msg.id, "ARCHIVED")} className="rounded-lg bg-slate-800 px-3 py-2 text-xs font-bold text-white transition hover:bg-slate-700">Archive</button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
