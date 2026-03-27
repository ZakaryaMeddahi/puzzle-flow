"use client";

import type { BookSetupState, BookStyleState, FmEnabled } from "../page";
import {
  BOOK_FONTS,
  FONT_LABELS,
  FONT_DESCRIPTIONS,
  FONT_FAMILY_CSS,
  LABEL_FORMAT_EXAMPLES,
} from "@kdp/shared/browser";
import type { BookFont, PuzzleLabelFormat, GridStyle } from "@kdp/shared/browser";

interface Props {
  state: BookSetupState;
  onChange: <K extends keyof BookSetupState>(key: K, value: BookSetupState[K]) => void;
  fmEnabled: FmEnabled;
  onFmEnabledChange: (key: keyof FmEnabled, value: boolean) => void;
  bookStyle: BookStyleState;
  onBookStyleChange: <K extends keyof BookStyleState>(key: K, value: BookStyleState[K]) => void;
}

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

const FM_TOGGLES: { key: keyof FmEnabled; label: string }[] = [
  { key: "titlePage",     label: "Title page" },
  { key: "copyrightPage", label: "Copyright page" },
  { key: "howToPlay",     label: "How to Play page" },
  { key: "introduction",  label: "Introduction page" },
  { key: "answerPages",   label: "Answer pages" },
];

const LABEL_FORMATS: { value: PuzzleLabelFormat; label: string }[] = [
  { value: "puzzle-n", label: "Puzzle 1" },
  { value: "hash-n",   label: "#1" },
  { value: "no-n",     label: "No. 1" },
  { value: "n",        label: "1" },
];

const GRID_STYLES: { value: GridStyle; label: string; desc: string }[] = [
  { value: "standard", label: "Standard", desc: "Solid black lines" },
  { value: "minimal",  label: "Minimal",  desc: "Soft grey lines" },
];

