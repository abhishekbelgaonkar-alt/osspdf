"use client";

import { PDFDocument } from "pdf-lib";
import { useId, useMemo, useRef, useState } from "react";

type PdfItem = {
  id: string;
  file: File;
};

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

function arrayMove<T>(arr: T[], from: number, to: number): T[] {
  if (from === to) return arr;
  const copy = arr.slice();
  const [item] = copy.splice(from, 1);
  copy.splice(to, 0, item);
  return copy;
}

function isPdfFile(file: File) {
  return (
    file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")
  );
}

async function mergePdfFiles(files: File[]): Promise<Uint8Array> {
  const merged = await PDFDocument.create();

  for (const file of files) {
    const srcBytes = await file.arrayBuffer();
    const srcDoc = await PDFDocument.load(srcBytes);
    
    // Copy all pages from this PDF
    const pageCount = srcDoc.getPageCount();
    for (let i = 0; i < pageCount; i++) {
      const [copiedPage] = await merged.copyPages(srcDoc, [i]);
      merged.addPage(copiedPage);
    }
  }

  return merged.save();
}

export default function MergePage() {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement | null>(null);

  const [items, setItems] = useState<PdfItem[]>([]);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [isMerging, setIsMerging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canMerge = items.length >= 2 && !isMerging;

  const totalSize = useMemo(
    () => items.reduce((sum, it) => sum + (it.file.size ?? 0), 0),
    [items],
  );

  function addFiles(fileList: FileList | File[]) {
    const arr = Array.from(fileList);
    const pdfs = arr.filter(isPdfFile);

    if (pdfs.length === 0) {
      setError("Please choose one or more PDF files.");
      return;
    }

    setError(null);
    setItems((prev) => [
      ...prev,
      ...pdfs.map((file) => ({
        id: crypto.randomUUID(),
        file,
      })),
    ]);
  }

  async function onMerge() {
    setError(null);
    setIsMerging(true);
    try {
      const mergedBytes = await mergePdfFiles(items.map((i) => i.file));
      const safeBytes = Uint8Array.from(mergedBytes);
      const blob = new Blob([safeBytes], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "merged.pdf";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to merge PDFs.");
    } finally {
      setIsMerging(false);
    }
  }

  return (
    <div className="min-h-screen bg-[hsl(210,20%,98%)]">
      <div className="mx-auto w-full max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-3">
          <h1 className="text-balance text-4xl font-bold tracking-tight text-[hsl(215,25%,15%)]">
            Merge PDFs
          </h1>
          <p className="max-w-2xl text-pretty text-base leading-7 text-[hsl(215,15%,45%)]">
            Add multiple PDF files, reorder them, then merge and download — no
            uploads, no server.
          </p>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-5">
          <section className="lg:col-span-2">
            <div
              className={[
                "rounded-xl border bg-white p-5 shadow-sm transition-all",
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
                  if (e.dataTransfer?.files?.length) addFiles(e.dataTransfer.files);
                }}
                className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-[hsl(210,15%,90%)] bg-[hsl(210,15%,95%)] px-5 py-10 text-center"
              >
                <div className="w-12 h-12 rounded-lg bg-[hsl(220,85%,55%)]/10 flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-[hsl(220,85%,55%)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>
                <div className="text-sm font-medium text-[hsl(215,25%,15%)]">
                  Drag & drop PDFs here
                </div>
                <div className="mt-1 text-sm text-[hsl(215,15%,45%)]">
                  or click to choose files
                </div>

                <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => inputRef.current?.click()}
                    className="inline-flex items-center justify-center h-11 rounded-full bg-[hsl(220,85%,55%)] px-6 text-sm font-semibold text-white shadow-sm hover:bg-[hsl(220,85%,55%)]/90 hover:shadow-lg focus:outline-none focus-visible:ring-4 focus-visible:ring-[hsl(220,85%,55%)]/20 transition-all"
                  >
                    Choose PDFs
                  </button>
                  <div className="text-xs text-[hsl(215,15%,45%)]">
                    Supports multiple files
                  </div>
                </div>

                <input
                  id={inputId}
                  ref={inputRef}
                  type="file"
                  accept="application/pdf,.pdf"
                  multiple
                  className="sr-only"
                  onChange={(e) => {
                    if (e.target.files?.length) addFiles(e.target.files);
                    e.target.value = "";
                  }}
                />
              </div>

              <div className="mt-4 flex items-center justify-between gap-3">
                <div className="text-sm text-[hsl(215,15%,45%)]">
                  <span className="font-medium text-[hsl(215,25%,15%)]">
                    {items.length}
                  </span>{" "}
                  file{items.length === 1 ? "" : "s"} •{" "}
                  <span className="font-medium text-[hsl(215,25%,15%)]">
                    {formatBytes(totalSize)}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setItems([]);
                    setError(null);
                  }}
                  disabled={items.length === 0 || isMerging}
                  className="text-sm font-medium text-[hsl(215,15%,45%)] hover:text-[hsl(215,25%,15%)] disabled:cursor-not-allowed disabled:opacity-40 transition-colors"
                >
                  Clear
                </button>
              </div>

              {error ? (
                <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                  {error}
                </div>
              ) : null}
            </div>
          </section>

          <section className="lg:col-span-3">
            <div className="rounded-xl border border-[hsl(210,15%,90%)] bg-white shadow-sm">
              <div className="flex items-center justify-between gap-3 border-b border-[hsl(210,15%,90%)] px-5 py-4">
                <div>
                  <div className="text-sm font-semibold text-[hsl(215,25%,15%)]">Files</div>
                  <div className="text-xs text-[hsl(215,15%,45%)]">
                    Drag to reorder (top = first in merged PDF)
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onMerge}
                  disabled={!canMerge}
                  className="inline-flex items-center justify-center h-11 rounded-full bg-[hsl(220,85%,55%)] px-6 text-sm font-semibold text-white shadow-sm hover:bg-[hsl(220,85%,55%)]/90 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none focus-visible:ring-4 focus-visible:ring-[hsl(220,85%,55%)]/20 transition-all"
                >
                  {isMerging ? "Merging…" : "Merge PDFs"}
                </button>
              </div>

              <div className="p-2">
                {items.length === 0 ? (
                  <div className="px-4 py-10 text-center text-sm text-[hsl(215,15%,45%)]">
                    Add at least two PDFs to enable merging.
                  </div>
                ) : (
                  <ul className="space-y-2">
                    {items.map((item, index) => (
                      <li
                        key={item.id}
                        draggable={!isMerging}
                        onDragStart={(e) => {
                          setDraggingId(item.id);
                          e.dataTransfer.effectAllowed = "move";
                          e.dataTransfer.setData("text/plain", item.id);
                        }}
                        onDragEnd={() => setDraggingId(null)}
                        onDragOver={(e) => {
                          e.preventDefault();
                          e.dataTransfer.dropEffect = "move";
                        }}
                        onDrop={(e) => {
                          e.preventDefault();
                          const fromId =
                            e.dataTransfer.getData("text/plain") || draggingId;
                          if (!fromId) return;
                          const fromIndex = items.findIndex((it) => it.id === fromId);
                          if (fromIndex < 0) return;
                          setItems((prev) => arrayMove(prev, fromIndex, index));
                          setDraggingId(null);
                        }}
                        className={[
                          "group flex items-center justify-between gap-3 rounded-xl border px-4 py-3 transition-all",
                          draggingId === item.id
                            ? "border-[hsl(220,85%,55%)] bg-[hsl(220,85%,55%)]/5"
                            : "border-[hsl(210,15%,90%)] hover:bg-[hsl(210,15%,95%)]",
                          isMerging ? "opacity-60" : "",
                        ].join(" ")}
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 flex-none items-center justify-center rounded-lg bg-[hsl(220,85%,55%)] text-xs font-bold text-white">
                              {index + 1}
                            </div>
                            <div className="min-w-0">
                              <div className="truncate text-sm font-medium text-[hsl(215,25%,15%)]">
                                {item.file.name}
                              </div>
                              <div className="text-xs text-[hsl(215,15%,45%)]">
                                {formatBytes(item.file.size)}
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-none items-center gap-2">
                          <div className="hidden text-xs text-[hsl(215,15%,45%)] sm:block">
                            Drag
                          </div>
                          <button
                            type="button"
                            disabled={isMerging}
                            onClick={() =>
                              setItems((prev) => prev.filter((p) => p.id !== item.id))
                            }
                            className="rounded-full px-3 py-1 text-sm font-medium text-[hsl(215,15%,45%)] hover:bg-[hsl(210,15%,95%)] hover:text-[hsl(215,25%,15%)] disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
                          >
                            Remove
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            <div className="mt-4 flex items-center justify-center gap-2 text-sm text-[hsl(215,15%,45%)] bg-[hsl(210,15%,95%)]/50 rounded-full px-4 py-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <span>Your files never leave your browser</span>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

