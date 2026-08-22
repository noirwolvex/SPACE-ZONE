"use client";

import { useEffect } from "react";

type ToolSnapshot = {
  slug: string;
  bestFor?: string[];
};

export default function AdminHashRouter() {
  useEffect(() => {
    const bestForBySlug = new Map<string, string[]>();
    const originalFetch = window.fetch.bind(window);

    const getToolForm = () => {
      const heading = Array.from(document.querySelectorAll("h2")).find((node) => {
        const text = node.textContent?.trim();
        return text === "Add tool" || text === "Edit tool";
      });
      return heading?.closest("form") ?? null;
    };

    const installBestForField = () => {
      const form = getToolForm();
      if (!form || form.querySelector("[data-admin-best-for]") || form.querySelector("button[type=submit]")?.textContent?.includes("Save service")) {
        return;
      }

      const wrapper = document.createElement("label");
      wrapper.dataset.adminBestFor = "true";
      wrapper.className = "mt-4 block text-sm font-semibold text-slate-700 dark:text-slate-200";

      const labelRow = document.createElement("span");
      labelRow.className = "flex items-center gap-2";
      labelRow.textContent = "Best for";

      const optional = document.createElement("span");
      optional.className = "rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-slate-500 dark:bg-slate-800 dark:text-slate-300";
      optional.textContent = "Optional";
      labelRow.appendChild(optional);

      const textarea = document.createElement("textarea");
      textarea.rows = 4;
      textarea.placeholder = "First-time founders\nMarketing teams\nSmall agencies";
      textarea.className = "mt-2 w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-950 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 dark:border-indigo-500/30 dark:bg-slate-950 dark:text-white dark:focus:ring-indigo-950";
      textarea.dataset.adminBestForInput = "true";

      wrapper.append(labelRow, textarea);

      const submit = form.querySelector("button[type=submit]");
      if (submit) form.insertBefore(wrapper, submit);
      else form.appendChild(wrapper);

      const syncFromSlug = () => {
        const slugInput = Array.from(form.querySelectorAll<HTMLInputElement>("input")).find((input) => input.placeholder === "seo-audit-pro" || input.placeholder === "social-automation");
        if (!slugInput) return;
        const values = bestForBySlug.get(slugInput.value.trim());
        if (values && document.activeElement !== textarea) {
          textarea.value = values.join("\n");
        }
      };

      syncFromSlug();
      const slugInput = Array.from(form.querySelectorAll<HTMLInputElement>("input")).find((input) => input.placeholder === "seo-audit-pro" || input.placeholder === "social-automation");
      slugInput?.addEventListener("input", syncFromSlug);
    };

    const activateRequestedTab = () => {
      if (window.location.hash !== "#tools") return false;

      const toolsButton = Array.from(document.querySelectorAll("button")).find(
        (button) => button.textContent?.trim() === "Startup Tools"
      );

      if (toolsButton instanceof HTMLButtonElement) {
        toolsButton.click();
        return true;
      }

      return false;
    };

    const activateWhenReady = () => {
      activateRequestedTab();
      installBestForField();
    };

    const originalWindowFetch = window.fetch;
    window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === "string" ? input : input instanceof Request ? input.url : input.toString();
      const method = (init?.method ?? (input instanceof Request ? input.method : "GET")).toUpperCase();
      let patchedInit = init;

      if (url.includes("/api/admin/tools") && (method === "POST" || method === "PUT") && typeof init?.body === "string") {
        try {
          const payload = JSON.parse(init.body) as Record<string, unknown>;
          const bestForField = document.querySelector<HTMLTextAreaElement>("[data-admin-best-for-input]");
          const bestFor = bestForField?.value
            .split("\n")
            .map((item) => item.trim())
            .filter(Boolean) ?? [];
          payload.bestFor = bestFor;
          patchedInit = { ...init, body: JSON.stringify(payload) };
        } catch {
          // Keep the original request if the body is not JSON.
        }
      }

      const response = await originalWindowFetch(input, patchedInit);

      if (url.includes("/api/admin/tools") && method === "GET") {
        try {
          const data = (await response.clone().json()) as ToolSnapshot[];
          for (const tool of data) {
            if (tool?.slug) bestForBySlug.set(tool.slug, tool.bestFor ?? []);
          }
          installBestForField();
        } catch {
          // Ignore non-JSON responses.
        }
      }

      return response;
    };

    activateWhenReady();
    window.addEventListener("hashchange", activateWhenReady);

    const observer = new MutationObserver(() => activateWhenReady());
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      window.fetch = originalFetch;
      window.removeEventListener("hashchange", activateWhenReady);
      observer.disconnect();
    };
  }, []);

  return null;
}
