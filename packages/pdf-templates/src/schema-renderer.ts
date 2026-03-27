import type { PDFPage, PDFFont, PDFImage } from "pdf-lib";
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

const BLACK = rgb(0, 0, 0);
const GREY  = rgb(0.35, 0.35, 0.35);

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
  const color            = element.weight === "bold" ? BLACK : GREY;
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
