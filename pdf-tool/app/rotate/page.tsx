"use client";

import JSZip from "jszip";
import { PDFDocument, degrees } from "pdf-lib";
import type { PDFDocumentProxy } from "pdfjs-dist/types/src/display/api";
import { useEffect, useId, useMemo, useRef, useState } from "react";

type PageRotation = 0 | 90 | 180 | 270;

type PageItem = {
  id: string;
  pageNumber: number;
  rotation: PageRotation;
  thumbnail: string;
};

type DragState = {
  draggingId: string | null;
};

function isPdfFile(file: File) {
  return (
    file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")
  );
}

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

export default function RotatePage() {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const pdfjsRef = useRef<null | typeof import("pdfjs-dist/legacy/build/pdf")>(null);

  const [file, setFile] = useState<File | null>(null);
  const [pdf, setPdf] = useState<PDFDocumentProxy | null>(null);
  const [pages, setPages] = useState<PageItem[]>([]);
  const [pageCount, setPageCount] = useState<number | null>(null);

  const [drag, setDrag] = useState<DragState>({ draggingId: null });
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSave = !!file && !!pdf && pages.length > 0 && !isSaving;

  const baseName = useMemo(() => {
    const n = file?.name ?? "document.pdf";
    return n.replace(/\.pdf$/i, "") || "document";
  }, [file?.name]);

  async function ensurePdfJs() {
    if (pdfjsRef.current) return pdfjsRef.current;
    const mod = await import("pdfjs-dist/legacy/build/pdf");
    mod.GlobalWorkerOptions.workerSrc =
      "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
    pdfjsRef.current = mod;
    return mod;
  }

  async function setPdfFile(next: File) {
    if (!isPdfFile(next)) {
      setError("Please choose a PDF file.");
      return;
    }

    setError(null);
    setIsLoading(true);
    setIsSaving(false);
    setPages([]);
    setPageCount(null);
    setPdf(null);
    setFile(next);

    try {
      const pdfjsLib = await ensurePdfJs();
      const bytes = await next.arrayBuffer();
      const loadingTask = pdfjsLib.getDocument({ data: bytes });
      const doc: PDFDocumentProxy = await loadingTask.promise;
      setPdf(doc);
      setPageCount(doc.numPages);
    } catch (e) {
      setFile(null);
      setPdf(null);
      setPages([]);
      setPageCount(null);
      setError(
        e instanceof Error
          ? e.message
          : "Could not read that PDF. Try another file.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    let cancelled = false;

    async function renderThumbnails(doc: PDFDocumentProxy) {
      const thumbScale = 0.4;
      const items: PageItem[] = [];

      for (let pageNumber = 1; pageNumber <= doc.numPages; pageNumber += 1) {
        if (cancelled) return;
        const page = await doc.getPage(pageNumber);
        const viewport = page.getViewport({ scale: thumbScale });

        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d", { alpha: false });
        if (!ctx) throw new Error("Canvas is not supported in this browser.");

        canvas.width = Math.max(1, Math.floor(viewport.width));
        canvas.height = Math.max(1, Math.floor(viewport.height));

        await page.render({ canvasContext: ctx, viewport }).promise;
        const dataUrl = canvas.toDataURL("image/png");
        items.push({
          id: crypto.randomUUID(),
          pageNumber,
          rotation: 0,
          thumbnail: dataUrl,
        });
      }

      if (!cancelled) setPages(items);
    }

    if (!pdf) return;
    setPages([]);
    setError(null);

    void renderThumbnails(pdf).catch((e) => {
      if (cancelled) return;
      setError(
        e instanceof Error ? e.message : "Failed to render thumbnails.",
      );
    });

    return () => {
      cancelled = true;
    };
  }, [pdf]);

  function rotatePage(id: string, delta: number) {
    setPages((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p;
        const next = (((p.rotation + delta + 360) % 360) as PageRotation);
        return { ...p, rotation: next };
      }),
    );
  }

  async function onSave() {
    if (!file || !pages.length) return;
    setError(null);
    setIsSaving(true);
    try {
      const srcBytes = await file.arrayBuffer();
      const srcDoc = await PDFDocument.load(srcBytes);
      const out = await PDFDocument.create();

      for (const item of pages) {
        const [copied] = await out.copyPages(srcDoc, [item.pageNumber - 1]);
        if (item.rotation !== 0) {
          copied.setRotation(degrees(item.rotation));
        }
        out.addPage(copied);
      }

      const bytes = await out.save();
      const safeBytes = Uint8Array.from(bytes);
      const blob = new Blob([safeBytes], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${baseName}_rotated.pdf`;
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

  return (
    <div className="min-h-screen bg-[hsl(210,20%,98%)]">
      <div className="mx-auto w-full max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-3">
          <h1 className="text-balance text-4xl font-bold tracking-tight text-[hsl(215,25%,15%)]">
            Rotate & Reorder Pages
          </h1>
          <p className="max-w-2xl text-pretty text-base leading-7 text-[hsl(215,15%,45%)]">
            Rotate individual pages and drag to reorder them, then save a new PDF —
            all locally in your browser.
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
                  const f = e.dataTransfer?.files?.[0];
                  if (f) void setPdfFile(f);
                }}
                className="flex flex-col items-center justify-center rounded-xl border border-dashed border-zinc-300 bg-zinc-50 px-5 py-10 text-center"
              >
                <div className="text-sm font-medium">Drag & drop a PDF here</div>
                <div className="mt-1 text-sm text-zinc-600">or click to choose</div>

                <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => inputRef.current?.click()}
                    className="inline-flex items-center justify-center rounded-full bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-zinc-800 focus:outline-none focus-visible:ring-4 focus-visible:ring-zinc-900/20"
                  >
                    Choose PDF
                  </button>
                  <div className="text-xs text-zinc-500">Single file</div>
                </div>

                <input
                  id={inputId}
                  ref={inputRef}
                  type="file"
                  accept="application/pdf,.pdf"
                  className="sr-only"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) void setPdfFile(f);
                    e.target.value = "";
                  }}
                />
              </div>

              <div className="mt-4 space-y-2">
                <div className="text-sm text-zinc-600">
                  <span className="font-medium text-zinc-900">
                    {file ? file.name : "No file selected"}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3 text-sm text-zinc-600">
                  <div>
                    Size:{" "}
                    <span className="font-medium text-zinc-900">
                      {file ? formatBytes(file.size) : "—"}
                    </span>
                  </div>
                  <div>
                    Pages:{" "}
                    <span className="font-medium text-zinc-900">
                      {pageCount ?? (file ? "…" : "—")}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setFile(null);
                    setPdf(null);
                    setPages([]);
                    setPageCount(null);
                    setError(null);
                  }}
                  disabled={!file || isSaving}
                  className="text-sm font-medium text-zinc-600 hover:text-zinc-900 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Clear
                </button>

                <button
                  type="button"
                  onClick={onSave}
                  disabled={!canSave}
                  className="inline-flex items-center justify-center rounded-full bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none focus-visible:ring-4 focus-visible:ring-zinc-900/20"
                >
                  {isSaving ? "Saving…" : "Save PDF"}
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
            <div className="rounded-2xl border border-zinc-200 bg-white shadow-sm">
              <div className="border-b border-zinc-200 px-5 py-4">
                <div className="text-sm font-semibold">Pages</div>
                <div className="text-xs text-zinc-600">
                  Drag to reorder, rotate with the buttons.
                </div>
              </div>

              <div className="p-4">
                {!file ? (
                  <div className="py-10 text-center text-sm text-zinc-600">
                    Upload a PDF to see its pages.
                  </div>
                ) : pages.length === 0 ? (
                  <div className="py-10 text-center text-sm text-zinc-600">
                    {isLoading ? "Loading PDF…" : "Rendering pages…"}
                  </div>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2">
                    {pages.map((item, index) => (
                      <div
                        key={item.id}
                        draggable={!isSaving}
                        onDragStart={(e) => {
                          setDrag({ draggingId: item.id });
                          e.dataTransfer.effectAllowed = "move";
                          e.dataTransfer.setData("text/plain", item.id);
                        }}
                        onDragEnd={() => setDrag({ draggingId: null })}
                        onDragOver={(e) => {
                          e.preventDefault();
                          e.dataTransfer.dropEffect = "move";
                        }}
                        onDrop={(e) => {
                          e.preventDefault();
                          const fromId =
                            e.dataTransfer.getData("text/plain") || drag.draggingId;
                          if (!fromId) return;
                          const fromIndex = pages.findIndex(
                            (p) => p.id === fromId,
                          );
                          if (fromIndex < 0) return;
                          setPages((prev) => arrayMove(prev, fromIndex, index));
                          setDrag({ draggingId: null });
                        }}
                        className={[
                          "group flex flex-col rounded-2xl border bg-white transition-colors",
                          drag.draggingId === item.id
                            ? "border-zinc-900 bg-zinc-50"
                            : "border-zinc-200 hover:bg-zinc-50",
                        ].join(" ")}
                      >
                        <div className="flex items-center justify-between border-b border-zinc-200 px-3 py-2">
                          <div className="flex items-center gap-2 text-xs font-semibold text-zinc-800">
                            <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-zinc-900 text-[11px] text-white">
                              {index + 1}
                            </span>
                            <span>Page {item.pageNumber}</span>
                          </div>
                          <div className="flex items-center gap-1 text-[11px] text-zinc-500">
                            <span>Drag</span>
                          </div>
                        </div>

                        <div className="flex flex-1 flex-col gap-2 p-3">
                          <div className="relative overflow-hidden rounded-xl border border-zinc-200 bg-zinc-100">
                            <div
                              className="origin-center"
                              style={{
                                transform: `rotate(${item.rotation}deg)`,
                                transition: "transform 150ms ease-out",
                              }}
                            >
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={item.thumbnail}
                                alt={`Page ${item.pageNumber} thumbnail`}
                                className="h-auto w-full"
                              />
                            </div>
                          </div>

                          <div className="flex items-center justify-between gap-2">
                            <div className="inline-flex items-center gap-2">
                              <button
                                type="button"
                                disabled={isSaving}
                                onClick={() => rotatePage(item.id, -90)}
                                className="rounded-full bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                ⟲ 90°
                              </button>
                              <button
                                type="button"
                                disabled={isSaving}
                                onClick={() => rotatePage(item.id, 90)}
                                className="rounded-full bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                ⟳ 90°
                              </button>
                            </div>
                            <div className="text-[11px] text-zinc-500">
                              Rotation: {item.rotation}°
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="mt-3 text-xs text-zinc-500">
              Tip: Very large PDFs may take a bit longer to process, but everything
              stays on your device.
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

