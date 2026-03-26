import type { PDFPage, PDFFont } from "pdf-lib";
import { rgb } from "pdf-lib";
import type { KdpTrimSize } from "../types";
import { usableArea, type PageSide } from "../layout";

const BLACK = rgb(0, 0, 0);
const GREY  = rgb(0.5, 0.5, 0.5);

export function drawCopyrightPage(
  page: PDFPage,
  _titleFont: PDFFont,
  bodyFont: PDFFont,
  trimSize: KdpTrimSize,
  side: PageSide,
): void {
  const area = usableArea(trimSize, side);
  const year = new Date().getFullYear();
  const bodySize = 10;
  const lineHeight = bodyFont.heightAtSize(bodySize) + 5;

  const lines = [
    `Copyright © ${year}`,
    "All rights reserved.",
    "No part of this publication may be reproduced,",
    "distributed, or transmitted in any form without",
    "prior written permission of the publisher.",
  ];

  // Anchor text near the bottom of the page (standard copyright convention).
  const blockHeight = lines.length * lineHeight;
  let y = area.y + blockHeight + 20;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!;
    const w = bodyFont.widthOfTextAtSize(line, bodySize);
    page.drawText(line, {
      x: area.x + area.width / 2 - w / 2,
      y,
      size: bodySize,
      font: bodyFont,
      color: i === 0 ? BLACK : GREY,
    });
    y -= lineHeight;
  }
}
