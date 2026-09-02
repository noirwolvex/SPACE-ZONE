import { createBrowserClient, createServerClient } from "@supabase/ssr";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { NextRequest, NextResponse } from "next/server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

/**
 * Next.js imports every route module while collecting page data at build
 * time, before runtime env vars are necessarily available. Validating here
 * (rather than with a top-level throw) keeps that import side-effect-free;
 * the error still surfaces the moment a Supabase client is actually used.
 */
function requireSupabaseConfig() {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Missing Supabase environment variables: NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY");
  }
  return { supabaseUrl, supabaseAnonKey };
}

function requireSupabaseServiceRoleKey() {
  if (!supabaseServiceRoleKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is not configured for this server operation");
  }
  return supabaseServiceRoleKey;
}

/** Defers client construction until first property access, e.g. `supabase.auth`. */
function createLazyClient<T extends object>(factory: () => T): T {
  let client: T | undefined;
  return new Proxy({} as T, {
    get(_target, prop, receiver) {
      client ??= factory();
      return Reflect.get(client as object, prop, receiver);
    },
  });
}

export const supabase = createLazyClient(() => {
  const { supabaseUrl, supabaseAnonKey } = requireSupabaseConfig();
  return createBrowserClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      flowType: "pkce",
    },
  });
});

export function createServerSupabaseClient(request: NextRequest, response: NextResponse) {
  const { supabaseUrl: resolvedSupabaseUrl, supabaseAnonKey: resolvedSupabaseAnonKey } = requireSupabaseConfig();
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
  const { supabaseUrl, supabaseAnonKey } = requireSupabaseConfig();
  const { cookies } = await import("next/headers");
  const cookieStore = await cookies();

  return createServerClient(supabaseUrl, supabaseAnonKey, {
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

/**
 * Server-only Supabase client. Never fall back to the anon client: admin
 * operations must fail closed when the service-role key is missing.
 */
export const supabaseAdmin = createLazyClient(() => {
  const { supabaseUrl } = requireSupabaseConfig();
  const serviceRoleKey = requireSupabaseServiceRoleKey();
  return createSupabaseClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
    },
  });
});
