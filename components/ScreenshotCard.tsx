"use client";

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

export const CATEGORY_COLORS: Record<string, string> = {
  recipe: "bg-orange-200/30 text-orange-700",
  outfit: "bg-blue-200/30 text-blue-700",
  travel: "bg-pink-200/30 text-pink-700",
  quote: "bg-purple-200/30 text-purple-700",
  listing: "bg-green-200/30 text-green-700",
  meme: "bg-yellow-200/30 text-yellow-700",
  social: "bg-indigo-200/30 text-indigo-700",
  receipt: "bg-teal-200/30 text-teal-700",
  other: "bg-gray-200/30 text-gray-700",
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
  const colors = CATEGORY_COLORS[category ?? "other"] ?? CATEGORY_COLORS.other;

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
          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${colors}`}>
            {category}
          </span>
        ) : null}

        {visibleTags.map((tag) => (
          <span
            key={tag}
            className={`rounded-full px-2 py-0.5 text-xs ${colors}`}
          >
            {tag}
          </span>
        ))}
        {overflowCount > 0 && (
          <span className={`rounded-full px-2 py-0.5 text-xs ${colors}`}>
            +{overflowCount}
          </span>
        )}
      </div>
    </div>
  );
}
