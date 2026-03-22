import {
  Controller,
  Post,
  Req,
  Headers,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { RawBodyRequest } from '@nestjs/common';
import type { Request } from 'express';
import { createHmac, timingSafeEqual } from 'crypto';
import { PuzzlesService } from '../puzzles/puzzles.service';
import { QueuesService } from '../queues/queues.service';
import { PrismaService } from '../prisma/prisma.service';
import { BookStatus } from '@kdp/shared';
import { Public } from '../auth/decorators/public.decorator';

interface LemonSqueezyEvent {
  meta: {
    event_name: string;
    custom_data?: {
      bookId?: string;
      userId?: string;
    };
  };
}

@Public()
@Controller('webhooks')
export class WebhooksController {
  private readonly logger = new Logger(WebhooksController.name);

  constructor(
    private readonly config: ConfigService,
    private readonly puzzles: PuzzlesService,
    private readonly queues: QueuesService,
    private readonly prisma: PrismaService,
  ) {}

  @Post('lemonsqueezy')
  async handleLemonSqueezy(
    @Req() req: RawBodyRequest<Request>,
    @Headers('x-signature') signature: string | undefined,
  ): Promise<{ received: boolean }> {
    // ── 1. Verify HMAC-SHA256 signature ────────────────────────────────────
    const secret = this.config.getOrThrow<string>('LEMONSQUEEZY_WEBHOOK_SECRET');
    const rawBody = req.rawBody;

    if (!rawBody || !signature) {
      throw new BadRequestException('Missing body or signature');
    }

    const expected = createHmac('sha256', secret)
      .update(rawBody)
      .digest('hex');

    const expectedBuf = Buffer.from(expected, 'hex');
    const receivedBuf = Buffer.from(signature.replace(/^sha256=/, ''), 'hex');

    if (
      expectedBuf.length !== receivedBuf.length ||
      !timingSafeEqual(expectedBuf, receivedBuf)
    ) {
      throw new BadRequestException('Invalid webhook signature');
    }

    // ── 2. Parse and route event ───────────────────────────────────────────
    const event = JSON.parse(rawBody.toString('utf-8')) as LemonSqueezyEvent;
    const { event_name, custom_data } = event.meta;

    this.logger.log(`Received LemonSqueezy event: ${event_name}`);

    if (event_name === 'order_created') {
      await this.handleOrderCreated(custom_data);
    }

    return { received: true };
  }

  // ── Event handlers ─────────────────────────────────────────────────────────

  private async handleOrderCreated(
    customData: LemonSqueezyEvent['meta']['custom_data'],
  ): Promise<void> {
    const bookId = customData?.bookId;
    const userId = customData?.userId;

    if (!bookId || !userId) {
      this.logger.warn('order_created missing bookId or userId in custom_data');
      return;
    }

    // Confirm puzzle reservations and mark book as pending (generating)
    await this.puzzles.confirmPuzzles(bookId);
    await this.prisma.db.book.update({
      where: { id: bookId },
      data: { status: BookStatus.PENDING },
    });

    // Enqueue PDF generation job
    await this.queues.enqueuePdfGeneration(bookId);

    this.logger.log(`order_created: confirmed puzzles and queued PDF for book ${bookId}`);
  }
}
