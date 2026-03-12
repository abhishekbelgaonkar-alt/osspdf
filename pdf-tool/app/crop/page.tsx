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

async function cropPdfMargins(
  file: File,
  margins: { top: number; right: number; bottom: number; left: number }
): Promise<Uint8Array> {
  const srcBytes = await file.arrayBuffer();
  const pdfDoc = await PDFDocument.load(srcBytes);
  const pages = pdfDoc.getPages();

  for (const page of pages) {
    const { width, height } = page.getSize();

    // Calculate crop box dimensions
    const cropX = margins.left;
    const cropY = margins.bottom;
    const cropWidth = width - margins.left - margins.right;
    const cropHeight = height - margins.top - margins.bottom;

    // Ensure crop dimensions are positive
    if (cropWidth > 0 && cropHeight > 0) {
      page.setCropBox(cropX, cropY, cropWidth, cropHeight);
    }
  }

  return pdfDoc.save();
}

export default function CropPage() {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement | null>(null);

  const [file, setFile] = useState<File | null>(null);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [isCropping, setIsCropping] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Margin settings
  const [margins, setMargins] = useState({
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  });
  const [uniformMargin, setUniformMargin] = useState(0);

  const canCrop = file && !isCropping;

  function addFile(fileList: FileList | File[]) {
    const arr = Array.from(fileList);
    const pdf = arr.find(isPdfFile);

    if (!pdf) {
      setError("Please choose a PDF file.");
      return;
    }

    setError(null);
    setFile(pdf);
  }

  function applyUniformMargin() {
    const value = uniformMargin;
    setMargins({
      top: value,
      right: value,
      bottom: value,
      left: value,
    });
  }

  async function onCrop() {
    if (!file) return;

    setError(null);
    setIsCropping(true);
    try {
      const croppedBytes = await cropPdfMargins(file, margins);
      const safeBytes = Uint8Array.from(croppedBytes);
      const blob = new Blob([safeBytes], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `cropped-${file.name}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to crop PDF.");
    } finally {
      setIsCropping(false);
    }
  }

  return (
    <div className="min-h-screen bg-[hsl(210,20%,98%)]">
      <div className="mx-auto w-full max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-3">
          <h1 className="text-balance text-4xl font-bold tracking-tight text-[hsl(215,25%,15%)]">
            Crop PDF Margins
          </h1>
          <p className="max-w-2xl text-pretty text-base leading-7 text-[hsl(215,15%,45%)]">
            Trim margins from every page in your PDF by setting crop boundaries — no uploads, no server.
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
                  if (e.dataTransfer?.files?.length) addFile(e.dataTransfer.files);
                }}
                className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-[hsl(210,15%,90%)] bg-[hsl(210,15%,95%)] px-5 py-10 text-center"
              >
                <div className="w-12 h-12 rounded-lg bg-[hsl(220,85%,55%)]/10 flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-[hsl(220,85%,55%)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>
                <div className="text-sm font-medium text-[hsl(215,25%,15%)]">
                  Drag & drop PDF here
                </div>
                <div className="mt-1 text-sm text-[hsl(215,15%,45%)]">
                  or click to choose file
                </div>

                <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => inputRef.current?.click()}
                    className="inline-flex items-center justify-center h-11 rounded-full bg-[hsl(220,85%,55%)] px-6 text-sm font-semibold text-white shadow-sm hover:bg-[hsl(220,85%,55%)]/90 hover:shadow-lg focus:outline-none focus-visible:ring-4 focus-visible:ring-[hsl(220,85%,55%)]/20 transition-all"
                  >
                    Choose PDF
                  </button>
                </div>

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

              {file && (
                <div className="mt-4 rounded-xl border border-[hsl(210,15%,90%)] bg-[hsl(210,15%,95%)] p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 flex-none items-center justify-center rounded-lg bg-[hsl(220,85%,55%)]/10 text-[hsl(220,85%,55%)]">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium text-[hsl(215,25%,15%)]">
                        {file.name}
                      </div>
                      <div className="text-xs text-[hsl(215,15%,45%)]">
                        {formatBytes(file.size)}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-4 flex items-center justify-between gap-3">
                <div className="text-sm text-[hsl(215,15%,45%)]">
                  {file ? "1 file selected" : "No file selected"}
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setFile(null);
                    setError(null);
                  }}
                  disabled={!file || isCropping}
                  className="text-sm font-medium text-[hsl(215,15%,45%)] hover:text-[hsl(215,25%,15%)] disabled:cursor-not-allowed disabled:opacity-40 transition-colors"
                >
                  Clear
                </button>
              </div>

              <div className="mt-4">
                <button
                  type="button"
                  onClick={onCrop}
                  disabled={!canCrop}
                  className="w-full inline-flex items-center justify-center h-11 rounded-full bg-[hsl(220,85%,55%)] px-6 text-sm font-semibold text-white shadow-sm hover:bg-[hsl(220,85%,55%)]/90 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none focus-visible:ring-4 focus-visible:ring-[hsl(220,85%,55%)]/20 transition-all"
                >
                  {isCropping ? "Cropping PDF…" : "Crop PDF"}
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
              <div className="border-b border-[hsl(210,15%,90%)] px-5 py-4">
                <div className="text-sm font-semibold text-[hsl(215,25%,15%)]">Margin Settings</div>
                <div className="text-xs text-[hsl(215,15%,45%)]">
                  1 inch = 72 points. Values are trimmed from each edge inward.
                </div>
              </div>

              <div className="p-5 space-y-6">
                {/* Uniform margin shortcut */}
                <div>
                  <label className="block text-sm font-medium text-[hsl(215,25%,15%)] mb-2">
                    Apply uniform margin
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      min="0"
                      max="200"
                      value={uniformMargin}
                      onChange={(e) => setUniformMargin(Number(e.target.value))}
                      className="flex-1 rounded-lg border border-[hsl(210,15%,90%)] px-3 py-2 text-sm focus:border-[hsl(220,85%,55%)] focus:outline-none focus:ring-4 focus:ring-[hsl(220,85%,55%)]/20"
                      placeholder="0"
                    />
                    <button
                      type="button"
                      onClick={applyUniformMargin}
                      className="rounded-lg border border-[hsl(210,15%,90%)] px-4 py-2 text-sm font-medium text-[hsl(215,25%,15%)] hover:bg-[hsl(210,15%,95%)] focus:outline-none focus:ring-4 focus:ring-[hsl(220,85%,55%)]/20 transition-colors"
                    >
                      Apply
                    </button>
                  </div>
                  <div className="mt-1 text-xs text-[hsl(215,15%,45%)]">
                    Sets all four margins to the same value
                  </div>
                </div>

                {/* Individual margin controls */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[hsl(215,25%,15%)] mb-1">
                      Top
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="200"
                      value={margins.top}
                      onChange={(e) => setMargins(prev => ({ ...prev, top: Number(e.target.value) }))}
                      className="w-full rounded-lg border border-[hsl(210,15%,90%)] px-3 py-2 text-sm focus:border-[hsl(220,85%,55%)] focus:outline-none focus:ring-4 focus:ring-[hsl(220,85%,55%)]/20"
                      placeholder="0"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[hsl(215,25%,15%)] mb-1">
                      Right
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="200"
                      value={margins.right}
                      onChange={(e) => setMargins(prev => ({ ...prev, right: Number(e.target.value) }))}
                      className="w-full rounded-lg border border-[hsl(210,15%,90%)] px-3 py-2 text-sm focus:border-[hsl(220,85%,55%)] focus:outline-none focus:ring-4 focus:ring-[hsl(220,85%,55%)]/20"
                      placeholder="0"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[hsl(215,25%,15%)] mb-1">
                      Bottom
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="200"
                      value={margins.bottom}
                      onChange={(e) => setMargins(prev => ({ ...prev, bottom: Number(e.target.value) }))}
                      className="w-full rounded-lg border border-[hsl(210,15%,90%)] px-3 py-2 text-sm focus:border-[hsl(220,85%,55%)] focus:outline-none focus:ring-4 focus:ring-[hsl(220,85%,55%)]/20"
                      placeholder="0"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[hsl(215,25%,15%)] mb-1">
                      Left
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="200"
                      value={margins.left}
                      onChange={(e) => setMargins(prev => ({ ...prev, left: Number(e.target.value) }))}
                      className="w-full rounded-lg border border-[hsl(210,15%,90%)] px-3 py-2 text-sm focus:border-[hsl(220,85%,55%)] focus:outline-none focus:ring-4 focus:ring-[hsl(220,85%,55%)]/20"
                      placeholder="0"
                    />
                  </div>
                </div>

                {/* Preview of current settings */}
                <div className="rounded-lg border border-[hsl(210,15%,90%)] bg-[hsl(210,15%,95%)] p-4">
                  <div className="text-sm font-medium text-[hsl(215,25%,15%)] mb-2">
                    Current margins (points)
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs text-[hsl(215,15%,45%)]">
                    <div>Top: {margins.top}</div>
                    <div>Right: {margins.right}</div>
                    <div>Bottom: {margins.bottom}</div>
                    <div>Left: {margins.left}</div>
                  </div>
                </div>
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