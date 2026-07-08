# Architecture

## Flow

```
                     ┌───────────────────────┐
  User picks a       │   Browser (Next.js)   │
  screenshot   ─────▶│  upload button, grid  │
                     └──────────┬────────────┘
                                │ POST /api/upload (multipart file)
                                ▼
                     ┌───────────────────────┐
                     │  app/api/upload/route │
                     └──────────┬────────────┘
                                │
              ┌─────────────────┼─────────────────┐
              ▼                 ▼                 ▼
      Supabase Storage   OpenAI Vision      OpenAI Embeddings
      (save the file,     (gpt-4o-mini:     (text-embedding-3-small:
       get public URL)     extract text,     embed description +
                            category, tags,   text + tags)
                            description)
              │                 │                 │
              └────────┬────────┴────────┬────────┘
                        ▼                 ▼
                 screenshots table (Postgres + pgvector)
                 file_url, file_name, extracted_text,
                 category, tags, description, embedding

                                │
                                │ user types a search query
                                ▼
                     ┌───────────────────────┐
                     │  app/api/search/route │
                     └──────────┬────────────┘
                                │ embed query -> cosine similarity
                                │ via match_screenshots() Postgres fn
                                ▼
                     ranked screenshots back to the browser
```

## Pieces

- **Frontend** (Next.js + Tailwind, deployed on Vercel): upload button, responsive grid, search bar. Talks to the two API routes below and reads directly from Supabase for the initial grid load.
- **`POST /api/upload`**: stores the file in Supabase Storage, inserts a row, then (best-effort — failures here don't fail the upload) calls the vision model and embeddings model and updates the row with the results.
- **`POST /api/search`**: embeds the query text, calls a Postgres function (`match_screenshots`) that does cosine similarity search over the `embedding` column via pgvector, returns the closest matches above a similarity threshold.
- **Supabase**: Postgres (the `screenshots` table + `match_screenshots` function), Storage (the actual image files, public bucket), pgvector extension for the embedding column and ivfflat index.
- **OpenAI**: `gpt-4o-mini` for vision/tagging, `text-embedding-3-small` for search vectors.

## Why these choices

- One Next.js app (frontend + API routes together) instead of a separate backend — v1 doesn't need the operational overhead of a second service.
- Vision and embedding calls happen synchronously inside the upload request rather than a background job queue — simpler for v1, at the cost of upload latency (see below). Worth revisiting if/when uploads need to feel instant.
- pgvector inside the existing Postgres instance instead of a dedicated vector DB — one fewer system to run, and query volume at this stage doesn't need a specialized index.

## Latency & cost budget

**Upload → searchable latency**: measured end-to-end (storage upload + vision call + embedding call, all synchronous) at ~3.2s for a small, textless test image. Real screenshots with more visual detail and text to extract will run higher — worth re-measuring with real dogfooding data once M2/M3 are in daily use, since this is currently the single biggest lever if uploads start to feel slow (candidate fix: move vision/embedding to a background job and let the UI show "processing..." instead of blocking the upload response — noted in the roadmap rather than built now, since it's not yet a proven problem).

**API cost per screenshot**: two calls per upload —
1. One `gpt-4o-mini` vision request (image + short prompt in, small JSON out)
2. One `text-embedding-3-small` request (a few hundred tokens of text in)

Both are OpenAI's cheapest models in their class, chosen specifically to keep per-screenshot cost low at v1 scale. Exact per-screenshot cost depends on current OpenAI pricing (check platform.openai.com/pricing for up-to-date rates) — at these two models' pricing tiers this comes out to a small fraction of a cent per screenshot, so the real budget constraint at this stage is the $5 in credits currently funding the project, not per-call cost. Worth tracking actual spend in the OpenAI dashboard once real dogfooding volume starts, and revisiting if usage scales toward hundreds of screenshots/day.
