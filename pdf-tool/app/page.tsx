import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[hsl(210,20%,98%)]">
      {/* Hero Section */}
      <section className="bg-white border-b border-[hsl(210,15%,90%)]">
        <div className="mx-auto w-full max-w-6xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 text-xs font-medium text-[hsl(215,15%,45%)] mb-6">
              <span className="rounded-full border border-[hsl(210,15%,90%)] bg-[hsl(210,15%,95%)] px-3 py-1">
                100% open-source
              </span>
            </div>

            <h1 className="text-balance text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl mb-6 text-[hsl(215,25%,15%)]">
              PDF tools that respect your privacy
            </h1>

            <p className="mx-auto max-w-2xl text-pretty text-lg leading-8 text-[hsl(215,15%,45%)] mb-10">
              Every tool runs entirely in your browser. Your files never leave your device.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/merge"
                className="inline-flex items-center justify-center h-11 rounded-full bg-[hsl(220,85%,55%)] px-8 text-base font-semibold text-white shadow-sm hover:bg-[hsl(220,85%,55%)]/90 hover:shadow-lg focus:outline-none focus-visible:ring-4 focus-visible:ring-[hsl(220,85%,55%)]/20 transition-all"
              >
                Get Started
                <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
              <a
                href="https://github.com/abhishekbelgaonkar-alt/osspdf"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center h-11 rounded-full border border-[hsl(210,15%,90%)] bg-white px-8 text-base font-semibold text-[hsl(215,25%,15%)] shadow-sm hover:bg-[hsl(210,15%,95%)] focus:outline-none focus-visible:ring-4 focus-visible:ring-[hsl(220,85%,55%)]/20 transition-all"
              >
                <svg className="mr-2 w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                </svg>
                View on GitHub
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-16">
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-balance text-2xl font-semibold tracking-tight mb-4 text-[hsl(215,25%,15%)]">
              How it works
            </h2>
            <p className="text-lg text-[hsl(215,15%,45%)]">
              Simple, secure, and straightforward
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            <div className="text-center p-6 rounded-xl bg-white border border-[hsl(210,15%,90%)] shadow-sm">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[hsl(220,85%,55%)] text-white font-bold">
                1
              </div>
              <h3 className="text-lg font-semibold mb-2 text-[hsl(215,25%,15%)]">Choose a tool</h3>
              <p className="text-[hsl(215,15%,45%)]">
                Select from our collection of PDF utilities below
              </p>
            </div>

            <div className="text-center p-6 rounded-xl bg-white border border-[hsl(210,15%,90%)] shadow-sm">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[hsl(220,85%,55%)] text-white font-bold">
                2
              </div>
              <h3 className="text-lg font-semibold mb-2 text-[hsl(215,25%,15%)]">Upload your PDF</h3>
              <p className="text-[hsl(215,15%,45%)]">
                It stays in your browser — never uploaded to any server
              </p>
            </div>

            <div className="text-center p-6 rounded-xl bg-white border border-[hsl(210,15%,90%)] shadow-sm">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[hsl(220,85%,55%)] text-white font-bold">
                3
              </div>
              <h3 className="text-lg font-semibold mb-2 text-[hsl(215,25%,15%)]">Download the result</h3>
              <p className="text-[hsl(215,15%,45%)]">
                Get your processed PDF instantly
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Tools Grid */}
      <section className="py-16">
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-balance text-2xl font-semibold tracking-tight mb-4 text-[hsl(215,25%,15%)]">
              PDF Tools
            </h2>
            <p className="text-lg text-[hsl(215,15%,45%)]">
              Everything you need to work with PDFs
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Link
              href="/merge"
              className="group rounded-xl border border-[hsl(210,15%,90%)] bg-white p-6 shadow-sm hover:border-[hsl(220,85%,55%)]/50 hover:shadow-lg transition-all"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-lg bg-[hsl(220,85%,55%)]/10 flex items-center justify-center text-[hsl(220,85%,55%)] group-hover:bg-[hsl(220,85%,55%)] group-hover:text-white transition-all flex-none">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold mb-2 text-[hsl(215,25%,15%)]">
                    Merge PDFs
                  </h3>
                  <p className="text-sm text-[hsl(215,15%,45%)]">
                    Combine multiple PDF files into a single document
                  </p>
                </div>
              </div>
            </Link>

            <Link
              href="/split"
              className="group rounded-xl border border-[hsl(210,15%,90%)] bg-white p-6 shadow-sm hover:border-[hsl(220,85%,55%)]/50 hover:shadow-lg transition-all"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-lg bg-[hsl(220,85%,55%)]/10 flex items-center justify-center text-[hsl(220,85%,55%)] group-hover:bg-[hsl(220,85%,55%)] group-hover:text-white transition-all flex-none">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold mb-2 text-[hsl(215,25%,15%)]">
                    Split PDF
                  </h3>
                  <p className="text-sm text-[hsl(215,15%,45%)]">
                    Extract pages or split into multiple documents
                  </p>
                </div>
              </div>
            </Link>

            <Link
              href="/compress"
              className="group rounded-xl border border-[hsl(210,15%,90%)] bg-white p-6 shadow-sm hover:border-[hsl(220,85%,55%)]/50 hover:shadow-lg transition-all"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-lg bg-[hsl(220,85%,55%)]/10 flex items-center justify-center text-[hsl(220,85%,55%)] group-hover:bg-[hsl(220,85%,55%)] group-hover:text-white transition-all flex-none">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold mb-2 text-[hsl(215,25%,15%)]">
                    Compress PDF
                  </h3>
                  <p className="text-sm text-[hsl(215,15%,45%)]">
                    Reduce file size while maintaining quality
                  </p>
                </div>
              </div>
            </Link>

            <Link
              href="/pdf-to-image"
              className="group rounded-xl border border-[hsl(210,15%,90%)] bg-white p-6 shadow-sm hover:border-[hsl(220,85%,55%)]/50 hover:shadow-lg transition-all"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-lg bg-[hsl(220,85%,55%)]/10 flex items-center justify-center text-[hsl(220,85%,55%)] group-hover:bg-[hsl(220,85%,55%)] group-hover:text-white transition-all flex-none">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold mb-2 text-[hsl(215,25%,15%)]">
                    PDF to Image
                  </h3>
                  <p className="text-sm text-[hsl(215,15%,45%)]">
                    Convert PDF pages to high-quality images
                  </p>
                </div>
              </div>
            </Link>

            <Link
              href="/image-to-pdf"
              className="group rounded-xl border border-[hsl(210,15%,90%)] bg-white p-6 shadow-sm hover:border-[hsl(220,85%,55%)]/50 hover:shadow-lg transition-all"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-lg bg-[hsl(220,85%,55%)]/10 flex items-center justify-center text-[hsl(220,85%,55%)] group-hover:bg-[hsl(220,85%,55%)] group-hover:text-white transition-all flex-none">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold mb-2 text-[hsl(215,25%,15%)]">
                    Image to PDF
                  </h3>
                  <p className="text-sm text-[hsl(215,15%,45%)]">
                    Convert JPG and PNG images to a single PDF document
                  </p>
                </div>
              </div>
            </Link>

            <Link
              href="/rotate"
              className="group rounded-xl border border-[hsl(210,15%,90%)] bg-white p-6 shadow-sm hover:border-[hsl(220,85%,55%)]/50 hover:shadow-lg transition-all"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-lg bg-[hsl(220,85%,55%)]/10 flex items-center justify-center text-[hsl(220,85%,55%)] group-hover:bg-[hsl(220,85%,55%)] group-hover:text-white transition-all flex-none">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold mb-2 text-[hsl(215,25%,15%)]">
                    Rotate & Reorder
                  </h3>
                  <p className="text-sm text-[hsl(215,15%,45%)]">
                    Rotate pages and change their order
                  </p>
                </div>
              </div>
            </Link>

            <Link
              href="/watermark"
              className="group rounded-xl border border-[hsl(210,15%,90%)] bg-white p-6 shadow-sm hover:border-[hsl(220,85%,55%)]/50 hover:shadow-lg transition-all"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-lg bg-[hsl(220,85%,55%)]/10 flex items-center justify-center text-[hsl(220,85%,55%)] group-hover:bg-[hsl(220,85%,55%)] group-hover:text-white transition-all flex-none">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold mb-2 text-[hsl(215,25%,15%)]">
                    Add Watermark
                  </h3>
                  <p className="text-sm text-[hsl(215,15%,45%)]">
                    Add text or image watermarks to your PDFs
                  </p>
                </div>
              </div>
            </Link>

            <Link
              href="/page-numbers"
              className="group rounded-xl border border-[hsl(210,15%,90%)] bg-white p-6 shadow-sm hover:border-[hsl(220,85%,55%)]/50 hover:shadow-lg transition-all"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-lg bg-[hsl(220,85%,55%)]/10 flex items-center justify-center text-[hsl(220,85%,55%)] group-hover:bg-[hsl(220,85%,55%)] group-hover:text-white transition-all flex-none">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold mb-2 text-[hsl(215,25%,15%)]">
                    Add Page Numbers
                  </h3>
                  <p className="text-sm text-[hsl(215,15%,45%)]">
                    Add customizable page numbers to every page
                  </p>
                </div>
              </div>
            </Link>

            <Link
              href="/metadata"
              className="group rounded-xl border border-[hsl(210,15%,90%)] bg-white p-6 shadow-sm hover:border-[hsl(220,85%,55%)]/50 hover:shadow-lg transition-all"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-lg bg-[hsl(220,85%,55%)]/10 flex items-center justify-center text-[hsl(220,85%,55%)] group-hover:bg-[hsl(220,85%,55%)] group-hover:text-white transition-all flex-none">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold mb-2 text-[hsl(215,25%,15%)]">
                    Edit Metadata
                  </h3>
                  <p className="text-sm text-[hsl(215,15%,45%)]">
                    View and edit PDF document properties and information
                  </p>
                </div>
              </div>
            </Link>

            <Link
              href="/grayscale"
              className="group rounded-xl border border-[hsl(210,15%,90%)] bg-white p-6 shadow-sm hover:border-[hsl(220,85%,55%)]/50 hover:shadow-lg transition-all"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-lg bg-[hsl(220,85%,55%)]/10 flex items-center justify-center text-[hsl(220,85%,55%)] group-hover:bg-[hsl(220,85%,55%)] group-hover:text-white transition-all flex-none">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold mb-2 text-[hsl(215,25%,15%)]">
                    Convert to Grayscale
                  </h3>
                  <p className="text-sm text-[hsl(215,15%,45%)]">
                    Convert your PDF to grayscale while maintaining quality
                  </p>
                </div>
              </div>
            </Link>

            <Link
              href="/crop"
              className="group rounded-xl border border-[hsl(210,15%,90%)] bg-white p-6 shadow-sm hover:border-[hsl(220,85%,55%)]/50 hover:shadow-lg transition-all"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-lg bg-[hsl(220,85%,55%)]/10 flex items-center justify-center text-[hsl(220,85%,55%)] group-hover:bg-[hsl(220,85%,55%)] group-hover:text-white transition-all flex-none">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.121 14.121L19 19m-7-7l7-7m-7 7l-2.879 2.879M12 12L9.121 9.121m0 5.758a3 3 0 10-4.243 4.243 3 3 0 004.243-4.243zm0-5.758a3 3 0 10-4.243-4.243 3 3 0 004.243 4.243z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold mb-2 text-[hsl(215,25%,15%)]">
                    Crop Margins
                  </h3>
                  <p className="text-sm text-[hsl(215,15%,45%)]">
                    Trim margins from every page by setting crop boundaries
                  </p>
                </div>
              </div>
            </Link>

            <Link
              href="/pdf-to-text"
              className="group rounded-xl border border-[hsl(210,15%,90%)] bg-white p-6 shadow-sm hover:border-[hsl(220,85%,55%)]/50 hover:shadow-lg transition-all"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-lg bg-[hsl(220,85%,55%)]/10 flex items-center justify-center text-[hsl(220,85%,55%)] group-hover:bg-[hsl(220,85%,55%)] group-hover:text-white transition-all flex-none">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold mb-2 text-[hsl(215,25%,15%)]">
                    PDF to Text
                  </h3>
                  <p className="text-sm text-[hsl(215,15%,45%)]">
                    Extract plain text from PDF documents for easy copying
                  </p>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* Why osspdf */}
      <section className="py-16">
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-balance text-2xl font-semibold tracking-tight mb-4 text-[hsl(215,25%,15%)]">
              Why osspdf
            </h2>
            <p className="text-lg text-[hsl(215,15%,45%)]">
              Built with privacy and transparency in mind
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-[hsl(210,15%,90%)] bg-white p-8 shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-[hsl(220,85%,55%)]/10 flex items-center justify-center text-[hsl(220,85%,55%)]">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-[hsl(215,25%,15%)]">
                  Your files never leave your device
                </h3>
              </div>
              <p className="text-[hsl(215,15%,45%)]">
                All processing happens client-side in your browser using WebAssembly and JavaScript libraries.
              </p>
            </div>

            <div className="rounded-xl border border-[hsl(210,15%,90%)] bg-white p-8 shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-[hsl(220,85%,55%)]/10 flex items-center justify-center text-[hsl(220,85%,55%)]">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-[hsl(215,25%,15%)]">
                  No login required
                </h3>
              </div>
              <p className="text-[hsl(215,15%,45%)]">
                No accounts, no email, no tracking. Just tools.
              </p>
            </div>

            <div className="rounded-xl border border-[hsl(210,15%,90%)] bg-white p-8 shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-[hsl(220,85%,55%)]/10 flex items-center justify-center text-[hsl(220,85%,55%)]">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-[hsl(215,25%,15%)]">
                  Fully open-source
                </h3>
              </div>
              <p className="text-[hsl(215,15%,45%)]">
                Fork it, self-host it, or contribute. Built in the open.
              </p>
            </div>

            <div className="rounded-xl border border-[hsl(210,15%,90%)] bg-white p-8 shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-[hsl(220,85%,55%)]/10 flex items-center justify-center text-[hsl(220,85%,55%)]">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-[hsl(215,25%,15%)]">
                  Free forever
                </h3>
              </div>
              <p className="text-[hsl(215,15%,45%)]">
                No paywalls, no usage limits, no subscriptions.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[hsl(210,15%,90%)] bg-white py-12">
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="mb-4">
              <p className="text-sm text-[hsl(215,15%,45%)]">
                Built by{" "}
                <a
                  href="https://twitter.com/AbhishekBelgaon"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-[hsl(215,25%,15%)] hover:text-[hsl(220,85%,55%)] transition-colors"
                >
                  @AbhishekBelgaon
                </a>
              </p>
            </div>

            <div className="mb-4">
              <a
                href="https://github.com/abhishekbelgaonkar-alt/osspdf"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium text-[hsl(215,25%,15%)] hover:text-[hsl(220,85%,55%)] transition-colors"
              >
                osspdf is open-source on GitHub
              </a>
            </div>

            <div className="inline-flex items-center gap-2 text-xs text-[hsl(215,15%,45%)] bg-[hsl(210,15%,95%)]/50 rounded-full px-4 py-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <span>Your files are processed locally and never uploaded to any server</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}