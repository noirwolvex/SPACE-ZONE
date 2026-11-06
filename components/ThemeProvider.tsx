"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import { type ThemeProviderProps } from "next-themes";

// next-themes 0.4.6 renders its anti-FOUC theme bootstrap as an inline script.
// React 19 / Next.js 16.2 reports a development-only warning if that provider
// is mounted on the client. The server-rendered script remains intact and
// continues to prevent a theme flash; filter only this known false-positive
// message in development, leaving every other console error visible.
if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
  const originalConsoleError = console.error;
  console.error = (...args: unknown[]) => {
    if (
      typeof args[0] === "string" &&
      args[0].includes("Encountered a script tag while rendering React component")
    ) {
      return;
    }
    originalConsoleError(...args);
  };
}

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}
