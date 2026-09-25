# BIT'O PYQs — Tier 1 MVP

> A full-stack, AI-assisted previous-year question (PYQ) bank for university students — upload exam questions as text, photographed images, or PDFs, and automatically detect which questions are being recycled across years while keeping the question bank free of redundant duplicates.

## 🚀 Tech Stack ($0/month Zero-Cost Architecture)

- **Frontend**: React (Vite) + TailwindCSS + React Query (Hosted on **Vercel**)
- **Backend**: Node.js + Express + `express-rate-limit` (Hosted on **Render**)
- **Database**: PostgreSQL + `pgvector` extension (Hosted on **Neon**)
- **Storage**: Cloudinary (in-memory buffer upload, no disk writes)
- **OCR Engine**: Tesseract.js + `sharp` preprocessing, including automatic deskew correction for crookedly photographed papers
- **PDF Parsing**: `pdf-parse` for native text-layer extraction, with a `pdfjs-dist` + `@napi-rs/canvas` page-rendering fallback (feeding the same OCR pipeline) for scanned PDFs
- **Semantic Embeddings**: Transformers.js (`Xenova/all-MiniLM-L6-v2`, 384-dim), run locally — no external embedding API or per-call cost
- **Filename Parsing LLM**: Groq API (structured JSON mode), used only as a fallback when regex-based filename parsing has low confidence
- **Authentication**: JWT + bcrypt, session-scoped tokens (cleared on browser close)

## How Duplicate Detection Works

Every submitted question is checked against the existing question bank **before** it's saved, scoped to the same subject:

- A near-identical match found in a **different exam paper** (different year/semester/exam type) is treated as a genuine recurring question — it's saved, and the app shows how many times and where it's appeared before.
- A near-identical match found in the **same paper** is treated as redundant (an accidental double-paste, a bad OCR split, or a duplicate submission) and is silently skipped — nothing is added, no manual review required.

This distinction is what lets the app track genuine question recurrence over time without the database filling up with copies of the same submission.

## Database Setup

This project uses Neon PostgreSQL with `pgvector` for local embedding storage.
1. Create a free Neon account.
2. Run `CREATE EXTENSION IF NOT EXISTS vector;` in the SQL editor.
3. Run the schema creation commands from the `Day 4` roadmap outline.
4. Add the Neon connection string to the server's `.env` file as `DATABASE_URL`.

## Known Limitations (Tier 1 MVP)

* **OCR Alignment:** Deskew correction handles tilted photographs automatically, but for best OCR accuracy, still try to photograph question papers reasonably flat and well-lit.
* **PDF reference images:** For PDFs that fall back to OCR (scanned/non-text-layer documents), the extracted text is saved but the original page image is not — there's no visual reference to double-check OCR output against for PDF uploads, unlike photographed questions, which always keep their source image. A deliberate scope decision for Tier 1, not an oversight.
* **Test coverage:** Core decision logic (filename inference, text splitting, duplicate-detection, deskew angle selection, PDF text-layer detection) has unit test coverage. The underlying OCR, image-processing, and PDF-rendering pipelines are not unit tested — they depend on real image/PDF fixtures and are better suited to integration testing, which isn't part of this Tier 1 scope.

## 📁 Repository Structure

```text
bito-pyqs/
├── client/    # React + Vite frontend
└── server/    # Express REST API & local AI execution
```