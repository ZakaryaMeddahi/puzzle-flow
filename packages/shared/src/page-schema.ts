import type {
  ElementZone, TextSize, FontWeight, Alignment, VerticalAlignment,
} from "./layout-constants";

export type { ElementZone, TextSize, FontWeight, Alignment, VerticalAlignment };

// ── Element types ─────────────────────────────────────────────────────────────

export interface TextElement {
  type: "text";
  id: string;
  label: string;
  zone: ElementZone;
  defaultValue: string;
  size: TextSize;
  weight: FontWeight;
  alignment: Alignment;
  /** Default vertical placement within the zone. Defaults to "top" for multiline, "middle" for single-line. */
  defaultVerticalAlignment?: VerticalAlignment;
  editable: boolean;
  multiline?: boolean;
  maxLength?: number;
}

export interface ImageElement {
  type: "image";
  id: string;
  label: string;
  zone: ElementZone;
  /** Maximum width as fraction (0–1) of the usable page width. */
  maxWidthFrac: number;
  /** Maximum height as fraction (0–1) of the zone height. */
  maxHeightFrac: number;
  optional: boolean;
  /** MIME types accepted by the file input, e.g. "image/png,image/jpeg". */
  accept: string;
}

export type PageElement = TextElement | ImageElement;

// ── Page definition ───────────────────────────────────────────────────────────

export type PageType = "titlePage" | "copyrightPage" | "howToPlay" | "introduction";

export interface PageDefinition {
  pageType: PageType;
  label: string;
  elements: PageElement[];
}

// ── Runtime values (user-supplied content) ────────────────────────────────────

/**
 * User-provided content keyed by element ID.
 * Text elements: the text string.
 * Image elements: the S3 object key (empty string = no image uploaded).
 */
export type PageValues = Record<string, string>;

// ── Front matter config (stored in DB as JSON, sent in DTO) ──────────────────

export interface FrontMatterPageConfig {
  enabled: boolean;
  /** User-supplied values for this page's elements. */
  values: PageValues;
  /**
   * Per-element style overrides keyed by element ID.
   * When absent for an element the schema default is used.
   */
  styles?: Record<string, { alignment: Alignment }>;
}

export interface FrontMatterConfig {
  titlePage:     FrontMatterPageConfig;
  copyrightPage: FrontMatterPageConfig;
  howToPlay:     FrontMatterPageConfig;
  introduction:  FrontMatterPageConfig;
  answerPages:   boolean;
}

// ── Default page definitions ──────────────────────────────────────────────────

export const TITLE_PAGE_DEFINITION: PageDefinition = {
  pageType: "titlePage",
  label: "Title Page",
  elements: [
    {
      type: "image",
      id: "logo",
      label: "Logo (optional)",
      zone: "header",
      maxWidthFrac: 0.5,
      maxHeightFrac: 0.8,
      optional: true,
      accept: "image/png,image/jpeg",
    },
    {
      type: "text",
      id: "title",
      label: "Book Title",
      zone: "upper",
      defaultValue: "",
      size: "2xl",
      weight: "bold",
      alignment: "center",
      editable: true,
      maxLength: 120,
    },
    {
      type: "text",
      id: "subtitle",
      label: "Subtitle",
      zone: "center",
      defaultValue: "",
      size: "lg",
      weight: "regular",
      alignment: "center",
      editable: true,
      maxLength: 120,
    },
    {
      type: "text",
      id: "author",
      label: "Author Name",
      zone: "lower",
      defaultValue: "",
      size: "md",
      weight: "regular",
      alignment: "center",
      editable: true,
      maxLength: 80,
    },
  ],
};

export const COPYRIGHT_PAGE_DEFINITION: PageDefinition = {
  pageType: "copyrightPage",
  label: "Copyright Page",
  elements: [
    {
      type: "text",
      id: "copyright",
      label: "Copyright Text",
      zone: "lower",
      defaultValue:
        `Copyright © ${new Date().getFullYear()} by the Author\n\nAll rights reserved. No part of this publication may be reproduced, distributed, or transmitted in any form or by any means without prior written permission.\n\nPublished independently.`,
      size: "sm",
      weight: "regular",
      alignment: "left",
      defaultVerticalAlignment: "bottom",
      editable: true,
      multiline: true,
      maxLength: 1000,
    },
  ],
};

export const HOW_TO_PLAY_DEFINITION: PageDefinition = {
  pageType: "howToPlay",
  label: "How to Play",
  elements: [
    {
      type: "text",
      id: "heading",
      label: "Heading",
      zone: "header",
      defaultValue: "How to Play Sudoku",
      size: "2xl",
      weight: "bold",
      alignment: "center",
      editable: true,
      maxLength: 60,
    },
    {
      type: "text",
      id: "body",
      label: "Instructions",
      zone: "upper",
      defaultValue:
        "Fill in the 9×9 grid so that every row, every column, and every 3×3 box contains the digits 1 through 9.\n\nEach digit may appear only once in each row, column, and box.\n\nNo math required — only logic and patience. Start with rows, columns, or boxes that have the most digits already filled in.\n\nGood luck!",
      size: "md",
      weight: "regular",
      alignment: "left",
      editable: true,
      multiline: true,
      maxLength: 2000,
    },
  ],
};

export const INTRODUCTION_DEFINITION: PageDefinition = {
  pageType: "introduction",
  label: "Introduction",
  elements: [
    {
      type: "text",
      id: "heading",
      label: "Heading",
      zone: "header",
      defaultValue: "Introduction",
      size: "2xl",
      weight: "bold",
      alignment: "center",
      editable: true,
      maxLength: 60,
    },
    {
      type: "text",
      id: "body",
      label: "Your text",
      zone: "upper",
      defaultValue: "",
      size: "md",
      weight: "regular",
      alignment: "left",
      editable: true,
      multiline: true,
      maxLength: 3000,
    },
  ],
};

export const PAGE_DEFINITIONS: Record<PageType, PageDefinition> = {
  titlePage:     TITLE_PAGE_DEFINITION,
  copyrightPage: COPYRIGHT_PAGE_DEFINITION,
  howToPlay:     HOW_TO_PLAY_DEFINITION,
  introduction:  INTRODUCTION_DEFINITION,
};

/** Get the static definition (template) for a given page type. */
export function getPageDefinition(pageType: PageType): PageDefinition {
  return PAGE_DEFINITIONS[pageType];
}

/**
 * Build a resolved styles map for a page definition.
 * Falls back to the schema-defined alignment for any element not overridden.
 */
export function resolveStyles(
  definition: PageDefinition,
  styles?: Record<string, { alignment: Alignment }>,
): Record<string, { alignment: Alignment }> {
  const resolved: Record<string, { alignment: Alignment }> = {};
  for (const el of definition.elements) {
    if (el.type === "text") {
      resolved[el.id] = styles?.[el.id] ?? { alignment: el.alignment };
    }
  }
  return resolved;
}

/**
 * Merge element defaults with user-supplied values.
 * Image elements without a stored key resolve to "".
 */
export function resolveValues(
  definition: PageDefinition,
  values: PageValues = {},
): PageValues {
  const resolved: PageValues = {};
  for (const el of definition.elements) {
    if (el.type === "text") {
      resolved[el.id] = values[el.id] ?? el.defaultValue;
    } else {
      resolved[el.id] = values[el.id] ?? "";
    }
  }
  return resolved;
}
