"use client";

import { PDFDocument } from "pdf-lib";
import { useId, useRef, useState } from "react";

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

type PdfMetadata = {
  title: string;
  author: string;
  subject: string;
  keywords: string;
  creator: string;
  producer: string;
};

export default function MetadataPage() {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement | null>(null);

  const [file, setFile] = useState<File | null>(null);
  const [pdfDoc, setPdfDoc] = useState<PDFDocument | null>(null);
  const [metadata, setMetadata] = useState<PdfMetadata>({
    title: "",
    author: "",
    subject: "",
    keywords: "",
    creator: "",
    producer: "",
  });
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadPdf(selectedFile: File) {
    if (!isPdfFile(selectedFile)) {
      setError("Please choose a PDF file.");
      return;
    }

    setError(null);
    setIsLoading(true);
    
    try {
      const arrayBuffer = await selectedFile.arrayBuffer();
      const doc = await PDFDocument.load(arrayBuffer);
      
      // Read existing metadata
      const keywords = doc.getKeywords();
      const existingMetadata: PdfMetadata = {
        title: doc.getTitle() || "",
        author: doc.getAuthor() || "",
        subject: doc.getSubject() || "",
        keywords: Array.isArray(keywords) ? keywords.join(", ") : (keywords || ""),
        creator: doc.getCreator() || "",
        producer: doc.getProducer() || "",
      };

      setFile(selectedFile);
      setPdfDoc(doc);
      setMetadata(existingMetadata);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load PDF.");
    } finally {
      setIsLoading(false);
    }
  }

  function handleFileSelect(fileList: FileList | File[]) {
    const selectedFile = Array.from(fileList)[0];
    if (selectedFile) {
      loadPdf(selectedFile);
    }
  }

  function clearAll() {
    setMetadata({
      title: "",
      author: "",
      subject: "",
      keywords: "",
      creator: "",
      producer: metadata.producer, // Keep producer as read-only
    });
  }

  async function savePdf() {
    if (!pdfDoc || !file) return;

    setError(null);
    setIsSaving(true);

    try {
      // Set metadata (excluding producer which is read-only)
      pdfDoc.setTitle(metadata.title);
      pdfDoc.setAuthor(metadata.author);
      pdfDoc.setSubject(metadata.subject);
      pdfDoc.setKeywords(metadata.keywords.split(",").map(k => k.trim()).filter(Boolean));
      pdfDoc.setCreator(metadata.creator);

      const pdfBytes = await pdfDoc.save();
      const safeBytes = Uint8Array.from(pdfBytes);
      const blob = new Blob([safeBytes], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement("a");
      a.href = url;
      const baseName = file.name.replace(/\.pdf$/i, "");
      a.download = `${baseName}_edited.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save PDF.");
    } finally {
      setIsSaving(false);
    }
  }

  function resetFile() {
    setFile(null);
    setPdfDoc(null);
    setMetadata({
      title: "",
      author: "",
      subject: "",
      keywords: "",
      creator: "",
      producer: "",
    });
    setError(null);
  }

  if (!file) {
    return (
      <div className="min-h-screen bg-[hsl(210,20%,98%)]">
        <div className="mx-auto w-full max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-3">
            <h1 className="text-balance text-4xl font-bold tracking-tight text-[hsl(215,25%,15%)]">
              Edit PDF Metadata
            </h1>
            <p className="max-w-2xl text-pretty text-base leading-7 text-[hsl(215,15%,45%)]">
              View and edit PDF document properties like title, author, and keywords — no uploads, no server.
            </p>
          </div>

          <div className="mt-8 flex justify-center">
            <div
              className={[
                "w-full max-w-md rounded-xl border bg-white p-6 shadow-sm transition-all",
                isDraggingOver
                  ? "border-[hsl(220,85%,55%)] ring-4 ring-[hsl(220,85%,55%)]/10"
                  : "border-[hsl(210,15%,90%)]",
              ].join(" ")}
            >
              <div
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
                  if (e.dataTransfer?.files?.length) handleFileSelect(e.dataTransfer.files);
                }}
                className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-[hsl(210,15%,90%)] bg-[hsl(210,15%,95%)] px-6 py-12 text-center"
              >
                <div className="w-12 h-12 rounded-lg bg-[hsl(220,85%,55%)]/10 flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-[hsl(220,85%,55%)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>
                <div className="text-sm font-medium text-[hsl(215,25%,15%)]">
                  Drag & drop a PDF here
                </div>
                <div className="mt-1 text-sm text-[hsl(215,15%,45%)]">
                  or click to choose a file
                </div>

                <div className="mt-6">
                  <button
                    type="button"
                    onClick={() => inputRef.current?.click()}
                    disabled={isLoading}
                    className="inline-flex items-center justify-center h-11 rounded-full bg-[hsl(220,85%,55%)] px-6 text-sm font-semibold text-white shadow-sm hover:bg-[hsl(220,85%,55%)]/90 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none focus-visible:ring-4 focus-visible:ring-[hsl(220,85%,55%)]/20 transition-all"
                  >
                    {isLoading ? "Loading..." : "Choose PDF"}
                  </button>
                </div>

                <input
                  id={inputId}
                  ref={inputRef}
                  type="file"
                  accept="application/pdf,.pdf"
                  className="sr-only"
                  onChange={(e) => {
                    if (e.target.files?.length) handleFileSelect(e.target.files);
                    e.target.value = "";
                  }}
                />
              </div>

              {error && (
                <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                  {error}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[hsl(210,20%,98%)]">
      <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-3">
          <h1 className="text-balance text-4xl font-bold tracking-tight text-[hsl(215,25%,15%)]">
            Edit PDF Metadata
          </h1>
          <p className="max-w-2xl text-pretty text-base leading-7 text-[hsl(215,15%,45%)]">
            View and edit PDF document properties like title, author, and keywords — no uploads, no server.
          </p>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-5">
          <section className="lg:col-span-2">
            <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold mb-4">File Information</h2>
              
              <div className="space-y-3">
                <div>
                  <div className="text-sm font-medium text-zinc-900">Name</div>
                  <div className="text-sm text-zinc-600 break-all">{file.name}</div>
                </div>
                
                <div>
                  <div className="text-sm font-medium text-zinc-900">Size</div>
                  <div className="text-sm text-zinc-600">{formatBytes(file.size)}</div>
                </div>
              </div>

              <button
                type="button"
                onClick={resetFile}
                className="mt-6 w-full rounded-full border border-zinc-200 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-900 shadow-sm hover:bg-zinc-50 focus:outline-none focus-visible:ring-4 focus-visible:ring-zinc-900/20"
              >
                Change File
              </button>
            </div>
          </section>

          <section className="lg:col-span-3">
            <div className="rounded-2xl border border-zinc-200 bg-white shadow-sm">
              <div className="border-b border-zinc-200 px-6 py-4">
                <h2 className="text-lg font-semibold">Metadata</h2>
                <p className="text-sm text-zinc-600 mt-1">
                  Edit document properties and information
                </p>
              </div>

              <div className="p-6 space-y-6">
                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-zinc-900 mb-2">
                    Title
                  </label>
                  <input
                    id="title"
                    type="text"
                    value={metadata.title}
                    onChange={(e) => setMetadata(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:border-zinc-900 focus:outline-none focus:ring-4 focus:ring-zinc-900/10"
                    placeholder="Document title"
                  />
                </div>

                <div>
                  <label htmlFor="author" className="block text-sm font-medium text-zinc-900 mb-2">
                    Author
                  </label>
                  <input
                    id="author"
                    type="text"
                    value={metadata.author}
                    onChange={(e) => setMetadata(prev => ({ ...prev, author: e.target.value }))}
                    className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:border-zinc-900 focus:outline-none focus:ring-4 focus:ring-zinc-900/10"
                    placeholder="Document author"
                  />
                </div>

                <div>
                  <label htmlFor="subject" className="block text-sm font-medium text-zinc-900 mb-2">
                    Subject
                  </label>
                  <input
                    id="subject"
                    type="text"
                    value={metadata.subject}
                    onChange={(e) => setMetadata(prev => ({ ...prev, subject: e.target.value }))}
                    className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:border-zinc-900 focus:outline-none focus:ring-4 focus:ring-zinc-900/10"
                    placeholder="Document subject"
                  />
                </div>

                <div>
                  <label htmlFor="keywords" className="block text-sm font-medium text-zinc-900 mb-2">
                    Keywords
                  </label>
                  <input
                    id="keywords"
                    type="text"
                    value={metadata.keywords}
                    onChange={(e) => setMetadata(prev => ({ ...prev, keywords: e.target.value }))}
                    className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:border-zinc-900 focus:outline-none focus:ring-4 focus:ring-zinc-900/10"
                    placeholder="Comma-separated keywords"
                  />
                  <p className="text-xs text-zinc-500 mt-1">Separate multiple keywords with commas</p>
                </div>

                <div>
                  <label htmlFor="creator" className="block text-sm font-medium text-zinc-900 mb-2">
                    Creator
                  </label>
                  <input
                    id="creator"
                    type="text"
                    value={metadata.creator}
                    onChange={(e) => setMetadata(prev => ({ ...prev, creator: e.target.value }))}
                    className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:border-zinc-900 focus:outline-none focus:ring-4 focus:ring-zinc-900/10"
                    placeholder="Application that created the document"
                  />
                </div>

                <div>
                  <label htmlFor="producer" className="block text-sm font-medium text-zinc-900 mb-2">
                    Producer
                  </label>
                  <input
                    id="producer"
                    type="text"
                    value={metadata.producer}
                    readOnly
                    className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-600 cursor-not-allowed"
                    placeholder="Read-only"
                  />
                  <p className="text-xs text-zinc-500 mt-1">Producer information is read-only</p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-4">
                  <button
                    type="button"
                    onClick={clearAll}
                    className="flex-1 rounded-full border border-zinc-200 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-900 shadow-sm hover:bg-zinc-50 focus:outline-none focus-visible:ring-4 focus-visible:ring-zinc-900/20"
                  >
                    Clear All
                  </button>
                  <button
                    type="button"
                    onClick={savePdf}
                    disabled={isSaving}
                    className="flex-1 rounded-full bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none focus-visible:ring-4 focus-visible:ring-zinc-900/20"
                  >
                    {isSaving ? "Saving..." : "Save PDF"}
                  </button>
                </div>

                {error && (
                  <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                    {error}
                  </div>
                )}
              </div>
            </div>

            <div className="mt-4 text-xs text-zinc-500">
              <strong>Note:</strong> Metadata is embedded in the PDF file and visible to anyone who opens the file properties.
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}