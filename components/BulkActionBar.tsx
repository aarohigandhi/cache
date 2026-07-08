"use client";

import type { Album } from "./AlbumCard";

const NEW_ALBUM_VALUE = "__new__";

export function BulkActionBar({
  count,
  albums,
  onMove,
  onCreateAlbumAndMove,
  onDelete,
  onCancel,
}: {
  count: number;
  albums: Album[];
  onMove: (albumId: string) => void;
  onCreateAlbumAndMove: (name: string) => void;
  onDelete: () => void;
  onCancel: () => void;
}) {
  function handleMoveChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const value = e.target.value;
    if (!value) return;
    if (value === NEW_ALBUM_VALUE) {
      const name = window.prompt("New album name:");
      if (name) {
        onCreateAlbumAndMove(name);
      }
    } else {
      onMove(value);
    }
    e.target.value = "";
  }

  return (
    <div className="mb-6 flex flex-wrap items-center gap-3 rounded-lg border bg-gray-50 px-4 py-3">
      <span className="text-sm font-medium">{count} selected</span>
      <select
        onChange={handleMoveChange}
        defaultValue=""
        className="rounded-lg border px-3 py-1.5 text-sm"
      >
        <option value="" disabled>
          Move to album...
        </option>
        {albums.map((album) => (
          <option key={album.id} value={album.id}>
            {album.name}
          </option>
        ))}
        <option value={NEW_ALBUM_VALUE}>+ New album...</option>
      </select>
      <button
        onClick={onDelete}
        className="rounded-lg border border-red-300 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50"
      >
        Delete selected
      </button>
      <button
        onClick={onCancel}
        className="ml-auto text-sm text-gray-500 hover:text-black"
      >
        Cancel
      </button>
    </div>
  );
}