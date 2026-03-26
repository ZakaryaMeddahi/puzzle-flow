"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useRequireAuth } from "../../hooks/use-require-auth";
import { apiFetch } from "../../lib/api";
import { NavHeader } from "../../components/nav-header";

interface FrontMatterPayload {
  titlePage: boolean;
  copyrightPage: boolean;
  howToPlay: boolean;
  introduction: boolean;
  introText?: string;
  answerPages: boolean;
}

interface CreateBookPayload {
  title: string;
  trimSize: string;
  difficulty: string;
  pageCount: number;
  layout: number;
  uniquenessLevel: string;
  frontMatter: FrontMatterPayload;
}

interface CreateBookResponse {
  book: { id: string };
  checkoutUrl: string;
}

// ── Constants ────────────────────────────────────────────────────────────────

const TRIM_SIZES = [
  { value: "8.5x11", label: '8.5" × 11"', hint: "Recommended for puzzle books" },
  { value: "8x10",   label: '8" × 10"',   hint: "Large print friendly" },
  { value: "6x9",    label: '6" × 9"',    hint: "Most popular KDP size" },
];

const DIFFICULTIES = [
  { value: "progressive", label: "Progressive", desc: "Easy → Expert (recommended)" },
  { value: "easy",        label: "Easy",        desc: "36–45 clues" },
  { value: "medium",      label: "Medium",      desc: "27–35 clues" },
  { value: "hard",        label: "Hard",        desc: "22–26 clues" },
  { value: "expert",      label: "Expert",      desc: "17–21 clues" },
];

const LAYOUTS = [
  { value: 1, label: "1 per page", hint: "Large Print" },
  { value: 2, label: "2 per page", hint: "Standard" },
  { value: 4, label: "4 per page", hint: "Compact" },
];

const UNIQUENESS_LEVELS = [
  { value: "book",   label: "Standard",  desc: "No duplicates within this book" },
  { value: "user",   label: "Advanced",  desc: "No duplicates across your books" },
  { value: "global", label: "Maximum",   desc: "No duplicates across all users" },
];

// ── Component ────────────────────────────────────────────────────────────────

