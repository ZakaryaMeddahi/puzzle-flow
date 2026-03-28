"use client";

import type {
  PageDefinition,
  PageValues,
  TextElement,
  Alignment,
  BookFont,
} from "@kdp/shared/browser";
import {
  ZONE_TOP_FRAC,
  ZONE_HEIGHT_FRAC,
  TEXT_SIZE_PX,
  FONT_FAMILY_CSS,
} from "@kdp/shared/browser";

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
  /** Per-element style overrides. */
  styles?: Record<string, { alignment: Alignment }>;
  font?: BookFont;
}

// ── Title page preview ────────────────────────────────────────────────────────
// Mirrors the dedicated renderTitlePageLayout() in the PDF renderer.
function TitlePagePreview({
  values,
  imageUrls,
  styles,
  fontFamily,
}: {
  values: PageValues;
  imageUrls: Record<string, string>;
  styles: Record<string, { alignment: Alignment }>;
  fontFamily: string;
}) {
  const title    = values["title"]    ?? "";
  const subtitle = values["subtitle"] ?? "";
  const author   = values["author"]   ?? "";
  const logoSrc  = imageUrls["logo"];

  const titleAlign    = styles["title"]?.alignment    ?? "center";
  const subtitleAlign = styles["subtitle"]?.alignment ?? "center";
  const authorAlign   = styles["author"]?.alignment   ?? "center";

  return (
    <>
      {/* Logo — top 4-14% */}
      {logoSrc && (
        <div className="absolute flex items-center justify-center"
          style={{ top: "4%", height: "10%", left: 0, right: 0 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={logoSrc} alt="logo"
            style={{ maxWidth: "45%", maxHeight: "100%", objectFit: "contain" }} />
        </div>
      )}

      {/* Title — 30% from top */}
      <div className="absolute overflow-hidden"
        style={{ top: "30%", left: 0, right: 0, display: "flex",
          justifyContent: titleAlign === "center" ? "center" : titleAlign === "right" ? "flex-end" : "flex-start" }}>
        <p style={{
          fontSize: TEXT_SIZE_PX["2xl"], fontWeight: 700, fontFamily,
          color: "#141414", margin: 0, lineHeight: 1.2,
          textAlign: titleAlign as React.CSSProperties["textAlign"],
        }}>
          {title || <span style={{ color: "#ccc", fontStyle: "italic", fontFamily: "inherit" }}>Book Title</span>}
        </p>
      </div>

      {/* Subtitle — 46% from top */}
      <div className="absolute overflow-hidden"
        style={{ top: "46%", left: 0, right: 0, display: "flex",
          justifyContent: subtitleAlign === "center" ? "center" : subtitleAlign === "right" ? "flex-end" : "flex-start" }}>
        <p style={{
          fontSize: TEXT_SIZE_PX["lg"], fontWeight: 400, fontFamily,
          color: "#595959", margin: 0, lineHeight: 1.3,
          textAlign: subtitleAlign as React.CSSProperties["textAlign"],
        }}>
          {subtitle || <span style={{ color: "#ccc", fontStyle: "italic", fontFamily: "inherit" }}>Subtitle</span>}
        </p>
      </div>

      {/* Decorative rule — shown when subtitle is present, just below it */}
      {subtitle && (
        <div className="absolute" style={{ top: "53%", left: "31%", right: "31%", height: "1px", backgroundColor: "#aaa" }} />
      )}

      {/* Author — 72% from top */}
      <div className="absolute overflow-hidden"
        style={{ top: "72%", left: 0, right: 0, display: "flex",
          justifyContent: authorAlign === "center" ? "center" : authorAlign === "right" ? "flex-end" : "flex-start" }}>
        <p style={{
          fontSize: TEXT_SIZE_PX["md"], fontWeight: 400, fontFamily,
          color: "#a8a8a8", margin: 0,
          textAlign: authorAlign as React.CSSProperties["textAlign"],
        }}>
          {author || <span style={{ color: "#ccc", fontStyle: "italic", fontFamily: "inherit" }}>Author Name</span>}
        </p>
      </div>
    </>
  );
}

export function PagePreview({
  definition,
  values,
  imageUrls = {},
  trimSize = "8.5x11",
  styles = {},
  font = "roboto",
}: PagePreviewProps) {
  const aspect     = ASPECT[trimSize] ?? ASPECT["8.5x11"]!;
  const fontFamily = FONT_FAMILY_CSS[font];

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
        {definition.pageType === "titlePage" ? (
          <TitlePagePreview
            values={values}
            imageUrls={imageUrls}
            styles={styles}
            fontFamily={fontFamily}
          />
        ) : (
          definition.elements.map((el) => {
            const topPct    = ZONE_TOP_FRAC[el.zone]    * 100;
            const heightPct = ZONE_HEIGHT_FRAC[el.zone] * 100;

            if (el.type === "text") {
              const textEl   = el as TextElement;
              const value    = values[el.id] ?? textEl.defaultValue ?? "";
              const fontSize = TEXT_SIZE_PX[el.size];
              const fontWeight = el.weight === "bold" ? "700" : "400";
              const color    = el.weight === "bold" ? "#141414" : "#595959";
              const alignment: Alignment = styles[el.id]?.alignment ?? el.alignment;
              const verticalAlignment = textEl.defaultVerticalAlignment
                ?? (textEl.multiline ? "top" : "middle");
              const textAlign = alignment as React.CSSProperties["textAlign"];

              const containerHeight = textEl.multiline
                ? `${100 - topPct}%`
                : `${heightPct}%`;

              const alignItems =
                verticalAlignment === "top"    ? "flex-start" :
                verticalAlignment === "bottom" ? "flex-end"   : "center";

              return (
                <div
                  key={el.id}
                  className="absolute overflow-hidden"
                  style={{
                    top:    `${topPct}%`,
                    height: containerHeight,
                    left: 0, right: 0,
                    display: "flex",
                    alignItems,
                    justifyContent:
                      alignment === "center" ? "center"
                      : alignment === "right"  ? "flex-end"
                      : "flex-start",
                    padding: "2px 0",
                  }}
                >
                  <p
                    style={{
                      fontSize,
                      fontWeight,
                      fontFamily,
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
                      <span style={{ color: "#ccc", fontStyle: "italic", fontFamily: "inherit" }}>
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
          })
        )}
      </div>

      {/* Page type watermark */}
      <div className="absolute bottom-1 right-1.5 text-[7px] text-zinc-300 select-none">
        {definition.label}
      </div>
    </div>
  );
}
