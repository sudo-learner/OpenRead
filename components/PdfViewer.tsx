"use client";

import { Document, Page, pdfjs } from "react-pdf";

// Runs only in the browser (this file is loaded with ssr:false), so it's
// safe to touch browser-only APIs here — this would crash a Node.js build.
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;

export default function PdfViewer({
  fileUrl,
  pageNumber,
  onLoadSuccess,
}: {
  fileUrl: string;
  pageNumber: number;
  onLoadSuccess: (numPages: number) => void;
}) {
  return (
    <Document file={fileUrl} onLoadSuccess={({ numPages }) => onLoadSuccess(numPages)}>
      <Page pageNumber={pageNumber} width={700} />
    </Document>
  );
}
