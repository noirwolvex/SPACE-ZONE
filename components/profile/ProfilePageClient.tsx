"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Camera, Loader2, LogOut, ShieldCheck, Sparkles, Trash2, Upload, UserRound, Mail, Phone, MapPin, Globe2, FileText, CreditCard, ExternalLink, Download } from "lucide-react";
import type { User } from "@supabase/supabase-js";
import { useAuth } from "@/components/auth/AuthProvider";
import { supabase } from "@/lib/supabase";

interface ProfileData {
  id: string;
  email: string;
  name?: string | null;
  phone?: string | null;
  avatar?: string | null;
  role?: string | null;
  supabaseId?: string | null;
  createdAt: string;
  updatedAt: string;
  username?: string | null;
  country?: string | null;
  city?: string | null;
  bio?: string | null;
}

interface ProfilePageClientProps {
  user: User;
  profile: ProfileData | null;
}

export default function ProfilePageClient({ user, profile }: ProfilePageClientProps) {
  const router = useRouter();
  const { signOut } = useAuth();
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(profile?.avatar ?? null);
  const [form, setForm] = useState({
    name: profile?.name ?? "",
    username: profile?.username ?? "",
    phone: profile?.phone ?? "",
    country: profile?.country ?? "",
    city: profile?.city ?? "",
    bio: profile?.bio ?? "",
  });

  useEffect(() => {
    setAvatarPreview(profile?.avatar ?? null);
    setForm({
      name: profile?.name ?? "",
      username: profile?.username ?? "",
      phone: profile?.phone ?? "",
      country: profile?.country ?? "",
      city: profile?.city ?? "",
      bio: profile?.bio ?? "",
    });
  }, [profile]);

  const stats = useMemo(() => ({
    books: 0,
    websites: 0,
    orders: 0,
  }), []);

  const handleSave = async () => {
    setLoading(true);
    setMessage(null);
    setError(null);

    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          username: form.username.trim(),
          phone: form.phone.trim(),
          country: form.country.trim(),
          city: form.city.trim(),
          bio: form.bio.trim(),
        }),
      });

      const result = await res.json().catch(() => ({}));
      if (!res.ok || result.error) {
        throw new Error(result.error || "Unable to update profile.");
      }

      setMessage("Profile updated successfully.");
      setEditing(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update profile.");
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setAvatarUploading(true);
    setError(null);
    setMessage(null);

    try {
      const formData = new FormData();
      formData.append("avatar", file);
      const res = await fetch("/api/profile/avatar", { method: "POST", body: formData });
      const result = await res.json().catch(() => ({}));
      if (!res.ok || result.error) {
        throw new Error(result.error || "Unable to upload avatar.");
      }
      setAvatarPreview(result.avatarUrl ?? null);
      setMessage("Profile picture updated successfully.");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to upload avatar.");
    } finally {
      setAvatarUploading(false);
    }
  };

  const handleDeleteAccount = async () => {
    const confirmed = window.confirm("This action will permanently delete your account and profile. Continue?");
    if (!confirmed) return;

    setLoading(true);
    try {
      const res = await fetch("/api/profile", { method: "DELETE" });
      const result = await res.json().catch(() => ({}));
      if (!res.ok || result.error) {
        throw new Error(result.error || "Unable to delete account.");
      }
      await signOut();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to delete account.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(99,102,241,0.18),_transparent_35%),linear-gradient(135deg,_rgba(255,255,255,0.95),_rgba(241,245,249,0.95))] px-4 py-10 text-slate-900 transition-colors dark:bg-[radial-gradient(circle_at_top_left,_rgba(99,102,241,0.22),_transparent_35%),linear-gradient(135deg,_rgba(2,6,23,0.98),_rgba(15,23,42,0.98))] dark:text-slate-100 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <div className="rounded-[32px] border border-white/70 bg-white/70 p-6 shadow-[0_25px_80px_rgba(15,23,42,0.12)] backdrop-blur-2xl dark:border-slate-800/70 dark:bg-slate-900/70 sm:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="flex items-center gap-4">
              <div className="relative h-24 w-24 overflow-hidden rounded-full border-4 border-white/80 shadow-lg dark:border-slate-800/80">
                {avatarPreview ? (
                  <Image src={avatarPreview} alt="Profile avatar" fill className="object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-indigo-100 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-200">
                    <UserRound className="h-10 w-10" />
                  </div>
                )}
              </div>
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-sm font-semibold text-indigo-700 dark:border-indigo-500/30 dark:bg-indigo-950/30 dark:text-indigo-200">
                  <Sparkles className="h-4 w-4" />
                  Premium Member
                </div>
                <h1 className="mt-3 text-3xl font-semibold tracking-tight">{profile?.name || user?.email?.split("@")[0] || "Your Profile"}</h1>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{user?.email}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-indigo-400 hover:text-indigo-600 dark:border-slate-700 dark:bg-slate-950/70 dark:text-slate-200">
                {avatarUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
                Change Picture
                <input type="file" accept="image/*" className="sr-only" onChange={handleAvatarUpload} />
              </label>
              <button type="button" onClick={() => setEditing((value) => !value)} className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-indigo-400 hover:text-indigo-600 dark:border-slate-700 dark:bg-slate-950/70 dark:text-slate-200">
                {editing ? "Cancel" : "Edit Profile"}
              </button>
            </div>
          </div>
        </div>

        {message ? <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300">{message}</div> : null}
        {error ? <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300">{error}</div> : null}

        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-6">
            <section className="rounded-[28px] border border-white/70 bg-white/70 p-6 shadow-[0_25px_80px_rgba(15,23,42,0.1)] backdrop-blur-2xl dark:border-slate-800/70 dark:bg-slate-900/70">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.24em] text-indigo-600 dark:text-indigo-300">Profile information</p>
                  <h2 className="mt-2 text-2xl font-semibold">Personal details</h2>
                </div>
                {editing ? <div className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-sm font-semibold text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300">Editing</div> : null}
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <label className="space-y-2 text-sm font-medium text-slate-700 dark:text-slate-200">
                  <span>Full Name</span>
                  <input value={form.name} onChange={(event) => setForm((value) => ({ ...value, name: event.target.value }))} disabled={!editing} className="w-full rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 text-sm shadow-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 disabled:cursor-not-allowed disabled:opacity-70 dark:border-slate-700 dark:bg-slate-950/60" />
                </label>
                <label className="space-y-2 text-sm font-medium text-slate-700 dark:text-slate-200">
                  <span>Username</span>
                  <input value={form.username} onChange={(event) => setForm((value) => ({ ...value, username: event.target.value }))} disabled={!editing} className="w-full rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 text-sm shadow-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 disabled:cursor-not-allowed disabled:opacity-70 dark:border-slate-700 dark:bg-slate-950/60" placeholder="@yourname" />
                </label>
                <label className="space-y-2 text-sm font-medium text-slate-700 dark:text-slate-200">
                  <span>Phone Number</span>
                  <input value={form.phone} onChange={(event) => setForm((value) => ({ ...value, phone: event.target.value }))} disabled={!editing} className="w-full rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 text-sm shadow-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 disabled:cursor-not-allowed disabled:opacity-70 dark:border-slate-700 dark:bg-slate-950/60" placeholder="+966..." />
                </label>
                <label className="space-y-2 text-sm font-medium text-slate-700 dark:text-slate-200">
                  <span>Country</span>
                  <input value={form.country} onChange={(event) => setForm((value) => ({ ...value, country: event.target.value }))} disabled={!editing} className="w-full rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 text-sm shadow-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 disabled:cursor-not-allowed disabled:opacity-70 dark:border-slate-700 dark:bg-slate-950/60" />
                </label>
                <label className="space-y-2 text-sm font-medium text-slate-700 dark:text-slate-200 md:col-span-2">
                  <span>City</span>
                  <input value={form.city} onChange={(event) => setForm((value) => ({ ...value, city: event.target.value }))} disabled={!editing} className="w-full rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 text-sm shadow-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 disabled:cursor-not-allowed disabled:opacity-70 dark:border-slate-700 dark:bg-slate-950/60" />
                </label>
                <label className="space-y-2 text-sm font-medium text-slate-700 dark:text-slate-200 md:col-span-2">
                  <span>Bio</span>
                  <textarea value={form.bio} onChange={(event) => setForm((value) => ({ ...value, bio: event.target.value }))} disabled={!editing} rows={4} className="w-full rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 text-sm shadow-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 disabled:cursor-not-allowed disabled:opacity-70 dark:border-slate-700 dark:bg-slate-950/60" placeholder="Tell us a bit about yourself..." />
                </label>
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                <button type="button" onClick={handleSave} disabled={loading} className="inline-flex items-center gap-2 rounded-full bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-70">
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                  Save Changes
                </button>
                <button type="button" onClick={() => setEditing(false)} className="rounded-full border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-indigo-400 hover:text-indigo-600 dark:border-slate-700 dark:bg-slate-950/70 dark:text-slate-200">
                  Cancel Changes
                </button>
              </div>
            </section>

            <section className="rounded-[28px] border border-white/70 bg-white/70 p-6 shadow-[0_25px_80px_rgba(15,23,42,0.1)] backdrop-blur-2xl dark:border-slate-800/70 dark:bg-slate-900/70">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-indigo-600 dark:text-indigo-300">My purchases</p>
              <h2 className="mt-2 text-2xl font-semibold">Your library</h2>
              <div className="mt-6 space-y-4">
                {[{ type: "Books", title: "No purchases yet", status: "Available soon", action: "Download" }, { type: "Websites", title: "No websites yet", status: "Coming soon", action: "Visit" }].map((item) => (
                  <div key={item.type} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-950/50">
                    <div>
                      <p className="font-semibold">{item.title}</p>
                      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{item.status}</p>
                    </div>
                    <button type="button" className="inline-flex items-center gap-2 rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-indigo-400 hover:text-indigo-600 dark:border-slate-700 dark:text-slate-200">
                      {item.action === "Download" ? <Download className="h-4 w-4" /> : <ExternalLink className="h-4 w-4" />}
                      {item.action}
                    </button>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <div className="space-y-6">
            <section className="rounded-[28px] border border-white/70 bg-white/70 p-6 shadow-[0_25px_80px_rgba(15,23,42,0.1)] backdrop-blur-2xl dark:border-slate-800/70 dark:bg-slate-900/70">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-indigo-600 dark:text-indigo-300">Account settings</p>
              <div className="mt-6 space-y-3">
                <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-950/50">
                  <div>
                    <p className="font-semibold">Change password</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Use Supabase password reset.</p>
                  </div>
                  <button type="button" onClick={() => supabase.auth.resetPasswordForEmail(user.email ?? "", { redirectTo: `${window.location.origin}/reset-password` })} className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-indigo-400 hover:text-indigo-600 dark:border-slate-700 dark:text-slate-200">Send Link</button>
                </div>
                <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-950/50">
                  <div>
                    <p className="font-semibold">Logout</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Sign out from this device.</p>
                  </div>
                  <button type="button" onClick={() => void signOut()} className="inline-flex items-center gap-2 rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-rose-400 hover:text-rose-600 dark:border-slate-700 dark:text-slate-200">
                    <LogOut className="h-4 w-4" />
                    Logout
                  </button>
                </div>
                <div className="flex items-center justify-between rounded-2xl border border-rose-200 bg-rose-50/70 p-4 dark:border-rose-500/30 dark:bg-rose-500/10">
                  <div>
                    <p className="font-semibold text-rose-700 dark:text-rose-300">Delete account</p>
                    <p className="text-sm text-rose-600 dark:text-rose-400">Irreversible. Delete your profile and account data.</p>
                  </div>
                  <button type="button" onClick={handleDeleteAccount} className="rounded-full border border-rose-300 px-4 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-100 dark:border-rose-500/30 dark:text-rose-300">
                    <Trash2 className="mr-2 inline h-4 w-4" />
                    Delete
                  </button>
                </div>
              </div>
            </section>

            <section className="rounded-[28px] border border-white/70 bg-white/70 p-6 shadow-[0_25px_80px_rgba(15,23,42,0.1)] backdrop-blur-2xl dark:border-slate-800/70 dark:bg-slate-900/70">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-indigo-600 dark:text-indigo-300">Account statistics</p>
              <div className="mt-6 grid gap-3">
                {[
                  { label: "Total purchased books", value: stats.books },
                  { label: "Total purchased websites", value: stats.websites },
                  { label: "Total orders", value: stats.orders },
                  { label: "Member since", value: profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString() : "—" },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-950/50">
                    <span className="text-sm text-slate-500 dark:text-slate-400">{item.label}</span>
                    <span className="font-semibold">{item.value}</span>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
