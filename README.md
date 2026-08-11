# BIT'O PYQs — Tier 1 MVP

> An intelligent, AI-assisted question bank platform for university students to search, upload, and clean previous year questions (PYQs) with automated deduplication and smart metadata extraction.

## 🚀 Tech Stack ($0/month Zero-Cost Architecture)

- **Frontend**: React (Vite) + TailwindCSS + React Query (Hosted on **Vercel**)
- **Backend**: Node.js + Express + `express-rate-limit` (Hosted on **Render**)
- **Database**: PostgreSQL + `pgvector` extension (Hosted on **Neon**)
- **Storage**: Cloudinary (In-memory buffer upload)
- **OCR Engine**: Tesseract.js + sharp preprocessing
- **Semantic Embeddings**: Transformers.js (`Xenova/all-MiniLM-L6-v2`, 384-dim)
- **Filename Parsing LLM**: Groq API (Structured JSON Mode)
- **Authentication**: JWT + bcrypt

## Database Setup

This project uses Neon PostgreSQL with `pgvector` for local embedding storage.
1. Create a free Neon account.
2. Run `CREATE EXTENSION IF NOT EXISTS vector;` in the SQL editor.
3. Run the schema creation commands from the `Day 4` roadmap outline.
4. Add the Neon connection string to the server's `.env` file as `DATABASE_URL`.

## 📁 Repository Structure

```text
bito-pyqs/
├── client/    # React + Vite frontend
├── server/    # Express REST API & local AI execution
└── docs/      # System architecture & deployment docs