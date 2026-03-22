"use client";

import { API_URL } from "../lib/api";
import { getAccessToken } from "../lib/auth";
import { StatusBadge, DifficultyBadge } from "./status-badge";

export interface Book {
  id: string;
  title: string | null;
  trimSize: string;
  difficulty: string;
  pageCount: number;
  status: string;
  pdfPath: string | null;
  expiresAt: string | null;
  createdAt: string;
}

export function BookCard({ book }: { book: Book }) {
  const title = book.title ?? "Untitled Book";
  const createdAt = new Date(book.createdAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const expiresAt = book.expiresAt
    ? new Date(book.expiresAt).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : null;

  function handleDownload() {
    const token = getAccessToken();
    // Open a fetch-based download so the Authorization header is included
    fetch(`${API_URL}/books/${book.id}/download`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.blob())
      .then((blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${title}.pdf`;
        a.click();
        URL.revokeObjectURL(url);
      })
      .catch(console.error);
  }

  return (
    <div className="flex flex-col rounded-xl border border-zinc-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
      {/* Header row */}
      <div className="mb-3 flex items-start justify-between gap-2">
        <h3 className="truncate text-base font-semibold text-zinc-900">
          {title}
        </h3>
        <StatusBadge status={book.status} />
      </div>

      {/* Meta */}
      <div className="mb-4 flex flex-wrap gap-2">
        <DifficultyBadge difficulty={book.difficulty} />
        <span className="inline-flex items-center rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-600">
          {book.trimSize}
        </span>
        <span className="inline-flex items-center rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-600">
          {book.pageCount} puzzles
        </span>
      </div>

      {/* Footer */}
      <div className="mt-auto flex items-center justify-between">
        <div className="text-xs text-zinc-400">
          <span>Created {createdAt}</span>
          {expiresAt && book.status === "ready" && (
            <span className="ml-2 text-amber-500">· expires {expiresAt}</span>
          )}
        </div>

        {book.status === "ready" && (
          <button
            onClick={handleDownload}
            className="rounded-lg bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-zinc-700"
          >
            Download PDF
          </button>
        )}

        {book.status === "draft" && (
          <span className="text-xs text-zinc-400">Awaiting payment</span>
        )}

        {book.status === "pending" && (
          <span className="flex items-center gap-1.5 text-xs text-amber-600">
            <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-amber-400" />
            Generating…
          </span>
        )}
      </div>
    </div>
  );
}
