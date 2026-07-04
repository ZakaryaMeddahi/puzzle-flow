import { Injectable } from '@nestjs/common';
import { PDFDocument } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import type { Alignment, PageType } from '@kdp/shared';
import { getPageDefinition, resolveValues } from '@kdp/shared';
import { renderPageFromSchema, PAGE_SIZE } from '@kdp/pdf-templates';
import type { KdpTrimSize } from '@kdp/pdf-templates';
import { UploadsService } from '../uploads/uploads.service';
import type { PreviewPageDto } from './preview.dto';

function fontDir(): string {
  // resolve the pdf-templates package root via its package.json
  const pkgJson = require.resolve('@kdp/pdf-templates/package.json');
  return join(dirname(pkgJson), 'fonts');
}

function getFontFiles(font?: string): {
  boldFile: string;
  regularFile: string;
} {
  switch (font) {
    case 'merriweather':
      return {
        boldFile: 'Merriweather_24pt-Bold.ttf',
        regularFile: 'Merriweather_24pt-Regular.ttf',
      };
    case 'lato':
      return { boldFile: 'Lato-Bold.ttf', regularFile: 'Lato-Regular.ttf' };
    default:
      return { boldFile: 'Roboto-Bold.ttf', regularFile: 'Roboto-Regular.ttf' };
  }
}

@Injectable()
export class PreviewService {
  constructor(private readonly uploads: UploadsService) {}

  async renderPage(dto: PreviewPageDto): Promise<Uint8Array> {
    const trimSize = (dto.trimSize ?? '8.5x11') as KdpTrimSize;
    const { width, height } = PAGE_SIZE[trimSize];

    const doc = await PDFDocument.create();
    doc.registerFontkit(fontkit);

    const { boldFile, regularFile } = getFontFiles(dto.font);
    const dir = fontDir();
    const titleFont = await doc.embedFont(readFileSync(join(dir, boldFile)));
    const bodyFont = await doc.embedFont(readFileSync(join(dir, regularFile)));

    const page = doc.addPage([width, height]);

    // Load any uploaded images referenced in values (keys look like "userId/uuid.ext")
    const images: Record<string, import('pdf-lib').PDFImage> = {};
    for (const [elId, val] of Object.entries(dto.values ?? {})) {
      if (
        typeof val === 'string' &&
        val.includes('/') &&
        !val.startsWith('http')
      ) {
        try {
          const bytes = await this.uploads.read(val);
          try {
            images[elId] = await doc.embedPng(bytes);
          } catch {
            images[elId] = await doc.embedJpg(bytes);
          }
        } catch {
          // Skip if file doesn't exist yet
        }
      }
    }

    const def = getPageDefinition(dto.pageType as PageType);
    const values = resolveValues(def, dto.values ?? {});

    const styleOverrides: Record<string, { alignment: Alignment }> = {};
    for (const [id, s] of Object.entries(dto.styles ?? {})) {
      styleOverrides[id] = { alignment: s.alignment as Alignment };
    }

    renderPageFromSchema(
      page,
      def,
      values,
      titleFont,
      bodyFont,
      trimSize,
      'recto',
      images,
      styleOverrides,
    );

    return doc.save();
  }
}
