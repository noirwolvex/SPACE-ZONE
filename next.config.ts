import type { NextConfig } from "next";

const envSupabaseHostname = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
  : undefined;

const supabaseHostnames = Array.from(
  new Set([
    envSupabaseHostname,
    "ukwjrawoquzoccgvpovw.supabase.co",
  ].filter(Boolean) as string[]),
);

const nextConfig: NextConfig = {
  images: {
    remotePatterns: supabaseHostnames.length
      ? supabaseHostnames.map((hostname) => ({
          protocol: "https",
          hostname,
          pathname: "/storage/v1/object/**",
        }))
      : [],
  },
};

export default nextConfig;
