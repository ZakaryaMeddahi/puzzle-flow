import type { PDFPage, PDFFont, PDFImage, Color } from "pdf-lib";
import { rgb } from "pdf-lib";
import type {
  PageDefinition,
  PageValues,
  TextElement,
  ImageElement,
  Alignment,
} from "@kdp/shared";
import {
  ZONE_TOP_FRAC,
  ZONE_HEIGHT_FRAC,
  TEXT_SIZE_PT,
} from "@kdp/shared";
import { usableArea, type PageSide } from "./layout";
import type { KdpTrimSize } from "./types";

const HEADING = rgb(0.08, 0.08, 0.08);
const BODY    = rgb(0.35, 0.35, 0.35);
const SUBTLE  = rgb(0.65, 0.65, 0.65);

function wordWrap(
  text: string,
  font: PDFFont,
  size: number,
  maxWidth: number,
): string[] {
  const lines: string[] = [];
  for (const para of text.split("\n")) {
    if (para.trim() === "") {
      lines.push("");
      continue;
    }
    const words = para.split(" ");
    let current = "";
    for (const word of words) {
      const test = current ? `${current} ${word}` : word;
      if (font.widthOfTextAtSize(test, size) > maxWidth) {
        if (current) lines.push(current);
        current = word;
      } else {
        current = test;
      }
    }
    if (current) lines.push(current);
  }
  return lines;
}

/**
 * Render a front matter page from its schema definition.
 *
 * @param page           pdf-lib PDFPage to draw on
 * @param definition     Static page template (zones, element types, defaults)
 * @param values         User-supplied content keyed by element ID
 * @param titleFont      Bold/display font
 * @param bodyFont       Body font
 * @param trimSize       KDP trim size for margin calculation
 * @param side           Recto or verso (gutter direction)
 * @param images         Pre-embedded PDFImage objects keyed by element ID
 * @param styleOverrides Per-element alignment overrides keyed by element ID.
 *                       Falls back to the schema-defined alignment when absent.
 */
export function renderPageFromSchema(
  page: PDFPage,
  definition: PageDefinition,
  values: PageValues,
  titleFont: PDFFont,
  bodyFont: PDFFont,
  trimSize: KdpTrimSize,
  side: PageSide,
  images: Record<string, PDFImage> = {},
  styleOverrides: Record<string, { alignment: Alignment }> = {},
): void {
  const area = usableArea(trimSize, side);

  // Title page gets a hand-crafted layout for professional typography.
  if (definition.pageType === "titlePage") {
    renderTitlePageLayout(page, values, titleFont, bodyFont, area, images, styleOverrides);
    return;
  }

  for (const element of definition.elements) {
    const value = values[element.id] ?? "";

    // Zone coordinates in pdf-lib space (Y increases upward from bottom).
    const zoneTopY    = area.y + area.height - ZONE_TOP_FRAC[element.zone]    * area.height;
    const zoneHeight  = ZONE_HEIGHT_FRAC[element.zone] * area.height;
    const zoneBottomY = zoneTopY - zoneHeight;
    const zoneMidY    = (zoneTopY + zoneBottomY) / 2;

    if (element.type === "text") {
      renderTextElement(
        page, element, value,
        titleFont, bodyFont,
        { x: area.x, y: area.y, width: area.width },
        zoneTopY, zoneHeight, zoneMidY,
        styleOverrides,
      );
    } else if (element.type === "image") {
      renderImageElement(
        page, element, images[element.id],
        area, zoneTopY, zoneHeight, zoneMidY,
      );
    }
  }
}

function renderTextElement(
  page: PDFPage,
  element: TextElement,
  value: string,
  titleFont: PDFFont,
  bodyFont: PDFFont,
  area: { x: number; y: number; width: number },
  zoneTopY: number,
  zoneHeight: number,
  zoneMidY: number,
  styleOverrides: Record<string, { alignment: Alignment }>,
): void {
  if (!value) return;

  const size             = TEXT_SIZE_PT[element.size];
  const font             = element.weight === "bold" ? titleFont : bodyFont;
  const color            = element.weight === "bold" ? HEADING : BODY;
  const alignment        = styleOverrides[element.id]?.alignment ?? element.alignment;
  const isMultilineEl    = element.multiline || value.includes("\n");
  const verticalAlignment = element.defaultVerticalAlignment
    ?? (isMultilineEl ? "top" : "middle");
  const zoneBottomY      = zoneTopY - zoneHeight;

  if (element.multiline || value.includes("\n")) {
    // Multiline: flow downward from computed start, stopping at the page margin.
    const lineHeight = font.heightAtSize(size) + 3;
    const lines = wordWrap(value, font, size, area.width);
    const totalH = lines.length * lineHeight;

    let startY: number;
    switch (verticalAlignment) {
      case "bottom":
        // Last line sits at zoneBottomY; first line is (N-1) line-heights above it.
        startY = zoneBottomY + (lines.length - 1) * lineHeight;
        break;
      case "middle":
        // Lines are symmetrically centred around zoneMidY.
        startY = zoneMidY + (lines.length - 1) * lineHeight / 2;
        break;
      default: // "top"
        startY = zoneTopY - font.heightAtSize(size);
    }

    let y = startY;
    for (const line of lines) {
      if (y < area.y) break;  // stop at the bottom page margin
      if (line !== "") {
        const x = textX(alignment, area, font.widthOfTextAtSize(line, size));
        page.drawText(line, { x, y, size, font, color });
      }
      y -= lineHeight;
    }
  } else {
    // Single line: position vertically within the zone
    let y: number;
    switch (verticalAlignment) {
      case "top":    y = zoneTopY - font.heightAtSize(size); break;
      case "bottom": y = zoneBottomY; break;
      default:       y = zoneMidY - size / 2; // "middle"
    }
    const x = textX(alignment, area, font.widthOfTextAtSize(value, size));
    page.drawText(value, { x, y, size, font, color });
  }
}

