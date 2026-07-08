"use client";

import { CATEGORY_COLORS, normalizeCategory } from "@/lib/categories";

export type Album = {
  id: string;
  name: string;
  created_at: string;
};

export function AlbumCard({
  album,
  coverUrl,
  count,
  categories,
  onClick,
  onRename,
}: {
  album: Album;
  coverUrl: string | null;
  count: number;
  categories: string[];
  onClick: () => void;
  onRename: () => void;
}) {
  const visibleCategories = categories.filter((c) => c !== "other");

  return (
    <div className="relative">
      <button
        onClick={onClick}
        className="flex w-full flex-col overflow-hidden rounded-lg border text-left hover:shadow-md"
      >
        {coverUrl ? (
          <img
            src={coverUrl}
            alt={album.name}
            className="aspect-square w-full object-cover"
          />
        ) : (
          <div className="flex aspect-square w-full items-center justify-center bg-gray-100 text-gray-400">
            No photos
          </div>
        )}
        <div className="p-2">
          <p className="truncate text-sm font-medium">{album.name}</p>
          <p className="mb-1 text-xs text-gray-500">
            {count} screenshot{count === 1 ? "" : "s"}
          </p>
          {visibleCategories.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {visibleCategories.map((category) => (
                <span
                  key={category}
                  className="rounded-full px-2 py-0.5 text-[10px] font-medium capitalize"
                  style={{
                    backgroundColor: CATEGORY_COLORS[normalizeCategory(category)].bg,
                    color: CATEGORY_COLORS[normalizeCategory(category)].text,
                  }}
                >
                  {category}
                </span>
              ))}
            </div>
          )}
        </div>
      </button>

      <button
        onClick={(e) => {
          e.stopPropagation();
          onRename();
        }}
        className="absolute top-2 right-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/70 text-white"
        aria-label="Rename album"
      >
        ✎
      </button>
    </div>
  );
}