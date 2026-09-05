"use client";

import { ChevronDown } from "lucide-react";
import { useState } from "react";

export type FAQListItem = { id: string; question: string; answer: string };

export default function FAQList({ items }: { items: FAQListItem[] }) {
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <div className="mt-12 space-y-4">
      {items.map((item) => {
        const open = openId === item.id;
        return (
          <div
            key={item.id}
            className="rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:border-indigo-300 dark:border-indigo-500/20 dark:bg-slate-900/60 dark:hover:border-indigo-400/40"
          >
            <button
              type="button"
              onClick={() => setOpenId(open ? null : item.id)}
              aria-expanded={open}
              aria-controls={`faq-answer-${item.id}`}
              className="flex w-full items-center justify-between gap-5 px-6 py-5 text-left font-bold text-slate-950 dark:text-white"
            >
              <span className="min-w-0 break-words">{item.question}</span>
              <ChevronDown
                aria-hidden="true"
                className={`h-5 w-5 shrink-0 text-indigo-600 transition-transform duration-300 dark:text-indigo-300 ${open ? "rotate-180" : ""}`}
              />
            </button>
            <div
              id={`faq-answer-${item.id}`}
              hidden={!open}
              className="break-words whitespace-pre-wrap px-6 pb-6 pr-14 text-base leading-8 text-slate-600 dark:text-slate-300"
            >
              {item.answer}
            </div>
          </div>
        );
      })}
    </div>
  );
}
