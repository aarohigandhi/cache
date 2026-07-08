"use client";

import { useEffect, useRef, type ChangeEvent } from "react";
import type { Screenshot } from "./ScreenshotCard";
import type { Album } from "./AlbumCard";
import { CATEGORY_COLORS, normalizeCategory } from "@/lib/categories";

const NO_ALBUM_VALUE = "__none__";
const NEW_ALBUM_VALUE = "__new__";

export function ScreenshotDetailModal({
  screenshot,
  albums,
  onClose,
  onMove,
  onCreateAlbum,
}: {
  screenshot: Screenshot;
  albums: Album[];
  onClose: () => void;
  onMove: (albumId: string | null) => void;
  onCreateAlbum: (name: string) => Promise<string>;
}) {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  async function handleAlbumChange(e: ChangeEvent<HTMLSelectElement>) {
    const value = e.target.value;
    if (value === NEW_ALBUM_VALUE) {
      const name = window.prompt("New album name:");
      if (name) {
        const newAlbumId = await onCreateAlbum(name);
        onMove(newAlbumId);
      }
      return;
    }
    onMove(value === NO_ALBUM_VALUE ? null : value);
  }

  return (
    <div
      ref={overlayRef}
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
    >
      <div className="max-h-full w-full max-w-2xl overflow-y-auto rounded-lg bg-white p-4">
        <div className="mb-3 flex justify-end">
          <button
            onClick={onClose}
            className="text-xl leading-none text-gray-500 hover:text-black"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <img
          src={screenshot.file_url}
          alt={screenshot.file_name}
          className="mb-4 w-full rounded-lg object-contain"
        />

        {screenshot.status === "failed" && (
          <p className="mb-2 inline-block rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800">
            failed to process
          </p>
        )}

        {screenshot.category && (
          <span
            className="mb-2 inline-block rounded-full px-2 py-0.5 text-xs font-medium"
            style={{
              backgroundColor: CATEGORY_COLORS[normalizeCategory(screenshot.category)].bg,
              color: CATEGORY_COLORS[normalizeCategory(screenshot.category)].text,
            }}
          >
            {normalizeCategory(screenshot.category)}
          </span>
        )}

        {screenshot.description && (
          <p className="mb-3 text-base">{screenshot.description}</p>
        )}

        {screenshot.tags && screenshot.tags.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-1">
            {screenshot.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full px-2 py-0.5 text-xs"
                style={{
                  backgroundColor: CATEGORY_COLORS[normalizeCategory(screenshot.category)].bg,
                  color: CATEGORY_COLORS[normalizeCategory(screenshot.category)].text,
                }}
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {screenshot.extracted_text && (
          <div className="mt-3 border-t pt-3">
            <p className="mb-1 text-xs font-medium tracking-wide text-gray-400 uppercase">
              Extracted text
            </p>
            <p className="text-sm whitespace-pre-wrap text-gray-700">
              {screenshot.extracted_text}
            </p>
          </div>
        )}

        <div className="mt-3 border-t pt-3">
          <label className="mb-1 block text-xs font-medium tracking-wide text-gray-400 uppercase">
            Album
          </label>
          <select
            value={screenshot.album_id ?? NO_ALBUM_VALUE}
            onChange={handleAlbumChange}
            className="w-full rounded-lg border px-3 py-2 text-sm"
          >
            <option value={NO_ALBUM_VALUE}>No album</option>
            {albums.map((album) => (
              <option key={album.id} value={album.id}>
                {album.name}
              </option>
            ))}
            <option value={NEW_ALBUM_VALUE}>+ New album...</option>
          </select>
        </div>
      </div>
    </div>
  );
}
