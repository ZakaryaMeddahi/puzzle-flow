"use client";

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

const ALIGN_ICONS: Record<Alignment, string> = {
  left:   "←",
  center: "↔",
  right:  "→",
};

const ALIGN_LABELS: Record<Alignment, string> = {
  left:   "Left",
  center: "Center",
  right:  "Right",
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
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">

      {/* ── Left: inputs ──────────────────────────────────────────────── */}
      <div className="space-y-5">
        <div>
          <h3 className="mb-1 text-base font-semibold text-zinc-900">
            {definition.label}
          </h3>
          <p className="text-sm text-zinc-500">
            Customize this page. Changes appear live in the preview.
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
                onUploaded={(key, blobUrl) => onImageUploaded(el.id, key, blobUrl)}
              />
            );
          }

          if (el.type === "text" && el.editable) {
            const textEl  = el as TextElement;
            const current = values[el.id] ?? textEl.defaultValue;
            const currentAlignment = styles[el.id]?.alignment ?? textEl.alignment;

            return (
              <div key={el.id}>
                <div className="mb-1.5 flex items-center justify-between gap-2">
                  <label className="text-sm font-medium text-zinc-700">
                    {textEl.label}
                  </label>
                  {/* Horizontal alignment toggles */}
                  <div className="flex rounded-md border border-zinc-200 overflow-hidden">
                    {(["left", "center", "right"] as Alignment[]).map((align) => (
                      <button
                        key={align}
                        type="button"
                        title={ALIGN_LABELS[align]}
                        onClick={() => setAlignment(el.id, align)}
                        className={`px-2.5 py-1 text-xs transition-colors ${
                          currentAlignment === align
                            ? "bg-indigo-600 text-white"
                            : "bg-white text-zinc-400 hover:text-zinc-700"
                        }`}
                      >
                        {ALIGN_ICONS[align]}
                      </button>
                    ))}
                  </div>
                </div>
                {textEl.multiline ? (
                  <textarea
                    value={current}
                    onChange={(e) => setField(el.id, e.target.value)}
                    rows={5}
                    maxLength={textEl.maxLength}
                    placeholder={textEl.defaultValue || textEl.label}
                    className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                  />
                ) : (
                  <input
                    type="text"
                    value={current}
                    onChange={(e) => setField(el.id, e.target.value)}
                    maxLength={textEl.maxLength}
                    placeholder={textEl.defaultValue || textEl.label}
                    className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                  />
                )}
              </div>
            );
          }

          return null;
        })}
      </div>

      {/* ── Right: live PDF preview ───────────────────────────────────── */}
      <div className="flex flex-col gap-2">
        <p className="text-xs font-semibold uppercase tracking-widest text-zinc-400">
          Preview
        </p>
        <PdfPagePreview
          pageType={definition.pageType}
          values={values}
          styles={styles}
          font={font}
          trimSize={trimSize}
        />
        <p className="text-xs text-zinc-400">
          Exact PDF rendering — matches the final output.
        </p>
      </div>
    </div>
  );
}