export function StepBookSetup({
  state,
  onChange,
  fmEnabled,
  onFmEnabledChange,
  bookStyle,
  onBookStyleChange,
}: Props) {
  const puzzlePages = Math.ceil(state.pageCount / state.layout);
  const answerPages = fmEnabled.answerPages ? Math.ceil(state.pageCount / 6) : 0;
  const fmPageCount = (["titlePage", "copyrightPage", "howToPlay", "introduction"] as const)
    .filter((k) => fmEnabled[k]).length;
  const totalMin = puzzlePages + answerPages + fmPageCount;
  const totalMax = totalMin + 1;

  return (
    <div className="space-y-10">

      {/* ── Basics ─────────────────────────────────────────────────────── */}
      <section>
        <h3 className="mb-4 text-xs font-semibold uppercase tracking-widest text-zinc-400">
          Basics
        </h3>
        <div className="space-y-5">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-zinc-700">
              Book title
            </label>
            <input
              type="text"
              value={state.title}
              onChange={(e) => onChange("title", e.target.value)}
              placeholder="My Sudoku Puzzle Book"
              maxLength={120}
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
            />
          </div>

          <fieldset>
            <legend className="mb-2 text-sm font-medium text-zinc-700">Trim size</legend>
            <div className="space-y-2">
              {TRIM_SIZES.map((ts) => (
                <label
                  key={ts.value}
                  className={`flex cursor-pointer items-center gap-3 rounded-lg border px-4 py-3 transition-colors ${
                    state.trimSize === ts.value
                      ? "border-zinc-900 bg-zinc-50"
                      : "border-zinc-200 hover:border-zinc-300"
                  }`}
                >
                  <input
                    type="radio"
                    name="trimSize"
                    value={ts.value}
                    checked={state.trimSize === ts.value}
                    onChange={() => onChange("trimSize", ts.value)}
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

      {/* ── Puzzles ────────────────────────────────────────────────────── */}
      <section>
        <h3 className="mb-4 text-xs font-semibold uppercase tracking-widest text-zinc-400">
          Puzzles
        </h3>
        <div className="space-y-5">
          <fieldset>
            <legend className="mb-2 text-sm font-medium text-zinc-700">Difficulty</legend>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {DIFFICULTIES.map((d) => (
                <label
                  key={d.value}
                  className={`flex cursor-pointer flex-col gap-0.5 rounded-lg border px-4 py-3 transition-colors ${
                    state.difficulty === d.value
                      ? "border-zinc-900 bg-zinc-50"
                      : "border-zinc-200 hover:border-zinc-300"
                  }`}
                >
                  <input
                    type="radio"
                    name="difficulty"
                    value={d.value}
                    checked={state.difficulty === d.value}
                    onChange={() => onChange("difficulty", d.value)}
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

          <div>
            <div className="mb-1.5 flex items-baseline justify-between">
              <label className="text-sm font-medium text-zinc-700">Number of puzzles</label>
              <span className="text-sm font-semibold tabular-nums text-zinc-900">
                {state.pageCount}
              </span>
            </div>
            <input
              type="range"
              min={10} max={300} step={5}
              value={state.pageCount}
              onChange={(e) => onChange("pageCount", Number(e.target.value))}
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

      {/* ── Layout ─────────────────────────────────────────────────────── */}
      <section>
        <h3 className="mb-4 text-xs font-semibold uppercase tracking-widest text-zinc-400">
          Layout
        </h3>
        <fieldset>
          <legend className="mb-2 text-sm font-medium text-zinc-700">Puzzles per page</legend>
          <div className="grid grid-cols-3 gap-2">
            {LAYOUTS.map((l) => (
              <label
                key={l.value}
                className={`flex cursor-pointer flex-col items-center gap-1 rounded-lg border px-4 py-4 text-center transition-colors ${
                  state.layout === l.value
                    ? "border-zinc-900 bg-zinc-50"
                    : "border-zinc-200 hover:border-zinc-300"
                }`}
              >
                <input
                  type="radio"
                  name="layout"
                  value={l.value}
                  checked={state.layout === l.value}
                  onChange={() => onChange("layout", l.value as 1 | 2 | 4)}
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

      {/* ── Style ──────────────────────────────────────────────────────── */}
      <section>
        <h3 className="mb-4 text-xs font-semibold uppercase tracking-widest text-zinc-400">
          Style
        </h3>
        <div className="space-y-6">

          {/* Font family */}
          <fieldset>
            <legend className="mb-2 text-sm font-medium text-zinc-700">Font</legend>
            <div className="space-y-2">
              {BOOK_FONTS.map((f) => (
                <label
                  key={f}
                  className={`flex cursor-pointer items-center gap-3 rounded-lg border px-4 py-3 transition-colors ${
                    bookStyle.font === f
                      ? "border-zinc-900 bg-zinc-50"
                      : "border-zinc-200 hover:border-zinc-300"
                  }`}
                >
                  <input
                    type="radio"
                    name="font"
                    value={f}
                    checked={bookStyle.font === f}
                    onChange={() => onBookStyleChange("font", f as BookFont)}
                    className="accent-zinc-900"
                  />
                  <div className="flex flex-1 items-baseline justify-between gap-3">
                    <div>
                      <span
                        className="text-sm font-medium text-zinc-900"
                        style={{ fontFamily: FONT_FAMILY_CSS[f] }}
                      >
                        {FONT_LABELS[f]}
                      </span>
                      <span className="ml-2 text-xs text-zinc-400">{FONT_DESCRIPTIONS[f]}</span>
                    </div>
                    <span
                      className="shrink-0 text-sm text-zinc-500"
                      style={{ fontFamily: FONT_FAMILY_CSS[f] }}
                    >
                      Aa Bb 123
                    </span>
                  </div>
                </label>
              ))}
            </div>
          </fieldset>

          {/* Grid line style */}
          <fieldset>
            <legend className="mb-2 text-sm font-medium text-zinc-700">Grid style</legend>
            <div className="grid grid-cols-2 gap-2">
              {GRID_STYLES.map((gs) => (
                <label
                  key={gs.value}
                  className={`flex cursor-pointer flex-col gap-0.5 rounded-lg border px-4 py-3 transition-colors ${
                    bookStyle.gridStyle === gs.value
                      ? "border-zinc-900 bg-zinc-50"
                      : "border-zinc-200 hover:border-zinc-300"
                  }`}
                >
                  <input
                    type="radio"
                    name="gridStyle"
                    value={gs.value}
                    checked={bookStyle.gridStyle === gs.value}
                    onChange={() => onBookStyleChange("gridStyle", gs.value as GridStyle)}
                    className="sr-only"
                  />
                  <span className="text-sm font-medium text-zinc-900">{gs.label}</span>
                  <span className="text-xs text-zinc-400">{gs.desc}</span>
                </label>
              ))}
            </div>
          </fieldset>

          {/* Puzzle label format */}
          <fieldset>
            <legend className="mb-2 text-sm font-medium text-zinc-700">Puzzle label</legend>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {LABEL_FORMATS.map((lf) => (
                <label
                  key={lf.value}
                  className={`flex cursor-pointer items-center justify-center rounded-lg border px-3 py-2.5 text-sm transition-colors ${
                    bookStyle.labelFormat === lf.value
                      ? "border-zinc-900 bg-zinc-50 font-medium text-zinc-900"
                      : "border-zinc-200 text-zinc-500 hover:border-zinc-300"
                  }`}
                >
                  <input
                    type="radio"
                    name="labelFormat"
                    value={lf.value}
                    checked={bookStyle.labelFormat === lf.value}
                    onChange={() => onBookStyleChange("labelFormat", lf.value as PuzzleLabelFormat)}
                    className="sr-only"
                  />
                  {lf.label}
                </label>
              ))}
            </div>
          </fieldset>

          {/* Toggles */}
          <div className="space-y-2 rounded-lg border border-zinc-200 px-4 py-3">
            <label className="flex cursor-pointer items-center gap-3">
              <input
                type="checkbox"
                checked={bookStyle.pageNumbers}
                onChange={(e) => onBookStyleChange("pageNumbers", e.target.checked)}
                className="h-4 w-4 rounded border-zinc-300 accent-zinc-900"
              />
              <div>
                <span className="text-sm text-zinc-700">Page numbers</span>
                <span className="ml-2 text-xs text-zinc-400">Bottom-right on right pages, bottom-left on left pages</span>
              </div>
            </label>
            <label className="flex cursor-pointer items-center gap-3">
              <input
                type="checkbox"
                checked={bookStyle.difficultyBadge}
                onChange={(e) => onBookStyleChange("difficultyBadge", e.target.checked)}
                className="h-4 w-4 rounded border-zinc-300 accent-zinc-900"
              />
              <div>
                <span className="text-sm text-zinc-700">Difficulty stars</span>
                <span className="ml-2 text-xs text-zinc-400">
                  Star indicators next to puzzle labels (★ easy → ★★★★ expert)
                </span>
              </div>
            </label>
            <label className="flex cursor-pointer items-center gap-3">
              <input
                type="checkbox"
                checked={bookStyle.clueBackground}
                onChange={(e) => onBookStyleChange("clueBackground", e.target.checked)}
                className="h-4 w-4 rounded border-zinc-300 accent-zinc-900"
              />
              <div>
                <span className="text-sm text-zinc-700">Clue cell shading</span>
                <span className="ml-2 text-xs text-zinc-400">
                  Light grey background behind pre-filled numbers in the grid
                </span>
              </div>
            </label>
          </div>
        </div>
      </section>

      {/* ── Options ────────────────────────────────────────────────────── */}
      <section>
        <h3 className="mb-4 text-xs font-semibold uppercase tracking-widest text-zinc-400">
          Options
        </h3>
        <div className="space-y-6">
          <fieldset>
            <legend className="mb-2 text-sm font-medium text-zinc-700">
              Duplicate protection
            </legend>
            <div className="space-y-2">
              {UNIQUENESS_LEVELS.map((u) => (
                <label
                  key={u.value}
                  className={`flex cursor-pointer items-start gap-3 rounded-lg border px-4 py-3 transition-colors ${
                    state.uniquenessLevel === u.value
                      ? "border-zinc-900 bg-zinc-50"
                      : "border-zinc-200 hover:border-zinc-300"
                  }`}
                >
                  <input
                    type="radio"
                    name="uniqueness"
                    value={u.value}
                    checked={state.uniquenessLevel === u.value}
                    onChange={() => onChange("uniquenessLevel", u.value)}
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

          <div>
            <p className="mb-2 text-sm font-medium text-zinc-700">Include pages</p>
            <div className="space-y-2 rounded-lg border border-zinc-200 px-4 py-3">
              {FM_TOGGLES.map((item) => (
                <label key={item.key} className="flex cursor-pointer items-center gap-3">
                  <input
                    type="checkbox"
                    checked={fmEnabled[item.key]}
                    onChange={(e) => onFmEnabledChange(item.key, e.target.checked)}
                    className="h-4 w-4 rounded border-zinc-300 accent-zinc-900"
                  />
                  <span className="text-sm text-zinc-700">{item.label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Live summary ───────────────────────────────────────────────── */}
      <div className="rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-4">
        <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-zinc-400">
          Summary
        </p>
        <div className="space-y-1 text-sm text-zinc-700">
          <div className="flex justify-between">
            <span>Total puzzles</span>
            <span className="font-semibold tabular-nums">{state.pageCount}</span>
          </div>
          <div className="flex justify-between">
            <span>Puzzle pages</span>
            <span className="tabular-nums">{puzzlePages}</span>
          </div>
          {fmEnabled.answerPages && (
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
    </div>
  );
}
