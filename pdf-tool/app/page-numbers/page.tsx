"use client";

import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { useId, useRef, useState } from "react";

type Position = "bottom-center" | "bottom-left" | "bottom-right" | "top-center" | "top-left" | "top-right";
type Format = "number" | "page-number" | "number-total";
type FontSize = "small" | "medium" | "large";
type Color = "black" | "grey";

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

function getFontSize(size: FontSize): number {
  switch (size) {
    case "small": return 10;
    case "medium": return 12;
    case "large": return 16;
  }
}

function getColor(color: Color) {
  switch (color) {
    case "black": return rgb(0, 0, 0);
    case "grey": return rgb(0.5, 0.5, 0.5);
  }
}

function formatPageNumber(pageNum: number, totalPages: number, format: Format): string {
  switch (format) {
    case "number": return String(pageNum);
    case "page-number": return `Page ${pageNum}`;
    case "number-total": return `${pageNum} / ${totalPages}`;
  }
}

async function addPageNumbers(
  file: File,
  position: Position,
  format: Format,
  fontSize: FontSize,
  color: Color
): Promise<Uint8Array> {
  const srcBytes = await file.arrayBuffer();
  const pdfDoc = await PDFDocument.load(srcBytes);
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const pages = pdfDoc.getPages();
  const totalPages = pdfDoc.getPageCount();
  const fontSizeNum = getFontSize(fontSize);
  const colorRgb = getColor(color);

  for (let i = 0; i < pages.length; i++) {
    const page = pages[i];
    const { width, height } = page.getSize();
    const pageNumber = i + 1;
    const text = formatPageNumber(pageNumber, totalPages, format);
    const textWidth = font.widthOfTextAtSize(text, fontSizeNum);

    let x: number;
    let y: number;

    // Calculate position
    switch (position) {
      case "bottom-center":
        x = width / 2 - textWidth / 2;
        y = 24;
        break;
      case "bottom-left":
        x = 24;
        y = 24;
        break;
      case "bottom-right":
        x = width - textWidth - 24;
        y = 24;
        break;
      case "top-center":
        x = width / 2 - textWidth / 2;
        y = height - 24 - fontSizeNum;
        break;
      case "top-left":
        x = 24;
        y = height - 24 - fontSizeNum;
        break;
      case "top-right":
        x = width - textWidth - 24;
        y = height - 24 - fontSizeNum;
        break;
    }

    page.drawText(text, {
      x,
      y,
      size: fontSizeNum,
      font,
      color: colorRgb,
    });
  }

  return pdfDoc.save();
}

