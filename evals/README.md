# Search Accuracy Eval

Methodology: a labeled set of screenshots (`data/labels.json`, one entry per screenshot with its true category) and a set of natural-language search queries (`data/queries.json`, each paired with the screenshot it should retrieve). The harness runs each query against `/api/search`, checks whether the expected screenshot appears in the top 3 results, and reports accuracy overall and per category.

Target: 100 labeled screenshots, 50 queries, before this becomes a meaningful accuracy number for the README.

## Running it

1. Upload the real screenshots referenced in `data/labels.json` through the app first (so they exist in Supabase with embeddings).
2. Make sure the dev server is running (`npm run dev`) or set `EVAL_BASE_URL` to point at a deployed instance.
3. Run:

```bash
npm run eval
```

## Results

_Not yet populated — placeholder data in `data/` needs to be replaced with a real labeled set before this table means anything._

| Category | Queries | Top-3 hits | Accuracy |
| --- | --- | --- | --- |
| — | — | — | — |
