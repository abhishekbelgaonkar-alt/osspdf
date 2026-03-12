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

function isImageFile(file: File) {
  return (
    file.type === "image/jpeg" ||
    file.type === "image/jpg" ||
    file.type === "image/png" ||
    file.name.toLowerCase().endsWith(".jpg") ||
    file.name.toLowerCase().endsWith(".jpeg") ||
    file.name.toLowerCase().endsWith(".png")
  );
}

type PageSizeOption = "fit" | "a4" | "letter";

interface ImageFile {
  file: File;
  id: string;
}

async function convertImagesToPdf(
  imageFiles: ImageFile[],
  pageSizeOption: PageSizeOption
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();

  for (const { file } of imageFiles) {
    const bytes = await file.arrayBuffer();
    
    // Determine if PNG or JPEG
    const isPng = file.type === "image/png" || file.name.toLowerCase().endsWith(".png");
    
    // Embed the image
    const embeddedImage = isPng 
      ? await pdfDoc.embedPng(bytes)
      : await pdfDoc.embedJpg(bytes);

    // Determine page size
    let pageWidth: number;
    let pageHeight: number;

    if (pageSizeOption === "a4") {
      pageWidth = 595; // A4 width in points
      pageHeight = 842; // A4 height in points
    } else if (pageSizeOption === "letter") {
      pageWidth = 612; // Letter width in points
      pageHeight = 792; // Letter height in points
    } else {
      // Fit to image
      pageWidth = embeddedImage.width;
      pageHeight = embeddedImage.height;
    }

    // Add page
    const page = pdfDoc.addPage([pageWidth, pageHeight]);

    if (pageSizeOption === "fit") {
      // Draw image to fill entire page
      page.drawImage(embeddedImage, {
        x: 0,
        y: 0,
        width: embeddedImage.width,
        height: embeddedImage.height,
      });
    } else {
      // Scale image to fit within page bounds while preserving aspect ratio
      const scale = Math.min(
        pageWidth / embeddedImage.width,
        pageHeight / embeddedImage.height
      );
      
      const drawWidth = embeddedImage.width * scale;
      const drawHeight = embeddedImage.height * scale;
      
      // Center the image
      const x = (pageWidth - drawWidth) / 2;
      const y = (pageHeight - drawHeight) / 2;

      page.drawImage(embeddedImage, {
        x,
        y,
        width: drawWidth,
        height: drawHeight,
      });
    }
  }

  return pdfDoc.save();
}

