"use client";

import { useEffect } from "react";

export default function AdminHashRouter() {
  useEffect(() => {
    const activateRequestedTab = () => {
      if (window.location.hash !== "#tools") return;

      const buttons = Array.from(document.querySelectorAll("button"));
      const toolsButton = buttons.find(
        (button) => button.textContent?.trim() === "Startup Tools"
      );

      if (toolsButton instanceof HTMLButtonElement) {
        toolsButton.click();
      }
    };

    activateRequestedTab();
    window.addEventListener("hashchange", activateRequestedTab);
    return () => window.removeEventListener("hashchange", activateRequestedTab);
  }, []);

  return null;
}
