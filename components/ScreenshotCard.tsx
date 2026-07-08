"use client";

import { CATEGORY_COLORS, normalizeCategory } from "@/lib/categories";

export type Screenshot = {
  id: string;
  file_url: string;
  file_name: string;
  created_at: string;
  extracted_text: string | null;
  category: string | null;
  tags: string[] | null;
  description: string | null;
  status: string | null;
  album_id: string | null;
};

export function ScreenshotCard({
  screenshot,
  onClick,
  onDelete,
  deleting,
}: {
  screenshot: Screenshot;
  onClick: () => void;
  onDelete: () => void;
  deleting: boolean;
}) {
  const { file_url, file_name, category, tags, status } = screenshot;
  const visibleTags = tags?.slice(0, 3) ?? [];
  const overflowCount = (tags?.length ?? 0) - visibleTags.length;

  return (
    <div className="relative cursor-pointer" onClick={onClick}>
      <img
        src={file_url}
        alt={file_name}
        className="aspect-square w-full rounded-lg object-cover"
      />

      <button
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
        disabled={deleting}
        className="absolute top-2 right-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/70 text-white disabled:opacity-50"
        aria-label="Remove screenshot"
      >
        ×
      </button>

      <div className="mt-1 flex flex-wrap items-center gap-1">
        {status === "failed" ? (
          <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800">
            failed
          </span>
        ) : status === "pending" ? (
          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
            processing...
          </span>
        ) : category ? (
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-medium ${
              CATEGORY_COLORS[normalizeCategory(category)]
            }`}
          >
            {normalizeCategory(category)}
          </span>
        ) : null}

        {visibleTags.map((tag) => (
          <span
            key={tag}
            className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600"
          >
            {tag}
          </span>
        ))}
        {overflowCount > 0 && (
          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
            +{overflowCount}
          </span>
        )}
      </div>
    </div>
  );
}
