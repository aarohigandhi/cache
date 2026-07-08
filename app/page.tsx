"use client";

import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import { ScreenshotCard, type Screenshot } from "@/components/ScreenshotCard";
import { ScreenshotDetailModal } from "@/components/ScreenshotDetailModal";
import { AlbumCard, type Album } from "@/components/AlbumCard";
import { SearchBar } from "@/components/SearchBar";
import { CategoryFilter } from "@/components/CategoryFilter";

export default function Home() {
  const [screenshots, setScreenshots] = useState<Screenshot[]>([]);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [selectedAlbumId, setSelectedAlbumId] = useState<string | null>(null);
  const [searchResults, setSearchResults] = useState<Screenshot[] | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({ done: 0, total: 0 });
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());
  const [selected, setSelected] = useState<Screenshot | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function loadScreenshots() {
    const { data } = await supabase
      .from("screenshots")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) {
      setScreenshots(data);
    }
  }

  async function loadAlbums() {
    const res = await fetch("/api/albums");
    const data = await res.json();
    if (Array.isArray(data)) {
      setAlbums(data);
    }
  }

  useEffect(() => {
    loadScreenshots();
    loadAlbums();
  }, []);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) {
      return;
    }
    const fileArray = Array.from(files);

    let albumId: string | null = null;
    if (fileArray.length > 1) {
      const defaultName = `Album ${new Date().toLocaleDateString()}`;
      const name = window.prompt(
        `Name this album of ${fileArray.length} screenshots:`,
        defaultName
      );
      if (name === null) {
        return;
      }
      const res = await fetch("/api/albums", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name || defaultName }),
      });
      const album = await res.json();
      albumId = album.id;
    }

    setUploading(true);
    setUploadProgress({ done: 0, total: fileArray.length });

    await Promise.all(
      fileArray.map(async (file) => {
        const formData = new FormData();
        formData.append("file", file);
        if (albumId) {
          formData.append("albumId", albumId);
        }
        await fetch("/api/upload", { method: "POST", body: formData });
        setUploadProgress((p) => ({ ...p, done: p.done + 1 }));
        await loadScreenshots();
      })
    );

    await loadAlbums();
    setUploading(false);
  }

  async function handleDelete(id: string) {
    setDeletingIds((prev) => new Set(prev).add(id));
    const res = await fetch(`/api/screenshots/${id}`, { method: "DELETE" });
    if (res.ok) {
      setScreenshots((prev) => prev.filter((s) => s.id !== id));
      setSearchResults((prev) => prev && prev.filter((s) => s.id !== id));
      setSelected((prev) => (prev?.id === id ? null : prev));
    }
    setDeletingIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }

  async function handleSearch(query: string) {
    setSelectedAlbumId(null);
    setSelectedCategory(null);
    const res = await fetch("/api/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query }),
    });
    const results = await res.json();
    setSearchResults(Array.isArray(results) ? results : []);
  }

  function handleClearSearch() {
    setSearchResults(null);
  }

  function openAlbum(id: string) {
    setSearchResults(null);
    setSelectedAlbumId(id);
  }

  function handleSelectCategory(category: string | null) {
    setSearchResults(null);
    setSelectedCategory(category);
  }

  async function createAlbum(name: string): Promise<string> {
    const res = await fetch("/api/albums", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    const album = await res.json();
    await loadAlbums();
    return album.id;
  }

  async function moveToAlbum(screenshotId: string, albumId: string | null) {
    const res = await fetch(`/api/screenshots/${screenshotId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ albumId }),
    });
    const updated = await res.json();
    setScreenshots((prev) =>
      prev.map((s) => (s.id === screenshotId ? updated : s))
    );
    setSearchResults(
      (prev) =>
        prev && prev.map((s) => (s.id === screenshotId ? updated : s))
    );
    setSelected((prev) => (prev?.id === screenshotId ? updated : prev));
    await loadAlbums();
  }

  const byCategory = (list: Screenshot[]) =>
    selectedCategory ? list.filter((s) => s.category === selectedCategory) : list;

  const ungroupedScreenshots = byCategory(
    screenshots.filter((s) => !s.album_id)
  );
  const albumScreenshots = selectedAlbumId
    ? byCategory(screenshots.filter((s) => s.album_id === selectedAlbumId))
    : [];
  const selectedAlbum = albums.find((a) => a.id === selectedAlbumId) ?? null;

  return (
    <main className="mx-auto max-w-5xl p-6">
      <h1 className="mb-6 text-3xl font-bold">Cache</h1>

      <SearchBar onSearch={handleSearch} onClear={handleClearSearch} />

      <button
        onClick={() => fileInputRef.current?.click()}
        disabled={uploading}
        className="mb-8 rounded-lg bg-black px-6 py-3 text-white disabled:opacity-50"
      >
        {uploading
          ? `Processing ${uploadProgress.done}/${uploadProgress.total}...`
          : "Upload screenshots"}
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={(e) => handleFiles(e.target.files)}
      />

      <CategoryFilter
        selected={selectedCategory}
        onSelect={handleSelectCategory}
      />

      {searchResults !== null ? (
        <>
          <h2 className="mb-4 text-lg font-semibold">
            Search results ({searchResults.length})
          </h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
            {searchResults.map((s) => (
              <ScreenshotCard
                key={s.id}
                screenshot={s}
                onClick={() => setSelected(s)}
                onDelete={() => handleDelete(s.id)}
                deleting={deletingIds.has(s.id)}
              />
            ))}
          </div>
        </>
      ) : selectedAlbumId ? (
        <>
          <button
            onClick={() => setSelectedAlbumId(null)}
            className="mb-4 text-sm text-gray-500 hover:text-black"
          >
            ← Back to albums
          </button>
          <h2 className="mb-4 text-lg font-semibold">
            {selectedAlbum?.name ?? "Album"}
          </h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
            {albumScreenshots.map((s) => (
              <ScreenshotCard
                key={s.id}
                screenshot={s}
                onClick={() => setSelected(s)}
                onDelete={() => handleDelete(s.id)}
                deleting={deletingIds.has(s.id)}
              />
            ))}
          </div>
        </>
      ) : (
        <>
          {albums.length > 0 && (
            <>
              <h2 className="mb-4 text-lg font-semibold">Albums</h2>
              <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
                {albums.map((album) => {
                  const albumShots = screenshots.filter(
                    (s) => s.album_id === album.id
                  );
                  return (
                    <AlbumCard
                      key={album.id}
                      album={album}
                      coverUrl={albumShots[0]?.file_url ?? null}
                      count={albumShots.length}
                      onClick={() => openAlbum(album.id)}
                    />
                  );
                })}
              </div>
            </>
          )}

          <h2 className="mb-4 text-lg font-semibold">All screenshots</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
            {ungroupedScreenshots.map((s) => (
              <ScreenshotCard
                key={s.id}
                screenshot={s}
                onClick={() => setSelected(s)}
                onDelete={() => handleDelete(s.id)}
                deleting={deletingIds.has(s.id)}
              />
            ))}
          </div>
        </>
      )}

      {selected && (
        <ScreenshotDetailModal
          screenshot={selected}
          albums={albums}
          onClose={() => setSelected(null)}
          onMove={(albumId) => moveToAlbum(selected.id, albumId)}
          onCreateAlbum={createAlbum}
        />
      )}
    </main>
  );
}
