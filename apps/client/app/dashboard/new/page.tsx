"use client";

import { useState } from "react";
import Link from "next/link";
import { useRequireAuth } from "../../hooks/use-require-auth";
import { apiFetch } from "../../lib/api";
import { NavHeader } from "../../components/nav-header";
import { Button } from "../../ui";
import {
  getPageDefinition,
  resolveValues,
  PAGE_DEFINITIONS,
} from "@kdp/shared/browser";
import type {
  PageValues,
  PageType,
  Alignment,
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
  font: BookFont;
  pageNumbers: boolean;
  labelFormat: PuzzleLabelFormat;
  gridStyle: GridStyle;
  difficultyBadge: boolean;
  clueBackground: boolean;
}

export type FmEnabled = {
  titlePage: boolean;
  copyrightPage: boolean;
  howToPlay: boolean;
  introduction: boolean;
  answerPages: boolean;
};

// ── Step definitions ──────────────────────────────────────────────────────────

type FmPageKey = "titlePage" | "copyrightPage" | "howToPlay" | "introduction";
type StepId = "setup" | FmPageKey | "review";

const FM_PAGE_KEYS: FmPageKey[] = [
  "titlePage",
  "copyrightPage",
  "howToPlay",
  "introduction",
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
  setup: "Setup",
  titlePage: "Title Page",
  copyrightPage: "Copyright",
  howToPlay: "How to Play",
  introduction: "Introduction",
  review: "Review",
};

// ── Component ─────────────────────────────────────────────────────────────────

interface CreateBookResponse {
  book: { id: string };
  checkoutUrl: string;
}

export default function NewBookPage() {
  const { loading: authLoading } = useRequireAuth();

  const [setup, setSetup] = useState<BookSetupState>({
    title: "",
    trimSize: "8.5x11",
    difficulty: "progressive",
    pageCount: 100,
    layout: 2,
    uniquenessLevel: "book",
  });

  const [bookStyle, setBookStyle] = useState<BookStyleState>({
    font: "roboto",
    pageNumbers: true,
    labelFormat: "puzzle-n",
    gridStyle: "standard",
    difficultyBadge: true,
    clueBackground: true,
  });

  const [fmEnabled, setFmEnabled] = useState<FmEnabled>({
    titlePage: true,
    copyrightPage: true,
    howToPlay: true,
    introduction: false,
    answerPages: true,
  });

  const [fmValues, setFmValues] = useState<Record<string, PageValues>>(() => {
    const init: Record<string, PageValues> = {};
    for (const key of FM_PAGE_KEYS) {
      const def = PAGE_DEFINITIONS[key as PageType];
      init[key] = resolveValues(def, {});
    }
    return init;
  });

  const [fmStyles, setFmStyles] = useState<
    Record<string, Record<string, { alignment: Alignment }>>
  >(() => {
    const init: Record<string, Record<string, { alignment: Alignment }>> = {};
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

  const [imageUrls, setImageUrls] = useState<
    Record<string, Record<string, string>>
  >({});
  const [currentStep, setCurrentStep] = useState<StepId>("setup");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-zinc-100">
        <NavHeader />
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-zinc-200 border-t-indigo-600" />
        </div>
      </div>
    );
  }

  // ── Handlers ──────────────────────────────────────────────────────────────

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
    styles: Record<string, { alignment: Alignment }>,
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

  const steps = computeSteps(fmEnabled);
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
      title: setup.title.trim() || "Sudoku Puzzle Book",
      trimSize: setup.trimSize,
      difficulty: setup.difficulty,
      pageCount: setup.pageCount,
      layout: setup.layout,
      uniquenessLevel: setup.uniquenessLevel,
      styleOptions: {
        font: bookStyle.font,
        pageNumbers: bookStyle.pageNumbers,
        labelFormat: bookStyle.labelFormat,
        gridStyle: bookStyle.gridStyle,
        difficultyBadge: bookStyle.difficultyBadge,
        clueBackground: bookStyle.clueBackground,
      },
      frontMatter: {
        titlePage: {
          enabled: fmEnabled.titlePage,
          values: fmValues["titlePage"] ?? {},
          styles: fmStyles["titlePage"] ?? {},
        },
        copyrightPage: {
          enabled: fmEnabled.copyrightPage,
          values: fmValues["copyrightPage"] ?? {},
          styles: fmStyles["copyrightPage"] ?? {},
        },
        howToPlay: {
          enabled: fmEnabled.howToPlay,
          values: fmValues["howToPlay"] ?? {},
          styles: fmStyles["howToPlay"] ?? {},
        },
        introduction: {
          enabled: fmEnabled.introduction,
          values: fmValues["introduction"] ?? {},
          styles: fmStyles["introduction"] ?? {},
        },
        answerPages: fmEnabled.answerPages,
      },
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

  const isFmStep = FM_PAGE_KEYS.includes(currentStep as FmPageKey);

  return (
    <div className="min-h-screen bg-zinc-100">
      <NavHeader />

      <main className="mx-auto max-w-4xl px-6 py-8">
        {/* Back link */}
        <Link
          href="/dashboard"
          className="mb-6 inline-flex items-center gap-1.5 text-sm text-zinc-500 transition-colors hover:text-zinc-900"
        >
          ← Back to dashboard
        </Link>

        {/* Page header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
            Create a new book
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            Configure your Sudoku puzzle book. You&apos;ll be taken to checkout
            after.
          </p>
        </div>

        {/* Step progress */}
        <nav aria-label="Steps" className="mb-6 overflow-x-auto pb-1">
          <ol className="flex min-w-max items-center">
            {steps.map((step, i) => {
              const done = i < stepIdx;
              const active = step === currentStep;
              return (
                <li key={step} className="flex items-center">
                  <div className="flex items-center gap-2">
                    {/* Circle */}
                    <div
                      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-all ${
                        done
                          ? "bg-indigo-600 text-white"
                          : active
                            ? "border-2 border-indigo-600 text-indigo-600"
                            : "border-2 border-zinc-300 text-zinc-400"
                      }`}
                    >
                      {done ? "✓" : i + 1}
                    </div>
                    {/* Label */}
                    <span
                      className={`whitespace-nowrap text-xs font-medium transition-colors ${
                        active
                          ? "text-zinc-900"
                          : done
                            ? "text-indigo-600"
                            : "text-zinc-400"
                      }`}
                    >
                      {STEP_LABELS[step]}
                    </span>
                  </div>
                  {/* Connector line */}
                  {i < steps.length - 1 && (
                    <div
                      className={`mx-3 h-px w-8 shrink-0 transition-colors ${
                        done ? "bg-indigo-300" : "bg-zinc-200"
                      }`}
                    />
                  )}
                </li>
              );
            })}
          </ol>
        </nav>

        {/* Step content card */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
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
              onStylesChange={(styles) =>
                handleFmStylesChange(currentStep, styles)
              }
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

        {/* Navigation */}
        {currentStep !== "review" && (
          <div className="mt-6 flex items-center justify-between">
            <Button
              variant="secondary"
              onClick={goBack}
              disabled={stepIdx === 0}
            >
              ← Back
            </Button>
            <Button variant="primary" onClick={goNext}>
              {stepIdx === steps.length - 2 ? "Review →" : "Next →"}
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}
