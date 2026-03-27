"use client";

import type { BookSetupState, FmEnabled } from "../page";
import type { PageValues } from "@kdp/shared/browser";
import { PAGE_DEFINITIONS } from "@kdp/shared/browser";

interface Props {
  setup: BookSetupState;
  fmEnabled: FmEnabled;
  fmValues: Record<string, PageValues>;
  submitting: boolean;
  error: string | null;
  onSubmit: () => void;
  onBack: () => void;
}

const DIFFICULTY_LABEL: Record<string, string> = {
  progressive: "Progressive (Easy → Expert)",
  easy:   "Easy",
  medium: "Medium",
  hard:   "Hard",
  expert: "Expert",
};

const FM_PAGE_KEYS = ["titlePage", "copyrightPage", "howToPlay", "introduction"] as const;

export function StepReview({
  setup,
  fmEnabled,
  fmValues,
  submitting,
  error,
  onSubmit,
  onBack,
}: Props) {
  return (
    <div className="mx-auto max-w-lg space-y-8">
      <div>
        <h3 className="mb-1 text-base font-semibold text-zinc-900">Review your book</h3>
        <p className="text-sm text-zinc-500">
          Everything look good? Click Generate to proceed to checkout.
        </p>
      </div>

      {/* Book config */}
      <div className="divide-y divide-zinc-100 rounded-lg border border-zinc-200">
        {[
          ["Title",                setup.title || "Sudoku Puzzle Book"],
          ["Trim size",            setup.trimSize],
          ["Difficulty",           DIFFICULTY_LABEL[setup.difficulty] ?? setup.difficulty],
          ["Puzzles",              String(setup.pageCount)],
          ["Layout",               `${setup.layout} per page`],
          ["Duplicate protection", setup.uniquenessLevel],
        ].map(([label, value]) => (
          <div key={label} className="flex justify-between px-4 py-2.5 text-sm">
            <span className="text-zinc-500">{label}</span>
            <span className="font-medium text-zinc-900">{value}</span>
          </div>
        ))}
      </div>

      {/* Front matter */}
      <div>
        <p className="mb-2 text-sm font-medium text-zinc-700">Pages included</p>
        <div className="space-y-1.5">
          {FM_PAGE_KEYS.filter((k) => fmEnabled[k]).map((key) => {
            const def = PAGE_DEFINITIONS[key];
            const vals = fmValues[key] ?? {};
            // Show the first non-empty text value as a subtitle
            const firstText = def.elements.find(
              (e) => e.type === "text" && vals[e.id],
            );
            const preview = firstText ? (vals[firstText.id] ?? "").slice(0, 60) : "";
            return (
              <div
                key={key}
                className="flex items-baseline gap-2 rounded-lg border border-zinc-200 px-3 py-2 text-sm"
              >
                <span className="font-medium text-zinc-900">{def.label}</span>
                {preview && (
                  <span className="truncate text-xs text-zinc-400">{preview}</span>
                )}
              </div>
            );
          })}
          {fmEnabled.answerPages && (
            <div className="flex items-baseline gap-2 rounded-lg border border-zinc-200 px-3 py-2 text-sm">
              <span className="font-medium text-zinc-900">Answer Pages</span>
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      <div className="space-y-3">
        <button
          type="button"
          onClick={onSubmit}
          disabled={submitting}
          className="w-full rounded-lg bg-zinc-900 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting ? "Reserving puzzles…" : "Generate Book →"}
        </button>
        <button
          type="button"
          onClick={onBack}
          className="w-full rounded-lg border border-zinc-300 px-4 py-2.5 text-sm font-medium text-zinc-700 transition-colors hover:border-zinc-400"
        >
          ← Back
        </button>
      </div>
    </div>
  );
}
