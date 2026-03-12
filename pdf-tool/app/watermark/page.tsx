"use client";

import { PDFDocument, rgb, degrees, StandardFonts } from "pdf-lib";
import { useId, useMemo, useRef, useState } from "react";

type WatermarkTextColor = "grey" | "red" | "blue" | "black";
type WatermarkOpacity = "light" | "medium" | "strong";
type WatermarkFontSize = "small" | "medium" | "large";

type ImagePosition =
  | "center"
  | "top-left"
  | "top-right"
  | "bottom-left"
  | "bottom-right";

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

function getTextColor(color: WatermarkTextColor) {
  switch (color) {
    case "grey":
      return rgb(0.4, 0.4, 0.4);
    case "red":
      return rgb(0.85, 0.1, 0.1);
    case "blue":
      return rgb(0.1, 0.35, 0.8);
    case "black":
    default:
      return rgb(0, 0, 0);
  }
}

function getOpacity(value: WatermarkOpacity) {
  switch (value) {
    case "light":
      return 0.25;
    case "medium":
      return 0.5;
    case "strong":
      return 0.8;
  }
}

function getFontSize(value: WatermarkFontSize) {
  switch (value) {
    case "small":
      return 36;
    case "medium":
      return 48;
    case "large":
      return 64;
  }
}

async function embedImageForFile(pdfDoc: PDFDocument, file: File) {
  const bytes = new Uint8Array(await file.arrayBuffer());
  if (
    file.type === "image/png" ||
    (!file.type && file.name.toLowerCase().endsWith(".png"))
  ) {
    return pdfDoc.embedPng(bytes);
  }

  // Fallback to JPG for common image types
  return pdfDoc.embedJpg(bytes);
}

