"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function ListsPage() {
  const supabase = createClient();
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [lists, setLists] = useState<any[]>([]);
  const [name, setName] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }
      setUserId(user.id);
      const { data } = await supabase
        .from("reading_lists")
        .select("id, name, is_public, created_at, reading_list_items(count)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      setLists(data ?? []);
      setLoading(false);
    }
    load();
  }, []);

  async function createList(e: React.FormEvent) {
    e.preventDefault();
    if (!userId || !name.trim()) return;
    const { data } = await supabase
      .from("reading_lists")
      .insert({ user_id: userId, name, is_public: isPublic })
      .select()
      .single();
    if (data) {
      setLists((prev) => [{ ...data, reading_list_items: [{ count: 0 }] }, ...prev]);
      setName("");
      setIsPublic(false);
    }
  }

  async function deleteList(id: string) {
    await supabase.from("reading_lists").delete().eq("id", id);
    setLists((prev) => prev.filter((l) => l.id !== id));
  }

  if (loading) return <p className="text-center py-20 text-white/40">Loading your lists...</p>;

  return (
    <div className="px-6 py-10 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-2">Your Reading Lists</h1>
      <p className="text-white/50 text-sm mb-8">
        Group books into custom lists — make one public to share with other readers.
      </p>

      <form onSubmit={createList} className="flex flex-col sm:flex-row gap-3 mb-10">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="New list name (e.g. 'Weekend Reads')"
          className="flex-1 bg-card border border-white/10 rounded-xl2 px-4 py-3"
        />
        <label className="flex items-center gap-2 text-sm text-white/60 px-2">
          <input type="checkbox" checked={isPublic} onChange={(e) => setIsPublic(e.target.checked)} />
          Public
        </label>
        <button className="bg-primary text-black font-semibold px-5 py-3 rounded-xl2 glow-primary">
          Create
        </button>
      </form>

      {lists.length === 0 ? (
        <p className="text-white/40 text-sm">No lists yet — create your first one above.</p>
      ) : (
        <div className="space-y-3">
          {lists.map((l) => (
            <div key={l.id} className="flex items-center justify-between glass rounded-xl2 px-5 py-3">
              <div>
                <p className="font-medium">{l.name}</p>
                <p className="text-xs text-white/50">
                  {l.reading_list_items?.[0]?.count ?? 0} books · {l.is_public ? "Public" : "Private"}
                </p>
              </div>
              <button onClick={() => deleteList(l.id)} className="text-xs text-danger/70 hover:text-danger">
                Delete
              </button>
            </div>
          ))}
        </div>
      )}

      <p className="text-white/40 text-xs mt-8">
        To add a book to a list, open it in the reader and use the "Add to list" option (see Notes panel).
      </p>
    </div>
  );
}
