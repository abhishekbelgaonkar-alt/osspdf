"use client";

import * as pdfjsLib from "pdfjs-dist";
import { useId, useRef, useState } from "react";

// Set the worker source
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes)) return "";
  const units = ["B", "KB", "MB", "GB"];
  let v = bytes;
  let i = 0;
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024;
    i += 1;
  }
  const fixed = i === 0 ? 0 : v < 10 ? 1 : 0;
  return `${v.toFixed(fixed)} ${units[i]}`;
}

function isPdfFile(file: File) {
  return (
    file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")
  );
}

async function extractTextFromPdf(file: File): Promise<{ text: string; pageCount: number }> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

  let fullText = "";

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const pageText = content.items.map((item: any) => item.str).join(" ");
    fullText += pageText + "\n\n";
  }

  return {
    text: fullText.trim(),
    pageCount: pdf.numPages
  };
}

export default function PdfToTextPage() {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement | null>(null);

  const [file, setFile] = useState<File | null>(null);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [extractedText, setExtractedText] = useState<string>("");
  const [pageCount, setPageCount] = useState<number>(0);
  const [copySuccess, setCopySuccess] = useState(false);

  const canExtract = file && !isExtracting;

  function addFile(fileList: FileList | File[]) {
    const arr = Array.from(fileList);
    const pdf = arr.find(isPdfFile);

    if (!pdf) {
      setError("Please choose a PDF file.");
      return;
    }

    setError(null);
    setFile(pdf);
    setExtractedText("");
    setPageCount(0);
  }

  async function onExtractText() {
    if (!file) return;

    setError(null);
    setIsExtracting(true);
    try {
      const result = await extractTextFromPdf(file);
      setExtractedText(result.text);
      setPageCount(result.pageCount);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to extract text from PDF.");
    } finally {
      setIsExtracting(false);
    }
  }

  async function copyToClipboard() {
    try {
      await navigator.clipboard.writeText(extractedText);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (e) {
      setError("Failed to copy text to clipboard.");
    }
  }

  function downloadAsText() {
    if (!extractedText || !file) return;

    const blob = new Blob([extractedText], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${file.name.replace(/\.pdf$/i, "")}.txt`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="min-h-screen bg-[hsl(210,20%,98%)]">
      <div className="mx-auto w-full max-w-2xl px-4 py-12 sm:px-6">
        <div className="flex flex-col gap-3 mb-8">
          <h1 className="text-balance text-4xl font-bold tracking-tight text-[hsl(215,25%,15%)]">
            PDF to Text
          </h1>
          <p className="text-[hsl(215,15%,45%)]">
            Extract plain text from your PDF documents — no uploads, no server.
          </p>
        </div>

        {!file ? (
          <div
            className={[
              "rounded-xl border-2 border-dashed bg-white p-12 text-center transition-all",
              isDraggingOver
                ? "border-[hsl(220,85%,55%)] bg-[hsl(220,85%,55%)]/5"
                : "border-[hsl(210,15%,90%)]",
            ].join(" ")}
            onDragEnter={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsDraggingOver(true);
            }}
            onDragOver={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsDraggingOver(true);
            }}
            onDragLeave={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsDraggingOver(false);
            }}
            onDrop={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsDraggingOver(false);
              if (e.dataTransfer?.files?.length) addFile(e.dataTransfer.files);
            }}
          >
            <div className="mx-auto w-12 h-12 rounded-lg bg-[hsl(220,85%,55%)]/10 flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-[hsl(220,85%,55%)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold mb-2 text-[hsl(215,25%,15%)]">Drop your PDF here</h2>
            <p className="text-sm text-[hsl(215,15%,45%)] mb-6">or click to browse</p>
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="inline-flex items-center justify-center h-11 rounded-full bg-[hsl(220,85%,55%)] text-white px-6 font-semibold hover:bg-[hsl(220,85%,55%)]/90 focus:outline-none focus-visible:ring-4 focus-visible:ring-[hsl(220,85%,55%)]/20 transition-all"
            >
              Choose PDF File
            </button>
            <p className="text-xs text-[hsl(215,15%,45%)] mt-4">PDF files only</p>
            <input
              id={inputId}
              ref={inputRef}
              type="file"
              accept="application/pdf,.pdf"
              className="sr-only"
              onChange={(e) => {
                if (e.target.files?.length) addFile(e.target.files);
                e.target.value = "";
              }}
            />
          </div>
        ) : !extractedText ? (
          <div className="space-y-6">
            <div className="rounded-xl border border-[hsl(210,15%,90%)] bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="flex h-12 w-12 flex-none items-center justify-center rounded-lg bg-[hsl(220,85%,55%)]/10 text-[hsl(220,85%,55%)]">
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-medium text-[hsl(215,25%,15%)]">{file.name}</div>
                    <div className="text-sm text-[hsl(215,15%,45%)]">{formatBytes(file.size)}</div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setFile(null);
                    setError(null);
                    setExtractedText("");
                    setPageCount(0);
                  }}
                  disabled={isExtracting}
                  className="text-[hsl(215,15%,45%)] hover:text-[hsl(215,25%,15%)] disabled:opacity-40 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={onExtractText}
              disabled={!canExtract}
              className="w-full h-11 inline-flex items-center justify-center rounded-full bg-[hsl(220,85%,55%)] text-white px-6 font-semibold hover:bg-[hsl(220,85%,55%)]/90 disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none focus-visible:ring-4 focus-visible:ring-[hsl(220,85%,55%)]/20 transition-all shadow-sm hover:shadow-lg"
            >
              {isExtracting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Extracting Text…
                </>
              ) : (
                "Extract Text"
              )}
            </button>

            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 flex items-start gap-2">
                <svg className="w-5 h-5 flex-none mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <span>{error}</span>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 flex items-center gap-2">
              <svg className="w-5 h-5 text-green-600 flex-none" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="text-sm font-medium text-green-800">
                Text extracted successfully • {extractedText.length.toLocaleString()} characters • {pageCount} pages
              </span>
            </div>

            <div className="rounded-xl border border-[hsl(210,15%,90%)] bg-white p-6 shadow-sm">
              <textarea
                value={extractedText}
                readOnly
                className="w-full h-96 resize-none rounded-lg border border-[hsl(210,15%,90%)] px-3 py-2 text-sm font-mono focus:border-[hsl(220,85%,55%)] focus:outline-none focus:ring-4 focus:ring-[hsl(220,85%,55%)]/20 bg-[hsl(210,15%,95%)]"
                placeholder="Extracted text will appear here..."
              />
              <p className="text-xs text-[hsl(215,15%,45%)] mt-3">
                Text extraction works best on digital PDFs. Scanned documents require OCR which is not supported.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={copyToClipboard}
                className="flex-1 h-11 inline-flex items-center justify-center rounded-full border border-[hsl(210,15%,90%)] px-6 font-semibold hover:bg-[hsl(210,15%,95%)] focus:outline-none focus-visible:ring-4 focus-visible:ring-[hsl(220,85%,55%)]/20 transition-all"
              >
                {copySuccess ? "Copied!" : "Copy to Clipboard"}
              </button>
              <button
                type="button"
                onClick={downloadAsText}
                className="flex-1 h-11 inline-flex items-center justify-center rounded-full bg-[hsl(220,85%,55%)] text-white px-6 font-semibold hover:bg-[hsl(220,85%,55%)]/90 focus:outline-none focus-visible:ring-4 focus-visible:ring-[hsl(220,85%,55%)]/20 transition-all shadow-sm hover:shadow-lg"
              >
                Download .txt File
              </button>
            </div>

            <button
              type="button"
              onClick={() => {
                setFile(null);
                setError(null);
                setExtractedText("");
                setPageCount(0);
              }}
              className="w-full text-sm text-[hsl(215,15%,45%)] hover:text-[hsl(215,25%,15%)] transition-colors"
            >
              Process another PDF
            </button>
          </div>
        )}

        <div className="mt-8 flex items-center justify-center gap-2 text-sm text-[hsl(215,15%,45%)] bg-[hsl(210,15%,95%)]/50 rounded-full px-4 py-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          <span>Your files never leave your browser</span>
        </div>
      </div>
    </div>
  );
}