# osspdf

> PDF tools that respect your privacy.

A fully open-source, client-side PDF toolkit. Every tool runs in your browser — your files never leave your device.

Built by [@AbhishekBelgaon](https://twitter.com/AbhishekBelgaon)

![License: MIT](https://img.shields.io/badge/License-MIT-zinc.svg)
![Next.js](https://img.shields.io/badge/Next.js-15-black)
![pdf-lib](https://img.shields.io/badge/made%20with-pdf--lib-informational)
![Open Source](https://img.shields.io/badge/open--source-yes-brightgreen)

---

## 🛠 Tools

| Tool | Description |
|------|-------------|
| Merge PDFs | Combine multiple PDFs into one |
| Split PDF | Extract pages or split into separate files |
| Compress PDF | Reduce file size by stripping metadata and bloat |
| PDF to Image | Convert pages to high-quality PNG/JPG |
| Rotate & Reorder | Rotate pages and drag to reorder |
| Add Watermark | Stamp text or image watermarks on every page |
| Add Page Numbers | Add customizable page numbers to every page |
| Edit Metadata | View and edit title, author, subject fields |
| Convert to Grayscale | Strip color from every page |
| Crop Margins | Trim page edges by setting a crop box |
| Image to PDF | Convert JPG/PNG images into a PDF document |
| PDF to Text | Extract plain text, copy or download as .txt |
| Remove Blank Pages | Auto-detect and remove empty pages |
| Flatten Form Fields | Lock filled forms into static content |
| Extract Pages as ZIP | Pull individual pages out as separate PDFs |

---

## 🔒 Privacy

All processing is done entirely client-side using pdf-lib and pdfjs-dist. No file is ever sent to a server. There is no analytics, no tracking, and no account required. What you upload stays on your machine.

---

## Tech stack

- [Next.js](https://nextjs.org) (App Router)
- TypeScript
- Tailwind CSS
- [pdf-lib](https://pdf-lib.js.org)
- [pdfjs-dist](https://mozilla.github.io/pdf.js) 3.11.174
- [jszip](https://stuk.github.io/jszip)

---

## Getting started

```bash
git clone https://github.com/abhishekbelgaonkar-alt/osspdf.git
cd osspdf/pdf-tool
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Contributing

PRs and issues are welcome. If you find a bug or want to suggest a new tool, open an issue at [github.com/abhishekbelgaonkar-alt/osspdf/issues](https://github.com/abhishekbelgaonkar-alt/osspdf/issues).

---

## What we don't support (and why)

- **Password protect / unlock** — pdf-lib has no encryption support
- **OCR on scanned PDFs** — too slow client-side, requires a server
- **Word / PowerPoint / Excel to PDF** — requires a headless browser or Office API, not possible in-browser
- **PDF translation** — requires an LLM or translation API

---

## License

MIT