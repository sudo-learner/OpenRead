"use client";

import { useEffect, useState } from "react";
import Hero from "@/components/Hero";
import BookCard from "@/components/BookCard";
import { createClient } from "@/lib/supabase/client";

type Book = { id: string; title: string; author: string; cover_url: string | null; category: string };

function Row({ title, books }: { title: string; books: Book[] }) {
  if (!books.length) return null;
  return (
    <section className="px-6 py-6">
      <h2 className="text-xl font-semibold mb-4">{title}</h2>
      <div className="flex gap-4 overflow-x-auto pb-2">
        {books.map((b) => (
          <BookCard key={b.id} book={b} />
        ))}
      </div>
    </section>
  );
}

export default function HomePage() {
  const supabase = createClient();
  const [sections, setSections] = useState<Record<string, Book[]>>({
    trending: [], popular: [], recent: [], cyber: [], hacking: [], programming: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      async function getSection(orderBy: string, category?: string) {
        let query = supabase
          .from("books")
          .select("id, title, author, cover_url, category")
          .eq("status", "approved")
          .order(orderBy, { ascending: false })
          .limit(10);
        if (category) query = query.eq("category", category);
        const { data } = await query;
        return data ?? [];
      }

      const [trending, popular, recent, cyber, hacking, programming] = await Promise.all([
        getSection("view_count"),
        getSection("download_count"),
        getSection("created_at"),
        getSection("created_at", "Cybersecurity"),
        getSection("created_at", "Ethical Hacking"),
        getSection("created_at", "Programming"),
      ]);

      setSections({ trending, popular, recent, cyber, hacking, programming });
      setLoading(false);
    }
    load();
  }, []);

  return (
    <>
      <Hero />
      {loading ? (
        <p className="text-center py-10 text-white/40">Loading books...</p>
      ) : (
        <>
          <Row title="Trending Books" books={sections.trending} />
          <Row title="Popular Books" books={sections.popular} />
          <Row title="Recently Added" books={sections.recent} />
          <Row title="Cybersecurity Collection" books={sections.cyber} />
          <Row title="Ethical Hacking Collection" books={sections.hacking} />
          <Row title="Programming Collection" books={sections.programming} />
        </>
      )}
      <footer className="px-6 py-10 text-center text-white/40 text-sm border-t border-white/10 mt-10">
        © {new Date().getFullYear()} OpenRead. Built for learners.
      </footer>
    </>
  );
}
