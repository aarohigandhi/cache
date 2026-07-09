"use client";

import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import { authFetch } from "@/lib/authFetch";
import { AuthGate } from "@/components/AuthGate";
import { ScreenshotCard, type Screenshot } from "@/components/ScreenshotCard";
import { ScreenshotDetailModal } from "@/components/ScreenshotDetailModal";
import { AlbumCard, type Album } from "@/components/AlbumCard";
import { SearchBar } from "@/components/SearchBar";
import { CategoryFilter } from "@/components/CategoryFilter";
import { BulkActionBar } from "@/components/BulkActionBar";
import { normalizeCategory, getTopTags } from "@/lib/categories";
import { track } from "@/lib/analytics";
import type { Session } from "@supabase/supabase-js";

const ONBOARDING_KEY = "cache_onboarded";

export default function Home() {
  return <AuthGate>{(session) => <CacheApp session={session} />}</AuthGate>;
}

function CacheApp({ session }: { session: Session }) {
  const [screenshots, setScreenshots] = useState<Screenshot[]>([]);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [selectedAlbumId, setSelectedAlbumId] = useState<string | null>(null);
  const [searchResults, setSearchResults] = useState<Screenshot[] | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({ done: 0, total: 0 });
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());
  const [selected, setSelected] = useState<Screenshot | null>(null);
  const [sorting, setSorting] = useState(false);
  const [flatView, setFlatView] = useState(false);
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showOnboarding, setShowOnboarding] = useState(false);
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
    const res = await authFetch("/api/albums");
    const data = await res.json();
    if (Array.isArray(data)) {
      setAlbums(data);
    }
  }

  useEffect(() => {
    loadScreenshots();
    loadAlbums();
    if (!localStorage.getItem(ONBOARDING_KEY)) {
      setShowOnboarding(true);
    }
  }, []);

  function dismissOnboarding() {
    localStorage.setItem(ONBOARDING_KEY, "1");
    setShowOnboarding(false);
  }

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) {
      return;
    }
    const fileArray = Array.from(files);

    setUploading(true);
    setUploadProgress({ done: 0, total: fileArray.length });

    await Promise.all(
      fileArray.map(async (file) => {
        const formData = new FormData();
        formData.append("file", file);
        await authFetch("/api/upload", { method: "POST", body: formData });
        setUploadProgress((p) => ({ ...p, done: p.done + 1 }));
        await loadScreenshots();
      })
    );

    setUploading(false);
    dismissOnboarding();
    track("upload", { count: fileArray.length });
  }

  async function handleDelete(id: string) {
    if (!window.confirm("Delete this screenshot? This can't be undone.")) {
      return;
    }
    setDeletingIds((prev) => new Set(prev).add(id));
    const res = await authFetch(`/api/screenshots/${id}`, { method: "DELETE" });
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
    setSelectedTag(null);
    setSearchError(null);
    try {
      const res = await authFetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      });
      if (!res.ok) {
        throw new Error("search request failed");
      }
      const results = await res.json();
      setSearchResults(Array.isArray(results) ? results : []);
      track("search", { query });
    } catch {
      setSearchError("Search failed. Try again.");
      setSearchResults(null);
    }
  }

  function handleClearSearch() {
    setSearchResults(null);
    setSearchError(null);
  }

  function openAlbum(id: string) {
    setSearchResults(null);
    setSelectedAlbumId(id);
  }

  function handleSelectTag(tag: string | null) {
    setSearchResults(null);
    setSelectedTag(tag);
  }

  async function createAlbum(name: string): Promise<string> {
    const res = await authFetch("/api/albums", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    const album = await res.json();
    await loadAlbums();
    return album.id;
  }

  async function moveToAlbum(screenshotId: string, albumId: string | null) {
    const res = await authFetch(`/api/screenshots/${screenshotId}`, {
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

  async function handleRenameAlbum(albumId: string) {
    const current = albums.find((a) => a.id === albumId);
    const name = window.prompt("Rename album:", current?.name ?? "");
    if (!name || name === current?.name) {
      return;
    }
    await authFetch(`/api/albums/${albumId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    await loadAlbums();
  }

  async function handleDeleteAlbum(albumId: string) {
    const current = albums.find((a) => a.id === albumId);
    const confirmed = window.confirm(
      `Delete "${current?.name ?? "this album"}"? Screenshots inside won't be deleted, just ungrouped.`
    );
    if (!confirmed) {
      return;
    }
    await authFetch(`/api/albums/${albumId}`, { method: "DELETE" });
    setSelectedAlbumId(null);
    await loadScreenshots();
    await loadAlbums();
  }

  async function handleMergeAlbum(sourceAlbumId: string, targetAlbumId: string) {
    const shotsToMove = screenshots.filter((s) => s.album_id === sourceAlbumId);
    await Promise.all(
      shotsToMove.map((s) =>
        authFetch(`/api/screenshots/${s.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ albumId: targetAlbumId }),
        })
      )
    );
    await authFetch(`/api/albums/${sourceAlbumId}`, { method: "DELETE" });
    setSelectedAlbumId(targetAlbumId);
    await loadScreenshots();
    await loadAlbums();
  }

  async function handleAutoSort() {
    setSorting(true);
    await authFetch("/api/albums/auto-sort", { method: "POST" });
    await loadScreenshots();
    await loadAlbums();
    setSorting(false);
  }

  async function handleSortButtonClick() {
    if (!flatView && albums.length > 0) {
      setSelectedAlbumId(null);
      setSelectedTag(null);
      setSearchResults(null);
      setFlatView(true);
      return;
    }
    await handleAutoSort();
    setFlatView(false);
  }

  const sortButtonLabel = sorting
    ? "Sorting..."
    : !flatView && albums.length > 0
      ? "All Screenshots"
      : "Sort into albums";

  function toggleSelectMode() {
    setSelectMode((m) => !m);
    setSelectedIds(new Set());
  }

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  async function bulkMoveToAlbum(albumId: string) {
    await Promise.all(
      Array.from(selectedIds).map((id) =>
        authFetch(`/api/screenshots/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ albumId }),
        })
      )
    );
    await loadScreenshots();
    await loadAlbums();
    setSelectedIds(new Set());
    setSelectMode(false);
  }

  async function bulkCreateAlbumAndMove(name: string) {
    const albumId = await createAlbum(name);
    await bulkMoveToAlbum(albumId);
  }

  async function bulkDelete() {
    if (
      !window.confirm(
        `Delete ${selectedIds.size} screenshot${selectedIds.size === 1 ? "" : "s"}? This can't be undone.`
      )
    ) {
      return;
    }
    await Promise.all(
      Array.from(selectedIds).map((id) =>
        authFetch(`/api/screenshots/${id}`, { method: "DELETE" })
      )
    );
    await loadScreenshots();
    setSelectedIds(new Set());
    setSelectMode(false);
  }

  const topTags = getTopTags(screenshots);

  const byTag = (list: Screenshot[]) =>
    selectedTag
      ? list.filter((s) => s.tags?.some((t) => t.toLowerCase() === selectedTag))
      : list;

  // A tag filter searches the whole library, not just the ungrouped
  // screenshots, since most screenshots may live inside albums.
  const tagResults = selectedTag ? byTag(screenshots) : null;

  const ungroupedScreenshots = byTag(screenshots.filter((s) => !s.album_id));
  const albumScreenshots = selectedAlbumId
    ? byTag(screenshots.filter((s) => s.album_id === selectedAlbumId))
    : [];
  const selectedAlbum = albums.find((a) => a.id === selectedAlbumId) ?? null;

  function renderGrid(list: Screenshot[]) {
    return (
      <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-4">
        {list.map((s) => (
          <ScreenshotCard
            key={s.id}
            screenshot={s}
            onClick={() => setSelected(s)}
            onDelete={() => handleDelete(s.id)}
            deleting={deletingIds.has(s.id)}
            selectMode={selectMode}
            selected={selectedIds.has(s.id)}
            onToggleSelect={() => toggleSelect(s.id)}
          />
        ))}
      </div>
    );
  }

  return (
    <main className="mx-auto max-w-screen-xl px-6 py-10 sm:px-8 sm:py-14">
      <div className="mb-10 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 italic sm:text-4xl">
            Cache
          </h1>
          <p className="mt-1.5 text-sm text-zinc-500">
            Search everything you&apos;ve saved.
          </p>
        </div>
        <div className="flex items-center gap-4 pt-1">
          <span className="hidden text-xs text-zinc-400 sm:inline">
            {session.user.email}
          </span>
          <button
            onClick={() => supabase.auth.signOut()}
            className="text-sm text-zinc-500 transition-colors hover:text-zinc-900"
          >
            Sign out
          </button>
        </div>
      </div>

      {showOnboarding && (
        <div className="mb-10 flex items-start justify-between gap-4 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
          <div>
            <p className="font-medium text-zinc-900">Welcome to Cache</p>
            <p className="text-sm text-zinc-500">
              Upload your screenshots to get started — they&apos;ll be tagged
              automatically. Then use search or &quot;Sort into albums&quot; to
              find them later.
            </p>
          </div>
          <button
            onClick={dismissOnboarding}
            className="shrink-0 text-sm text-zinc-500 transition-colors hover:text-zinc-900"
          >
            Got it
          </button>
        </div>
      )}

      <SearchBar onSearch={handleSearch} onClear={handleClearSearch} />
      {searchError && (
        <p className="mb-4 text-sm text-red-600">{searchError}</p>
      )}

      <div className="mb-10 flex flex-wrap gap-3">
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="rounded-xl bg-zinc-900 px-5 py-3 text-sm font-medium text-white shadow-sm transition-colors hover:bg-zinc-800 disabled:opacity-50 sm:px-6 sm:py-3.5 sm:text-base"
        >
          {uploading
            ? `Processing ${uploadProgress.done}/${uploadProgress.total}...`
            : "Upload screenshots"}
        </button>
        <button
          onClick={handleSortButtonClick}
          disabled={sorting}
          className="rounded-xl border border-zinc-200 px-5 py-3 text-sm font-medium text-zinc-700 transition-colors hover:border-zinc-300 hover:bg-zinc-50 disabled:opacity-50 sm:px-6 sm:py-3.5 sm:text-base"
        >
          {sortButtonLabel}
        </button>
        <button
          onClick={toggleSelectMode}
          className="rounded-xl border border-zinc-200 px-5 py-3 text-sm font-medium text-zinc-700 transition-colors hover:border-zinc-300 hover:bg-zinc-50 disabled:opacity-50 sm:px-6 sm:py-3.5 sm:text-base"
        >
          {selectMode ? "Cancel select" : "Select"}
        </button>
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={(e) => handleFiles(e.target.files)}
      />

      <CategoryFilter
        options={topTags}
        selected={selectedTag}
        onSelect={handleSelectTag}
      />

      {selectMode && selectedIds.size > 0 && (
        <BulkActionBar
          count={selectedIds.size}
          albums={albums}
          onMove={bulkMoveToAlbum}
          onCreateAlbumAndMove={bulkCreateAlbumAndMove}
          onDelete={bulkDelete}
          onCancel={() => setSelectedIds(new Set())}
        />
      )}

      {searchResults !== null ? (
        <>
          <h2 className="mb-5 text-xl font-bold tracking-tight text-zinc-900">
            Search results ({searchResults.length})
          </h2>
          {renderGrid(searchResults)}
        </>
      ) : selectedAlbumId ? (
        <>
          <button
            onClick={() => setSelectedAlbumId(null)}
            className="mb-4 text-sm text-zinc-500 transition-colors hover:text-zinc-900"
          >
            ← Back to albums
          </button>
          <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-xl font-bold tracking-tight text-zinc-900">
              {selectedAlbum?.name ?? "Album"}
            </h2>
            {!selectMode && (
              <div className="flex flex-wrap items-center gap-3">
                <select
                  onChange={async (e) => {
                    const targetId = e.target.value;
                    if (!targetId || !selectedAlbumId) return;
                    const target = albums.find((a) => a.id === targetId);
                    if (
                      window.confirm(
                        `Merge "${selectedAlbum?.name}" into "${target?.name}"? This album will be removed.`
                      )
                    ) {
                      await handleMergeAlbum(selectedAlbumId, targetId);
                    }
                    e.target.value = "";
                  }}
                  defaultValue=""
                  className="rounded-lg border border-zinc-200 px-2 py-1 text-sm text-zinc-500 transition-colors hover:border-zinc-300"
                >
                  <option value="" disabled>
                    Merge into...
                  </option>
                  {albums
                    .filter((a) => a.id !== selectedAlbumId)
                    .map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name}
                      </option>
                    ))}
                </select>
                <button
                  onClick={() => selectedAlbumId && handleRenameAlbum(selectedAlbumId)}
                  className="text-sm text-zinc-500 transition-colors hover:text-zinc-900"
                >
                  Rename
                </button>
                <button
                  onClick={() => selectedAlbumId && handleDeleteAlbum(selectedAlbumId)}
                  className="text-sm text-red-500 transition-colors hover:text-red-700"
                >
                  Delete album
                </button>
              </div>
            )}
          </div>
          {renderGrid(albumScreenshots)}
        </>
      ) : tagResults !== null ? (
        <>
          <h2 className="mb-5 text-xl font-bold tracking-tight text-zinc-900 capitalize">
            {selectedTag} ({tagResults.length})
          </h2>
          {renderGrid(tagResults)}
        </>
      ) : flatView ? (
        <>
          <h2 className="mb-5 text-xl font-bold tracking-tight text-zinc-900">
            All screenshots ({byTag(screenshots).length})
          </h2>
          {renderGrid(byTag(screenshots))}
        </>
      ) : (
        <>
          {albums.length > 0 && (
            <>
              <h2 className="mb-5 text-xl font-bold tracking-tight text-zinc-900">Albums</h2>
              <div className="mb-10 grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-4">
                {albums.map((album) => {
                  const albumShots = screenshots.filter(
                    (s) => s.album_id === album.id
                  );
                  const albumCategories = Array.from(
                    new Set(
                      albumShots
                        .map((s) => normalizeCategory(s.category))
                        .filter(Boolean)
                    )
                  );
                  return (
                    <AlbumCard
                      key={album.id}
                      album={album}
                      coverUrl={albumShots[0]?.file_url ?? null}
                      count={albumShots.length}
                      categories={albumCategories}
                      onClick={() => openAlbum(album.id)}
                      onRename={() => handleRenameAlbum(album.id)}
                    />
                  );
                })}
              </div>
            </>
          )}

          {ungroupedScreenshots.length > 0 && (
            <>
              <h2 className="mb-5 text-xl font-bold tracking-tight text-zinc-900">All screenshots</h2>
              {renderGrid(ungroupedScreenshots)}
            </>
          )}
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