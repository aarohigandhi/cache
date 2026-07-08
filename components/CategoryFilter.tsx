"use client";

export function CategoryFilter({
  options,
  selected,
  onSelect,
}: {
  options: string[];
  selected: string | null;
  onSelect: (tag: string | null) => void;
}) {
  if (options.length === 0) {
    return null;
  }

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
      {options.map((tag) => (
        <button
          key={tag}
          onClick={() => onSelect(tag)}
          className={`rounded-full px-3 py-1 text-sm font-medium capitalize transition-colors ${
            selected === tag
              ? "bg-black text-white"
              : "border border-gray-300 text-gray-600 hover:bg-gray-50"
          }`}
        >
          {tag}
        </button>
      ))}
    </div>
  );
}