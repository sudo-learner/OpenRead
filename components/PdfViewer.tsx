"use client";

import { useRef } from "react";
import { Document, Page, pdfjs } from "react-pdf";

// Runs only in the browser (this file is loaded with ssr:false), so it's
// safe to touch browser-only APIs here — this would crash a Node.js build.
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;

export default function PdfViewer({
  fileUrl,
  pageNumber,
  width,
  onLoadSuccess,
  onError,
  onPageTextReady,
}: {
  fileUrl: string;
  pageNumber: number;
  width: number;
  onLoadSuccess: (numPages: number) => void;
  onError: () => void;
  // Called with the plain text of the currently rendered page, once react-pdf
  // has drawn its (invisible, selectable) text layer over the page image.
  // Used for Text-to-Speech and for reading the user's text selection.
  onPageTextReady?: (text: string) => void;
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

  return (
    <div ref={containerRef}>
      <Document
        file={fileUrl}
        onLoadSuccess={({ numPages }) => onLoadSuccess(numPages)}
        onLoadError={onError}
      >
        <Page
          pageNumber={pageNumber}
          width={width}
          renderTextLayer={true}
          renderAnnotationLayer={false}
          onRenderTextLayerSuccess={handleTextLayerReady}
        />
      </Document>
    </div>
  );
}
