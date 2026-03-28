"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import { useRequireAuth } from "../hooks/use-require-auth";
import { apiFetch } from "../lib/api";
import { NavHeader } from "../components/nav-header";
import { BookCard, type Book } from "../components/book-card";
import { Button } from "../ui";

export default function DashboardPage() {
  const { user, loading: authLoading } = useRequireAuth();
  const [books, setBooks] = useState<Book[]>([]);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadBooks = useCallback(async (isPolling = false) => {
    if (!isPolling) setFetching(true);
    setError(null);
    try {
      const data = await apiFetch<Book[]>("/books");
      setBooks(data);
      if (data.some((b) => b.status === "pending")) {
        pollRef.current = setTimeout(() => void loadBooks(true), 5000);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load books");
    } finally {
      if (!isPolling) setFetching(false);
    }
  }, []);

  useEffect(() => {
    if (user) void loadBooks();
    return () => {
      if (pollRef.current) clearTimeout(pollRef.current);
    };
  }, [user, loadBooks]);

  function handleDeleteBook(id: string) {
    setBooks((prev) => prev.filter((b) => b.id !== id));
  }

  const readyCount   = books.filter((b) => b.status === "ready").length;
  const pendingCount = books.filter((b) => b.status === "pending").length;

  // ── Loading skeleton ──────────────────────────────────────────────────────
  if (authLoading || (fetching && books.length === 0)) {
    return (
      <div className="min-h-screen bg-zinc-100">
        <NavHeader />
        <main className="mx-auto max-w-6xl px-6 py-10">
          {/* Header skeleton */}
          <div className="mb-8 flex items-start justify-between gap-4">
            <div className="space-y-2.5">
              <div className="h-7 w-32 animate-pulse rounded-lg bg-zinc-200" />
              <div className="h-4 w-52 animate-pulse rounded bg-zinc-200" />
            </div>
            <div className="h-9 w-36 animate-pulse rounded-lg bg-zinc-200" />
          </div>

          {/* Card skeletons */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm"
              >
                <div className="h-1 w-full animate-pulse bg-zinc-200" />
                <div className="p-5">
                  <div className="mb-3 flex items-start justify-between gap-2">
                    <div className="h-4 w-3/5 animate-pulse rounded bg-zinc-200" />
                    <div className="h-5 w-14 animate-pulse rounded-full bg-zinc-200" />
                  </div>
                  <div className="mb-3 h-3 w-2/5 animate-pulse rounded bg-zinc-100" />
                  <div className="mb-5 h-5 w-16 animate-pulse rounded-full bg-zinc-100" />
                  <div className="border-t border-zinc-100 pt-4 flex items-center justify-between">
                    <div className="h-3 w-24 animate-pulse rounded bg-zinc-100" />
                    <div className="h-7 w-28 animate-pulse rounded-lg bg-zinc-100" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>
    );
  }

  // ── Error ─────────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="min-h-screen bg-zinc-100">
        <NavHeader />
        <main className="mx-auto max-w-6xl px-6 py-10">
          <div className="rounded-2xl border border-red-200 bg-white p-8 text-center shadow-sm">
            <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-red-50">
              <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0zm-8-5a.75.75 0 0 1 .75.75v4.5a.75.75 0 0 1-1.5 0v-4.5A.75.75 0 0 1 10 5zm0 10a1 1 0 1 0 0-2 1 1 0 0 0 0 2z" clipRule="evenodd" />
              </svg>
            </div>
            <p className="text-sm font-semibold text-zinc-900">Could not load your books</p>
            <p className="mt-1 text-xs text-zinc-500">{error}</p>
            <Button variant="secondary" size="sm" className="mt-4" onClick={() => void loadBooks()}>
              Try again
            </Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-100">
      <NavHeader />
      <main className="mx-auto max-w-6xl px-6 py-10">

        {/* Page header */}
        <div className="mb-8 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
              Your Books
            </h1>
            <p className="mt-1 text-sm text-zinc-500">
              Create and manage your puzzle books
            </p>
          </div>
          <Link href="/dashboard/new">
            <Button variant="primary" size="md">
              + Create New Book
            </Button>
          </Link>
        </div>

        {/* Empty state */}
        {books.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-zinc-300 bg-white py-24 text-center shadow-sm">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-8 w-8 text-indigo-400"
                aria-hidden="true"
              >
                <path d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
              </svg>
            </div>
            <h2 className="mb-1.5 text-lg font-semibold text-zinc-900">
              No books yet
            </h2>
            <p className="mb-6 max-w-xs text-sm text-zinc-500">
              Create your first puzzle book in minutes.
            </p>
            <Link href="/dashboard/new">
              <Button variant="primary" size="md">
                Create New Book
              </Button>
            </Link>
          </div>
        )}

        {/* Books grid */}
        {books.length > 0 && (
          <>
            {/* Stats row */}
            <div className="mb-5 flex flex-wrap items-center gap-x-5 gap-y-1 text-sm">
              <span className="text-zinc-500">
                <span className="font-semibold text-zinc-900">{books.length}</span>{" "}
                {books.length === 1 ? "book" : "books"}
              </span>
              {readyCount > 0 && (
                <span className="text-zinc-500">
                  <span className="font-semibold text-emerald-600">{readyCount}</span> ready
                </span>
              )}
              {pendingCount > 0 && (
                <span className="flex items-center gap-1.5 text-zinc-500">
                  <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-amber-400" />
                  <span className="font-semibold text-amber-600">{pendingCount}</span> generating
                </span>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {books.map((book) => (
                <BookCard
                  key={book.id}
                  book={book}
                  onDelete={handleDeleteBook}
                />
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
