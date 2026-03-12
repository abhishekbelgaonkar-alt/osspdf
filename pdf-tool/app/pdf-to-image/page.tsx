"use client";

import JSZip from "jszip";
import type { PDFDocumentProxy } from "pdfjs-dist/types/src/display/api";
import { useEffect, useId, useMemo, useRef, useState } from "react";

type OutputFormat = "png" | "jpg";
type OutputQuality = "low" | "medium" | "high";

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

function pad3(n: number) {
  return String(n).padStart(3, "0");
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function getRenderScale(q: OutputQuality) {
  switch (q) {
    case "low":
      return 1.0;
    case "medium":
      return 1.5;
    case "high":
      return 2.0;
  }
}

function getJpegQuality(q: OutputQuality) {
  switch (q) {
    case "low":
      return 0.6;
    case "medium":
      return 0.8;
    case "high":
      return 0.92;
  }
}

async function canvasToBlob(
  canvas: HTMLCanvasElement,
  format: OutputFormat,
  quality: OutputQuality,
): Promise<Blob> {
  const mime = format === "png" ? "image/png" : "image/jpeg";
  const q = format === "jpg" ? getJpegQuality(quality) : undefined;

  return await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) reject(new Error("Failed to export image."));
        else resolve(blob);
      },
      mime,
      q,
    );
  });
}

type PreviewItem = { pageNumber: number; dataUrl: string };

