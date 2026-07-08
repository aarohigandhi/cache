export const CATEGORIES = [
  "recipe",
  "outfit",
  "travel",
  "quote",
  "listing",
  "meme",
  "social",
  "receipt",
  "other",
] as const;

export type Category = (typeof CATEGORIES)[number];

export type CategoryColor = { bg: string; text: string };

// Inline color values (not Tailwind classes) on purpose: this app's
// globals.css sets `body { color: var(--foreground) }` outside any
// Tailwind @layer block, which in Tailwind v4 beats layered utility
// classes regardless of specificity. Inline styles always win, so
// badge colors render correctly regardless of that cascade quirk.
export const CATEGORY_COLORS: Record<Category, CategoryColor> = {
  recipe: { bg: "rgba(254,215,170,0.3)", text: "#c2410c" },
  outfit: { bg: "rgba(191,219,254,0.3)", text: "#1d4ed8" },
  travel: { bg: "rgba(251,207,232,0.3)", text: "#be185d" },
  quote: { bg: "rgba(233,213,255,0.3)", text: "#7e22ce" },
  listing: { bg: "rgba(187,247,208,0.3)", text: "#15803d" },
  meme: { bg: "rgba(254,240,138,0.3)", text: "#a16207" },
  social: { bg: "rgba(199,210,254,0.3)", text: "#4338ca" },
  receipt: { bg: "rgba(153,246,228,0.3)", text: "#0f766e" },
  other: { bg: "rgba(229,231,235,0.3)", text: "#374151" },
};

export function normalizeCategory(
  value: string | null | undefined
): Category {
  const normalized = value?.trim().toLowerCase();
  return (CATEGORIES as readonly string[]).includes(normalized ?? "")
    ? (normalized as Category)
    : "other";
}

// Derives a chip list from what's actually in the library, instead of
// a fixed hardcoded set: tallies every tag across all screenshots and
// returns the most common ones. If most uploads are sunsets, "sunset"
// shows up here; if some are desserts, "dessert" does too.
export function getTopTags(
  screenshots: { tags: string[] | null }[],
  limit = 7
): string[] {
  const counts = new Map<string, number>();
  for (const s of screenshots) {
    for (const rawTag of s.tags ?? []) {
      const tag = rawTag.trim().toLowerCase();
      if (!tag) continue;
      counts.set(tag, (counts.get(tag) ?? 0) + 1);
    }
  }
  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([tag]) => tag);
}