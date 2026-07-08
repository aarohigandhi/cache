"use client";

import { useState, type FormEvent } from "react";

export function SearchBar({
  onSearch,
  onClear,
}: {
  onSearch: (query: string) => Promise<void>;
  onClear: () => void;
}) {
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [active, setActive] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    setSearching(true);
    await onSearch(query.trim());
    setSearching(false);
    setActive(true);
  }

  function handleClear() {
    setQuery("");
    setActive(false);
    onClear();
  }

  return (
    <form onSubmit={handleSubmit} className="mb-6 flex gap-2">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search your screenshots..."
        className="flex-1 rounded-lg border px-4 py-2 text-sm"
      />
      <button
        type="submit"
        disabled={searching}
        className="rounded-lg bg-black px-4 py-2 text-sm text-white disabled:opacity-50"
      >
        {searching ? "Searching..." : "Search"}
      </button>
      {active && (
        <button
          type="button"
          onClick={handleClear}
          className="rounded-lg border px-4 py-2 text-sm"
        >
          Clear
        </button>
      )}
    </form>
  );
}
