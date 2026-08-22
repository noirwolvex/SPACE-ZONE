"use client";

import { useEffect } from "react";

export default function AdminHashRouter() {
  useEffect(() => {
    const activateRequestedTab = () => {
      if (window.location.hash !== "#tools") return;

      const toolsButton = Array.from(document.querySelectorAll("button")).find(
        (button) => button.textContent?.trim() === "Startup Tools"
      );

      if (toolsButton instanceof HTMLButtonElement) {
        toolsButton.click();
        return true;
      }

      return false;
    };

    let attempts = 0;
    const activateWhenReady = () => {
      if (activateRequestedTab()) return;
      if (window.location.hash !== "#tools" || attempts++ >= 30) return;
      window.setTimeout(activateWhenReady, 50);
    };

    activateWhenReady();
    window.addEventListener("hashchange", activateWhenReady);

    const observer = new MutationObserver(() => {
      if (window.location.hash === "#tools") {
        activateRequestedTab();
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      window.removeEventListener("hashchange", activateWhenReady);
      observer.disconnect();
    };
  }, []);

  return null;
}
