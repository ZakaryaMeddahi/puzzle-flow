"use client";

import type { PageDefinition, PageValues, TextElement } from "@kdp/shared/browser";
import { ZONE_TOP_FRAC, ZONE_HEIGHT_FRAC, TEXT_SIZE_PX } from "@kdp/shared/browser";

const ASPECT: Record<string, number> = {
  "6x9":    6 / 9,
  "8x10":   8 / 10,
  "8.5x11": 8.5 / 11,
};

// Margins as fraction of preview dimensions (mirrors KDP gutter margins)
const MARGIN_H = 0.09;
const MARGIN_V = 0.06;

interface PagePreviewProps {
  definition: PageDefinition;
  values: PageValues;
  /** Blob URLs for images selected locally (before or after upload). */
  imageUrls?: Record<string, string>;
  trimSize?: "6x9" | "8x10" | "8.5x11";
}

export function PagePreview({
  definition,
  values,
  imageUrls = {},
  trimSize = "8.5x11",
}: PagePreviewProps) {
  const aspect = ASPECT[trimSize] ?? ASPECT["8.5x11"]!;

  return (
    <div
      className="relative w-full overflow-hidden rounded border border-zinc-200 bg-white shadow-sm"
      style={{ aspectRatio: String(aspect) }}
    >
      {/* Usable area (inset by margins) */}
      <div
        className="absolute"
        style={{
          left:   `${MARGIN_H * 100}%`,
          right:  `${MARGIN_H * 100}%`,
          top:    `${MARGIN_V * 100}%`,
          bottom: `${MARGIN_V * 100}%`,
        }}
      >
        {definition.elements.map((el) => {
          const topPct    = ZONE_TOP_FRAC[el.zone]    * 100;
          const heightPct = ZONE_HEIGHT_FRAC[el.zone] * 100;

          if (el.type === "text") {
            const textEl  = el as TextElement;
            const value   = values[el.id] ?? textEl.defaultValue ?? "";
            const fontSize  = TEXT_SIZE_PX[el.size];
            const fontWeight = el.weight === "bold" ? "700" : "400";
            const color    = el.weight === "bold" ? "#111" : "#555";
            const textAlign = el.alignment as React.CSSProperties["textAlign"];

            return (
              <div
                key={el.id}
                className="absolute overflow-hidden"
                style={{
                  top:    `${topPct}%`,
                  height: `${heightPct}%`,
                  left: 0, right: 0,
                  display: "flex",
                  alignItems: textEl.multiline ? "flex-start" : "center",
                  justifyContent:
                    el.alignment === "center" ? "center"
                    : el.alignment === "right"  ? "flex-end"
                    : "flex-start",
                  padding: "2px 0",
                }}
              >
                <p
                  style={{
                    fontSize,
                    fontWeight,
                    textAlign,
                    color,
                    whiteSpace: textEl.multiline ? "pre-wrap" : "nowrap",
                    overflow: "hidden",
                    maxHeight: "100%",
                    margin: 0,
                    lineHeight: 1.4,
                  }}
                >
                  {value || (
                    <span style={{ color: "#ccc", fontStyle: "italic" }}>
                      {el.label}
                    </span>
                  )}
                </p>
              </div>
            );
          }

          if (el.type === "image") {
            const src = imageUrls[el.id];
            return (
              <div
                key={el.id}
                className="absolute flex items-center justify-center"
                style={{
                  top:    `${topPct}%`,
                  height: `${heightPct}%`,
                  left: 0, right: 0,
                }}
              >
                {src ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={src}
                    alt={el.label}
                    style={{
                      maxWidth:  `${el.maxWidthFrac * 100}%`,
                      maxHeight: `${el.maxHeightFrac * 100}%`,
                      objectFit: "contain",
                    }}
                  />
                ) : el.optional ? null : (
                  <div className="flex h-10 items-center justify-center rounded border border-dashed border-zinc-300 px-3 text-[10px] text-zinc-400">
                    {el.label}
                  </div>
                )}
              </div>
            );
          }

          return null;
        })}
      </div>

      {/* Page type watermark */}
      <div className="absolute bottom-1 right-1.5 text-[7px] text-zinc-300 select-none">
        {definition.label}
      </div>
    </div>
  );
}
