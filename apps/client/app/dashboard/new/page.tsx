"use client";

import { useState } from "react";
import Link from "next/link";
import { useRequireAuth } from "../../hooks/use-require-auth";
import { apiFetch } from "../../lib/api";
import { NavHeader } from "../../components/nav-header";
import { getPageDefinition, resolveValues, PAGE_DEFINITIONS } from "@kdp/shared/browser";
import type {
  PageValues,
  PageType,
  Alignment,
  VerticalAlignment,
  BookFont,
  PuzzleLabelFormat,
  GridStyle,
} from "@kdp/shared/browser";
import { StepBookSetup } from "./steps/step-book-setup";
import { StepPageEditor } from "./steps/step-page-editor";
import { StepReview } from "./steps/step-review";

// ── Exported types (consumed by step components) ──────────────────────────────

export interface BookSetupState {
  title: string;
  trimSize: string;
  difficulty: string;
  pageCount: number;
  layout: 1 | 2 | 4;
  uniquenessLevel: string;
}

export interface BookStyleState {
  font:            BookFont;
  pageNumbers:     boolean;
  labelFormat:     PuzzleLabelFormat;
  gridStyle:       GridStyle;
  difficultyBadge: boolean;
  clueBackground:  boolean;
}

export type FmEnabled = {
  titlePage:     boolean;
  copyrightPage: boolean;
  howToPlay:     boolean;
  introduction:  boolean;
  answerPages:   boolean;
};

// ── Step definitions ──────────────────────────────────────────────────────────

type FmPageKey = "titlePage" | "copyrightPage" | "howToPlay" | "introduction";
type StepId = "setup" | FmPageKey | "review";

const FM_PAGE_KEYS: FmPageKey[] = [
  "titlePage", "copyrightPage", "howToPlay", "introduction",
];

function computeSteps(fmEnabled: FmEnabled): StepId[] {
  const steps: StepId[] = ["setup"];
  for (const key of FM_PAGE_KEYS) {
    if (fmEnabled[key]) steps.push(key);
  }
  steps.push("review");
  return steps;
}

const STEP_LABELS: Record<StepId, string> = {
  setup:         "Setup",
  titlePage:     "Title Page",
  copyrightPage: "Copyright",
  howToPlay:     "How to Play",
  introduction:  "Introduction",
  review:        "Review",
};

// ── Component ─────────────────────────────────────────────────────────────────

interface CreateBookResponse {
  book: { id: string };
  checkoutUrl: string;
}

