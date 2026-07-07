"use client";

import { useState, useEffect } from "react";
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
  const [trialAvailable, setTrialAvailable] = useState(false);
  const [freeTrial, setFreeTrial] = useState(false);

  useEffect(() => {
    apiFetch<{ trialUsed: boolean }>("/users/me")
      .then((u) => {
        if (!u.trialUsed) setTrialAvailable(true);
      })
      .catch(() => {});
  }, []);

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
      pageCount: freeTrial ? Math.min(setup.pageCount, 10) : setup.pageCount,
      layout: setup.layout,
      uniquenessLevel: setup.uniquenessLevel,
      ...(freeTrial ? { freeTrial: true } : {}),
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

      <main className="mx-auto max-w-6xl px-6 py-4">
        <div className="mb-4 flex items-center gap-4">
          <Link
            href="/dashboard"
            className="flex shrink-0 items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-600 shadow-sm transition-colors hover:border-zinc-300 hover:text-zinc-900"
          >
            <svg
              className="h-3.5 w-3.5"
              fill="none"
              viewBox="0 0 16 16"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M10 12L6 8l4-4"
              />
            </svg>
            Dashboard
          </Link>
          <div className="min-w-0">
            <h1 className="text-lg font-bold tracking-tight text-zinc-900">
              Create a new book
            </h1>
            <p className="text-xs text-zinc-500">
              Configure your puzzle book - checkout happens at the end.
            </p>
          </div>
        </div>

        {/* Step progress */}
        <div className="mb-4">
          {/* Track */}
          <div className="mb-2.5 flex items-center gap-1">
            {steps.map((step, i) => {
              const done = i < stepIdx;
              const active = step === currentStep;
              return (
                <div
                  key={step}
                  className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                    done
                      ? "bg-indigo-500"
                      : active
                        ? "bg-indigo-300"
                        : "bg-zinc-200"
                  }`}
                />
              );
            })}
          </div>
          {/* Step label row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600 text-[10px] font-bold text-white">
                {stepIdx + 1}
              </span>
              <span className="text-sm font-semibold text-zinc-900">
                {STEP_LABELS[currentStep]}
              </span>
            </div>
            <span className="text-xs text-zinc-400">
              Step {stepIdx + 1} of {steps.length}
            </span>
          </div>
        </div>

        {/* Free trial banner (shown only on setup step when trial is available) */}
        {currentStep === "setup" && trialAvailable && (
          <div
            className={`mb-4 rounded-xl px-5 py-4 ${freeTrial ? "border border-indigo-200 bg-indigo-50" : "border border-zinc-200 bg-zinc-50"}`}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-zinc-900">
                  {freeTrial ? "✓ Free trial active" : "Try PuzzleFlow free"}
                </p>
                <p className="mt-0.5 text-xs text-zinc-500">
                  {freeTrial
                    ? "Your book will include 10 puzzles and a watermark. One-time offer."
                    : "Generate a 10-puzzle sample book at no cost. Watermarked. One-time offer."}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setFreeTrial((v) => !v)}
                className={`shrink-0 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                  freeTrial
                    ? "bg-indigo-600 text-white hover:bg-indigo-700"
                    : "border border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-100"
                }`}
              >
                {freeTrial ? "Cancel trial" : "Use free trial"}
              </button>
            </div>
          </div>
        )}

        {/* Step content card */}
        <div
          className={`rounded-2xl border border-zinc-200 shadow-sm ${isFmStep ? "" : "bg-white p-8"}`}
          style={isFmStep ? { overflow: "clip" } : undefined}
        >
          {currentStep === "setup" && (
            <StepBookSetup
              state={setup}
              onChange={handleSetupChange}
              fmEnabled={fmEnabled}
              onFmEnabledChange={handleFmEnabledChange}
              bookStyle={bookStyle}
              onBookStyleChange={handleBookStyleChange}
              isTrial={freeTrial}
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
          <div className="mt-4 flex items-center justify-between">
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
