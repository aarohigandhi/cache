"use client";

export type Album = {
  id: string;
  name: string;
  created_at: string;
};

export function AlbumCard({
  album,
  coverUrl,
  count,
  onClick,
}: {
  album: Album;
  coverUrl: string | null;
  count: number;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col overflow-hidden rounded-lg border text-left hover:shadow-md"
    >
      {coverUrl ? (
        <img
          src={coverUrl}
          alt={album.name}
          className="aspect-square w-full object-cover"
        />
      ) : (
        <div className="flex aspect-square w-full items-center justify-center bg-gray-100 text-gray-400">
          No photos
        </div>
      )}
      <div className="p-2">
        <p className="truncate text-sm font-medium">{album.name}</p>
        <p className="text-xs text-gray-500">
          {count} screenshot{count === 1 ? "" : "s"}
        </p>
      </div>
    </button>
  );
}
