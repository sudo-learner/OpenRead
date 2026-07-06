"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Tab = "pending" | "all" | "users" | "stats";

export default function AdminPage() {
  const supabase = createClient();
  const router = useRouter();
  const [allowed, setAllowed] = useState<boolean | null>(null);
  const [tab, setTab] = useState<Tab>("pending");
  const [books, setBooks] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [stats, setStats] = useState({ totalBooks: 0, pending: 0, approved: 0, rejected: 0, totalUsers: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function checkAccess() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }
      const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
      if (profile?.role !== "admin") {
        setAllowed(false);
        return;
      }
      setAllowed(true);
    }
    checkAccess();
  }, []);

  useEffect(() => {
    if (!allowed) return;
    loadTab();
  }, [allowed, tab]);

  async function loadTab() {
    setLoading(true);
    setError(null);
    if (tab === "pending" || tab === "all") {
      // Note: intentionally NOT joining profiles(username) here — that
      // embed depends on PostgREST correctly resolving the books->profiles
      // foreign key, which can silently fail in some project configs and
      // make the whole query return nothing with no visible error.
      let query = supabase
        .from("books")
        .select("id, title, author, category, status, created_at, uploaded_by")
        .order("created_at", { ascending: false });
      if (tab === "pending") query = query.eq("status", "pending");
      const { data, error: err } = await query;
      if (err) setError(err.message);
      setBooks(data ?? []);
    } else if (tab === "users") {
      const { data, error: err } = await supabase.from("profiles").select("id, username, role, created_at").order("created_at", { ascending: false });
      if (err) setError(err.message);
      setUsers(data ?? []);
    } else if (tab === "stats") {
      const results = await Promise.all([
        supabase.from("books").select("*", { count: "exact", head: true }),
        supabase.from("books").select("*", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("books").select("*", { count: "exact", head: true }).eq("status", "approved"),
        supabase.from("books").select("*", { count: "exact", head: true }).eq("status", "rejected"),
        supabase.from("profiles").select("*", { count: "exact", head: true }),
      ]);
      const firstError = results.find((r) => r.error)?.error;
      if (firstError) setError(firstError.message);
      const [{ count: totalBooks }, { count: pending }, { count: approved }, { count: rejected }, { count: totalUsers }] = results;
      setStats({
        totalBooks: totalBooks ?? 0,
        pending: pending ?? 0,
        approved: approved ?? 0,
        rejected: rejected ?? 0,
        totalUsers: totalUsers ?? 0,
      });
    }
    setLoading(false);
  }

  async function updateStatus(id: string, status: "approved" | "rejected") {
    await supabase.from("books").update({ status }).eq("id", id);
    setBooks((prev) => (tab === "pending" ? prev.filter((b) => b.id !== id) : prev.map((b) => (b.id === id ? { ...b, status } : b))));
  }

  async function toggleAdmin(id: string, currentRole: string) {
    const newRole = currentRole === "admin" ? "user" : "admin";
    await supabase.from("profiles").update({ role: newRole }).eq("id", id);
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, role: newRole } : u)));
  }

  if (allowed === null) return <p className="text-center py-20 text-white/40">Checking access...</p>;
  if (allowed === false) {
    return (
      <p className="text-center py-20 text-danger">
        You don't have admin access. If this is your site, set your role to
        'admin' in the Supabase profiles table.
      </p>
    );
  }

  return (
    <div className="px-6 py-10 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-8">Admin Panel</h1>

      <div className="flex gap-2 mb-8 text-sm flex-wrap">
        {(["pending", "all", "users", "stats"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-xl2 border capitalize ${
              tab === t ? "border-primary text-primary" : "border-white/10 text-white/60"
            }`}
          >
            {t === "pending" ? "Pending Uploads" : t === "all" ? "All Books" : t === "users" ? "Manage Users" : "Statistics"}
          </button>
        ))}
      </div>

      {error && (
        <div className="mb-6 px-4 py-3 rounded-xl2 border border-danger/40 bg-danger/10 text-danger text-sm">
          Error loading data: {error}
        </div>
      )}

      {loading ? (
        <p className="text-white/40">Loading...</p>
      ) : tab === "stats" ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <div className="glass rounded-xl2 p-5"><p className="text-white/50 text-sm">Total Books</p><p className="text-3xl font-bold text-primary">{stats.totalBooks}</p></div>
          <div className="glass rounded-xl2 p-5"><p className="text-white/50 text-sm">Pending</p><p className="text-3xl font-bold text-white/70">{stats.pending}</p></div>
          <div className="glass rounded-xl2 p-5"><p className="text-white/50 text-sm">Approved</p><p className="text-3xl font-bold text-primary">{stats.approved}</p></div>
          <div className="glass rounded-xl2 p-5"><p className="text-white/50 text-sm">Rejected</p><p className="text-3xl font-bold text-danger">{stats.rejected}</p></div>
          <div className="glass rounded-xl2 p-5"><p className="text-white/50 text-sm">Total Users</p><p className="text-3xl font-bold text-secondary">{stats.totalUsers}</p></div>
        </div>
      ) : tab === "users" ? (
        <div className="space-y-2">
          {users.map((u) => (
            <div key={u.id} className="flex items-center justify-between glass rounded-xl2 px-5 py-3">
              <span>{u.username}</span>
              <div className="flex items-center gap-3">
                <span className={`text-xs px-2 py-1 rounded-lg ${u.role === "admin" ? "bg-accent/20 text-accent" : "bg-white/10 text-white/60"}`}>
                  {u.role}
                </span>
                <button onClick={() => toggleAdmin(u.id, u.role)} className="text-xs px-3 py-1.5 rounded-lg border border-white/20 hover:bg-white/5">
                  {u.role === "admin" ? "Remove admin" : "Make admin"}
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : books.length === 0 ? (
        <p className="text-white/40">Nothing here.</p>
      ) : (
        <div className="space-y-2">
          {books.map((b) => (
            <div key={b.id} className="flex flex-wrap items-center justify-between gap-3 glass rounded-xl2 px-5 py-3">
              <div>
                <p className="font-medium">{b.title}</p>
                <p className="text-xs text-white/50">
                  {b.author} · {b.category}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-xs px-2 py-1 rounded-lg ${
                  b.status === "approved" ? "bg-primary/20 text-primary" :
                  b.status === "rejected" ? "bg-danger/20 text-danger" : "bg-white/10 text-white/60"
                }`}>
                  {b.status}
                </span>
                {b.status !== "approved" && (
                  <button onClick={() => updateStatus(b.id, "approved")} className="text-xs px-3 py-1.5 rounded-lg bg-primary text-black font-semibold">
                    Approve
                  </button>
                )}
                {b.status !== "rejected" && (
                  <button onClick={() => updateStatus(b.id, "rejected")} className="text-xs px-3 py-1.5 rounded-lg border border-danger/50 text-danger">
                    Reject
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
