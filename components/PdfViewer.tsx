"use client";

import { useRef } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { motion, AnimatePresence } from "framer-motion";
import "react-pdf/dist/Page/TextLayer.css";

// Runs only in the browser (this file is loaded with ssr:false), so it's
// safe to touch browser-only APIs here — this would crash a Node.js build.
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;

export default function PdfViewer({
  fileUrl,
  pageNumber,
  width,
  turnDirection = 1,
  onLoadSuccess,
  onError,
  onPageTextReady,
  onPageDimensions,
}: {
  fileUrl: string;
  pageNumber: number;
  width: number;
  // 1 = moving forward (next page), -1 = moving backward (previous page).
  // Only affects which way the flip animation appears to turn.
  turnDirection?: 1 | -1;
  onLoadSuccess: (numPages: number) => void;
  onError: () => void;
  // Called with the plain text of the currently rendered page, once react-pdf
  // has drawn its (invisible, selectable) text layer over the page image.
  // Used for Text-to-Speech and for reading the user's text selection.
  onPageTextReady?: (text: string) => void;
  // Called with the page's natural width/height (in PDF points) once known,
  // so the reader can size the page to fit the screen both across AND
  // down — not just fit the width, which can still leave a tall page
  // taller than the screen and needing a scroll to see the rest.
  onPageDimensions?: (width: number, height: number) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);

  function handleTextLayerReady() {
    if (!containerRef.current || !onPageTextReady) return;
    // react-pdf renders each page's extracted text as an invisible overlay
    // of <span> elements (.react-pdf__Page__textContent) on top of the
    // canvas image — this is what makes PDF text selectable/searchable.
    // We read it back out here to feed the speech synthesizer.
    const layer = containerRef.current.querySelector(".react-pdf__Page__textContent");
    if (layer) onPageTextReady(layer.textContent || "");
  }

  function handlePageLoadSuccess(page: any) {
    if (!onPageDimensions) return;
    // pdf.js's page proxy exposes the natural page box via .view =
    // [x0, y0, x1, y1] in PDF points — read defensively since exact
    // property names can vary slightly across pdf.js versions.
    const w = page?.originalWidth ?? (page?.view ? page.view[2] - page.view[0] : null);
    const h = page?.originalHeight ?? (page?.view ? page.view[3] - page.view[1] : null);
    if (w && h) onPageDimensions(w, h);
  }

  return (
    // <Document> is deliberately OUTSIDE the animated/keyed element below —
    // it holds the parsed PDF file. If it remounted on every page turn,
    // the whole file would re-download and re-parse every time you flip a
    // page, causing a lag spike instead of a smooth animation. Only the
    // individual <Page> swaps, which is cheap since the file is already loaded.
    <Document
      file={fileUrl}
      onLoadSuccess={({ numPages }) => onLoadSuccess(numPages)}
      onLoadError={onError}
    >
      <div style={{ perspective: 1800 }}>
        <AnimatePresence initial={false} mode="popLayout">
          <motion.div
            key={pageNumber}
            ref={containerRef}
            initial={{ rotateY: turnDirection > 0 ? 65 : -65, opacity: 0 }}
            animate={{ rotateY: 0, opacity: 1 }}
            exit={{ rotateY: turnDirection > 0 ? -65 : 65, opacity: 0 }}
            transition={{ duration: 0.32, ease: "easeInOut" }}
            style={{
              transformStyle: "preserve-3d",
              transformOrigin: turnDirection > 0 ? "left center" : "right center",
            }}
          >
            <Page
              pageNumber={pageNumber}
              width={width}
              renderTextLayer={true}
              renderAnnotationLayer={false}
              onLoadSuccess={handlePageLoadSuccess}
              onRenderTextLayerSuccess={handleTextLayerReady}
            />
          </motion.div>
        </AnimatePresence>
      </div>
    </Document>
  );
}
