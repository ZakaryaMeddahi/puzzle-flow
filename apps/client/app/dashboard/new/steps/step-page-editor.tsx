"use client";

import React from "react";
import type {
  PageDefinition,
  PageValues,
  TextElement,
  ImageElement,
  Alignment,
  BookFont,
} from "@kdp/shared/browser";
import { PdfPagePreview } from "../components/pdf-page-preview";
import { ImageUploader } from "../components/image-uploader";

interface Props {
  definition: PageDefinition;
  values: PageValues;
  onValuesChange: (values: PageValues) => void;
  /** Blob URLs for images (local preview, not S3 keys). */
  imageUrls: Record<string, string>;
  onImageUploaded: (elementId: string, key: string, blobUrl: string) => void;
  trimSize: string;
  /** Per-element style overrides. */
  styles: Record<string, { alignment: Alignment }>;
  onStylesChange: (styles: Record<string, { alignment: Alignment }>) => void;
  font: BookFont;
}

const ALIGN_ICONS: Record<Alignment, React.ReactElement> = {
  left: (
    <svg
      className="h-3.5 w-3.5"
      fill="none"
      viewBox="0 0 16 16"
      stroke="currentColor"
      strokeWidth={1.75}
    >
      <path strokeLinecap="round" d="M2 4h12M2 8h7M2 12h10" />
    </svg>
  ),
  center: (
    <svg
      className="h-3.5 w-3.5"
      fill="none"
      viewBox="0 0 16 16"
      stroke="currentColor"
      strokeWidth={1.75}
    >
      <path strokeLinecap="round" d="M2 4h12M4.5 8h7M3 12h10" />
    </svg>
  ),
  right: (
    <svg
      className="h-3.5 w-3.5"
      fill="none"
      viewBox="0 0 16 16"
      stroke="currentColor"
      strokeWidth={1.75}
    >
      <path strokeLinecap="round" d="M2 4h12M7 8h7M4 12h10" />
    </svg>
  ),
};

const ALIGN_LABELS: Record<Alignment, string> = {
  left: "Left",
  center: "Center",
  right: "Right",
};

export function StepPageEditor({
  definition,
  values,
  onValuesChange,
  imageUrls,
  onImageUploaded,
  trimSize,
  styles,
  onStylesChange,
  font,
}: Props) {
  function setField(id: string, value: string) {
    onValuesChange({ ...values, [id]: value });
  }

  function setAlignment(id: string, alignment: Alignment) {
    onStylesChange({ ...styles, [id]: { alignment } });
  }

  return (
    <div className="grid min-h-0 grid-cols-1 lg:grid-cols-[460px_1fr]">
      {/* ── Left: form inputs ─────────────────────────────────────────────── */}
      <div className="space-y-6 bg-white p-8 lg:border-r lg:border-zinc-100">
        {/* Section header */}
        <div className="border-b border-zinc-100 pb-5">
          <h3 className="text-lg font-semibold text-zinc-900">
            {definition.label}
          </h3>
          <p className="mt-1 text-sm text-zinc-500">
            Customize this page. The preview updates live as you type.
          </p>
        </div>

        {definition.elements.map((el) => {
          if (el.type === "image") {
            const imgEl = el as ImageElement;
            return (
              <ImageUploader
                key={el.id}
                label={imgEl.label + (imgEl.optional ? " (optional)" : "")}
                accept={imgEl.accept}
                previewUrl={imageUrls[el.id]}
                onUploaded={(key, blobUrl) =>
                  onImageUploaded(el.id, key, blobUrl)
                }
              />
            );
          }

          if (el.type === "text" && el.editable) {
            const textEl = el as TextElement;
            const current = values[el.id] ?? textEl.defaultValue;
            const currentAlignment =
              styles[el.id]?.alignment ?? textEl.alignment;

            return (
              <div key={el.id} className="space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <label className="text-sm font-medium text-zinc-700">
                    {textEl.label}
                  </label>
                  {/* Alignment toggles */}
                  <div className="flex overflow-hidden rounded-lg border border-zinc-200">
                    {(["left", "center", "right"] as Alignment[]).map(
                      (align) => (
                        <button
                          key={align}
                          type="button"
                          title={ALIGN_LABELS[align]}
                          onClick={() => setAlignment(el.id, align)}
                          className={`flex items-center justify-center px-2.5 py-1.5 transition-colors ${
                            currentAlignment === align
                              ? "bg-indigo-600 text-white"
                              : "bg-white text-zinc-400 hover:bg-zinc-50 hover:text-zinc-700"
                          }`}
                        >
                          {ALIGN_ICONS[align]}
                        </button>
                      ),
                    )}
                  </div>
                </div>
                {textEl.multiline ? (
                  <div className="relative">
                    <textarea
                      value={current}
                      onChange={(e) => setField(el.id, e.target.value)}
                      rows={12}
                      maxLength={textEl.maxLength}
                      placeholder={textEl.defaultValue || textEl.label}
                      className="w-full resize-none rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3.5 text-sm leading-relaxed text-zinc-900 placeholder-zinc-400 transition-colors focus:border-indigo-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100"
                    />
                    {textEl.maxLength && (
                      <span className="pointer-events-none absolute bottom-3 right-3.5 text-xs text-zinc-400">
                        {current.length}/{textEl.maxLength}
                      </span>
                    )}
                  </div>
                ) : (
                  <input
                    type="text"
                    value={current}
                    onChange={(e) => setField(el.id, e.target.value)}
                    maxLength={textEl.maxLength}
                    placeholder={textEl.defaultValue || textEl.label}
                    className="w-full rounded-lg border border-zinc-200 px-3 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 transition-colors focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                  />
                )}
              </div>
            );
          }

          return null;
        })}
      </div>

      {/* ── Right: live preview panel ──────────────────────────────────────── */}
      <div className="bg-zinc-900">
        <div className="p-8 lg:sticky lg:top-6">
          {/* Panel header */}
          <div className="mb-6 flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500">
              Live Preview
            </p>
            <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-zinc-300">
              {definition.label}
            </span>
          </div>

          <PdfPagePreview
            pageType={definition.pageType}
            values={values}
            styles={styles}
            font={font}
            trimSize={trimSize}
          />
        </div>
      </div>
    </div>
  );
}
