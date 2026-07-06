"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import { createClient } from "@/lib/supabase/client";
import TextToSpeech from "@/components/TextToSpeech";
import ReaderPanel from "@/components/ReaderPanel";
import ReviewsPanel from "@/components/ReviewsPanel";

// react-pdf needs browser-only APIs (DOMMatrix etc.) that don't exist in
// the Node.js environment Next.js uses to pre-render pages during
// `next build` with output: 'export'. ssr:false keeps it out of that
// pre-render pass entirely — it only loads once this runs in the browser.
const PdfViewer = dynamic(() => import("@/components/PdfViewer"), { ssr: false });

function ReaderContent() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  const supabase = createClient();

  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [numPages, setNumPages] = useState(0);
  const [pageNumber, setPageNumber] = useState(1);
  const [theme, setTheme] = useState<"dark" | "sepia" | "light">("dark");
  const [loading, setLoading] = useState(true);
  const [fileError, setFileError] = useState(false);

  const [pageText, setPageText] = useState("");
  const [selectedText, setSelectedText] = useState("");
  const [panelOpen, setPanelOpen] = useState(false);
  const [reviewsOpen, setReviewsOpen] = useState(false);
  const [dictDefinition, setDictDefinition] = useState<string | null>(null);
  const [dictLoading, setDictLoading] = useState(false);
  const [jumpInput, setJumpInput] = useState("");

  // Keyboard shortcuts: ← / → change page, Esc closes any open panel.
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === "ArrowRight") changePage(1);
      if (e.key === "ArrowLeft") changePage(-1);
      if (e.key === "Escape") {
        setPanelOpen(false);
        setReviewsOpen(false);
        setDictDefinition(null);
      }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [pageNumber, numPages]);

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
    setSelectedText("");
    saveProgress(next);
  }

  function jumpToPage(page: number) {
    setPageNumber(page);
    setSelectedText("");
    saveProgress(page);
  }

  function handleMouseUp() {
    const selection = window.getSelection()?.toString().trim() ?? "";
    if (selection.length > 0) {
      setSelectedText(selection);
      setDictDefinition(null);
    }
  }

  async function lookupDictionary() {
    const word = selectedText.trim().split(/\s+/)[0]?.replace(/[^a-zA-Z'-]/g, "");
    if (!word) return;
    setDictLoading(true);
    setDictDefinition(null);
    try {
      // Free, no-key public dictionary API — safe to call directly from
      // the browser (unlike a generative-AI API key, this one is meant
      // to be used client-side with no secret to protect).
      const res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`);
      if (!res.ok) throw new Error("not found");
      const data = await res.json();
      const def = data[0]?.meanings?.[0]?.definitions?.[0]?.definition;
      setDictDefinition(def || "No definition found.");
    } catch {
      setDictDefinition("No definition found for that word.");
    } finally {
      setDictLoading(false);
    }
  }

  function openTranslate() {
    // Real machine translation needs either a paid API or a key-holding
    // backend server to call it safely — neither fits a key-free static
    // site. Opening Google Translate in a new tab with the text pre-filled
    // gets the same result for the reader without exposing any secret.
    const url = `https://translate.google.com/?sl=auto&tl=hi&text=${encodeURIComponent(selectedText)}&op=translate`;
    window.open(url, "_blank");
  }

  function handleJumpSubmit(e: React.FormEvent) {
    e.preventDefault();
    const page = parseInt(jumpInput);
    if (page >= 1 && page <= (numPages || page)) {
      jumpToPage(page);
      setJumpInput("");
    }
  }

  const themeClasses = {
    dark: "bg-black text-white",
    sepia: "bg-[#F4ECD8] text-[#3B2F1E]",
    light: "bg-white text-black",
  };

  if (!id) return <p className="text-center py-20 text-danger">No book selected.</p>;
  if (loading) return <p className="text-center py-20 text-white/50">Loading book...</p>;
  if (!fileUrl) return <p className="text-center py-20 text-danger">Book not found.</p>;
  if (fileError) {
    return (
      <p className="text-center py-20 text-white/50 max-w-md mx-auto">
        This book's file hasn't been uploaded yet — its listing exists, but no
        readable file is attached. Check back soon, or contact the admin.
      </p>
    );
  }

  return (
    <div className={`min-h-screen ${themeClasses[theme]} transition-colors`}>
      <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-3 border-b border-white/10 sticky top-0 bg-inherit z-10">
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

        <TextToSpeech text={pageText} />

        <div className="flex items-center gap-2 text-sm">
          <button onClick={() => setReviewsOpen(true)} className="px-3 py-1.5 rounded-lg border border-white/20 hover:bg-white/5">
            ⭐ Reviews
          </button>
          <button onClick={() => setPanelOpen(true)} className="px-3 py-1.5 rounded-lg border border-white/20 hover:bg-white/5">
            🔖 Notes
          </button>
          <form onSubmit={handleJumpSubmit} className="flex items-center gap-1">
            <input
              value={jumpInput}
              onChange={(e) => setJumpInput(e.target.value)}
              placeholder="Go to page"
              className="w-24 bg-black/30 border border-white/10 rounded-lg px-2 py-1 text-xs"
            />
          </form>
          <span>
            Page {pageNumber} / {numPages || "?"} · {numPages ? Math.round((pageNumber / numPages) * 100) : 0}%
          </span>
        </div>
      </div>

      {selectedText && (
        <div className="flex flex-wrap items-center gap-3 px-6 py-2 border-b border-white/10 bg-black/20 text-sm">
          <span className="text-white/50 italic truncate max-w-xs">&ldquo;{selectedText}&rdquo;</span>
          <button onClick={lookupDictionary} className="px-3 py-1 rounded-lg border border-secondary/40 text-secondary hover:bg-secondary/10">
            {dictLoading ? "Looking up..." : "📖 Dictionary"}
          </button>
          <button onClick={openTranslate} className="px-3 py-1 rounded-lg border border-accent/40 text-accent hover:bg-accent/10">
            🌐 Translate
          </button>
          <button onClick={() => setPanelOpen(true)} className="px-3 py-1 rounded-lg border border-primary/40 text-primary hover:bg-primary/10">
            ✏️ Save as note
          </button>
          {dictDefinition && <span className="text-white/70 w-full">{dictDefinition}</span>}
        </div>
      )}

      <div className="flex justify-center py-8" onMouseUp={handleMouseUp}>
        <PdfViewer
          fileUrl={fileUrl}
          pageNumber={pageNumber}
          onLoadSuccess={setNumPages}
          onError={() => setFileError(true)}
          onPageTextReady={setPageText}
        />
      </div>

      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 flex gap-4 glass px-6 py-3 rounded-xl2">
        <button onClick={() => changePage(-1)} className="px-4 py-2 rounded-lg bg-white/10">
          ← Prev
        </button>
        <button onClick={() => changePage(1)} className="px-4 py-2 rounded-lg bg-primary text-black font-semibold">
          Next →
        </button>
      </div>

      {panelOpen && (
        <ReaderPanel
          bookId={id}
          currentPage={pageNumber}
          selectedText={selectedText}
          onJumpToPage={jumpToPage}
          onClose={() => setPanelOpen(false)}
        />
      )}
      {reviewsOpen && <ReviewsPanel bookId={id} onClose={() => setReviewsOpen(false)} />}
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
