"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useRequireAuth } from "../../../hooks/use-require-auth";
import { apiFetch, API_URL } from "../../../lib/api";
import { getAccessToken } from "../../../lib/auth";
import { NavHeader } from "../../../components/nav-header";
import { Button, DifficultyBadge } from "../../../ui";
import type { Book } from "../../../components/book-card";

// ── Helpers ───────────────────────────────────────────────────────────────────

const DIFFICULTY_LABEL: Record<string, string> = {
  progressive: "Progressive (Easy → Expert)",
  easy:        "Easy",
  medium:      "Medium",
  hard:        "Hard",
  expert:      "Expert",
};

const TRIM_LABEL: Record<string, string> = {
  "6x9":    '6" × 9"',
  "8x10":   '8" × 10"',
  "8.5x11": '8.5" × 11"',
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "long", day: "numeric", year: "numeric",
  });
}

function daysUntil(iso: string) {
  const diff = new Date(iso).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

// ── Status card variants ──────────────────────────────────────────────────────

function PendingCard() {
  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-100">
          <svg className="h-5 w-5 animate-spin text-amber-500" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        </div>
        <div>
          <p className="text-sm font-semibold text-amber-900">Generating your book</p>
          <p className="text-xs text-amber-600">Usually under 60 seconds</p>
        </div>
      </div>
      <p className="text-sm leading-relaxed text-amber-700">
        Your puzzles are being generated and the PDF is being assembled.
        This page will update automatically when it&apos;s ready.
      </p>
      <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-amber-200">
        <div className="h-full w-2/3 animate-[progress_2s_ease-in-out_infinite] rounded-full bg-amber-400" />
      </div>
    </div>
  );
}

function ReadyCard({ book, title }: { book: Book; title: string }) {
  const [downloading, setDownloading] = useState(false);
  const days = book.expiresAt ? daysUntil(book.expiresAt) : null;
  const expiringSoon = days !== null && days <= 7;

  function handleDownload() {
    setDownloading(true);
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
      .catch(console.error)
      .finally(() => setDownloading(false));
  }

  return (
    <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100">
          <svg className="h-5 w-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div>
          <p className="text-sm font-semibold text-emerald-900">Ready to download</p>
          {book.expiresAt && (
            <p className={`text-xs ${expiringSoon ? "font-medium text-red-500" : "text-emerald-600"}`}>
              {expiringSoon
                ? `Expires in ${days} day${days === 1 ? "" : "s"} — download now`
                : `Expires ${formatDate(book.expiresAt)}`}
            </p>
          )}
        </div>
      </div>

      <Button
        variant="primary"
        size="lg"
        loading={downloading}
        className="w-full justify-center"
        onClick={handleDownload}
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
        </svg>
        {downloading ? "Preparing PDF…" : "Download PDF"}
      </Button>

      <p className="mt-3 text-center text-xs text-emerald-700">
        KDP-ready interior file — upload directly to Kindle Direct Publishing
      </p>
    </div>
  );
}