export default function PdfToImagePage() {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const pdfjsRef = useRef<null | typeof import("pdfjs-dist")>(null);

  const [file, setFile] = useState<File | null>(null);
  const [pdf, setPdf] = useState<PDFDocumentProxy | null>(null);
  const [pageCount, setPageCount] = useState<number | null>(null);
  const [previews, setPreviews] = useState<PreviewItem[]>([]);

  const [format, setFormat] = useState<OutputFormat>("png");
  const [quality, setQuality] = useState<OutputQuality>("medium");

  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isZipping, setIsZipping] = useState(false);
  const [progress, setProgress] = useState<{ current: number; total: number } | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);

  const canDownloadZip =
    !!file && !!pdf && pageCount !== null && previews.length > 0 && !isZipping;

  const baseName = useMemo(() => {
    const n = file?.name ?? "document.pdf";
    return n.replace(/\.pdf$/i, "") || "document";
  }, [file?.name]);

  async function setPdfFile(next: File) {
    if (!isPdfFile(next)) {
      setError("Please choose a PDF file.");
      return;
    }

    setError(null);
    setIsLoading(true);
    setIsZipping(false);
    setProgress(null);
    setFile(next);
    setPdf(null);
    setPageCount(null);
    setPreviews([]);

    try {
      const pdfjsLib =
        pdfjsRef.current ??
        (pdfjsRef.current = await import("pdfjs-dist/legacy/build/pdf"));
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;

      const bytes = await next.arrayBuffer();
      const loadingTask = pdfjsLib.getDocument({ data: bytes });
      const doc = await loadingTask.promise;
      setPdf(doc);
      setPageCount(doc.numPages);
    } catch (e) {
      setFile(null);
      setPdf(null);
      setPageCount(null);
      setPreviews([]);
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

    async function renderPreviews(doc: PDFDocumentProxy) {
      const previewScale = 0.6;
      const nextPreviews: PreviewItem[] = [];

      for (let pageNumber = 1; pageNumber <= doc.numPages; pageNumber += 1) {
        if (cancelled) return;
        const page = await doc.getPage(pageNumber);
        const viewport = page.getViewport({ scale: previewScale });

        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d", { alpha: false });
        if (!ctx) throw new Error("Canvas is not supported in this browser.");

        canvas.width = Math.max(1, Math.floor(viewport.width));
        canvas.height = Math.max(1, Math.floor(viewport.height));

        await page.render({ canvasContext: ctx, viewport }).promise;
        const dataUrl = canvas.toDataURL("image/png");
        nextPreviews.push({ pageNumber, dataUrl });
        setPreviews([...nextPreviews]);
      }
    }

    if (!pdf) return;
    setPreviews([]);
    setError(null);

    void renderPreviews(pdf).catch((e) => {
      if (cancelled) return;
      setError(e instanceof Error ? e.message : "Failed to render previews.");
    });

    return () => {
      cancelled = true;
    };
  }, [pdf]);

  async function onDownloadZip() {
    if (!pdf || pageCount === null) return;
    setError(null);
    setIsZipping(true);
    setProgress({ current: 0, total: pageCount });

    try {
      const zip = new JSZip();
      const scale = getRenderScale(quality);

      for (let pageNumber = 1; pageNumber <= pageCount; pageNumber += 1) {
        setProgress({ current: pageNumber - 1, total: pageCount });
        const page = await pdf.getPage(pageNumber);
        const viewport = page.getViewport({ scale });

        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d", { alpha: format === "png" });
        if (!ctx) throw new Error("Canvas is not supported in this browser.");

        canvas.width = Math.max(1, Math.floor(viewport.width));
        canvas.height = Math.max(1, Math.floor(viewport.height));

        await page.render({ canvasContext: ctx, viewport }).promise;

        const blob = await canvasToBlob(canvas, format, quality);
        const ext = format === "png" ? "png" : "jpg";
        zip.file(`${baseName}_page-${pad3(pageNumber)}.${ext}`, blob);
      }

      setProgress({ current: pageCount, total: pageCount });
      const zipBytes = await zip.generateAsync({ type: "uint8array" });
      const zipBlob = new Blob([Uint8Array.from(zipBytes)], { type: "application/zip" });
      downloadBlob(zipBlob, `${baseName}_images.zip`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to export images.");
    } finally {
      setIsZipping(false);
      setProgress(null);
    }
  }

  return (
    <div className="min-h-screen bg-[hsl(210,20%,98%)]">
      <div className="mx-auto w-full max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-3">
          <h1 className="text-balance text-4xl font-bold tracking-tight text-[hsl(215,25%,15%)]">
            PDF to Image
          </h1>
          <p className="max-w-2xl text-pretty text-base leading-7 text-[hsl(215,15%,45%)]">
            Render each page as an image and download them all as a zip — no uploads.
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

              <div className="mt-5 rounded-2xl border border-zinc-200 p-4">
                <div className="text-sm font-semibold">Export settings</div>

                <div className="mt-3 grid gap-3">
                  <div className="grid grid-cols-2 gap-3">
                    <label className="text-sm">
                      <div className="mb-1 text-xs font-medium text-zinc-600">
                        Format
                      </div>
                      <select
                        value={format}
                        onChange={(e) => setFormat(e.target.value as OutputFormat)}
                        className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm shadow-sm outline-none focus:border-zinc-900 focus:ring-4 focus:ring-zinc-900/10"
                      >
                        <option value="png">PNG</option>
                        <option value="jpg">JPG</option>
                      </select>
                    </label>

                    <label className="text-sm">
                      <div className="mb-1 text-xs font-medium text-zinc-600">
                        Quality
                      </div>
                      <select
                        value={quality}
                        onChange={(e) => setQuality(e.target.value as OutputQuality)}
                        className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm shadow-sm outline-none focus:border-zinc-900 focus:ring-4 focus:ring-zinc-900/10"
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                      </select>
                    </label>
                  </div>

                  <div className="text-xs text-zinc-600">
                    {format === "png"
                      ? "PNG is lossless; “Quality” controls render resolution."
                      : "JPG “Quality” controls compression; higher = larger files."}
                  </div>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setFile(null);
                    setPdf(null);
                    setPageCount(null);
                    setPreviews([]);
                    setError(null);
                    setProgress(null);
                  }}
                  disabled={!file || isLoading || isZipping}
                  className="text-sm font-medium text-zinc-600 hover:text-zinc-900 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Clear
                </button>

                <button
                  type="button"
                  onClick={onDownloadZip}
                  disabled={!canDownloadZip}
                  className="inline-flex items-center justify-center rounded-full bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none focus-visible:ring-4 focus-visible:ring-zinc-900/20"
                >
                  {isLoading ? "Loading…" : isZipping ? "Preparing zip…" : "Download zip"}
                </button>
              </div>

              {progress ? (
                <div className="mt-4 rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-700">
                  Exporting page{" "}
                  <span className="font-semibold text-zinc-900">
                    {Math.min(progress.current + 1, progress.total)}
                  </span>{" "}
                  of{" "}
                  <span className="font-semibold text-zinc-900">
                    {progress.total}
                  </span>
                  …
                </div>
              ) : null}

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
                <div className="text-sm font-semibold">Preview</div>
                <div className="text-xs text-zinc-600">
                  Pages rendered in-browser (small preview scale).
                </div>
              </div>

              <div className="p-5">
                {!file ? (
                  <div className="py-10 text-center text-sm text-zinc-600">
                    Upload a PDF to preview pages.
                  </div>
                ) : previews.length === 0 ? (
                  <div className="py-10 text-center text-sm text-zinc-600">
                    {isLoading ? "Loading PDF…" : "Rendering previews…"}
                  </div>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2">
                    {previews.map((p) => (
                      <div
                        key={p.pageNumber}
                        className="overflow-hidden rounded-2xl border border-zinc-200 bg-white"
                      >
                        <div className="flex items-center justify-between border-b border-zinc-200 px-3 py-2">
                          <div className="text-xs font-semibold text-zinc-800">
                            Page {p.pageNumber}
                          </div>
                          <div className="text-[11px] text-zinc-500">Preview</div>
                        </div>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={p.dataUrl}
                          alt={`Page ${p.pageNumber} preview`}
                          className="h-auto w-full bg-zinc-50"
                          loading="lazy"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="mt-3 text-xs text-zinc-500">
              Tip: For very large PDFs, consider “Low” quality for faster export.
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