export default function PageNumbersPage() {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement | null>(null);

  const [file, setFile] = useState<File | null>(null);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Settings
  const [position, setPosition] = useState<Position>("bottom-center");
  const [format, setFormat] = useState<Format>("number");
  const [fontSize, setFontSize] = useState<FontSize>("medium");
  const [color, setColor] = useState<Color>("black");

  const canProcess = !!file && !isProcessing;

  async function setPdfFile(next: File) {
    if (!isPdfFile(next)) {
      setError("Please choose a PDF file.");
      return;
    }
    setError(null);
    setFile(next);
  }

  async function onAddPageNumbers() {
    if (!file) return;
    setError(null);
    setIsProcessing(true);
    try {
      const resultBytes = await addPageNumbers(file, position, format, fontSize, color);
      const safeBytes = Uint8Array.from(resultBytes);
      const blob = new Blob([safeBytes], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = file.name.replace(/\.pdf$/i, "_numbered.pdf");
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to add page numbers.");
    } finally {
      setIsProcessing(false);
    }
  }

  return (
    <div className="min-h-screen bg-[hsl(210,20%,98%)]">
      <div className="mx-auto w-full max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-3">
          <h1 className="text-balance text-4xl font-bold tracking-tight text-[hsl(215,25%,15%)]">
            Add Page Numbers
          </h1>
          <p className="max-w-2xl text-pretty text-base leading-7 text-[hsl(215,15%,45%)]">
            Add page numbers to every page of your PDF with customizable position and format.
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
                <div className="text-sm text-zinc-600">
                  Size:{" "}
                  <span className="font-medium text-zinc-900">
                    {file ? formatBytes(file.size) : "—"}
                  </span>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setFile(null);
                    setError(null);
                  }}
                  disabled={!file || isProcessing}
                  className="text-sm font-medium text-zinc-600 hover:text-zinc-900 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Clear
                </button>

                <button
                  type="button"
                  onClick={onAddPageNumbers}
                  disabled={!canProcess}
                  className="inline-flex items-center justify-center rounded-full bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none focus-visible:ring-4 focus-visible:ring-zinc-900/20"
                >
                  {isProcessing ? "Adding Numbers…" : "Add Page Numbers"}
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
                <div className="text-sm font-semibold">Settings</div>
                <div className="text-xs text-zinc-600">
                  Customize how page numbers appear on your PDF.
                </div>
              </div>

              <div className="p-5 space-y-6">
                {/* Position */}
                <div>
                  <label className="block text-sm font-semibold mb-3">Position</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { value: "top-left", label: "Top Left" },
                      { value: "top-center", label: "Top Center" },
                      { value: "top-right", label: "Top Right" },
                      { value: "bottom-left", label: "Bottom Left" },
                      { value: "bottom-center", label: "Bottom Center" },
                      { value: "bottom-right", label: "Bottom Right" },
                    ].map((pos) => (
                      <label key={pos.value} className="flex cursor-pointer">
                        <input
                          type="radio"
                          name="position"
                          value={pos.value}
                          checked={position === pos.value}
                          onChange={(e) => setPosition(e.target.value as Position)}
                          className="sr-only"
                        />
                        <div
                          className={[
                            "flex-1 rounded-lg border px-3 py-2 text-center text-xs font-medium",
                            position === pos.value
                              ? "border-zinc-900 bg-zinc-900 text-white"
                              : "border-zinc-200 bg-white text-zinc-900 hover:bg-zinc-50",
                          ].join(" ")}
                        >
                          {pos.label}
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Format */}
                <div>
                  <label className="block text-sm font-semibold mb-3">Format</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { value: "number", label: "1" },
                      { value: "page-number", label: "Page 1" },
                      { value: "number-total", label: "1 / 12" },
                    ].map((fmt) => (
                      <label key={fmt.value} className="flex cursor-pointer">
                        <input
                          type="radio"
                          name="format"
                          value={fmt.value}
                          checked={format === fmt.value}
                          onChange={(e) => setFormat(e.target.value as Format)}
                          className="sr-only"
                        />
                        <div
                          className={[
                            "flex-1 rounded-lg border px-3 py-2 text-center text-xs font-medium",
                            format === fmt.value
                              ? "border-zinc-900 bg-zinc-900 text-white"
                              : "border-zinc-200 bg-white text-zinc-900 hover:bg-zinc-50",
                          ].join(" ")}
                        >
                          {fmt.label}
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Font Size */}
                <div>
                  <label className="block text-sm font-semibold mb-3">Font Size</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { value: "small", label: "Small (10)" },
                      { value: "medium", label: "Medium (12)" },
                      { value: "large", label: "Large (16)" },
                    ].map((size) => (
                      <label key={size.value} className="flex cursor-pointer">
                        <input
                          type="radio"
                          name="fontSize"
                          value={size.value}
                          checked={fontSize === size.value}
                          onChange={(e) => setFontSize(e.target.value as FontSize)}
                          className="sr-only"
                        />
                        <div
                          className={[
                            "flex-1 rounded-lg border px-3 py-2 text-center text-xs font-medium",
                            fontSize === size.value
                              ? "border-zinc-900 bg-zinc-900 text-white"
                              : "border-zinc-200 bg-white text-zinc-900 hover:bg-zinc-50",
                          ].join(" ")}
                        >
                          {size.label}
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Color */}
                <div>
                  <label className="block text-sm font-semibold mb-3">Color</label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { value: "black", label: "Black" },
                      { value: "grey", label: "Grey" },
                    ].map((clr) => (
                      <label key={clr.value} className="flex cursor-pointer">
                        <input
                          type="radio"
                          name="color"
                          value={clr.value}
                          checked={color === clr.value}
                          onChange={(e) => setColor(e.target.value as Color)}
                          className="sr-only"
                        />
                        <div
                          className={[
                            "flex-1 rounded-lg border px-3 py-2 text-center text-xs font-medium",
                            color === clr.value
                              ? "border-zinc-900 bg-zinc-900 text-white"
                              : "border-zinc-200 bg-white text-zinc-900 hover:bg-zinc-50",
                          ].join(" ")}
                        >
                          {clr.label}
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-3 text-xs text-zinc-500">
              Tip: Page numbers are added to all pages. Preview the first few pages to check positioning.
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}