export default function NewBookPage() {
  const { loading: authLoading } = useRequireAuth();
  useRouter();

  // Section 1 — Basics
  const [title, setTitle]       = useState("");
  const [trimSize, setTrimSize] = useState("8.5x11");

  // Section 2 — Puzzles
  const [difficulty, setDifficulty] = useState("progressive");
  const [pageCount, setPageCount]   = useState(100);

  // Section 3 — Layout
  const [layout, setLayout] = useState<1 | 2 | 4>(2);

  // Section 4 — Options
  const [uniqueness, setUniqueness]   = useState("book");
  const [fmTitle, setFmTitle]         = useState(true);
  const [fmCopyright, setFmCopyright] = useState(true);
  const [fmHowToPlay, setFmHowToPlay] = useState(true);
  const [fmIntro, setFmIntro]         = useState(false);
  const [fmIntroText, setFmIntroText] = useState("");
  const [fmAnswers, setFmAnswers]     = useState(true);

  // UI state
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]           = useState<string | null>(null);

  // ── Live summary ────────────────────────────────────────────────────────────
  const puzzlePages    = Math.ceil(pageCount / layout);
  const answerPages    = fmAnswers ? Math.ceil(pageCount / 6) : 0;
  const fmPageCount    = [fmTitle, fmCopyright, fmHowToPlay, fmIntro].filter(Boolean).length;
  const totalMin       = puzzlePages + answerPages + fmPageCount;
  const totalMax       = totalMin + 1; // possible blank page for recto alignment

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

    const frontMatter: FrontMatterPayload = {
      titlePage:    fmTitle,
      copyrightPage: fmCopyright,
      howToPlay:    fmHowToPlay,
      introduction: fmIntro,
      introText:    fmIntro && fmIntroText.trim() ? fmIntroText.trim() : undefined,
      answerPages:  fmAnswers,
    };

    const payload: CreateBookPayload = {
      title: title.trim() || "Sudoku Puzzle Book",
      trimSize,
      difficulty,
      pageCount,
      layout,
      uniquenessLevel: uniqueness,
      frontMatter,
    };

    try {
      const { checkoutUrl } = await apiFetch<CreateBookResponse>("/books", {
        method: "POST",
        body: JSON.stringify(payload),
      });
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

        <form onSubmit={handleSubmit} className="space-y-10">

          {/* ── Section 1: Basics ────────────────────────────────────────── */}
          <section>
            <h2 className="mb-4 text-xs font-semibold uppercase tracking-widest text-zinc-400">
              Basics
            </h2>
            <div className="space-y-5">
              {/* Title */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-zinc-700">
                  Book title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="My Sudoku Puzzle Book"
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
                      <div>
                        <span className="text-sm font-medium text-zinc-900">{ts.label}</span>
                        {ts.value === "8.5x11" && (
                          <span className="ml-2 rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-500">
                            Recommended
                          </span>
                        )}
                        <span className="ml-2 text-xs text-zinc-400">{ts.hint}</span>
                      </div>
                    </label>
                  ))}
                </div>
              </fieldset>
            </div>
          </section>

          {/* ── Section 2: Puzzles ───────────────────────────────────────── */}
          <section>
            <h2 className="mb-4 text-xs font-semibold uppercase tracking-widest text-zinc-400">
              Puzzles
            </h2>
            <div className="space-y-5">
              {/* Difficulty */}
              <fieldset>
                <legend className="mb-2 text-sm font-medium text-zinc-700">
                  Difficulty
                </legend>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
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
                        {d.value === "progressive" && (
                          <span className="ml-1.5 text-xs font-normal text-zinc-400">★</span>
                        )}
                      </span>
                      <span className="text-xs text-zinc-400">{d.desc}</span>
                    </label>
                  ))}
                </div>
              </fieldset>

              {/* Number of puzzles */}
              <div>
                <div className="mb-1.5 flex items-baseline justify-between">
                  <label className="text-sm font-medium text-zinc-700">
                    Number of puzzles
                  </label>
                  <span className="text-sm font-semibold tabular-nums text-zinc-900">
                    {pageCount}
                  </span>
                </div>
                <input
                  type="range"
                  min={10}
                  max={300}
                  step={5}
                  value={pageCount}
                  onChange={(e) => setPageCount(Number(e.target.value))}
                  className="w-full accent-zinc-900"
                />
                <div className="mt-1 flex justify-between text-xs text-zinc-400">
                  <span>10</span>
                  <span className="text-zinc-500">Most books: 80–150</span>
                  <span>300</span>
                </div>
              </div>
            </div>
          </section>

          {/* ── Section 3: Layout ────────────────────────────────────────── */}
          <section>
            <h2 className="mb-4 text-xs font-semibold uppercase tracking-widest text-zinc-400">
              Layout
            </h2>
            <fieldset>
              <legend className="mb-2 text-sm font-medium text-zinc-700">
                Puzzles per page
              </legend>
              <div className="grid grid-cols-3 gap-2">
                {LAYOUTS.map((l) => (
                  <label
                    key={l.value}
                    className={`flex cursor-pointer flex-col items-center gap-1 rounded-lg border px-4 py-4 text-center transition-colors ${
                      layout === l.value
                        ? "border-zinc-900 bg-zinc-50"
                        : "border-zinc-200 hover:border-zinc-300"
                    }`}
                  >
                    <input
                      type="radio"
                      name="layout"
                      value={l.value}
                      checked={layout === l.value}
                      onChange={() => setLayout(l.value as 1 | 2 | 4)}
                      className="sr-only"
                    />
                    <span className="text-lg font-bold text-zinc-900">{l.label}</span>
                    <span className="text-xs text-zinc-400">{l.hint}</span>
                    {l.value === 2 && (
                      <span className="mt-0.5 rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-500">
                        Default
                      </span>
                    )}
                  </label>
                ))}
              </div>
            </fieldset>
          </section>

          {/* ── Section 4: Options ───────────────────────────────────────── */}
          <section>
            <h2 className="mb-4 text-xs font-semibold uppercase tracking-widest text-zinc-400">
              Options
            </h2>
            <div className="space-y-6">
              {/* Duplicate protection */}
              <fieldset>
                <legend className="mb-2 text-sm font-medium text-zinc-700">
                  Duplicate protection
                </legend>
                <div className="space-y-2">
                  {UNIQUENESS_LEVELS.map((u) => (
                    <label
                      key={u.value}
                      className={`flex cursor-pointer items-start gap-3 rounded-lg border px-4 py-3 transition-colors ${
                        uniqueness === u.value
                          ? "border-zinc-900 bg-zinc-50"
                          : "border-zinc-200 hover:border-zinc-300"
                      }`}
                    >
                      <input
                        type="radio"
                        name="uniqueness"
                        value={u.value}
                        checked={uniqueness === u.value}
                        onChange={() => setUniqueness(u.value)}
                        className="mt-0.5 accent-zinc-900"
                      />
                      <div>
                        <p className="text-sm font-medium text-zinc-900">{u.label}</p>
                        <p className="text-xs text-zinc-400">{u.desc}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </fieldset>

              {/* Include pages */}
              <div>
                <p className="mb-2 text-sm font-medium text-zinc-700">Include pages</p>
                <div className="space-y-2 rounded-lg border border-zinc-200 px-4 py-3">
                  {[
                    { label: "Title page",    state: fmTitle,    set: setFmTitle },
                    { label: "Copyright page", state: fmCopyright, set: setFmCopyright },
                    { label: "How to Play",   state: fmHowToPlay, set: setFmHowToPlay },
                    { label: "Answer pages",  state: fmAnswers,  set: setFmAnswers },
                  ].map((item) => (
                    <label key={item.label} className="flex cursor-pointer items-center gap-3">
                      <input
                        type="checkbox"
                        checked={item.state}
                        onChange={(e) => item.set(e.target.checked)}
                        className="h-4 w-4 rounded border-zinc-300 accent-zinc-900"
                      />
                      <span className="text-sm text-zinc-700">{item.label}</span>
                    </label>
                  ))}

                  {/* Introduction — with expandable textarea */}
                  <label className="flex cursor-pointer items-center gap-3">
                    <input
                      type="checkbox"
                      checked={fmIntro}
                      onChange={(e) => setFmIntro(e.target.checked)}
                      className="h-4 w-4 rounded border-zinc-300 accent-zinc-900"
                    />
                    <span className="text-sm text-zinc-700">Introduction page</span>
                  </label>
                  {fmIntro && (
                    <textarea
                      value={fmIntroText}
                      onChange={(e) => setFmIntroText(e.target.value)}
                      rows={4}
                      maxLength={3000}
                      placeholder="Welcome to this puzzle book…"
                      className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
                    />
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* ── Live summary ─────────────────────────────────────────────── */}
          <div className="rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-zinc-400">
              Summary
            </p>
            <div className="space-y-1 text-sm text-zinc-700">
              <div className="flex justify-between">
                <span>Total puzzles</span>
                <span className="font-semibold tabular-nums">{pageCount}</span>
              </div>
              <div className="flex justify-between">
                <span>Puzzle pages</span>
                <span className="tabular-nums">{puzzlePages}</span>
              </div>
              {fmAnswers && (
                <div className="flex justify-between">
                  <span>Answer pages</span>
                  <span className="tabular-nums">{answerPages}</span>
                </div>
              )}
              {fmPageCount > 0 && (
                <div className="flex justify-between">
                  <span>Front matter</span>
                  <span className="tabular-nums">{fmPageCount}</span>
                </div>
              )}
              <div className="flex justify-between border-t border-zinc-200 pt-1 font-semibold">
                <span>Estimated total pages</span>
                <span className="tabular-nums">~{totalMin}–{totalMax}</span>
              </div>
            </div>
          </div>

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
            {submitting ? "Reserving puzzles…" : "Generate Book →"}
          </button>
        </form>
      </main>
    </>
  );
}