function renderImageElement(
  page: PDFPage,
  element: ImageElement,
  image: PDFImage | undefined,
  area: { x: number; width: number },
  _zoneTopY: number,
  zoneHeight: number,
  zoneMidY: number,
): void {
  if (!image) return;

  const maxW = area.width  * element.maxWidthFrac;
  const maxH = zoneHeight  * element.maxHeightFrac;
  const { width: iw, height: ih } = image.size();
  const scale  = Math.min(maxW / iw, maxH / ih, 1);
  const drawW  = iw * scale;
  const drawH  = ih * scale;

  // Center horizontally in the usable area, center vertically in the zone
  const x = area.x + (area.width - drawW) / 2;
  const y = zoneMidY - drawH / 2;
  page.drawImage(image, { x, y, width: drawW, height: drawH });
}

function textX(
  alignment: Alignment,
  area: { x: number; width: number },
  textWidth: number,
): number {
  switch (alignment) {
    case "center": return area.x + (area.width - textWidth) / 2;
    case "right":  return area.x + area.width - textWidth;
    default:       return area.x;
  }
}

/**
 * Dedicated high-quality layout for the title page.
 * Positions title at ~30% from top, decorative rule below subtitle, author at ~72%.
 * Called by renderPageFromSchema when pageType === "titlePage".
 */
export function renderTitlePageLayout(
  page: PDFPage,
  values: PageValues,
  titleFont: PDFFont,
  bodyFont: PDFFont,
  area: { x: number; y: number; width: number; height: number },
  images: Record<string, PDFImage>,
  styleOverrides: Record<string, { alignment: Alignment }>,
): void {
  const pageH = area.height;

  // ── Logo (header zone, centered) ──────────────────────────────────────────
  const logoImage = images["logo"];
  if (logoImage) {
    const maxW  = area.width  * 0.45;
    const maxH  = pageH       * 0.10;
    const { width: iw, height: ih } = logoImage.size();
    const scale = Math.min(maxW / iw, maxH / ih, 1);
    const dw = iw * scale;
    const dh = ih * scale;
    const logoTopFrac  = 0.04;
    const logoCenterY  = area.y + pageH * (1 - logoTopFrac - 0.05);
    page.drawImage(logoImage, {
      x: area.x + (area.width - dw) / 2,
      y: logoCenterY - dh / 2,
      width: dw,
      height: dh,
    });
  }

  const titleText    = values["title"]    ?? "";
  const subtitleText = values["subtitle"] ?? "";
  const authorText   = values["author"]   ?? "";

  const titleAlignment    = styleOverrides["title"]?.alignment    ?? "center";
  const subtitleAlignment = styleOverrides["subtitle"]?.alignment ?? "center";
  const authorAlignment   = styleOverrides["author"]?.alignment   ?? "center";

  function drawCentered(
    text: string,
    font: PDFFont,
    size: number,
    fracFromTop: number,
    alignment: Alignment,
    color: Color,
  ): void {
    if (!text) return;
    const y = area.y + pageH * (1 - fracFromTop) - font.heightAtSize(size);
    const x = textX(alignment, area, font.widthOfTextAtSize(text, size));
    page.drawText(text, { x, y, size, font, color });
  }

  // Title — bold, ~30% from top
  drawCentered(titleText, titleFont, TEXT_SIZE_PT["2xl"], 0.30, titleAlignment, HEADING);

  // Subtitle — regular, ~46% from top
  drawCentered(subtitleText, bodyFont, TEXT_SIZE_PT["lg"], 0.46, subtitleAlignment, BODY);

  // Decorative rule — drawn only when there's a subtitle, just below it
  if (subtitleText) {
    const ruleW = area.width * 0.38;
    const ruleY = area.y + pageH * (1 - 0.46) - bodyFont.heightAtSize(TEXT_SIZE_PT["lg"]) - 14;
    page.drawLine({
      start: { x: area.x + (area.width - ruleW) / 2, y: ruleY },
      end:   { x: area.x + (area.width + ruleW) / 2, y: ruleY },
      thickness: 0.5,
      color: SUBTLE,
    });
  }

  // Author — lighter, ~72% from top
  drawCentered(authorText, bodyFont, TEXT_SIZE_PT["md"], 0.72, authorAlignment, SUBTLE);
}
