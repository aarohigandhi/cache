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

## Category taxonomy

Current set (9): `recipe, outfit, travel, quote, listing, meme, social, receipt, other`.

The product one-liner originally scoped 7 (`recipe, outfit, travel, quote, listing, meme, other`), matched to the three launch personas (recipe savers, outfit collectors, apartment hunters via `listing`). Two more got added after reviewing what real screenshots actually look like: `social` (screenshotted tweets/Instagram posts — one of the single most common screenshot types, previously would've been misfiled under `quote` or `other`) and `receipt` (receipts/order confirmations/documents, a distinct enough type to warrant its own bucket rather than falling into `other`).

Stopped at 9 rather than going further: the plan's own guidance is 6-8 for accuracy, and every category added increases the chance the model — and the M4 eval — has to draw a fuzzier line between similar buckets (e.g. `quote` vs `social`, `listing` vs `receipt`). 9 was judged the right trade given real screenshot coverage; if M4's per-category accuracy numbers show heavy confusion between any two categories, that's the signal to merge them back down rather than add more.

## Sync vs. async processing (design tradeoff)

Upload processing (storage → vision → embedding) runs **synchronously** inside the `/api/upload` request for v1 — the client waits ~3-4s and gets back a fully tagged row. Chosen over an async job queue (upload returns instantly, card shows "processing...", results fill in later) because it's simpler to build and reason about, and correctness (see: `status` column below) matters more than latency at this stage.

Known breaking point: Vercel's default function timeout (~10s on the free tier) is fine for one image at a time, but this design doesn't survive someone uploading 50 screenshots at once — that's the concrete trigger for moving to the async design later, not a hypothetical. Noting it here now, deliberately, rather than building the queue before it's a proven problem.

To make the sync design degrade gracefully rather than silently: every screenshot gets a `status` column (`pending` → `done` or `failed`). If the vision/embedding call throws for any reason (bad JSON from the model, API timeout, network error), the row still exists with the raw file saved, `status` is set to `failed`, and the raw model output gets logged server-side so a parse failure is debuggable instead of a silent gap.

## Latency & cost budget

**Upload → searchable latency**: measured end-to-end (storage upload + vision call + embedding call, all synchronous) at ~3.2s for a small, textless test image. Real screenshots with more visual detail and text to extract will run higher — worth re-measuring with real dogfooding data once M2/M3 are in daily use, since this is currently the single biggest lever if uploads start to feel slow (candidate fix: move vision/embedding to a background job and let the UI show "processing..." instead of blocking the upload response — noted in the roadmap rather than built now, since it's not yet a proven problem).

**API cost per screenshot**: two calls per upload —
1. One `gpt-4o-mini` vision request (image + short prompt in, small JSON out)
2. One `text-embedding-3-small` request (a few hundred tokens of text in)

Both are OpenAI's cheapest models in their class, chosen specifically to keep per-screenshot cost low at v1 scale. Exact per-screenshot cost depends on current OpenAI pricing (check platform.openai.com/pricing for up-to-date rates) — at these two models' pricing tiers this comes out to a small fraction of a cent per screenshot, so the real budget constraint at this stage is the $5 in credits currently funding the project, not per-call cost. Worth tracking actual spend in the OpenAI dashboard once real dogfooding volume starts, and revisiting if usage scales toward hundreds of screenshots/day.
