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

export const CATEGORY_COLORS: Record<Category, string> = {
  recipe: "bg-orange-100 text-orange-800",
  outfit: "bg-pink-100 text-pink-800",
  travel: "bg-blue-100 text-blue-800",
  quote: "bg-purple-100 text-purple-800",
  listing: "bg-green-100 text-green-800",
  meme: "bg-yellow-100 text-yellow-800",
  social: "bg-indigo-100 text-indigo-800",
  receipt: "bg-teal-100 text-teal-800",
  other: "bg-gray-100 text-gray-800",
};

export function normalizeCategory(
  value: string | null | undefined
): Category {
  const normalized = value?.trim().toLowerCase();
  return (CATEGORIES as readonly string[]).includes(normalized ?? "")
    ? (normalized as Category)
    : "other";
}
