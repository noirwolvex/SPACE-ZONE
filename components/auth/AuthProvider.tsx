"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { syncCartKeyForCurrentUser } from "@/lib/cart";

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string, options?: { rememberMe?: boolean; redirectTo?: string }) => Promise<{ error?: string }>;
  signUp: (fullName: string, email: string, password: string, options?: { redirectTo?: string }) => Promise<{ error?: string; message?: string }>;
  signOut: () => Promise<void>;
  sendResetEmail: (email: string) => Promise<{ error?: string; message?: string }>;
  resetPassword: (password: string) => Promise<{ error?: string; message?: string }>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function getFriendlyAuthError(message: string) {
  const normalized = message.toLowerCase();

  if (normalized.includes("email rate limit exceeded") || normalized.includes("rate limit")) {
    return "We’re sending confirmation emails a bit too quickly. Please wait a few minutes and try again, or use a different email address.";
  }

  if (normalized.includes("user already registered") || normalized.includes("already registered") || normalized.includes("already exists")) {
    return "This email is already registered. Please sign in or use a different email.";
  }

  if (normalized.includes("invalid login credentials") || normalized.includes("invalid credentials")) {
    return "The email or password is incorrect.";
  }

  return message;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    let active = true;

    const initialize = async () => {
      const { data, error } = await supabase.auth.getSession();
      if (!active) return;
      if (error) {
        setLoading(false);
        return;
      }
      const nextUser = data.session?.user ?? null;
      syncCartKeyForCurrentUser(nextUser?.id ?? null);
      setSession(data.session);
      setUser(nextUser);
      setLoading(false);
    };

    initialize();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      const nextUser = nextSession?.user ?? null;
      syncCartKeyForCurrentUser(nextUser?.id ?? null);
      setSession(nextSession);
      setUser(nextUser);
    });

    return () => {
      active = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  const signIn = useCallback(async (email: string, password: string, options?: { rememberMe?: boolean; redirectTo?: string }) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      return { error: getFriendlyAuthError(error.message) };
    }

    if (data.session) {
      await fetch("/api/auth/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-access-token": data.session.access_token },
        body: JSON.stringify({ fullName: data.user?.user_metadata?.full_name ?? data.user?.email?.split("@")[0] ?? "User", email: data.user?.email }),
      });
      if (data.user?.email_confirmed_at) {
        router.replace(options?.redirectTo ?? "/");
      } else {
        router.replace("/verify-email");
      }
    }

    return {};
  }, [router]);

  const signUp = useCallback(async (fullName: string, email: string, password: string, options?: { redirectTo?: string }) => {
    const response = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fullName, email, password }),
    });

    const result = await response.json().catch(() => ({}));

    if (!response.ok || result.error) {
      return { error: getFriendlyAuthError(result.error ?? "Unable to create account.") };
    }

    router.replace(options?.redirectTo ?? "/login");
    return { message: "Account created successfully. You can now sign in." };
  }, [router]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    router.replace("/login");
  }, [router]);

  const sendResetEmail = useCallback(async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      return { error: getFriendlyAuthError(error.message) };
    }

    return { message: "Please check your email for a password reset link." };
  }, []);

  const resetPassword = useCallback(async (password: string) => {
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      return { error: getFriendlyAuthError(error.message) };
    }

    return { message: "Your password was updated successfully." };
  }, []);

  const value = useMemo(() => ({
    user,
    session,
    loading,
    signIn,
    signUp,
    signOut,
    sendResetEmail,
    resetPassword,
  }), [loading, resetPassword, session, signIn, signOut, signUp, sendResetEmail, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
