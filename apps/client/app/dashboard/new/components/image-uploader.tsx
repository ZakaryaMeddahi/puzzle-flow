"use client";

import { useRef, useState } from "react";
import { getAccessToken } from "../../../lib/auth";
import { API_URL } from "../../../lib/api";

interface ImageUploaderProps {
  label: string;
  accept?: string;
  previewUrl?: string;
  onUploaded: (key: string, blobUrl: string) => void;
}

export function ImageUploader({
  label,
  accept = "image/png,image/jpeg",
  previewUrl,
  onUploaded,
}: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError]         = useState<string | null>(null);

  async function handleFile(file: File) {
    setError(null);
    setUploading(true);

    // Create a local blob URL immediately for instant preview
    const blobUrl = URL.createObjectURL(file);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const token = getAccessToken();
      const res = await fetch(`${API_URL}/uploads`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
        // Do NOT set Content-Type — browser sets it with the multipart boundary
      });

      if (!res.ok) throw new Error(`Upload failed (${res.status})`);
      const { key } = (await res.json()) as { key: string };
      onUploaded(key, blobUrl);
    } catch (err) {
      URL.revokeObjectURL(blobUrl);
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-zinc-700">{label}</label>

      <div
        role="button"
        tabIndex={0}
        className={`relative flex min-h-[5rem] cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed px-4 py-4 text-center transition-colors ${
          uploading
            ? "border-zinc-300 bg-zinc-50"
            : "border-zinc-300 hover:border-zinc-400"
        }`}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
      >
        {previewUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={previewUrl}
            alt="Preview"
            className="max-h-24 max-w-full rounded object-contain"
          />
        ) : (
          <>
            <div className="text-2xl leading-none text-zinc-300">↑</div>
            <p className="text-xs text-zinc-400">
              {uploading ? "Uploading…" : "Click to upload"}
            </p>
          </>
        )}

        <input
          ref={inputRef}
          type="file"
          accept={accept}
          className="sr-only"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
            // Reset input so the same file can be re-selected
            e.target.value = "";
          }}
        />
      </div>

      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}

      {previewUrl && !uploading && (
        <button
          type="button"
          className="mt-1 text-xs text-zinc-400 hover:text-zinc-700"
          onClick={() => onUploaded("", "")}
        >
          Remove image
        </button>
      )}
    </div>
  );
}