function DraftCard({ bookId }: { bookId: string }) {
  const [loading, setLoading] = useState(false);

  async function handleCompletePurchase() {
    setLoading(true);
    try {
      const { checkoutUrl } = await apiFetch<{ checkoutUrl: string }>(
        `/books/${bookId}/checkout`,
        { method: "POST" },
      );
      window.location.href = checkoutUrl;
    } catch {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-6">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-zinc-200">
          <svg className="h-5 w-5 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
          </svg>
        </div>
        <div>
          <p className="text-sm font-semibold text-zinc-900">Awaiting payment</p>
          <p className="text-xs text-zinc-500">Complete checkout to generate your book</p>
        </div>
      </div>
      <p className="mb-4 text-sm leading-relaxed text-zinc-600">
        Your book configuration has been saved. Complete your purchase to start the generation process.
      </p>
      <Button variant="primary" size="md" loading={loading} className="w-full justify-center" onClick={handleCompletePurchase}>
        Complete purchase
      </Button>
    </div>
  );
}

function ExpiredCard() {
  return (
    <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100">
          <svg className="h-5 w-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
        </div>
        <div>
          <p className="text-sm font-semibold text-red-900">PDF expired</p>
          <p className="text-xs text-red-500">This file is no longer available for download</p>
        </div>
      </div>
      <p className="mb-4 text-sm leading-relaxed text-red-700">
        PDFs are available for 30 days after generation. This one has passed its expiry date.
        Create a new book to generate a fresh copy.
      </p>
      <Link href="/dashboard/new">
        <Button variant="secondary" size="md" className="w-full justify-center">
          Create new book
        </Button>
      </Link>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function BookDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { loading: authLoading } = useRequireAuth();

  const [book, setBook]       = useState<Book | null>(null);
  const [fetching, setFetching] = useState(true);
  const [error, setError]     = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const pollRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadBook = useCallback(async (isPolling = false) => {
    if (!isPolling) setFetching(true);
    try {
      const data = await apiFetch<Book>(`/books/${id}`);
      setBook(data);
      if (data.status === "pending") {
        pollRef.current = setTimeout(() => void loadBook(true), 5000);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load book");
    } finally {
      if (!isPolling) setFetching(false);
    }
  }, [id]);

  useEffect(() => {
    if (!authLoading) void loadBook();
    return () => { if (pollRef.current) clearTimeout(pollRef.current); };
  }, [authLoading, loadBook]);

  async function handleDelete() {
    if (!window.confirm("Delete this book permanently? This cannot be undone.")) return;
    setDeleting(true);
    try {
      await apiFetch(`/books/${id}`, { method: "DELETE" });
      router.push("/dashboard");
    } catch (err) {
      setDeleting(false);
      window.alert(err instanceof Error ? err.message : "Failed to delete book");
    }
  }

  // ── Loading ────────────────────────────────────────────────────────────────

  if (authLoading || fetching) {
    return (
      <div className="min-h-screen bg-zinc-100">
        <NavHeader />
        <main className="mx-auto max-w-4xl px-6 py-10">
          <div className="mb-6 h-4 w-28 animate-pulse rounded bg-zinc-200" />
          <div className="mb-8 h-8 w-64 animate-pulse rounded-lg bg-zinc-200" />
          <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
            <div className="h-64 animate-pulse rounded-2xl bg-zinc-200" />
            <div className="h-52 animate-pulse rounded-2xl bg-zinc-200" />
          </div>
        </main>
      </div>
    );
  }

  // ── Error ──────────────────────────────────────────────────────────────────

  if (error || !book) {
    return (
      <div className="min-h-screen bg-zinc-100">
        <NavHeader />
        <main className="mx-auto max-w-4xl px-6 py-10">
          <div className="rounded-2xl border border-red-200 bg-white p-10 text-center shadow-sm">
            <p className="text-sm font-semibold text-zinc-900">Could not load this book</p>
            <p className="mt-1 text-xs text-zinc-500">{error ?? "Book not found"}</p>
            <div className="mt-4 flex justify-center gap-3">
              <Button variant="secondary" size="sm" onClick={() => void loadBook()}>Try again</Button>
              <Link href="/dashboard"><Button variant="ghost" size="sm">← Back to dashboard</Button></Link>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // ── Ready ──────────────────────────────────────────────────────────────────

  const title = book.title ?? "Untitled Book";

  const details: [string, string][] = [
    ["Trim size",   TRIM_LABEL[book.trimSize] ?? book.trimSize],
    ["Difficulty",  DIFFICULTY_LABEL[book.difficulty] ?? book.difficulty],
    ["Puzzles",     String(book.pageCount)],
    ["Created",     formatDate(book.createdAt)],
    ...(book.expiresAt && book.status === "ready"
      ? [["Expires", formatDate(book.expiresAt)] as [string, string]]
      : []),
  ];

  return (
    <div className="min-h-screen bg-zinc-100">
      <NavHeader />

      <main className="mx-auto max-w-4xl px-6 py-8">

        {/* Back link */}
        <Link
          href="/dashboard"
          className="mb-6 inline-flex items-center gap-1.5 text-sm text-zinc-500 transition-colors hover:text-zinc-900"
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 16 16" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 12L6 8l4-4" />
          </svg>
          Back to dashboard
        </Link>

        {/* Page header */}
        <div className="mb-8 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900">{title}</h1>
            <div className="mt-2">
              <DifficultyBadge difficulty={book.difficulty} />
            </div>
          </div>
          <div className={`rounded-full px-3 py-1 text-xs font-semibold ${
            book.status === "ready"   ? "bg-emerald-100 text-emerald-700" :
            book.status === "pending" ? "bg-amber-100 text-amber-700" :
            book.status === "expired" ? "bg-red-100 text-red-600" :
            "bg-zinc-100 text-zinc-600"
          }`}>
            {book.status === "pending" && <span className="mr-1.5 inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-amber-400 align-middle" />}
            {{
              ready: "Ready",
              pending: "Generating",
              draft: "Draft",
              expired: "Expired",
            }[book.status] ?? book.status}
          </div>
        </div>

        {/* Two-column layout */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px]">

          {/* Left: book details */}
          <div className="space-y-6">
            <div className="rounded-2xl border border-zinc-200 bg-white shadow-sm">
              <div className="border-b border-zinc-100 px-6 py-4">
                <h2 className="text-sm font-semibold text-zinc-900">Book details</h2>
              </div>
              <div className="divide-y divide-zinc-50">
                {details.map(([label, value]) => (
                  <div key={label} className="flex items-center justify-between px-6 py-3.5">
                    <span className="text-sm text-zinc-500">{label}</span>
                    <span className="text-sm font-medium text-zinc-900">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right: status + actions */}
          <div className="space-y-4">
            {book.status === "pending" && <PendingCard />}
            {book.status === "ready"   && <ReadyCard book={book} title={title} />}
            {book.status === "draft"   && <DraftCard bookId={book.id} />}
            {book.status === "expired" && <ExpiredCard />}

            {/* Danger zone */}
            <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
              <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-zinc-400">Danger zone</p>
              <p className="mb-4 text-sm text-zinc-500">
                Permanently delete this book and all associated data. This cannot be undone.
              </p>
              <Button
                variant="danger"
                size="sm"
                loading={deleting}
                onClick={handleDelete}
                className="w-full justify-center"
              >
                Delete book
              </Button>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
