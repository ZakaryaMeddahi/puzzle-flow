"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRequireAuth } from "../hooks/use-require-auth";
import { apiFetch } from "../lib/api";
import { NavHeader } from "../components/nav-header";
import { BookCard, type Book } from "../components/book-card";

export default function DashboardPage() {
  const { user, loading: authLoading } = useRequireAuth();
  const [books, setBooks] = useState<Book[]>([]);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadBooks = useCallback(async () => {
    setFetching(true);
    setError(null);
    try {
      const data = await apiFetch<Book[]>("/books");
      setBooks(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load books");
    } finally {
      setFetching(false);
    }
  }, []);

  useEffect(() => {
    if (user) void loadBooks();
  }, [user, loadBooks]);

  // ── Loading skeleton ──────────────────────────────────────────────────────
  if (authLoading || (fetching && books.length === 0)) {
    return (
      <>
        <NavHeader />
        <main className="mx-auto max-w-6xl px-6 py-10">
          <div className="mb-8 flex items-center justify-between">
            <div className="h-8 w-40 animate-pulse rounded-lg bg-zinc-200" />
            <div className="h-9 w-32 animate-pulse rounded-lg bg-zinc-200" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="h-40 animate-pulse rounded-xl bg-zinc-100"
              />
            ))}
          </div>
        </main>
      </>
    );
  }

  // ── Error ─────────────────────────────────────────────────────────────────
  if (error) {
    return (
      <>
        <NavHeader />
        <main className="mx-auto max-w-6xl px-6 py-10">
          <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
            <p className="text-sm text-red-600">{error}</p>
            <button
              onClick={() => void loadBooks()}
              className="mt-3 text-sm font-medium text-red-700 underline"
            >
              Try again
            </button>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <NavHeader />
      <main className="mx-auto max-w-6xl px-6 py-10">
        {/* Page header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
              My Books
            </h1>
            {user && (
              <p className="mt-1 text-sm text-zinc-500">
                Welcome back, {user.name ?? user.email}
              </p>
            )}
          </div>

          <Link
            href="/dashboard/new"
            className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700"
          >
            + New Book
          </Link>
        </div>

        {/* Empty state */}
        {books.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-zinc-200 bg-zinc-50 py-24 text-center">
            <div className="mb-4 text-5xl">📚</div>
            <h2 className="mb-2 text-lg font-semibold text-zinc-800">
              No books yet
            </h2>
            <p className="mb-6 max-w-xs text-sm text-zinc-500">
              Create your first Sudoku puzzle book and publish it on KDP in
              minutes.
            </p>
            <Link
              href="/dashboard/new"
              className="rounded-lg bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-700"
            >
              Create your first book
            </Link>
          </div>
        )}

        {/* Book grid */}
        {books.length > 0 && (
          <>
            <p className="mb-4 text-sm text-zinc-400">
              {books.length} book{books.length !== 1 ? "s" : ""}
            </p>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {books.map((book) => (
                <BookCard key={book.id} book={book} />
              ))}
            </div>
          </>
        )}
      </main>
    </>
  );
}
