"use client";

import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import { ScreenshotCard, type Screenshot } from "@/components/ScreenshotCard";
import { ScreenshotDetailModal } from "@/components/ScreenshotDetailModal";

export default function Home() {
  const [screenshots, setScreenshots] = useState<Screenshot[]>([]);
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

  useEffect(() => {
    loadScreenshots();
  }, []);

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
        await fetch("/api/upload", { method: "POST", body: formData });
        setUploadProgress((p) => ({ ...p, done: p.done + 1 }));
        await loadScreenshots();
      })
    );

    setUploading(false);
  }

  async function handleDelete(id: string) {
    setDeletingIds((prev) => new Set(prev).add(id));
    const res = await fetch(`/api/screenshots/${id}`, { method: "DELETE" });
    if (res.ok) {
      setScreenshots((prev) => prev.filter((s) => s.id !== id));
      setSelected((prev) => (prev?.id === id ? null : prev));
    }
    setDeletingIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }

  return (
    <main className="mx-auto max-w-5xl p-6">
      <h1 className="mb-6 text-3xl font-bold">Cache</h1>
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
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
        {screenshots.map((s) => (
          <ScreenshotCard
            key={s.id}
            screenshot={s}
            onClick={() => setSelected(s)}
            onDelete={() => handleDelete(s.id)}
            deleting={deletingIds.has(s.id)}
          />
        ))}
      </div>
      {selected && (
        <ScreenshotDetailModal
          screenshot={selected}
          onClose={() => setSelected(null)}
        />
      )}
    </main>
  );
}
