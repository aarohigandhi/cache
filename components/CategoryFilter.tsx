"use client";

import { CATEGORIES, CATEGORY_COLORS } from "@/lib/categories";

export function CategoryFilter({
  selected,
  onSelect,
}: {
  selected: string | null;
  onSelect: (category: string | null) => void;
}) {
  return (
    <div className="mb-6 flex flex-wrap gap-2">
      <button
        onClick={() => onSelect(null)}
        className={`rounded-full px-3 py-1 text-sm font-medium transition-colors ${
          selected === null
            ? "bg-black text-white"
            : "border border-gray-300 text-gray-600 hover:bg-gray-50"
        }`}
      >
        All
      </button>
      {CATEGORIES.filter((category) => category !== "other").map(
        (category) => (
          <button
            key={category}
            onClick={() => onSelect(category)}
            className={`rounded-full px-3 py-1 text-sm font-medium capitalize transition-colors ${
              selected === category
                ? `${CATEGORY_COLORS[category]} ring-2 ring-black`
                : "border border-gray-300 text-gray-600 hover:bg-gray-50"
            }`}
          >
            {category}
          </button>
        )
      )}
    </div>
  );
}