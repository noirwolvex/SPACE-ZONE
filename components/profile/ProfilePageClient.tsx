"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Camera, CheckCircle2, Download, ExternalLink, Loader2, LogOut, Mail, MapPin, Phone, ShieldCheck, Sparkles, Trash2, UserRound } from "lucide-react";
import type { User } from "@supabase/supabase-js";
import { useAuth } from "@/components/auth/AuthProvider";
import { supabase } from "@/lib/supabase";

interface ProfileData {
  id: string; email: string; name?: string | null; phone?: string | null; avatar?: string | null; role?: string | null;
  supabaseId?: string | null; createdAt: string; updatedAt: string; username?: string | null; country?: string | null; city?: string | null; bio?: string | null;
}

type PurchaseStats = { books: number; websites: number; orders: number };
type BookPurchase = { id: string; bookId: string; title: string; purchasedAt: string; price: number | null; currency: string; coverImageUrl: string | null };
type WebsitePurchase = { id: string; title: string; slug: string; websiteUrl: string; purchasedAt: string; price: number; currency: string; imageUrl: string | null };

type Props = {
  user: User;
  profile: ProfileData | null;
  stats?: PurchaseStats;
  purchases?: { books: BookPurchase[]; websites: WebsitePurchase[] };
};

export default function ProfilePageClient({ user, profile, stats = { books: 0, websites: 0, orders: 0 }, purchases = { books: [], websites: [] } }: Props) {
  const router = useRouter();
  const { signOut } = useAuth();
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(profile?.avatar ?? null);
  const [form, setForm] = useState({ name: profile?.name ?? "", username: profile?.username ?? "", phone: profile?.phone ?? "", country: profile?.country ?? "", city: profile?.city ?? "", bio: profile?.bio ?? "" });

  useEffect(() => {
    setAvatarPreview(profile?.avatar ?? null);
    setForm({ name: profile?.name ?? "", username: profile?.username ?? "", phone: profile?.phone ?? "", country: profile?.country ?? "", city: profile?.city ?? "", bio: profile?.bio ?? "" });
  }, [profile]);

  const handleSave = async () => {
    setLoading(true); setMessage(null); setError(null);
    try {
      const res = await fetch("/api/profile", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: form.name.trim(), username: form.username.trim(), phone: form.phone.trim(), country: form.country.trim(), city: form.city.trim(), bio: form.bio.trim() }) });
      const result = await res.json().catch(() => ({}));
      if (!res.ok || result.error) throw new Error(result.error || "Unable to update profile.");
      setMessage("Profile updated successfully."); setEditing(false); router.refresh();
    } catch (err) { setError(err instanceof Error ? err.message : "Unable to update profile."); }
    finally { setLoading(false); }
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]; if (!file) return;
    setAvatarUploading(true); setError(null); setMessage(null);
    try {
      const formData = new FormData(); formData.append("avatar", file);
      const res = await fetch("/api/profile/avatar", { method: "POST", body: formData });
      const result = await res.json().catch(() => ({}));
      if (!res.ok || result.error) throw new Error(result.error || "Unable to upload avatar.");
      setAvatarPreview(result.avatarUrl ?? null); setMessage("Profile picture updated successfully."); router.refresh();
    } catch (err) { setError(err instanceof Error ? err.message : "Unable to upload avatar."); }
    finally { setAvatarUploading(false); }
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm("This action will permanently delete your account and profile. Continue?")) return;
    setLoading(true);
    try {
      const res = await fetch("/api/profile", { method: "DELETE" });
      const result = await res.json().catch(() => ({}));
      if (!res.ok || result.error) throw new Error(result.error || "Unable to delete account.");
      await signOut();
    } catch (err) { setError(err instanceof Error ? err.message : "Unable to delete account."); setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(99,102,241,0.18),_transparent_35%),linear-gradient(135deg,_rgba(255,255,255,0.95),_rgba(241,245,249,0.95))] px-4 py-10 text-slate-900 transition-colors dark:bg-[radial-gradient(circle_at_top_left,_rgba(99,102,241,0.22),_transparent_35%),linear-gradient(135deg,_rgba(2,6,23,0.98),_rgba(15,23,42,0.98))] dark:text-slate-100 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <header className="rounded-[32px] border border-white/70 bg-white/70 p-6 shadow-[0_25px_80px_rgba(15,23,42,0.12)] backdrop-blur-2xl dark:border-slate-800/70 dark:bg-slate-900/70 sm:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="flex items-center gap-4">
              <div className="relative h-24 w-24 overflow-hidden rounded-full border-4 border-white/80 shadow-lg dark:border-slate-800/80">
                {avatarPreview ? <Image src={avatarPreview} alt="Profile avatar" fill className="object-cover" /> : <div className="flex h-full w-full items-center justify-center bg-indigo-100 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-200"><UserRound className="h-10 w-10" /></div>}
              </div>
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-sm font-semibold text-indigo-700 dark:border-indigo-500/30 dark:bg-indigo-950/30 dark:text-indigo-200"><Sparkles className="h-4 w-4" />Member</div>
                <h1 className="mt-3 text-3xl font-semibold tracking-tight">{profile?.name || user.email?.split("@")[0] || "Your Profile"}</h1>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{user.email}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold dark:border-slate-700 dark:bg-slate-950/70"><Camera className="h-4 w-4" />{avatarUploading ? "Uploading..." : "Change Picture"}<input type="file" accept="image/*" className="sr-only" onChange={handleAvatarUpload} /></label>
              <button type="button" onClick={() => setEditing(v => !v)} className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold dark:border-slate-700 dark:bg-slate-950/70">{editing ? "Cancel" : "Edit Profile"}</button>
            </div>
          </div>
        </header>

        {message ? <div className="flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300"><CheckCircle2 className="h-4 w-4" />{message}</div> : null}
        {error ? <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300">{error}</div> : null}

        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-6">
            <section className="rounded-[28px] border border-white/70 bg-white/70 p-6 shadow-sm backdrop-blur-2xl dark:border-slate-800/70 dark:bg-slate-900/70">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-indigo-600 dark:text-indigo-300">Profile information</p>
              <h2 className="mt-2 text-2xl font-semibold">Personal details</h2>
              <div className="mt-6 grid gap-4 md:grid-cols-2">
                {([['name','Full Name'],['username','Username'],['phone','Phone Number'],['country','Country'],['city','City']] as const).map(([key,label]) => <label key={key} className="space-y-2 text-sm font-medium"><span>{label}</span><input value={form[key]} onChange={e=>setForm(v=>({...v,[key]:e.target.value}))} disabled={!editing} className="w-full rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 text-sm disabled:opacity-70 dark:border-slate-700 dark:bg-slate-950/60" /></label>)}
                <label className="space-y-2 text-sm font-medium md:col-span-2"><span>Bio</span><textarea value={form.bio} onChange={e=>setForm(v=>({...v,bio:e.target.value}))} disabled={!editing} rows={4} className="w-full rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 text-sm disabled:opacity-70 dark:border-slate-700 dark:bg-slate-950/60" /></label>
              </div>
              <button type="button" onClick={handleSave} disabled={!editing || loading} className="mt-6 inline-flex items-center gap-2 rounded-full bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50">{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}Save Changes</button>
            </section>

            <section className="rounded-[28px] border border-white/70 bg-white/70 p-6 shadow-sm backdrop-blur-2xl dark:border-slate-800/70 dark:bg-slate-900/70">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-indigo-600 dark:text-indigo-300">My purchases</p>
              <h2 className="mt-2 text-2xl font-semibold">Your library</h2>
              <div className="mt-6 space-y-4">
                {purchases.books.map(book => <article key={book.id} className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-950/50">
                  <div className="relative h-20 w-14 shrink-0 overflow-hidden rounded-lg bg-slate-200 dark:bg-slate-800">{book.coverImageUrl ? <Image src={book.coverImageUrl} alt={book.title} fill className="object-cover" /> : null}</div>
                  <div className="min-w-0 flex-1"><p className="truncate font-semibold">{book.title}</p><p className="text-xs text-slate-500">{book.price != null ? `${book.price} ${book.currency}` : "Free"} · {new Date(book.purchasedAt).toLocaleDateString()}</p></div>
                  <a href={`/api/books/${book.bookId}/access?mode=download`} className="inline-flex items-center gap-2 rounded-full border border-slate-300 px-3 py-2 text-xs font-semibold dark:border-slate-700"><Download className="h-4 w-4" />Download</a>
                </article>)}
                {purchases.websites.map(site => <article key={site.id} className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-950/50">
                  <div className="relative h-20 w-28 shrink-0 overflow-hidden rounded-lg bg-slate-200 dark:bg-slate-800">{site.imageUrl ? <Image src={site.imageUrl} alt={site.title} fill className="object-cover" /> : null}</div>
                  <div className="min-w-0 flex-1"><p className="truncate font-semibold">{site.title}</p><p className="text-xs text-slate-500">{site.price} {site.currency} · {new Date(site.purchasedAt).toLocaleDateString()}</p></div>
                  <div className="flex gap-2"><a href={`/websites/${site.slug}`} className="rounded-full bg-indigo-600 px-3 py-2 text-xs font-semibold text-white">View</a>{site.websiteUrl ? <a href={site.websiteUrl} target="_blank" rel="noreferrer" className="rounded-full border px-3 py-2 text-xs font-semibold dark:border-slate-700"><ExternalLink className="h-4 w-4" /></a> : null}</div>
                </article>)}
                {purchases.books.length === 0 && purchases.websites.length === 0 ? <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500 dark:border-slate-700">No completed purchases yet.</div> : null}
              </div>
            </section>
          </div>

          <div className="space-y-6">
            <section className="rounded-[28px] border border-white/70 bg-white/70 p-6 shadow-sm backdrop-blur-2xl dark:border-slate-800/70 dark:bg-slate-900/70">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-indigo-600 dark:text-indigo-300">Account statistics</p>
              <div className="mt-6 space-y-3">{[
                ["Total purchased books", stats.books], ["Total purchased websites", stats.websites], ["Total orders", stats.orders], ["Member since", profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString() : "—"],
              ].map(([label,value]) => <div key={String(label)} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-950/50"><span className="text-sm text-slate-500">{label}</span><span className="font-semibold">{value}</span></div>)}</div>
            </section>

            <section className="rounded-[28px] border border-white/70 bg-white/70 p-6 shadow-sm backdrop-blur-2xl dark:border-slate-800/70 dark:bg-slate-900/70">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-indigo-600 dark:text-indigo-300">Account settings</p>
              <div className="mt-5 space-y-3">
                <div className="flex items-center justify-between rounded-2xl border p-4 dark:border-slate-800"><div className="flex items-center gap-3"><Mail className="h-5 w-5 text-indigo-500" /><span>Change password</span></div><button type="button" onClick={()=>void supabase.auth.resetPasswordForEmail(user.email ?? "", { redirectTo: `${window.location.origin}/reset-password` })} className="rounded-full border px-3 py-2 text-xs font-semibold dark:border-slate-700">Send Link</button></div>
                <div className="flex items-center justify-between rounded-2xl border p-4 dark:border-slate-800"><div className="flex items-center gap-3"><Phone className="h-5 w-5 text-indigo-500" /><span>Sign out</span></div><button type="button" onClick={()=>void signOut()} className="inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-semibold dark:border-slate-700"><LogOut className="h-4 w-4" />Logout</button></div>
                <div className="flex items-center justify-between rounded-2xl border border-rose-200 bg-rose-50/70 p-4 dark:border-rose-500/30 dark:bg-rose-500/10"><div><p className="font-semibold text-rose-700 dark:text-rose-300">Delete account</p><p className="text-xs text-rose-600 dark:text-rose-400">Irreversible.</p></div><button type="button" onClick={handleDeleteAccount} className="rounded-full border border-rose-300 px-3 py-2 text-xs font-semibold text-rose-700 dark:border-rose-500/30 dark:text-rose-300"><Trash2 className="mr-1 inline h-4 w-4" />Delete</button></div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
