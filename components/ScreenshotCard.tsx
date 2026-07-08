"use client";

import { CATEGORY_COLORS, colorForTag, normalizeCategory } from "@/lib/categories";

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
  selectMode = false,
  selected = false,
  onToggleSelect,
}: {
  screenshot: Screenshot;
  onClick: () => void;
  onDelete: () => void;
  deleting: boolean;
  selectMode?: boolean;
  selected?: boolean;
  onToggleSelect?: () => void;
}) {
  const { file_url, file_name, category, tags, status } = screenshot;
  const visibleTags = tags?.slice(0, 3) ?? [];
  const overflowCount = (tags?.length ?? 0) - visibleTags.length;
  const normalizedCategory = normalizeCategory(category);
  const categoryColors = CATEGORY_COLORS[normalizedCategory];

  function handleCardClick() {
    if (selectMode) {
      onToggleSelect?.();
    } else {
      onClick();
    }
  }

  return (
    <div className="relative cursor-pointer" onClick={handleCardClick}>
      <img
        src={file_url}
        alt={file_name}
        className={`aspect-square w-full rounded-lg object-cover ${
          selectMode && selected ? "ring-2 ring-black ring-offset-2" : ""
        }`}
      />

      {selectMode ? (
        <div
          className={`absolute top-2 right-2 flex h-6 w-6 items-center justify-center rounded-full border-2 border-white ${
            selected ? "bg-black" : "bg-black/40"
          }`}
        >
          {selected && (
            <div className="h-2.5 w-2.5 rounded-full bg-white" />
          )}
        </div>
      ) : (
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
      )}

      <div className="mt-1 flex flex-wrap items-center gap-1">
        {status === "failed" ? (
          <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800">
            failed
          </span>
        ) : status === "pending" ? (
          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
            processing...
          </span>
        ) : normalizedCategory !== "other" ? (
          <span
            className="rounded-full px-2 py-0.5 text-xs font-medium"
            style={{ backgroundColor: categoryColors.bg, color: categoryColors.text }}
          >
            {normalizedCategory}
          </span>
        ) : null}

        {visibleTags.map((tag) => {
          const colors = colorForTag(tag);
          return (
            <span
              key={tag}
              className="rounded-full px-2 py-0.5 text-xs"
              style={{ backgroundColor: colors.bg, color: colors.text }}
            >
              {tag}
            </span>
          );
        })}
        {overflowCount > 0 && (
          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
            +{overflowCount}
          </span>
        )}
      </div>
    </div>
  );
}