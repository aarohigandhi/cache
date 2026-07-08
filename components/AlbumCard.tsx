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
}: {
  album: Album;
  coverUrl: string | null;
  count: number;
  categories: string[];
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col overflow-hidden rounded-lg border text-left hover:shadow-md"
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
        {categories.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {categories.map((category) => (
              <span
                key={category}
                className={`rounded-full px-2 py-0.5 text-[10px] font-medium capitalize ${
                  CATEGORY_COLORS[normalizeCategory(category)]
                }`}
              >
                {category}
              </span>
            ))}
          </div>
        )}
      </div>
    </button>
  );
}