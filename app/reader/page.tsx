"use client";

import { useEffect, useState, useCallback, useRef, Suspense } from "react";
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
  const containerRef = useRef<HTMLDivElement>(null);
  const pageAreaRef = useRef<HTMLDivElement>(null);

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

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [fitToScreen, setFitToScreen] = useState(false);
  const [pageWidth, setPageWidth] = useState(700);
  const touchStart = useRef<{ x: number; y: number } | null>(null);

  // Full screen: uses the browser's native Fullscreen API on the whole
  // reader container. Works the same on a static export — no server involved.
  function toggleFullscreen() {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  }

  useEffect(() => {
    function handleFsChange() {
      setIsFullscreen(!!document.fullscreenElement);
    }
    document.addEventListener("fullscreenchange", handleFsChange);
    return () => document.removeEventListener("fullscreenchange", handleFsChange);
  }, []);

  // Fit Screen: recompute the PDF page width to match the available space
  // instead of a fixed 700px — this is what fixes "very long book pages"
  // on smaller screens or when a book has a tall/large page size.
  useEffect(() => {
    if (!fitToScreen) return;
    function recompute() {
      if (!pageAreaRef.current) return;
      const available = pageAreaRef.current.clientWidth - 32; // small side padding
      setPageWidth(Math.max(280, Math.min(available, 1100)));
    }
    recompute();
    window.addEventListener("resize", recompute);
    return () => window.removeEventListener("resize", recompute);
  }, [fitToScreen, isFullscreen]);

  function toggleFitScreen() {
    if (fitToScreen) {
      setFitToScreen(false);
      setPageWidth(700);
    } else {
      setFitToScreen(true);
    }
  }

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

  // Swipe gestures: swipe left -> next page, swipe right -> previous page.
  // Vertical scrolling is left completely alone — we only act when the
  // horizontal movement clearly dominates, so a normal up/down scroll
  // never gets mistaken for a page turn.
  function handleTouchStart(e: React.TouchEvent) {
    const t = e.touches[0];
    touchStart.current = { x: t.clientX, y: t.clientY };
  }

  function handleTouchEnd(e: React.TouchEvent) {
    if (!touchStart.current) return;
    const t = e.changedTouches[0];
    const deltaX = t.clientX - touchStart.current.x;
    const deltaY = t.clientY - touchStart.current.y;
    touchStart.current = null;

    const SWIPE_THRESHOLD = 50;
    if (Math.abs(deltaX) > SWIPE_THRESHOLD && Math.abs(deltaX) > Math.abs(deltaY) * 1.5) {
      if (deltaX < 0) changePage(1); // swiped left -> next
      else changePage(-1); // swiped right -> previous
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
    <div
      ref={containerRef}
      className={`${themeClasses[theme]} transition-colors ${
        isFullscreen ? "h-screen overflow-y-auto" : "min-h-screen"
      }`}
    >
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
          <button
            onClick={toggleFitScreen}
            className={`px-3 py-1 rounded-lg border ${fitToScreen ? "border-primary text-primary" : "border-white/20"}`}
            title="Resize the page to fit your screen width"
          >
            ⤢ Fit Screen
          </button>
          <button
            onClick={toggleFullscreen}
            className={`px-3 py-1 rounded-lg border ${isFullscreen ? "border-primary text-primary" : "border-white/20"}`}
          >
            {isFullscreen ? "⤓ Exit Full Screen" : "⛶ Full Screen"}
          </button>
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

      <div
        ref={pageAreaRef}
        className="flex justify-center py-8 pb-28"
        onMouseUp={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <PdfViewer
          fileUrl={fileUrl}
          pageNumber={pageNumber}
          width={pageWidth}
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
