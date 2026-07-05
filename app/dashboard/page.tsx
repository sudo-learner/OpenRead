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

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      // Client-side guard for UX only — real security is enforced by
      // Supabase Row Level Security, since there's no server here to check.
      if (!user) {
        router.push("/login");
        return;
      }

      const [{ data: prog }, { data: ups }] = await Promise.all([
        supabase
          .from("reading_progress")
          .select("book_id, progress_percent, last_read_at, books(title, cover_url)")
          .eq("user_id", user.id)
          .order("last_read_at", { ascending: false })
          .limit(10),
        supabase.from("books").select("id, title, status").eq("uploaded_by", user.id),
      ]);

      setProgress(prog ?? []);
      setUploads(ups ?? []);
      setLoading(false);
    }
    load();
  }, []);

  if (loading) return <p className="text-center py-20 text-white/40">Loading dashboard...</p>;

  const completed = progress.filter((p) => p.progress_percent >= 95).length;

  return (
    <div className="px-6 py-10 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-8">Your Dashboard</h1>

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

      <h2 className="text-lg font-semibold mb-4">Your Uploads</h2>
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
