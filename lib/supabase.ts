import { createBrowserClient, createServerClient } from "@supabase/ssr";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { NextRequest, NextResponse } from "next/server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase environment variables: NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY");
}

const resolvedSupabaseUrl = supabaseUrl;
const resolvedSupabaseAnonKey = supabaseAnonKey;

export const supabase = createBrowserClient(resolvedSupabaseUrl, resolvedSupabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    flowType: "pkce",
  },
});

export function createServerSupabaseClient(request: NextRequest, response: NextResponse) {
  return createServerClient(resolvedSupabaseUrl, resolvedSupabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });
}

/**
 * Carry Supabase's refreshed auth cookies onto the response we actually return.
 *
 * createServerSupabaseClient() writes rotated tokens onto whatever response it
 * was handed. Route handlers build that scratch response before they know their
 * result, so without this the refresh is silently dropped and the user is
 * signed out early.
 */
export function applyAuthCookies<T extends NextResponse>(source: NextResponse, target: T): T {
  for (const cookie of source.cookies.getAll()) {
    target.cookies.set(cookie);
  }
  return target;
}

/**
 * Supabase client for Server Components / server actions, reading the session
 * from the request cookies. Cookie writes are no-ops because Server Components
 * cannot mutate the response; token refresh happens in middleware instead.
 */
export async function createServerComponentSupabaseClient() {
  const { cookies } = await import("next/headers");
  const cookieStore = await cookies();

  return createServerClient(resolvedSupabaseUrl, resolvedSupabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll() {
        // Not writable from a Server Component; middleware refreshes the session.
      },
    },
  });
}

export const supabaseAdmin = supabaseServiceRoleKey
  ? createSupabaseClient(resolvedSupabaseUrl, supabaseServiceRoleKey, {
      auth: {
        persistSession: false,
      },
    })
  : supabase;
