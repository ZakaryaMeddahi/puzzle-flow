import { Controller, Post, Body, Res } from '@nestjs/common';
import type { Response } from 'express';
import { PreviewService } from './preview.service';
import { PreviewPageDto } from './preview.dto';

@Controller('preview')
export class PreviewController {
  constructor(private readonly previewService: PreviewService) {}

  @Post('page')
  async previewPage(
    @Body() dto: PreviewPageDto,
    @Res() res: Response,
  ): Promise<void> {
    const bytes = await this.previewService.renderPage(dto);
    res.setHeader('Content-Type', 'application/pdf');
    res.end(Buffer.from(bytes));
  }
}