export default function ImageToPdfPage() {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement | null>(null);

  const [imageFiles, setImageFiles] = useState<ImageFile[]>([]);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pageSizeOption, setPageSizeOption] = useState<PageSizeOption>("fit");

  const canConvert = imageFiles.length > 0 && !isConverting;

  function addFiles(fileList: FileList | File[]) {
    const arr = Array.from(fileList);
    const images = arr.filter(isImageFile);

    if (images.length === 0) {
      setError("Please choose JPG or PNG image files.");
      return;
    }

    setError(null);
    const newImageFiles = images.map(file => ({
      file,
      id: Math.random().toString(36).substr(2, 9),
    }));
    
    setImageFiles(prev => [...prev, ...newImageFiles]);
  }

  function removeImage(id: string) {
    setImageFiles(prev => prev.filter(img => img.id !== id));
  }

  function moveImage(id: string, direction: "up" | "down") {
    setImageFiles(prev => {
      const index = prev.findIndex(img => img.id === id);
      if (index === -1) return prev;
      
      const newIndex = direction === "up" ? index - 1 : index + 1;
      if (newIndex < 0 || newIndex >= prev.length) return prev;
      
      const newArray = [...prev];
      [newArray[index], newArray[newIndex]] = [newArray[newIndex], newArray[index]];
      return newArray;
    });
  }

  async function onConvert() {
    if (imageFiles.length === 0) return;

    setError(null);
    setIsConverting(true);
    try {
      const pdfBytes = await convertImagesToPdf(imageFiles, pageSizeOption);
      const safeBytes = Uint8Array.from(pdfBytes);
      const blob = new Blob([safeBytes], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "images.pdf";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to convert images to PDF.");
    } finally {
      setIsConverting(false);
    }
  }

  return (
    <div className="min-h-screen bg-[hsl(210,20%,98%)]">
      <div className="mx-auto w-full max-w-2xl px-4 py-12 sm:px-6">
        <div className="flex flex-col gap-3 mb-8">
          <h1 className="text-balance text-4xl font-bold tracking-tight text-[hsl(215,25%,15%)]">
            Image to PDF
          </h1>
          <p className="text-[hsl(215,15%,45%)]">
            Convert JPG and PNG images to a single PDF document — no uploads, no server.
          </p>
        </div>

        <div className="mt-8">
          <div className="rounded-xl border border-[hsl(210,15%,90%)] bg-white p-6 shadow-sm">
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
              className={[
                "flex flex-col items-center justify-center rounded-xl border-2 border-dashed bg-[hsl(210,15%,95%)] px-6 py-12 text-center transition-all",
                isDraggingOver
                  ? "border-[hsl(220,85%,55%)] ring-4 ring-[hsl(220,85%,55%)]/10"
                  : "border-[hsl(210,15%,90%)]",
              ].join(" ")}
            >
              <div className="w-12 h-12 rounded-lg bg-[hsl(220,85%,55%)]/10 flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-[hsl(220,85%,55%)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
              <div className="text-sm font-medium text-[hsl(215,25%,15%)]">
                Drag & drop images here
              </div>
              <div className="mt-1 text-sm text-[hsl(215,15%,45%)]">
                or click to choose files
              </div>

              <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => inputRef.current?.click()}
                  className="inline-flex items-center justify-center h-11 rounded-full bg-[hsl(220,85%,55%)] px-6 text-sm font-semibold text-white shadow-sm hover:bg-[hsl(220,85%,55%)]/90 hover:shadow-lg focus:outline-none focus-visible:ring-4 focus-visible:ring-[hsl(220,85%,55%)]/20 transition-all"
                >
                  Choose Images
                </button>
              </div>

              <input
                id={inputId}
                ref={inputRef}
                type="file"
                accept="image/jpeg,image/png,.jpg,.jpeg,.png"
                multiple
                className="sr-only"
                onChange={(e) => {
                  if (e.target.files?.length) addFiles(e.target.files);
                  e.target.value = "";
                }}
              />
            </div>

            {imageFiles.length > 0 && (
              <div className="mt-6 space-y-3">
                <div className="text-sm font-medium text-[hsl(215,25%,15%)]">
                  {imageFiles.length} image{imageFiles.length === 1 ? "" : "s"} selected
                </div>
                
                {imageFiles.map((imageFile, index) => (
                  <div
                    key={imageFile.id}
                    className="flex items-center gap-3 rounded-xl border border-[hsl(210,15%,90%)] bg-[hsl(210,15%,95%)] p-4"
                  >
                    <div className="flex h-10 w-10 flex-none items-center justify-center rounded-lg bg-[hsl(220,85%,55%)]/10 text-[hsl(220,85%,55%)]">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium text-[hsl(215,25%,15%)]">
                        {imageFile.file.name}
                      </div>
                      <div className="text-xs text-[hsl(215,15%,45%)]">
                        {formatBytes(imageFile.file.size)}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => moveImage(imageFile.id, "up")}
                        disabled={index === 0}
                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-[hsl(210,15%,90%)] text-[hsl(215,15%,45%)] hover:bg-white disabled:cursor-not-allowed disabled:opacity-40 transition-colors"
                        title="Move up"
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        onClick={() => moveImage(imageFile.id, "down")}
                        disabled={index === imageFiles.length - 1}
                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-[hsl(210,15%,90%)] text-[hsl(215,15%,45%)] hover:bg-white disabled:cursor-not-allowed disabled:opacity-40 transition-colors"
                        title="Move down"
                      >
                        ↓
                      </button>
                      <button
                        type="button"
                        onClick={() => removeImage(imageFile.id)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-[hsl(210,15%,90%)] text-[hsl(215,15%,45%)] hover:bg-white hover:text-red-600 transition-colors"
                        title="Remove"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {imageFiles.length > 0 && (
              <div className="mt-6 space-y-4">
                <div>
                  <div className="text-sm font-medium text-[hsl(215,25%,15%)] mb-3">
                    Page sizing options
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setPageSizeOption("fit")}
                      className={[
                        "rounded-lg border px-3 py-2 text-sm font-medium transition-all",
                        pageSizeOption === "fit"
                          ? "border-[hsl(220,85%,55%)] bg-[hsl(220,85%,55%)] text-white"
                          : "border-[hsl(210,15%,90%)] text-[hsl(215,25%,15%)] hover:bg-[hsl(210,15%,95%)]",
                      ].join(" ")}
                    >
                      Fit to image
                    </button>
                    <button
                      type="button"
                      onClick={() => setPageSizeOption("a4")}
                      className={[
                        "rounded-lg border px-3 py-2 text-sm font-medium transition-all",
                        pageSizeOption === "a4"
                          ? "border-[hsl(220,85%,55%)] bg-[hsl(220,85%,55%)] text-white"
                          : "border-[hsl(210,15%,90%)] text-[hsl(215,25%,15%)] hover:bg-[hsl(210,15%,95%)]",
                      ].join(" ")}
                    >
                      A4
                    </button>
                    <button
                      type="button"
                      onClick={() => setPageSizeOption("letter")}
                      className={[
                        "rounded-lg border px-3 py-2 text-sm font-medium transition-all",
                        pageSizeOption === "letter"
                          ? "border-[hsl(220,85%,55%)] bg-[hsl(220,85%,55%)] text-white"
                          : "border-[hsl(210,15%,90%)] text-[hsl(215,25%,15%)] hover:bg-[hsl(210,15%,95%)]",
                      ].join(" ")}
                    >
                      Letter
                    </button>
                  </div>
                  <div className="mt-2 text-xs text-[hsl(215,15%,45%)]">
                    {pageSizeOption === "fit" && "Each page matches the image dimensions exactly"}
                    {pageSizeOption === "a4" && "All pages are A4 size, images scaled to fit with letterboxing"}
                    {pageSizeOption === "letter" && "All pages are Letter size, images scaled to fit with letterboxing"}
                  </div>
                </div>

                <div className="flex items-center justify-between gap-3">
                  <div className="text-sm text-[hsl(215,15%,45%)]">
                    Each image becomes one page
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setImageFiles([]);
                      setError(null);
                    }}
                    disabled={isConverting}
                    className="text-sm font-medium text-[hsl(215,15%,45%)] hover:text-[hsl(215,25%,15%)] disabled:cursor-not-allowed disabled:opacity-40 transition-colors"
                  >
                    Clear all
                  </button>
                </div>

                <button
                  type="button"
                  onClick={onConvert}
                  disabled={!canConvert}
                  className="w-full inline-flex items-center justify-center h-11 rounded-full bg-[hsl(220,85%,55%)] px-6 text-sm font-semibold text-white shadow-sm hover:bg-[hsl(220,85%,55%)]/90 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none focus-visible:ring-4 focus-visible:ring-[hsl(220,85%,55%)]/20 transition-all"
                >
                  {isConverting ? "Converting to PDF…" : "Convert to PDF"}
                </button>
              </div>
            )}

            {error ? (
              <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                {error}
              </div>
            ) : null}
          </div>
        </div>

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