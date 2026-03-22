"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useRequireAuth } from "../../hooks/use-require-auth";
import { apiFetch } from "../../lib/api";
import { NavHeader } from "../../components/nav-header";

interface CreateBookPayload {
  title?: string;
  trimSize: string;
  difficulty: string;
  pageCount: number;
  uniquenessLevel: string;
}

interface CreateBookResponse {
  book: { id: string };
  checkoutUrl: string;
}

const TRIM_SIZES = [
  { value: "6x9",    label: '6" × 9"  — Most popular KDP size' },
  { value: "8x10",   label: '8" × 10" — Large print friendly' },
  { value: "8.5x11", label: '8.5" × 11" — Maximum page area' },
];

const DIFFICULTIES = [
  { value: "easy",   label: "Easy",   desc: "36–45 clues" },
  { value: "medium", label: "Medium", desc: "27–35 clues" },
  { value: "hard",   label: "Hard",   desc: "22–26 clues" },
  { value: "expert", label: "Expert", desc: "17–21 clues" },
];

const UNIQUENESS_LEVELS = [
  { value: "global", label: "Global",  desc: "No puzzle appears in any book on the platform" },
  { value: "user",   label: "Per account", desc: "No puzzle repeated across your books" },
  { value: "book",   label: "Per book", desc: "No puzzle repeated within this book" },
];

export default function NewBookPage() {
  const { loading: authLoading } = useRequireAuth();
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [trimSize, setTrimSize] = useState("6x9");
  const [difficulty, setDifficulty] = useState("medium");
  const [pageCount, setPageCount] = useState(50);
  const [uniquenessLevel, setUniquenessLevel] = useState("global");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (authLoading) {
    return (
      <>
        <NavHeader />
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-zinc-300 border-t-zinc-900" />
        </div>
      </>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const payload: CreateBookPayload = {
        trimSize,
        difficulty,
        pageCount,
        uniquenessLevel,
        ...(title.trim() ? { title: title.trim() } : {}),
      };

      const { checkoutUrl } = await apiFetch<CreateBookResponse>("/books", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      // Redirect to LemonSqueezy checkout
      window.location.href = checkoutUrl;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setSubmitting(false);
    }
  }

  return (
    <>
      <NavHeader />
      <main className="mx-auto max-w-2xl px-6 py-10">
        {/* Back link */}
        <Link
          href="/dashboard"
          className="mb-6 inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-900"
        >
          ← Back to dashboard
        </Link>

        <h1 className="mb-1 text-2xl font-bold tracking-tight text-zinc-900">
          Create a new book
        </h1>
        <p className="mb-8 text-sm text-zinc-500">
          Configure your Sudoku puzzle book. You&apos;ll be taken to checkout after.
        </p>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Title */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-zinc-700">
              Book title <span className="font-normal text-zinc-400">(optional)</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. 500 Medium Sudoku Puzzles"
              maxLength={120}
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
            />
          </div>

          {/* Trim size */}
          <fieldset>
            <legend className="mb-2 text-sm font-medium text-zinc-700">
              Trim size
            </legend>
            <div className="space-y-2">
              {TRIM_SIZES.map((ts) => (
                <label
                  key={ts.value}
                  className={`flex cursor-pointer items-center gap-3 rounded-lg border px-4 py-3 transition-colors ${
                    trimSize === ts.value
                      ? "border-zinc-900 bg-zinc-50"
                      : "border-zinc-200 hover:border-zinc-300"
                  }`}
                >
                  <input
                    type="radio"
                    name="trimSize"
                    value={ts.value}
                    checked={trimSize === ts.value}
                    onChange={() => setTrimSize(ts.value)}
                    className="accent-zinc-900"
                  />
                  <span className="text-sm text-zinc-800">{ts.label}</span>
                </label>
              ))}
            </div>
          </fieldset>

          {/* Difficulty */}
          <fieldset>
            <legend className="mb-2 text-sm font-medium text-zinc-700">
              Difficulty
            </legend>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {DIFFICULTIES.map((d) => (
                <label
                  key={d.value}
                  className={`flex cursor-pointer flex-col gap-0.5 rounded-lg border px-4 py-3 transition-colors ${
                    difficulty === d.value
                      ? "border-zinc-900 bg-zinc-50"
                      : "border-zinc-200 hover:border-zinc-300"
                  }`}
                >
                  <input
                    type="radio"
                    name="difficulty"
                    value={d.value}
                    checked={difficulty === d.value}
                    onChange={() => setDifficulty(d.value)}
                    className="sr-only"
                  />
                  <span className="text-sm font-medium text-zinc-900">
                    {d.label}
                  </span>
                  <span className="text-xs text-zinc-400">{d.desc}</span>
                </label>
              ))}
            </div>
          </fieldset>

          {/* Page count */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-zinc-700">
              Number of puzzles{" "}
              <span className="font-normal text-zinc-400">(10 – 200)</span>
            </label>
            <div className="flex items-center gap-4">
              <input
                type="range"
                min={10}
                max={200}
                step={5}
                value={pageCount}
                onChange={(e) => setPageCount(Number(e.target.value))}
                className="w-full accent-zinc-900"
              />
              <span className="w-12 text-right text-sm font-semibold tabular-nums text-zinc-900">
                {pageCount}
              </span>
            </div>
          </div>

          {/* Uniqueness level */}
          <fieldset>
            <legend className="mb-2 text-sm font-medium text-zinc-700">
              Uniqueness guarantee
            </legend>
            <div className="space-y-2">
              {UNIQUENESS_LEVELS.map((u) => (
                <label
                  key={u.value}
                  className={`flex cursor-pointer items-start gap-3 rounded-lg border px-4 py-3 transition-colors ${
                    uniquenessLevel === u.value
                      ? "border-zinc-900 bg-zinc-50"
                      : "border-zinc-200 hover:border-zinc-300"
                  }`}
                >
                  <input
                    type="radio"
                    name="uniquenessLevel"
                    value={u.value}
                    checked={uniquenessLevel === u.value}
                    onChange={() => setUniquenessLevel(u.value)}
                    className="mt-0.5 accent-zinc-900"
                  />
                  <div>
                    <p className="text-sm font-medium text-zinc-900">
                      {u.label}
                    </p>
                    <p className="text-xs text-zinc-400">{u.desc}</p>
                  </div>
                </label>
              ))}
            </div>
          </fieldset>

          {/* Error */}
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg bg-zinc-900 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? "Reserving puzzles…" : "Continue to checkout →"}
          </button>
        </form>
      </main>
    </>
  );
}
