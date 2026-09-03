import type { NextConfig } from "next";

const envSupabaseHostname = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
  : undefined;

const supabaseHostnames = envSupabaseHostname ? [envSupabaseHostname] : [];

const nextConfig: NextConfig = {
  turbopack: {
    root: process.cwd(),
  },
  images: {
    remotePatterns: supabaseHostnames.map((hostname) => ({
      protocol: "https",
      hostname,
      pathname: "/storage/v1/object/**",
    })),
  },
};

export default nextConfig;
