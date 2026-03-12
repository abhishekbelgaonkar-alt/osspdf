"use client";

import JSZip from "jszip";
import { PDFDocument } from "pdf-lib";
import { useId, useMemo, useRef, useState } from "react";

type SplitMode = "range" | "single-pages";

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

type Range = { start: number; end: number };

function parseRanges(input: string): { ranges: Range[]; error: string | null } {
  const lines = input
    .split(/\r?\n/g)
    .map((l) => l.trim())
    .filter(Boolean);

  if (lines.length === 0) {
    return { ranges: [], error: "Add at least one range (e.g. 1-3)." };
  }

  const ranges: Range[] = [];

  for (const line of lines) {
    const m = line.match(/^(\d+)\s*-\s*(\d+)$/);
    if (!m) {
      return {
        ranges: [],
        error: `Invalid range "${line}". Use the format "start-end" (e.g. 4-6).`,
      };
    }

    const start = Number(m[1]);
    const end = Number(m[2]);
    if (!Number.isInteger(start) || !Number.isInteger(end) || start < 1 || end < 1) {
      return { ranges: [], error: `Invalid range "${line}". Pages start at 1.` };
    }
    if (start > end) {
      return { ranges: [], error: `Invalid range "${line}". Start must be ≤ end.` };
    }

    ranges.push({ start, end });
  }

  return { ranges, error: null };
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

async function splitByRanges(opts: {
  srcBytes: ArrayBuffer;
  ranges: Range[];
  originalName: string;
  pageCount: number;
}): Promise<{ kind: "pdf"; bytes: Uint8Array; filename: string } | { kind: "zip"; bytes: Uint8Array; filename: string }> {
  const src = await PDFDocument.load(opts.srcBytes);

  const validated: Range[] = [];
  for (const r of opts.ranges) {
    if (r.end > opts.pageCount) {
      throw new Error(
        `Range ${r.start}-${r.end} exceeds this PDF's page count (${opts.pageCount}).`,
      );
    }
    validated.push(r);
  }

  const baseName = opts.originalName.replace(/\.pdf$/i, "") || "split";

  if (validated.length === 1) {
    const r = validated[0];
    const out = await PDFDocument.create();
    const pageIndices = Array.from(
      { length: r.end - r.start + 1 },
      (_, i) => r.start - 1 + i,
    );
    const pages = await out.copyPages(src, pageIndices);
    pages.forEach((p) => out.addPage(p));
    const bytes = await out.save();
    return {
      kind: "pdf",
      bytes,
      filename: `${baseName}_${r.start}-${r.end}.pdf`,
    };
  }

  const zip = new JSZip();
  for (const r of validated) {
    const out = await PDFDocument.create();
    const pageIndices = Array.from(
      { length: r.end - r.start + 1 },
      (_, i) => r.start - 1 + i,
    );
    const pages = await out.copyPages(src, pageIndices);
    pages.forEach((p) => out.addPage(p));
    const bytes = await out.save();
    zip.file(`${baseName}_${r.start}-${r.end}.pdf`, bytes);
  }

  const zipBytes = await zip.generateAsync({ type: "uint8array" });
  return { kind: "zip", bytes: zipBytes, filename: `${baseName}_ranges.zip` };
}

async function extractSinglePagesZip(opts: {
  srcBytes: ArrayBuffer;
  originalName: string;
  pageCount: number;
}): Promise<{ bytes: Uint8Array; filename: string }> {
  const src = await PDFDocument.load(opts.srcBytes);
  const zip = new JSZip();
  const baseName = opts.originalName.replace(/\.pdf$/i, "") || "pages";

  for (let i = 0; i < opts.pageCount; i += 1) {
    const out = await PDFDocument.create();
    const [page] = await out.copyPages(src, [i]);
    out.addPage(page);
    const bytes = await out.save();
    zip.file(`${baseName}_page-${pad3(i + 1)}.pdf`, bytes);
  }

  const zipBytes = await zip.generateAsync({ type: "uint8array" });
  return { bytes: zipBytes, filename: `${baseName}_pages.zip` };
}

export default function SplitPage() {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement | null>(null);

  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState<number | null>(null);
  const [mode, setMode] = useState<SplitMode>("range");
  const [rangesText, setRangesText] = useState("1-1");
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [isSplitting, setIsSplitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const parsed = useMemo(() => parseRanges(rangesText), [rangesText]);

  const canSplit =
    !!file &&
    pageCount !== null &&
    !isSplitting &&
    (mode === "single-pages" || (parsed.error === null && parsed.ranges.length > 0));

  async function setPdfFile(next: File) {
    if (!isPdfFile(next)) {
      setError("Please choose a PDF file.");
      return;
    }
    setError(null);
    setIsSplitting(false);
    setFile(next);
    setPageCount(null);

    try {
      const bytes = await next.arrayBuffer();
      const doc = await PDFDocument.load(bytes);
      setPageCount(doc.getPageCount());
      setRangesText(`1-${doc.getPageCount()}`);
    } catch (e) {
      setFile(null);
      setPageCount(null);
      setError(
        e instanceof Error ? e.message : "Could not read that PDF. Try another file.",
      );
    }
  }

  async function onSplit() {
    if (!file || pageCount === null) return;
    setError(null);
    setIsSplitting(true);
    try {
      const srcBytes = await file.arrayBuffer();

      if (mode === "single-pages") {
        const { bytes, filename } = await extractSinglePagesZip({
          srcBytes,
          originalName: file.name,
          pageCount,
        });
        const blob = new Blob([Uint8Array.from(bytes)], { type: "application/zip" });
        downloadBlob(blob, filename);
        return;
      }

      if (parsed.error) throw new Error(parsed.error);
      const result = await splitByRanges({
        srcBytes,
        ranges: parsed.ranges,
        originalName: file.name,
        pageCount,
      });

      if (result.kind === "pdf") {
        const blob = new Blob([Uint8Array.from(result.bytes)], {
          type: "application/pdf",
        });
        downloadBlob(blob, result.filename);
      } else {
        const blob = new Blob([Uint8Array.from(result.bytes)], {
          type: "application/zip",
        });
        downloadBlob(blob, result.filename);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to split PDF.");
    } finally {
      setIsSplitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-[hsl(210,20%,98%)]">
      <div className="mx-auto w-full max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-3">
          <h1 className="text-balance text-4xl font-bold tracking-tight text-[hsl(215,25%,15%)]">
            Split PDF
          </h1>
          <p className="max-w-2xl text-pretty text-base leading-7 text-[hsl(215,15%,45%)]">
            Upload one PDF, choose how to split it, and download instantly — no uploads.
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
                    setPageCount(null);
                    setError(null);
                  }}
                  disabled={!file || isSplitting}
                  className="text-sm font-medium text-zinc-600 hover:text-zinc-900 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Clear
                </button>

                <button
                  type="button"
                  onClick={onSplit}
                  disabled={!canSplit}
                  className="inline-flex items-center justify-center rounded-full bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none focus-visible:ring-4 focus-visible:ring-zinc-900/20"
                >
                  {isSplitting ? "Splitting…" : "Split PDF"}
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
                <div className="text-sm font-semibold">Split options</div>
                <div className="text-xs text-zinc-600">
                  Choose a mode, then download instantly.
                </div>
              </div>

              <div className="p-5">
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="flex cursor-pointer gap-3 rounded-xl border border-zinc-200 p-4 hover:bg-zinc-50">
                    <input
                      type="radio"
                      name="mode"
                      className="mt-1"
                      checked={mode === "range"}
                      onChange={() => setMode("range")}
                    />
                    <div>
                      <div className="text-sm font-semibold">By range</div>
                      <div className="text-xs text-zinc-600">
                        Create separate PDFs for each range (one per line).
                      </div>
                    </div>
                  </label>

                  <label className="flex cursor-pointer gap-3 rounded-xl border border-zinc-200 p-4 hover:bg-zinc-50">
                    <input
                      type="radio"
                      name="mode"
                      className="mt-1"
                      checked={mode === "single-pages"}
                      onChange={() => setMode("single-pages")}
                    />
                    <div>
                      <div className="text-sm font-semibold">Extract single pages</div>
                      <div className="text-xs text-zinc-600">
                        Every page becomes its own PDF (downloaded as a zip).
                      </div>
                    </div>
                  </label>
                </div>

                {mode === "range" ? (
                  <div className="mt-5">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="text-sm font-semibold">Ranges</div>
                        <div className="text-xs text-zinc-600">
                          One per line, like{" "}
                          <span className="font-mono text-zinc-800">1-3</span>
                          .
                        </div>
                      </div>
                      <button
                        type="button"
                        disabled={pageCount === null || isSplitting}
                        onClick={() => {
                          if (pageCount !== null) setRangesText(`1-${pageCount}`);
                        }}
                        className="text-sm font-medium text-zinc-600 hover:text-zinc-900 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        Full document
                      </button>
                    </div>

                    <textarea
                      value={rangesText}
                      onChange={(e) => setRangesText(e.target.value)}
                      rows={5}
                      spellCheck={false}
                      className="mt-3 w-full resize-y rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm outline-none focus:border-zinc-900 focus:ring-4 focus:ring-zinc-900/10"
                      placeholder={"1-3\n4-6"}
                    />

                    {parsed.error ? (
                      <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                        {parsed.error}
                      </div>
                    ) : (
                      <div className="mt-3 text-xs text-zinc-600">
                        Output:{" "}
                        <span className="font-medium text-zinc-900">
                          {parsed.ranges.length}
                        </span>{" "}
                        file{parsed.ranges.length === 1 ? "" : "s"}
                        {parsed.ranges.length > 1 ? " (zipped)" : ""}.
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="mt-5 rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-4 text-sm text-zinc-700">
                    This will create{" "}
                    <span className="font-semibold text-zinc-900">
                      {pageCount ?? "—"}
                    </span>{" "}
                    PDFs (one per page) and download a zip.
                  </div>
                )}
              </div>
            </div>

            <div className="mt-3 text-xs text-zinc-500">
              Tip: Very large PDFs may take a bit longer to process, but everything stays on your device.
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

