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
              CATEGORY_COLORS[category] ?? CATEGORY_COLORS.other
            }`}
          >
            {category}
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
