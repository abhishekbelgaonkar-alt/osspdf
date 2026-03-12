'use client';

import { useState, useRef } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { PDFDocument } from 'pdf-lib';
import Link from 'next/link';

// Set the worker source
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

export default function GrayscalePage() {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile && selectedFile.type === 'application/pdf') {
      setFile(selectedFile);
    }
  };

  const convertToGrayscale = async () => {
    if (!file) return;

    setIsProcessing(true);
    setProgress('Loading PDF...');

    try {
      // Step 1: Load PDF with pdfjs-dist
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      const numPages = pdf.numPages;

      // Step 2: Create new PDF document
      const newPdfDoc = await PDFDocument.create();
      
      // Process each page
      for (let pageNum = 1; pageNum <= numPages; pageNum++) {
        setProgress(`Processing page ${pageNum} of ${numPages}...`);
        
        // Get the page
        const page = await pdf.getPage(pageNum);
        const viewport = page.getViewport({ scale: 2.0 }); // Higher scale for quality
        
        // Create canvas (with fallback for browsers without OffscreenCanvas)
        let canvas: OffscreenCanvas | HTMLCanvasElement;
        let context: OffscreenCanvasRenderingContext2D | CanvasRenderingContext2D;
        
        if (typeof OffscreenCanvas !== 'undefined') {
          canvas = new OffscreenCanvas(viewport.width, viewport.height);
          context = canvas.getContext('2d')!;
        } else {
          // Fallback for browsers without OffscreenCanvas support
          canvas = document.createElement('canvas');
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          context = canvas.getContext('2d')!;
        }
        
        if (!context) {
          throw new Error('Could not get canvas context');
        }
        
        // Render page to canvas
        await page.render({
          canvasContext: context as any,
          viewport: viewport
        }).promise;
        
        // Convert to grayscale
        const imageData = context.getImageData(0, 0, viewport.width, viewport.height);
        const data = imageData.data;
        
        // Apply grayscale conversion using luminance formula
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          
          // Standard luminance formula
          const gray = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
          
          data[i] = gray;     // Red
          data[i + 1] = gray; // Green
          data[i + 2] = gray; // Blue
          // Alpha (data[i + 3]) remains unchanged
        }
        
        // Put the grayscale data back
        context.putImageData(imageData, 0, 0);
        
        // Convert canvas to blob and then to array buffer
        let blob: Blob;
        if (canvas instanceof OffscreenCanvas) {
          blob = await canvas.convertToBlob({ type: 'image/jpeg', quality: 0.92 });
        } else {
          // Fallback for regular canvas
          blob = await new Promise<Blob>((resolve) => {
            (canvas as HTMLCanvasElement).toBlob((b) => resolve(b!), 'image/jpeg', 0.92);
          });
        }
        const jpegArrayBuffer = await blob.arrayBuffer();
        
        // Embed the image in the new PDF
        const jpegImage = await newPdfDoc.embedJpg(jpegArrayBuffer);
        
        // Add page with same dimensions as original
        const newPage = newPdfDoc.addPage([viewport.width / 2, viewport.height / 2]); // Divide by 2 because we scaled up
        newPage.drawImage(jpegImage, {
          x: 0,
          y: 0,
          width: viewport.width / 2,
          height: viewport.height / 2,
        });
      }
      
      setProgress('Finalizing PDF...');
      
      // Save the new PDF
      const pdfBytes = await newPdfDoc.save();
      
      // Create download
      const blob = new Blob([Uint8Array.from(pdfBytes)], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.name.replace('.pdf', '_grayscale.pdf');
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      setProgress('');
      setIsProcessing(false);
      
    } catch (error) {
      console.error('Error converting PDF to grayscale:', error);
      setProgress('Error occurred during conversion');
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-[hsl(210,20%,98%)]">
      {/* Main Content */}
      <main className="mx-auto w-full max-w-2xl px-4 py-12 sm:px-6">
        <div className="flex flex-col gap-3 mb-8">
          <h1 className="text-balance text-4xl font-bold tracking-tight text-[hsl(215,25%,15%)]">
            Convert PDF to Grayscale
          </h1>
          <p className="text-[hsl(215,15%,45%)]">
            Convert your PDF to grayscale while maintaining quality
          </p>
        </div>

        <div className="bg-white rounded-xl border border-[hsl(210,15%,90%)] p-8 shadow-sm">
          {!file ? (
            <div className="text-center">
              <div className="border-2 border-dashed border-[hsl(210,15%,90%)] rounded-xl p-12 hover:border-[hsl(220,85%,55%)]/50 transition-colors">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <div className="space-y-4">
                  <div className="mx-auto w-12 h-12 bg-[hsl(220,85%,55%)]/10 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-[hsl(220,85%,55%)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                  </div>
                  <div>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="inline-flex items-center justify-center h-11 rounded-full bg-[hsl(220,85%,55%)] px-6 text-base font-semibold text-white hover:bg-[hsl(220,85%,55%)]/90 hover:shadow-lg focus:outline-none focus-visible:ring-4 focus-visible:ring-[hsl(220,85%,55%)]/20 transition-all"
                    >
                      Choose PDF File
                    </button>
                  </div>
                  <p className="text-sm text-[hsl(215,15%,45%)]">
                    Select a PDF file to convert to grayscale
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center justify-between p-4 bg-[hsl(210,15%,95%)] rounded-xl">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-[hsl(220,85%,55%)]/10 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-[hsl(220,85%,55%)]" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium text-[hsl(215,25%,15%)]">{file.name}</p>
                    <p className="text-sm text-[hsl(215,15%,45%)]">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setFile(null);
                    if (fileInputRef.current) {
                      fileInputRef.current.value = '';
                    }
                  }}
                  className="text-[hsl(215,15%,45%)] hover:text-[hsl(215,25%,15%)] transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {progress && (
                <div className="text-center py-4">
                  <div className="inline-flex items-center space-x-2 text-[hsl(215,15%,45%)]">
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span className="text-sm">{progress}</span>
                  </div>
                </div>
              )}

              <button
                onClick={convertToGrayscale}
                disabled={isProcessing}
                className="w-full inline-flex items-center justify-center h-11 rounded-full bg-[hsl(220,85%,55%)] px-6 text-base font-semibold text-white hover:bg-[hsl(220,85%,55%)]/90 hover:shadow-lg focus:outline-none focus-visible:ring-4 focus-visible:ring-[hsl(220,85%,55%)]/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {isProcessing ? 'Converting...' : 'Convert to Grayscale'}
              </button>
            </div>
          )}
        </div>

        <div className="mt-8 flex items-center justify-center gap-2 text-sm text-[hsl(215,15%,45%)] bg-[hsl(210,15%,95%)]/50 rounded-full px-4 py-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          <span>Your files never leave your browser</span>
        </div>
      </main>
    </div>
  );
}