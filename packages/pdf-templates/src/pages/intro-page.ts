import type { PDFPage, PDFFont } from "pdf-lib";
import { rgb } from "pdf-lib";
import type { KdpTrimSize } from "../types";
import { usableArea, type PageSide } from "../layout";

const BLACK = rgb(0, 0, 0);
const GREY = rgb(0.35, 0.35, 0.35);

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

export function drawIntroPage(
  page: PDFPage,
  titleFont: PDFFont,
  bodyFont: PDFFont,
  trimSize: KdpTrimSize,
  side: PageSide,
  introText: string,
): void {
  const area = usableArea(trimSize, side);

  const headingSize = 22;
  const headingText = "Introduction";
  const headingHeight = titleFont.heightAtSize(headingSize);
  const hw = titleFont.widthOfTextAtSize(headingText, headingSize);
  page.drawText(headingText, {
    x: area.x + area.width / 2 - hw / 2,
    y: area.y + area.height - headingHeight,
    size: headingSize,
    font: titleFont,
    color: BLACK,
  });

  const bodySize = 11;
  const lineHeight = bodyFont.heightAtSize(bodySize) + 4;
  const wrappedLines = wordWrap(introText, bodyFont, bodySize, area.width);

  let y = area.y + area.height - headingHeight - 28;
  for (const line of wrappedLines) {
    if (y < area.y) break;
    if (line !== "") {
      page.drawText(line, {
        x: area.x,
        y,
        size: bodySize,
        font: bodyFont,
        color: GREY,
      });
    }
    y -= lineHeight;
  }
}
