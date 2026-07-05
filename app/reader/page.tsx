"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Document, Page, pdfjs } from "react-pdf";
import { createClient } from "@/lib/supabase/client";

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;

function ReaderContent() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  const supabase = createClient();

  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [numPages, setNumPages] = useState(0);
  const [pageNumber, setPageNumber] = useState(1);
  const [theme, setTheme] = useState<"dark" | "sepia" | "light">("dark");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    async function load() {
      const { data: book } = await supabase
        .from("books")
        .select("file_path")
        .eq("id", id)
        .single();

      if (book) {
        const { data } = supabase.storage.from("books").getPublicUrl(book.file_path);
        setFileUrl(data.publicUrl);
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: progress } = await supabase
          .from("reading_progress")
          .select("current_page")
          .eq("book_id", id)
          .eq("user_id", user.id)
          .maybeSingle();
        if (progress?.current_page) setPageNumber(progress.current_page);
      }
      setLoading(false);
    }
    load();
  }, [id]);

  const saveProgress = useCallback(
    async (page: number) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !id) return;
      await supabase.from("reading_progress").upsert(
        {
          user_id: user.id,
          book_id: id,
          current_page: page,
          total_pages: numPages,
          progress_percent: numPages ? Math.round((page / numPages) * 100) : 0,
          last_read_at: new Date().toISOString(),
        },
        { onConflict: "user_id,book_id" }
      );
    },
    [id, numPages]
  );

  function changePage(delta: number) {
    const next = Math.min(Math.max(pageNumber + delta, 1), numPages || 1);
    setPageNumber(next);
    saveProgress(next);
  }

  const themeClasses = {
    dark: "bg-black text-white",
    sepia: "bg-[#F4ECD8] text-[#3B2F1E]",
    light: "bg-white text-black",
  };

  if (!id) return <p className="text-center py-20 text-danger">No book selected.</p>;
  if (loading) return <p className="text-center py-20 text-white/50">Loading book...</p>;
  if (!fileUrl) return <p className="text-center py-20 text-danger">Book not found.</p>;

  return (
    <div className={`min-h-screen ${themeClasses[theme]} transition-colors`}>
      <div className="flex items-center justify-between px-6 py-3 border-b border-white/10 sticky top-0 bg-inherit z-10">
        <div className="flex gap-2 text-sm">
          {(["dark", "sepia", "light"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTheme(t)}
              className={`px-3 py-1 rounded-lg border ${theme === t ? "border-primary text-primary" : "border-white/20"}`}
            >
              {t}
            </button>
          ))}
        </div>
        <p className="text-sm">
          Page {pageNumber} / {numPages || "?"} · {numPages ? Math.round((pageNumber / numPages) * 100) : 0}% read
        </p>
      </div>

      <div className="flex justify-center py-8">
        <Document file={fileUrl} onLoadSuccess={({ numPages }) => setNumPages(numPages)}>
          <Page pageNumber={pageNumber} width={700} />
        </Document>
      </div>

      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 flex gap-4 glass px-6 py-3 rounded-xl2">
        <button onClick={() => changePage(-1)} className="px-4 py-2 rounded-lg bg-white/10">
          ← Prev
        </button>
        <button onClick={() => changePage(1)} className="px-4 py-2 rounded-lg bg-primary text-black font-semibold">
          Next →
        </button>
      </div>
    </div>
  );
}

export default function ReaderPage() {
  return (
    <Suspense fallback={<p className="text-center py-20 text-white/40">Loading...</p>}>
      <ReaderContent />
    </Suspense>
  );
}
