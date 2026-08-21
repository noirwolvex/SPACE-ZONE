"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Inbox, Loader2, MessageSquare } from "lucide-react";

type ContactMessage = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  message: string;
  status: string;
  createdAt: string;
};

export default function AdminMessages() {
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadMessages() {
      try {
        const response = await fetch("/api/admin/messages");
        if (!response.ok) throw new Error("Failed to load messages");
        const data = await response.json();
        setMessages(data);
      } catch (err) {
        setError("Unable to load messages.");
      } finally {
        setIsLoading(false);
      }
    }
    loadMessages();
  }, []);

  return (
    <main className="flex-1 bg-slate-50 px-4 py-10 text-slate-900 transition-colors dark:bg-[#050505] dark:text-white min-h-[90vh]">
      <div className="mx-auto max-w-5xl">
        <header className="mb-8 flex flex-col justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-indigo-500/20 dark:bg-slate-900/40 dark:shadow-none md:flex-row md:items-center">
          <div>
            <div className="flex items-center gap-4 mb-4">
              <Link href="/admin" className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition">
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-sm font-semibold text-indigo-700 dark:border-indigo-500/30 dark:bg-indigo-950/30 dark:text-indigo-200">
                <Inbox className="h-4 w-4" />
                Inbox
              </div>
            </div>
            
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-950 dark:text-white md:text-4xl">
              User Messages
            </h1>
            <p className="mt-2 text-slate-600 dark:text-slate-300">
              View messages submitted via the{" "}
              <Link href="/contact" className="text-indigo-600 dark:text-indigo-400 font-medium hover:underline">
                Contact Page
              </Link>.
            </p>
          </div>
        </header>

        {isLoading ? (
          <div className="flex justify-center p-12">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
          </div>
        ) : error ? (
          <p className="text-red-500 text-center rounded-xl border border-red-200 bg-red-50 p-6 dark:border-red-500/30 dark:bg-red-950/30 dark:text-red-200">
            {error}
          </p>
        ) : messages.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm dark:border-indigo-500/20 dark:bg-slate-900/40 dark:shadow-none">
            <MessageSquare className="mx-auto h-12 w-12 text-slate-300 dark:text-slate-600 mb-4" />
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">No messages yet</h3>
            <p className="text-slate-500 dark:text-slate-400 mt-2">When users reach out, their messages will appear here.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {messages.map((msg) => (
              <div key={msg.id} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col md:flex-row gap-6 justify-between dark:border-indigo-500/20 dark:bg-slate-900/40 dark:shadow-none">
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
                    {msg.name} <span className="text-sm font-normal text-slate-500 dark:text-slate-400 ml-2">&lt;{msg.email}&gt;</span>
                  </h3>
                  <div className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4">
                    {new Date(msg.createdAt).toLocaleString()}
                  </div>
                  <p className="whitespace-pre-wrap text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-100 dark:border-indigo-500/10">
                    {msg.message}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
