"use client";

import { useState } from "react";
import Link from "next/link";
import { apiFetch, API_URL } from "../lib/api";
import { getAccessToken } from "../lib/auth";
import { DifficultyBadge, Button } from "../ui";

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

// Colored top bar (instant visual status without reading the badge)
const STATUS_BAR: Record<string, string> = {
  draft: "bg-zinc-300",
  pending: "bg-amber-400",
  ready: "bg-emerald-500",
  expired: "bg-red-400",
};

const STATUS_LABEL: Record<string, string> = {
  draft: "Draft",
  pending: "Generating",
  ready: "Ready",
  expired: "Expired",
};

const STATUS_LABEL_COLOR: Record<string, string> = {
  draft: "text-zinc-500",
  pending: "text-amber-600",
  ready: "text-emerald-600",
  expired: "text-red-500",
};

const TrashIcon = (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.75"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="h-3.5 w-3.5"
    aria-hidden="true"
  >
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
    <path d="M10 11v6" />
    <path d="M14 11v6" />
    <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
  </svg>
);

const DownloadIcon = (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="h-3.5 w-3.5"
    aria-hidden="true"
  >
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);

export function BookCard({
  book,
  onDelete,
}: {
  book: Book;
  onDelete: (id: string) => void;
}) {
  const [deleting, setDeleting] = useState(false);

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

  async function handleDelete() {
    if (!window.confirm("Delete this book? This cannot be undone.")) return;
    setDeleting(true);
    try {
      await apiFetch(`/books/${book.id}`, { method: "DELETE" });
      onDelete(book.id);
    } catch (err) {
      setDeleting(false);
      window.alert(
        err instanceof Error ? err.message : "Failed to delete book",
      );
    }
  }

  const statusBar = STATUS_BAR[book.status] ?? STATUS_BAR["draft"];
  const statusLabel = STATUS_LABEL[book.status] ?? book.status;
  const statusColor = STATUS_LABEL_COLOR[book.status] ?? "text-zinc-500";

  return (
    <div className="group flex flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm transition-shadow hover:shadow-md">
      {/* Status accent bar */}
      <div className={`h-1 w-full ${statusBar}`} />

      <div className="flex flex-1 flex-col p-5">
        {/* Title */}
        <Link
          href={`/dashboard/books/${book.id}`}
          className="mb-1 block truncate text-base font-semibold text-zinc-900 hover:text-indigo-600 transition-colors"
        >
          {title}
        </Link>

        {/* Metadata */}
        <p className="mb-4 text-xs text-zinc-400">
          {book.pageCount} puzzles · {book.trimSize}
        </p>

        {/* Difficulty badge */}
        <div className="mb-5">
          <DifficultyBadge difficulty={book.difficulty} />
        </div>

        {/* Footer (separated by a subtle top border) */}
        <div className="mt-auto border-t border-zinc-100 pt-4">
          <div className="flex items-center justify-between gap-2">
            {/* Status label + date */}
            <div className="min-w-0">
              <p
                className={`text-xs font-medium ${statusColor} flex items-center gap-1.5`}
              >
                {book.status === "pending" && (
                  <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-amber-400" />
                )}
                {statusLabel}
              </p>
              <p className="mt-0.5 text-xs text-zinc-400">
                {expiresAt && book.status === "ready"
                  ? `Expires ${expiresAt}`
                  : `Created ${createdAt}`}
              </p>
            </div>

            {/* Actions */}
            <div className="flex shrink-0 items-center gap-1">
              {book.status === "ready" && (
                <Button size="sm" icon={DownloadIcon} onClick={handleDownload}>
                  Download
                </Button>
              )}
              {book.status === "draft" && (
                <span className="rounded-md bg-zinc-100 px-2.5 py-1 text-xs text-zinc-500">
                  Awaiting payment
                </span>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDelete}
                loading={deleting}
                icon={TrashIcon}
                aria-label="Delete book"
                className="text-zinc-300 hover:text-red-500"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
