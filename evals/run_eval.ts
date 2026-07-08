import "dotenv/config";
import { readFileSync } from "fs";
import { join } from "path";

const BASE_URL = process.env.EVAL_BASE_URL ?? "http://localhost:3000";

type QueryCase = { query: string; expected_file_name: string };
type LabelCase = { file_name: string; expected_category: string };

async function searchTopN(query: string, n = 3) {
  const res = await fetch(`${BASE_URL}/api/search`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query }),
  });
  if (!res.ok) {
    throw new Error(`search failed for "${query}": ${res.status} ${await res.text()}`);
  }
  const results = (await res.json()) as { file_name: string; category: string }[];
  return results.slice(0, n);
}

async function main() {
  const queries: QueryCase[] = JSON.parse(
    readFileSync(join(__dirname, "data/queries.json"), "utf-8")
  );
  const labels: LabelCase[] = JSON.parse(
    readFileSync(join(__dirname, "data/labels.json"), "utf-8")
  );

  const categoryTotals = new Map<string, { hits: number; total: number }>();
  let overallHits = 0;

  for (const { query, expected_file_name } of queries) {
    const top3 = await searchTopN(query);
    const hit = top3.some((r) => r.file_name === expected_file_name);
    if (hit) overallHits += 1;

    const label = labels.find((l) => l.file_name === expected_file_name);
    const category = label?.expected_category ?? "unknown";
    const bucket = categoryTotals.get(category) ?? { hits: 0, total: 0 };
    bucket.total += 1;
    if (hit) bucket.hits += 1;
    categoryTotals.set(category, bucket);

    console.log(`${hit ? "✅" : "❌"} "${query}" -> expected ${expected_file_name}`);
  }

  console.log("\n| Category | Queries | Top-3 hits | Accuracy |");
  console.log("| --- | --- | --- | --- |");
  for (const [category, { hits, total }] of categoryTotals) {
    const pct = ((hits / total) * 100).toFixed(0);
    console.log(`| ${category} | ${total} | ${hits} | ${pct}% |`);
  }

  const overallPct = ((overallHits / queries.length) * 100).toFixed(0);
  console.log(`\nOverall top-3 accuracy: ${overallHits}/${queries.length} (${overallPct}%)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
