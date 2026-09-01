"use client";

import { FormEvent, useState } from "react";
import { Bot, LoaderCircle, MessageSquareText, SendHorizontal, Sparkles } from "lucide-react";

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  text: string;
};

const starterMessages: ChatMessage[] = [
  {
    id: "welcome",
    role: "assistant",
    text:
      "Hello! I am the Space Zone AI assistant. I can help you choose the right services, explain the process, or answer any questions about the website and products.",
  },
];

export default function AIChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>(starterMessages);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = input.trim();

    if (!trimmed || isLoading) {
      return;
    }

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      text: trimmed,
    };

    const pendingAssistantMessage: ChatMessage = {
      id: `pending-${crypto.randomUUID()}`,
      role: "assistant",
      text: "Thinking...",
    };

    setMessages((current) => [...current, userMessage, pendingAssistantMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/ai-chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: trimmed }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Failed to get response.");
      }

      setMessages((current) => {
        const withoutPending = current.filter((message) => message.id !== pendingAssistantMessage.id);
        return [
          ...withoutPending,
          {
            id: crypto.randomUUID(),
            role: "assistant",
            text: data.reply || "No response is available right now.",
          },
        ];
      });
    } catch (error) {
      setMessages((current) => {
        const withoutPending = current.filter((message) => message.id !== pendingAssistantMessage.id);
        return [
          ...withoutPending,
          {
            id: crypto.randomUUID(),
            role: "assistant",
            text:
              error instanceof Error
                ? `An error occurred: ${error.message}`
                : "Sorry, an unexpected error occurred. Please try again.",
          },
        ];
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-9rem)] bg-[radial-gradient(circle_at_top,_rgba(99,102,241,0.16),_transparent_38%),linear-gradient(to_bottom,_#eef2ff,_#f8fafc_30%,_#f8fafc)] px-4 py-10 dark:bg-[radial-gradient(circle_at_top,_rgba(99,102,241,0.18),_transparent_35%),linear-gradient(to_bottom,_#020817,_#0f172a_35%,_#020817)] dark:text-white">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6 flex items-center justify-between gap-3 rounded-2xl border border-indigo-200/70 bg-white/80 p-5 shadow-lg shadow-indigo-500/5 backdrop-blur-xl dark:border-indigo-500/20 dark:bg-slate-900/70">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-500/30">
              <Bot className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-indigo-600 dark:text-indigo-300">AI CHAT BOT</p>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Space Zone AI Assistant</h1>
            </div>
          </div>
          <div className="hidden items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300 md:flex">
            <Sparkles className="h-4 w-4" />
            Gemini Flash Lite
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
          <aside className="rounded-3xl border border-slate-200 bg-white/80 p-5 shadow-xl shadow-slate-200/50 backdrop-blur-xl dark:border-slate-700 dark:bg-slate-900/80 dark:shadow-none">
            <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
              <MessageSquareText className="h-4 w-4 text-indigo-500" />
              Quick actions
            </div>
            <div className="space-y-3">
              {[
                "What are your best services?",
                "How can I order a professional website?",
                "Can you create a store or a new website?",
                "I need help choosing the right package.",
              ].map((label) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => setInput(label)}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-left text-sm text-slate-700 transition hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:border-indigo-500/40 dark:hover:bg-slate-800/90"
                >
                  {label}
                </button>
              ))}
            </div>
          </aside>

          <section className="rounded-3xl border border-slate-200 bg-white/80 shadow-xl shadow-slate-200/50 backdrop-blur-xl dark:border-slate-700 dark:bg-slate-900/80 dark:shadow-none">
            <div className="flex h-[62vh] min-h-[450px] flex-col">
              <div className="flex-1 space-y-4 overflow-y-auto p-4 sm:p-5">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-7 shadow-sm ${
                        message.role === "user"
                          ? "bg-indigo-600 text-white shadow-indigo-500/20"
                          : "border border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                      }`}
                    >
                      {message.text}
                    </div>
                  </div>
                ))}
              </div>

              <form onSubmit={handleSubmit} className="border-t border-slate-200 p-4 dark:border-slate-700">
                <div className="flex items-end gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-2 dark:border-slate-700 dark:bg-slate-800">
                  <textarea
                    value={input}
                    onChange={(event) => setInput(event.target.value)}
                    rows={1}
                    placeholder="Type your message here..."
                    className="max-h-36 min-h-[52px] flex-1 resize-none border-0 bg-transparent px-2 py-2 text-sm text-slate-700 outline-none placeholder:text-slate-400 dark:text-slate-100 dark:placeholder:text-slate-500"
                  />
                  <button
                    type="submit"
                    disabled={isLoading || !input.trim()}
                    className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-600 text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:bg-slate-300 dark:disabled:bg-slate-700"
                  >
                    {isLoading ? <LoaderCircle className="h-5 w-5 animate-spin" /> : <SendHorizontal className="h-5 w-5" />}
                  </button>
                </div>
              </form>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
