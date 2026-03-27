"use client";

import type { PageDefinition, PageValues, TextElement, ImageElement } from "@kdp/shared/browser";
import { PagePreview } from "../components/page-preview";
import { ImageUploader } from "../components/image-uploader";

interface Props {
  definition: PageDefinition;
  values: PageValues;
  onValuesChange: (values: PageValues) => void;
  /** Blob URLs for images (local preview, not S3 keys). */
  imageUrls: Record<string, string>;
  onImageUploaded: (elementId: string, key: string, blobUrl: string) => void;
  trimSize: string;
}

export function StepPageEditor({
  definition,
  values,
  onValuesChange,
  imageUrls,
  onImageUploaded,
  trimSize,
}: Props) {
  function setField(id: string, value: string) {
    onValuesChange({ ...values, [id]: value });
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
            const textEl = el as TextElement;
            const current = values[el.id] ?? textEl.defaultValue;
            return (
              <div key={el.id}>
                <label className="mb-1.5 block text-sm font-medium text-zinc-700">
                  {textEl.label}
                </label>
                {textEl.multiline ? (
                  <textarea
                    value={current}
                    onChange={(e) => setField(el.id, e.target.value)}
                    rows={5}
                    maxLength={textEl.maxLength}
                    placeholder={textEl.defaultValue || textEl.label}
                    className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
                  />
                ) : (
                  <input
                    type="text"
                    value={current}
                    onChange={(e) => setField(el.id, e.target.value)}
                    maxLength={textEl.maxLength}
                    placeholder={textEl.defaultValue || textEl.label}
                    className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
                  />
                )}
              </div>
            );
          }

          return null;
        })}
      </div>

      {/* ── Right: live preview ────────────────────────────────────────── */}
      <div className="flex flex-col gap-2">
        <p className="text-xs font-semibold uppercase tracking-widest text-zinc-400">
          Preview
        </p>
        <PagePreview
          definition={definition}
          values={values}
          imageUrls={imageUrls}
          trimSize={trimSize as "6x9" | "8x10" | "8.5x11"}
        />
        <p className="text-xs text-zinc-400">
          Approximate — final output may differ slightly.
        </p>
      </div>
    </div>
  );
}