export default function NewBookPage() {
  const { loading: authLoading } = useRequireAuth();

  // Book setup
  const [setup, setSetup] = useState<BookSetupState>({
    title:           "",
    trimSize:        "8.5x11",
    difficulty:      "progressive",
    pageCount:       100,
    layout:          2,
    uniquenessLevel: "book",
  });

  // Book style options
  const [bookStyle, setBookStyle] = useState<BookStyleState>({
    font:            "roboto",
    pageNumbers:     true,
    labelFormat:     "puzzle-n",
    gridStyle:       "standard",
    difficultyBadge: false,
    clueBackground:  false,
  });

  // Front matter enabled flags
  const [fmEnabled, setFmEnabled] = useState<FmEnabled>({
    titlePage:     true,
    copyrightPage: true,
    howToPlay:     true,
    introduction:  false,
    answerPages:   true,
  });

  // Per-page text values — initialised with schema defaults
  const [fmValues, setFmValues] = useState<Record<string, PageValues>>(() => {
    const init: Record<string, PageValues> = {};
    for (const key of FM_PAGE_KEYS) {
      const def = PAGE_DEFINITIONS[key as PageType];
      init[key] = resolveValues(def, {});
    }
    return init;
  });

  // Per-page per-element style overrides — initialised from schema defaults
  const [fmStyles, setFmStyles] = useState<
    Record<string, Record<string, { alignment: Alignment; verticalAlignment?: VerticalAlignment }>>
  >(() => {
    const init: Record<string, Record<string, { alignment: Alignment; verticalAlignment?: VerticalAlignment }>> = {};
    for (const key of FM_PAGE_KEYS) {
      const def = PAGE_DEFINITIONS[key as PageType];
      init[key] = {};
      for (const el of def.elements) {
        if (el.type === "text") {
          init[key]![el.id] = { alignment: el.alignment };
        }
      }
    }
    return init;
  });

  // Blob URLs for image preview (client-side only)
  const [imageUrls, setImageUrls] = useState<Record<string, Record<string, string>>>({});

  // Wizard navigation
  const [currentStep, setCurrentStep] = useState<StepId>("setup");
  const [submitting, setSubmitting]   = useState(false);
  const [error, setError]             = useState<string | null>(null);

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

  // ── Handlers ───────────────────────────────────────────────────────────────

  function handleSetupChange<K extends keyof BookSetupState>(
    key: K,
    value: BookSetupState[K],
  ) {
    setSetup((prev) => ({ ...prev, [key]: value }));
  }

  function handleBookStyleChange<K extends keyof BookStyleState>(
    key: K,
    value: BookStyleState[K],
  ) {
    setBookStyle((prev) => ({ ...prev, [key]: value }));
  }

  function handleFmEnabledChange(key: keyof FmEnabled, value: boolean) {
    setFmEnabled((prev) => ({ ...prev, [key]: value }));
  }

  function handleValuesChange(pageType: string, values: PageValues) {
    setFmValues((prev) => ({ ...prev, [pageType]: values }));
  }

  function handleFmStylesChange(
    pageType: string,
    styles: Record<string, { alignment: Alignment; verticalAlignment?: VerticalAlignment }>,
  ) {
    setFmStyles((prev) => ({ ...prev, [pageType]: styles }));
  }

  function handleImageUploaded(
    pageType: string,
    elementId: string,
    key: string,
    blobUrl: string,
  ) {
    setImageUrls((prev) => ({
      ...prev,
      [pageType]: { ...(prev[pageType] ?? {}), [elementId]: blobUrl },
    }));
    setFmValues((prev) => ({
      ...prev,
      [pageType]: { ...(prev[pageType] ?? {}), [elementId]: key },
    }));
  }

  // Navigation
  const steps   = computeSteps(fmEnabled);
  const stepIdx = steps.indexOf(currentStep);

  function goNext() {
    if (stepIdx < steps.length - 1) {
      setCurrentStep(steps[stepIdx + 1]!);
      window.scrollTo(0, 0);
    }
  }

  function goBack() {
    if (stepIdx > 0) {
      setCurrentStep(steps[stepIdx - 1]!);
      window.scrollTo(0, 0);
    }
  }

  async function handleSubmit() {
    setSubmitting(true);
    setError(null);

    const payload = {
      title:           setup.title.trim() || "Sudoku Puzzle Book",
      trimSize:        setup.trimSize,
      difficulty:      setup.difficulty,
      pageCount:       setup.pageCount,
      layout:          setup.layout,
      uniquenessLevel: setup.uniquenessLevel,
      styleOptions: {
        font:            bookStyle.font,
        pageNumbers:     bookStyle.pageNumbers,
        labelFormat:     bookStyle.labelFormat,
        gridStyle:       bookStyle.gridStyle,
        difficultyBadge: bookStyle.difficultyBadge,
        clueBackground:  bookStyle.clueBackground,
      },
      frontMatter: {
        titlePage:     { enabled: fmEnabled.titlePage,     values: fmValues["titlePage"]     ?? {}, styles: fmStyles["titlePage"]     ?? {} },
        copyrightPage: { enabled: fmEnabled.copyrightPage, values: fmValues["copyrightPage"] ?? {}, styles: fmStyles["copyrightPage"] ?? {} },
        howToPlay:     { enabled: fmEnabled.howToPlay,     values: fmValues["howToPlay"]     ?? {}, styles: fmStyles["howToPlay"]     ?? {} },
        introduction:  { enabled: fmEnabled.introduction,  values: fmValues["introduction"]  ?? {}, styles: fmStyles["introduction"]  ?? {} },
        answerPages:   fmEnabled.answerPages,
      },
    };

    try {
      const { checkoutUrl } = await apiFetch<CreateBookResponse>("/books", {
        method: "POST",
        body:   JSON.stringify(payload),
      });
      window.location.href = checkoutUrl;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setSubmitting(false);
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  const isFmStep = FM_PAGE_KEYS.includes(currentStep as FmPageKey);

  return (
    <>
      <NavHeader />
      <main className="mx-auto max-w-4xl px-6 py-10">
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

        {/* Progress bar */}
        <nav aria-label="Steps" className="mb-8 flex items-center gap-1 overflow-x-auto pb-1">
          {steps.map((step, i) => (
            <div key={step} className="flex items-center gap-1">
              <div
                className={`flex h-7 min-w-max items-center rounded-full px-3 text-xs font-medium transition-colors ${
                  step === currentStep
                    ? "bg-zinc-900 text-white"
                    : i < stepIdx
                    ? "bg-zinc-200 text-zinc-600"
                    : "bg-zinc-100 text-zinc-400"
                }`}
              >
                {i < stepIdx && "✓ "}{STEP_LABELS[step]}
              </div>
              {i < steps.length - 1 && (
                <div className="h-px w-4 shrink-0 bg-zinc-200" />
              )}
            </div>
          ))}
        </nav>

        {/* Step content */}
        <div className="mb-10">
          {currentStep === "setup" && (
            <StepBookSetup
              state={setup}
              onChange={handleSetupChange}
              fmEnabled={fmEnabled}
              onFmEnabledChange={handleFmEnabledChange}
              bookStyle={bookStyle}
              onBookStyleChange={handleBookStyleChange}
            />
          )}

          {isFmStep && (
            <StepPageEditor
              definition={getPageDefinition(currentStep as PageType)}
              values={fmValues[currentStep] ?? {}}
              onValuesChange={(vals) => handleValuesChange(currentStep, vals)}
              imageUrls={imageUrls[currentStep] ?? {}}
              onImageUploaded={(elId, key, blobUrl) =>
                handleImageUploaded(currentStep, elId, key, blobUrl)
              }
              trimSize={setup.trimSize}
              styles={fmStyles[currentStep] ?? {}}
              onStylesChange={(styles) => handleFmStylesChange(currentStep, styles)}
              font={bookStyle.font}
            />
          )}

          {currentStep === "review" && (
            <StepReview
              setup={setup}
              bookStyle={bookStyle}
              fmEnabled={fmEnabled}
              fmValues={fmValues}
              submitting={submitting}
              error={error}
              onSubmit={handleSubmit}
              onBack={goBack}
            />
          )}
        </div>

        {/* Navigation — shown on all steps except review (which has its own buttons) */}
        {currentStep !== "review" && (
          <div className="flex justify-between">
            <button
              type="button"
              onClick={goBack}
              disabled={stepIdx === 0}
              className="rounded-lg border border-zinc-300 px-5 py-2.5 text-sm font-medium text-zinc-700 transition-colors hover:border-zinc-400 disabled:cursor-not-allowed disabled:opacity-40"
            >
              ← Back
            </button>
            <button
              type="button"
              onClick={goNext}
              className="rounded-lg bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-zinc-700"
            >
              {stepIdx === steps.length - 2 ? "Review →" : "Next →"}
            </button>
          </div>
        )}
      </main>
    </>
  );
}
