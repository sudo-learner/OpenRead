"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function DashboardPage() {
  const supabase = createClient();
  const router = useRouter();
  const [progress, setProgress] = useState<any[]>([]);
  const [uploads, setUploads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      // Client-side guard for UX only — real security is enforced by
      // Supabase Row Level Security, since there's no server here to check.
      if (!user) {
        router.push("/login");
        return;
      }

      setEmail(user.email ?? "");

      const [{ data: prog }, { data: ups }, { data: profile }] = await Promise.all([
        supabase
          .from("reading_progress")
          .select("book_id, progress_percent, last_read_at, books(title, cover_url)")
          .eq("user_id", user.id)
          .order("last_read_at", { ascending: false })
          .limit(10),
        supabase.from("books").select("id, title, status").eq("uploaded_by", user.id),
        supabase.from("profiles").select("username, bio").eq("id", user.id).single(),
      ]);

      setProgress(prog ?? []);
      setUploads(ups ?? []);
      setUsername(profile?.username ?? "");
      setBio(profile?.bio ?? "");
      setLoading(false);
    }
    load();
  }, []);

  async function saveProfile() {
    setSaving(true);
    setSaveMessage(null);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = await supabase.from("profiles").update({ username, bio }).eq("id", user.id);
    setSaving(false);
    if (error) {
      setSaveMessage(error.message.includes("duplicate") ? "That username is already taken." : error.message);
    } else {
      setSaveMessage("Saved.");
      setEditing(false);
    }
  }

  if (loading) return <p className="text-center py-20 text-white/40">Loading dashboard...</p>;

  const completed = progress.filter((p) => p.progress_percent >= 95).length;

  return (
    <div className="px-6 py-10 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Your Dashboard</h1>

      <div className="glass rounded-xl2 p-5 mb-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">Your Profile</h2>
          {!editing && (
            <button onClick={() => setEditing(true)} className="text-xs px-3 py-1.5 rounded-lg border border-white/20 hover:bg-white/5">
              Edit
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-white/50 mb-1">Name</p>
            {editing ? (
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2"
              />
            ) : (
              <p className="font-medium">{username || "—"}</p>
            )}
          </div>
          <div>
            <p className="text-white/50 mb-1">Email</p>
            <p className="font-medium">{email}</p>
            <p className="text-xs text-white/30 mt-0.5">Email is tied to your login and can't be edited here.</p>
          </div>
          <div className="sm:col-span-2">
            <p className="text-white/50 mb-1">Bio</p>
            {editing ? (
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={2}
                placeholder="Say a bit about yourself..."
                className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2"
              />
            ) : (
              <p className="text-white/70">{bio || "No bio yet."}</p>
            )}
          </div>
        </div>

        {editing && (
          <div className="flex items-center gap-3 mt-4">
            <button
              onClick={saveProfile}
              disabled={saving}
              className="px-4 py-2 rounded-xl2 bg-primary text-black font-semibold text-sm"
            >
              {saving ? "Saving..." : "Save changes"}
            </button>
            <button onClick={() => setEditing(false)} className="text-sm text-white/50 hover:text-white">
              Cancel
            </button>
            {saveMessage && <span className="text-sm text-white/60">{saveMessage}</span>}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
        <div className="glass rounded-xl2 p-5">
          <p className="text-white/50 text-sm">Books in progress</p>
          <p className="text-3xl font-bold text-primary">{progress.length}</p>
        </div>
        <div className="glass rounded-xl2 p-5">
          <p className="text-white/50 text-sm">Completed</p>
          <p className="text-3xl font-bold text-secondary">{completed}</p>
        </div>
        <div className="glass rounded-xl2 p-5">
          <p className="text-white/50 text-sm">Your uploads</p>
          <p className="text-3xl font-bold text-accent">{uploads.length}</p>
        </div>
      </div>

      <h2 className="text-lg font-semibold mb-4">Continue Reading</h2>
      <div className="space-y-3 mb-10">
        {progress.length ? progress.map((p: any) => (
          <Link
            key={p.book_id}
            href={`/reader/?id=${p.book_id}`}
            className="flex items-center justify-between glass rounded-xl2 px-5 py-3 hover:glow-primary"
          >
            <span>{p.books?.title ?? "Untitled"}</span>
            <span className="text-primary text-sm">{p.progress_percent}%</span>
          </Link>
        )) : <p className="text-white/40 text-sm">No reading activity yet. Go find a book!</p>}
      </div>

      <h2 className="text-lg font-semibold mb-2">Your Uploads</h2>
      <p className="text-white/40 text-xs mb-4">
        "Pending" means the upload succeeded but is waiting for admin approval
        before it appears on the site. Approve it at <Link href="/admin" className="text-primary underline">/admin</Link> (admins only).
      </p>
      <div className="space-y-3">
        {uploads.length ? uploads.map((b) => (
          <div key={b.id} className="flex items-center justify-between glass rounded-xl2 px-5 py-3">
            <span>{b.title}</span>
            <span className={`text-xs px-2 py-1 rounded-lg ${
              b.status === "approved" ? "bg-primary/20 text-primary" :
              b.status === "rejected" ? "bg-danger/20 text-danger" :
              "bg-white/10 text-white/60"
            }`}>
              {b.status}
            </span>
          </div>
        )) : <p className="text-white/40 text-sm">You haven't uploaded any books yet.</p>}
      </div>
    </div>
  );
}