export default function WatermarkPage() {
  const [activeTab, setActiveTab] = useState<"text" | "image">("text");

  // Shared
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Text watermark state
  const textPdfInputId = useId();
  const textPdfInputRef = useRef<HTMLInputElement | null>(null);
  const [textPdfFile, setTextPdfFile] = useState<File | null>(null);
  const [textIsDragging, setTextIsDragging] = useState(false);
  const [watermarkText, setWatermarkText] = useState("CONFIDENTIAL");
  const [textColor, setTextColor] = useState<WatermarkTextColor>("grey");
  const [textOpacity, setTextOpacity] = useState<WatermarkOpacity>("light");
  const [textFontSize, setTextFontSize] =
    useState<WatermarkFontSize>("large");

  const textBaseName = useMemo(() => {
    const n = textPdfFile?.name ?? "document.pdf";
    return n.replace(/\.pdf$/i, "") || "document";
  }, [textPdfFile?.name]);

  // Image watermark state
  const imagePdfInputId = useId();
  const imageFileInputId = useId();
  const imagePdfInputRef = useRef<HTMLInputElement | null>(null);
  const imageFileInputRef = useRef<HTMLInputElement | null>(null);
  const [imagePdfFile, setImagePdfFile] = useState<File | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePdfIsDragging, setImagePdfIsDragging] = useState(false);
  const [imageIsDragging, setImageIsDragging] = useState(false);
  const [imagePosition, setImagePosition] =
    useState<ImagePosition>("center");
  const [imageOpacity, setImageOpacity] =
    useState<WatermarkOpacity>("light");

  const imageBaseName = useMemo(() => {
    const n = imagePdfFile?.name ?? "document.pdf";
    return n.replace(/\.pdf$/i, "") || "document";
  }, [imagePdfFile?.name]);

  async function handleTextWatermark() {
    if (!textPdfFile) {
      setError("Please choose a PDF for the text watermark.");
      return;
    }
    if (!watermarkText.trim()) {
      setError("Please enter a watermark text.");
      return;
    }

    setError(null);
    setIsProcessing(true);

    try {
      const bytes = await textPdfFile.arrayBuffer();
      const pdfDoc = await PDFDocument.load(bytes);
      const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      const color = getTextColor(textColor);
      const opacity = getOpacity(textOpacity);
      const size = getFontSize(textFontSize);

      const pages = pdfDoc.getPages();
      const text = watermarkText.trim();

      for (const page of pages) {
        const { width, height } = page.getSize();
        const textWidth = font.widthOfTextAtSize(text, size);
        const x = width / 2 - textWidth / 2;
        const y = height / 2;

        page.drawText(text, {
          x,
          y,
          size,
          font,
          color,
          opacity,
          rotate: degrees(45),
        });
      }

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob(
        [pdfBytes as unknown as BlobPart],
        { type: "application/pdf" },
      );
      downloadBlob(blob, `${textBaseName}_watermark_text.pdf`);
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Failed to apply text watermark. Please try another PDF.",
      );
    } finally {
      setIsProcessing(false);
    }
  }

  async function handleImageWatermark() {
    if (!imagePdfFile) {
      setError("Please choose a PDF for the image watermark.");
      return;
    }
    if (!imageFile) {
      setError("Please choose a watermark image (PNG or JPG).");
      return;
    }

    setError(null);
    setIsProcessing(true);

    try {
      const bytes = await imagePdfFile.arrayBuffer();
      const pdfDoc = await PDFDocument.load(bytes);
      const embeddedImage = await embedImageForFile(pdfDoc, imageFile);
      const opacity = getOpacity(imageOpacity);

      const pages = pdfDoc.getPages();
      for (const page of pages) {
        const { width, height } = page.getSize();
        const maxWidth = width * 0.4;
        const scaleFactor = maxWidth / embeddedImage.width;
        const scaled = embeddedImage.scale(scaleFactor);
        const margin = 24;

        let x = (width - scaled.width) / 2;
        let y = (height - scaled.height) / 2;

        switch (imagePosition) {
          case "top-left":
            x = margin;
            y = height - scaled.height - margin;
            break;
          case "top-right":
            x = width - scaled.width - margin;
            y = height - scaled.height - margin;
            break;
          case "bottom-left":
            x = margin;
            y = margin;
            break;
          case "bottom-right":
            x = width - scaled.width - margin;
            y = margin;
            break;
          case "center":
          default:
            break;
        }

        page.drawImage(embeddedImage, {
          x,
          y,
          width: scaled.width,
          height: scaled.height,
          opacity,
        });
      }

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob(
        [pdfBytes as unknown as BlobPart],
        { type: "application/pdf" },
      );
      downloadBlob(blob, `${imageBaseName}_watermark_image.pdf`);
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Failed to apply image watermark. Please try different files.",
      );
    } finally {
      setIsProcessing(false);
    }
  }

  return (
    <div className="min-h-screen bg-[hsl(210,20%,98%)]">
      <div className="mx-auto w-full max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-3">
          <h1 className="text-balance text-4xl font-bold tracking-tight text-[hsl(215,25%,15%)]">
            PDF Watermark
          </h1>
          <p className="max-w-2xl text-pretty text-base leading-7 text-[hsl(215,15%,45%)]">
            Add text or image watermarks to every page of your PDF, entirely in
            your browser.
          </p>
        </div>

        <div className="mt-6 inline-flex gap-2 rounded-full bg-[hsl(210,15%,95%)] p-1 text-xs font-medium text-[hsl(215,15%,45%)]">
          <button
            type="button"
            onClick={() => setActiveTab("text")}
            className={[
              "rounded-full px-4 py-1.5 transition",
              activeTab === "text"
                ? "bg-white text-[hsl(215,25%,15%)] shadow-sm"
                : "hover:text-[hsl(215,25%,15%)]",
            ].join(" ")}
          >
            Text Watermark
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("image")}
            className={[
              "rounded-full px-4 py-1.5 transition",
              activeTab === "image"
                ? "bg-white text-[hsl(215,25%,15%)] shadow-sm"
                : "hover:text-[hsl(215,25%,15%)]",
            ].join(" ")}
          >
            Image Watermark
          </button>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-5">
          {activeTab === "text" ? (
            <>
              <section className="lg:col-span-2">
                <div
                  className={[
                    "rounded-2xl border bg-white p-5 shadow-sm",
                    textIsDragging
                      ? "border-zinc-900 ring-4 ring-zinc-900/10"
                      : "border-zinc-200",
                  ].join(" ")}
                >
                  <div
                    onDragEnter={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setTextIsDragging(true);
                    }}
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setTextIsDragging(true);
                    }}
                    onDragLeave={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setTextIsDragging(false);
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setTextIsDragging(false);
                      const f = e.dataTransfer?.files?.[0];
                      if (f && isPdfFile(f)) {
                        setTextPdfFile(f);
                        setError(null);
                      } else if (f) {
                        setError("Please choose a PDF file.");
                      }
                    }}
                    className="flex flex-col items-center justify-center rounded-xl border border-dashed border-zinc-300 bg-zinc-50 px-5 py-10 text-center"
                  >
                    <div className="text-sm font-medium">
                      Drag & drop a PDF here
                    </div>
                    <div className="mt-1 text-sm text-zinc-600">
                      or click to choose
                    </div>

                    <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
                      <button
                        type="button"
                        onClick={() => textPdfInputRef.current?.click()}
                        className="inline-flex items-center justify-center rounded-full bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-zinc-800 focus:outline-none focus-visible:ring-4 focus-visible:ring-zinc-900/20"
                      >
                        Choose PDF
                      </button>
                      <div className="text-xs text-zinc-500">Single file</div>
                    </div>

                    <input
                      id={textPdfInputId}
                      ref={textPdfInputRef}
                      type="file"
                      accept="application/pdf,.pdf"
                      className="sr-only"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (!f) return;
                        if (isPdfFile(f)) {
                          setTextPdfFile(f);
                          setError(null);
                        } else {
                          setError("Please choose a PDF file.");
                          setTextPdfFile(null);
                        }
                        e.target.value = "";
                      }}
                    />
                  </div>

                  <div className="mt-4 space-y-2">
                    <div className="text-sm text-zinc-600">
                      <span className="font-medium text-zinc-900">
                        {textPdfFile ? textPdfFile.name : "No file selected"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-3 text-sm text-zinc-600">
                      <div>
                        Size:{" "}
                        <span className="font-medium text-zinc-900">
                          {textPdfFile
                            ? formatBytes(textPdfFile.size)
                            : "—"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 rounded-2xl border border-zinc-200 p-4">
                    <div className="text-sm font-semibold">
                      Watermark settings
                    </div>

                    <div className="mt-3 space-y-3">
                      <label className="text-sm">
                        <div className="mb-1 text-xs font-medium text-zinc-600">
                          Text
                        </div>
                        <input
                          type="text"
                          value={watermarkText}
                          onChange={(e) => setWatermarkText(e.target.value)}
                          placeholder="CONFIDENTIAL"
                          className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm shadow-sm outline-none focus:border-zinc-900 focus:ring-4 focus:ring-zinc-900/10"
                        />
                      </label>

                      <div className="grid grid-cols-3 gap-3">
                        <label className="text-sm">
                          <div className="mb-1 text-xs font-medium text-zinc-600">
                            Color
                          </div>
                          <select
                            value={textColor}
                            onChange={(e) =>
                              setTextColor(
                                e.target.value as WatermarkTextColor,
                              )
                            }
                            className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm shadow-sm outline-none focus:border-zinc-900 focus:ring-4 focus:ring-zinc-900/10"
                          >
                            <option value="grey">Grey</option>
                            <option value="red">Red</option>
                            <option value="blue">Blue</option>
                            <option value="black">Black</option>
                          </select>
                        </label>

                        <label className="text-sm">
                          <div className="mb-1 text-xs font-medium text-zinc-600">
                            Opacity
                          </div>
                          <select
                            value={textOpacity}
                            onChange={(e) =>
                              setTextOpacity(
                                e.target.value as WatermarkOpacity,
                              )
                            }
                            className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm shadow-sm outline-none focus:border-zinc-900 focus:ring-4 focus:ring-zinc-900/10"
                          >
                            <option value="light">Light</option>
                            <option value="medium">Medium</option>
                            <option value="strong">Strong</option>
                          </select>
                        </label>

                        <label className="text-sm">
                          <div className="mb-1 text-xs font-medium text-zinc-600">
                            Font size
                          </div>
                          <select
                            value={textFontSize}
                            onChange={(e) =>
                              setTextFontSize(
                                e.target.value as WatermarkFontSize,
                              )
                            }
                            className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm shadow-sm outline-none focus:border-zinc-900 focus:ring-4 focus:ring-zinc-900/10"
                          >
                            <option value="small">Small</option>
                            <option value="medium">Medium</option>
                            <option value="large">Large</option>
                          </select>
                        </label>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setTextPdfFile(null);
                        setWatermarkText("CONFIDENTIAL");
                        setTextColor("grey");
                        setTextOpacity("light");
                        setTextFontSize("large");
                        setError(null);
                      }}
                      disabled={isProcessing && !!textPdfFile}
                      className="text-sm font-medium text-zinc-600 hover:text-zinc-900 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Clear
                    </button>

                    <button
                      type="button"
                      onClick={() => void handleTextWatermark()}
                      disabled={!textPdfFile || isProcessing}
                      className="inline-flex items-center justify-center rounded-full bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none focus-visible:ring-4 focus-visible:ring-zinc-900/20"
                    >
                      {isProcessing
                        ? "Applying watermark…"
                        : "Download watermarked PDF"}
                    </button>
                  </div>
                </div>
              </section>

              <section className="lg:col-span-3">
                <div className="rounded-2xl border border-zinc-200 bg-white shadow-sm">
                  <div className="border-b border-zinc-200 px-5 py-4">
                    <div className="text-sm font-semibold">How it works</div>
                    <div className="text-xs text-zinc-600">
                      The watermark text is drawn diagonally across every page
                      using Helvetica Bold.
                    </div>
                  </div>

                  <div className="p-5 text-sm text-zinc-700">
                    <ol className="list-decimal space-y-2 pl-5">
                      <li>Choose a PDF and your watermark text.</li>
                      <li>
                        Adjust color, opacity, and font size as needed for your
                        document.
                      </li>
                      <li>
                        Click “Download watermarked PDF” to process everything
                        in your browser.
                      </li>
                    </ol>

                    <p className="mt-4 text-xs text-zinc-500">
                      Tip: Use a lighter opacity for sensitive documents to keep
                      the original content easy to read.
                    </p>
                  </div>
                </div>

                {error ? (
                  <div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                    {error}
                  </div>
                ) : null}
              </section>
            </>
          ) : (
            <>
              <section className="lg:col-span-2 space-y-5">
                <div>
                  <div
                    className={[
                      "rounded-2xl border bg-white p-5 shadow-sm",
                      imagePdfIsDragging
                        ? "border-zinc-900 ring-4 ring-zinc-900/10"
                        : "border-zinc-200",
                    ].join(" ")}
                  >
                    <div
                      onDragEnter={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setImagePdfIsDragging(true);
                      }}
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setImagePdfIsDragging(true);
                      }}
                      onDragLeave={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setImagePdfIsDragging(false);
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setImagePdfIsDragging(false);
                        const f = e.dataTransfer?.files?.[0];
                        if (f && isPdfFile(f)) {
                          setImagePdfFile(f);
                          setError(null);
                        } else if (f) {
                          setError("Please choose a PDF file.");
                        }
                      }}
                      className="flex flex-col items-center justify-center rounded-xl border border-dashed border-zinc-300 bg-zinc-50 px-5 py-8 text-center"
                    >
                      <div className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                        PDF
                      </div>
                      <div className="mt-1 text-sm font-medium">
                        Drag & drop a PDF
                      </div>
                      <div className="mt-1 text-sm text-zinc-600">
                        or click to choose
                      </div>

                      <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
                        <button
                          type="button"
                          onClick={() => imagePdfInputRef.current?.click()}
                          className="inline-flex items-center justify-center rounded-full bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-zinc-800 focus:outline-none focus-visible:ring-4 focus-visible:ring-zinc-900/20"
                        >
                          Choose PDF
                        </button>
                        <div className="text-xs text-zinc-500">
                          Single file
                        </div>
                      </div>

                      <input
                        id={imagePdfInputId}
                        ref={imagePdfInputRef}
                        type="file"
                        accept="application/pdf,.pdf"
                        className="sr-only"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (!f) return;
                          if (isPdfFile(f)) {
                            setImagePdfFile(f);
                            setError(null);
                          } else {
                            setError("Please choose a PDF file.");
                            setImagePdfFile(null);
                          }
                          e.target.value = "";
                        }}
                      />
                    </div>

                    <div className="mt-3 text-xs text-zinc-600">
                      <span className="font-medium text-zinc-900">
                        {imagePdfFile ? imagePdfFile.name : "No PDF selected"}
                      </span>{" "}
                      {imagePdfFile ? (
                        <span>({formatBytes(imagePdfFile.size)})</span>
                      ) : null}
                    </div>
                  </div>
                </div>

                <div>
                  <div
                    className={[
                      "rounded-2xl border bg-white p-5 shadow-sm",
                      imageIsDragging
                        ? "border-zinc-900 ring-4 ring-zinc-900/10"
                        : "border-zinc-200",
                    ].join(" ")}
                  >
                    <div
                      onDragEnter={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setImageIsDragging(true);
                      }}
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setImageIsDragging(true);
                      }}
                      onDragLeave={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setImageIsDragging(false);
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setImageIsDragging(false);
                        const f = e.dataTransfer?.files?.[0];
                        if (f) {
                          if (
                            f.type.startsWith("image/") ||
                            /\.(png|jpe?g)$/i.test(f.name)
                          ) {
                            setImageFile(f);
                            setError(null);
                          } else {
                            setError(
                              "Please choose a PNG or JPG image for the watermark.",
                            );
                          }
                        }
                      }}
                      className="flex flex-col items-center justify-center rounded-xl border border-dashed border-zinc-300 bg-zinc-50 px-5 py-8 text-center"
                    >
                      <div className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                        Image
                      </div>
                      <div className="mt-1 text-sm font-medium">
                        Drag & drop an image
                      </div>
                      <div className="mt-1 text-sm text-zinc-600">
                        PNG or JPG works best
                      </div>

                      <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
                        <button
                          type="button"
                          onClick={() => imageFileInputRef.current?.click()}
                          className="inline-flex items-center justify-center rounded-full bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-zinc-800 focus:outline-none focus-visible:ring-4 focus-visible:ring-zinc-900/20"
                        >
                          Choose image
                        </button>
                        <div className="text-xs text-zinc-500">
                          PNG or JPG
                        </div>
                      </div>

                      <input
                        id={imageFileInputId}
                        ref={imageFileInputRef}
                        type="file"
                        accept="image/png,image/jpeg"
                        className="sr-only"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (!f) return;
                          if (
                            f.type.startsWith("image/") ||
                            /\.(png|jpe?g)$/i.test(f.name)
                          ) {
                            setImageFile(f);
                            setError(null);
                          } else {
                            setError(
                              "Please choose a PNG or JPG image for the watermark.",
                            );
                            setImageFile(null);
                          }
                          e.target.value = "";
                        }}
                      />
                    </div>

                    <div className="mt-3 text-xs text-zinc-600">
                      <span className="font-medium text-zinc-900">
                        {imageFile ? imageFile.name : "No image selected"}
                      </span>{" "}
                      {imageFile ? (
                        <span>({formatBytes(imageFile.size)})</span>
                      ) : null}
                    </div>
                  </div>
                </div>
              </section>

              <section className="lg:col-span-3">
                <div className="rounded-2xl border border-zinc-200 bg-white shadow-sm">
                  <div className="border-b border-zinc-200 px-5 py-4">
                    <div className="text-sm font-semibold">
                      Watermark settings
                    </div>
                    <div className="text-xs text-zinc-600">
                      Your image will be embedded on every page at the chosen
                      position.
                    </div>
                  </div>

                  <div className="p-5 space-y-4">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <label className="text-sm">
                        <div className="mb-1 text-xs font-medium text-zinc-600">
                          Position
                        </div>
                        <select
                          value={imagePosition}
                          onChange={(e) =>
                            setImagePosition(e.target.value as ImagePosition)
                          }
                          className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm shadow-sm outline-none focus:border-zinc-900 focus:ring-4 focus:ring-zinc-900/10"
                        >
                          <option value="center">Center</option>
                          <option value="top-left">Top left</option>
                          <option value="top-right">Top right</option>
                          <option value="bottom-left">Bottom left</option>
                          <option value="bottom-right">Bottom right</option>
                        </select>
                      </label>

                      <label className="text-sm">
                        <div className="mb-1 text-xs font-medium text-zinc-600">
                          Opacity
                        </div>
                        <select
                          value={imageOpacity}
                          onChange={(e) =>
                            setImageOpacity(
                              e.target.value as WatermarkOpacity,
                            )
                          }
                          className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm shadow-sm outline-none focus:border-zinc-900 focus:ring-4 focus:ring-zinc-900/10"
                        >
                          <option value="light">Light</option>
                          <option value="medium">Medium</option>
                          <option value="strong">Strong</option>
                        </select>
                      </label>
                    </div>

                    <p className="text-xs text-zinc-500">
                      The image is scaled so that its width is at most 40% of
                      the page width, keeping the watermark prominent but not
                      overwhelming.
                    </p>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setImagePdfFile(null);
                      setImageFile(null);
                      setImagePosition("center");
                      setImageOpacity("light");
                      setError(null);
                    }}
                    disabled={isProcessing && (!!imagePdfFile || !!imageFile)}
                    className="text-sm font-medium text-zinc-600 hover:text-zinc-900 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Clear
                  </button>

                  <button
                    type="button"
                    onClick={() => void handleImageWatermark()}
                    disabled={!imagePdfFile || !imageFile || isProcessing}
                    className="inline-flex items-center justify-center rounded-full bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none focus-visible:ring-4 focus-visible:ring-zinc-900/20"
                  >
                    {isProcessing
                      ? "Applying watermark…"
                      : "Download watermarked PDF"}
                  </button>
                </div>

                {error ? (
                  <div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                    {error}
                  </div>
                ) : null}
              </section>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

