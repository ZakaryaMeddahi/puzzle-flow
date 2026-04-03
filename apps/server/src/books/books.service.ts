import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  BookStatus,
  Difficulty,
  UniquenessLevel,
  PlanType,
  SubscriptionStatus,
  CONSTANTS,
} from '@kdp/shared';
import type { Book, PuzzleReservation } from '@kdp/shared';
import { PrismaService } from '../prisma/prisma.service';
import { PuzzlesService } from '../puzzles/puzzles.service';
import { QueuesService } from '../queues/queues.service';
import type { CreateBookDto } from './dto/create-book.dto';

interface CheckoutResponse {
  data: { attributes: { url: string } };
}

const PROGRESSIVE_ORDER = [
  Difficulty.EASY,
  Difficulty.MEDIUM,
  Difficulty.HARD,
  Difficulty.EXPERT,
] as const;

@Injectable()
export class BooksService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly puzzles: PuzzlesService,
    private readonly queues: QueuesService,
    private readonly config: ConfigService,
  ) {}

  // ── Create ─────────────────────────────────────────────────────────────────

  async createBook(
    userId: string,
    dto: CreateBookDto,
  ): Promise<{ book: Book; checkoutUrl: string }> {
    // ── Plan enforcement ─────────────────────────────────────────────────────
    const user = await this.prisma.db.user.findUniqueOrThrow({
      where: { id: userId },
    });
    const now = new Date();

    // If subscription was canceled and the billing period has ended, revert to pay_per_book
    const effectivePlan: PlanType =
      user.plan !== PlanType.PAY_PER_BOOK &&
      user.subscriptionStatus === SubscriptionStatus.CANCELED &&
      user.currentPeriodEnd !== null &&
      user.currentPeriodEnd < now
        ? PlanType.PAY_PER_BOOK
        : (user.plan as PlanType);

    // Catalog-wide uniqueness is Pro-only
    if (
      dto.uniquenessLevel === UniquenessLevel.GLOBAL &&
      effectivePlan !== PlanType.PRO
    ) {
      throw new ForbiddenException(
        'Catalog-wide uniqueness requires the Pro plan',
      );
    }

    // Starter: enforce monthly book limit
    if (effectivePlan === PlanType.STARTER && !dto.freeTrial) {
      const periodStart = user.planPeriodStart ?? user.createdAt;
      const booksThisPeriod = await this.prisma.db.book.count({
        where: {
          userId,
          createdAt: { gte: periodStart },
          NOT: { status: BookStatus.DRAFT },
        },
      });
      if (booksThisPeriod >= CONSTANTS.STARTER_MONTHLY_LIMIT) {
        throw new ForbiddenException(
          'Monthly book limit reached. Upgrade to Pro for unlimited books.',
        );
      }
    }

    // ── Free trial handling ──────────────────────────────────────────────────
    if (dto.freeTrial) {
      const user = await this.prisma.db.user.findUniqueOrThrow({ where: { id: userId } });
      if (user.trialUsed) {
        throw new BadRequestException('Free trial has already been used');
      }
      // Cap puzzles at 10 and force watermark
      dto = { ...dto, pageCount: Math.min(dto.pageCount ?? 10, 10) };
      if (!dto.styleOptions) dto = { ...dto, styleOptions: {} };
      dto = { ...dto, styleOptions: { ...dto.styleOptions, watermark: true } };
    }

    // Reserve puzzles — progressive splits across all 4 difficulties in order.
    const reserved = await this.reservePuzzles(userId, dto);

    // Persist draft book
    // Embed styleOptions inside the frontMatter JSON blob so no extra column is needed.
    const frontMatterPayload = {
      ...dto.frontMatter,
      _style: dto.styleOptions ?? {},
    };

    const book = await this.prisma.db.book.create({
      data: {
        userId,
        title:       dto.title,
        trimSize:    dto.trimSize,
        difficulty:  dto.difficulty,
        pageCount:   dto.pageCount,
        layout:      dto.layout,
        frontMatter: JSON.parse(JSON.stringify(frontMatterPayload)),
        status:      BookStatus.DRAFT,
      },
    });

    // Link reserved puzzles to this book
    const puzzleIds = reserved.map((r) => r.id);
    await this.prisma.db.$executeRawUnsafe(
      `UPDATE puzzle_registry SET book_id = $1 WHERE id = ANY($2::text[])`,
      book.id,
      puzzleIds,
    );

    const isSubscriber =
      effectivePlan === PlanType.STARTER || effectivePlan === PlanType.PRO;

    const skipCheckout =
      dto.freeTrial ||
      isSubscriber ||
      this.config.get<string>('SKIP_CHECKOUT') === 'true';
    let checkoutUrl: string;

    if (skipCheckout) {
      // Dev bypass: confirm puzzles and enqueue PDF generation immediately.
      await this.puzzles.confirmPuzzles(book.id);
      await this.prisma.db.book.update({
        where: { id: book.id },
        data: { status: BookStatus.PENDING },
      });
      await this.queues.enqueuePdfGeneration(book.id);
      const clientUrl = this.config.get<string>('CLIENT_URL') ?? 'http://localhost:3000';
      checkoutUrl = `${clientUrl}/dashboard?payment_success=1&book_id=${book.id}`;
    } else {
      checkoutUrl = await this.createCheckout(book.id, userId);
    }

    if (dto.freeTrial) {
      await this.prisma.db.user.update({
        where: { id: userId },
        data: { trialUsed: true },
      });
    }

    return { book, checkoutUrl };
  }

  // ── Puzzle reservation ─────────────────────────────────────────────────────

  private async reservePuzzles(
    userId: string,
    dto: CreateBookDto,
  ): Promise<PuzzleReservation[]> {
    if (dto.difficulty !== Difficulty.PROGRESSIVE) {
      return this.puzzles.reservePuzzles(
        dto.difficulty,
        dto.pageCount,
        dto.uniquenessLevel ?? UniquenessLevel.GLOBAL,
        userId,
      );
    }

    // Progressive: divide puzzles evenly across 4 difficulties.
    // Each difficulty gets floor(pageCount/4); any remainder goes to the last.
    const base  = Math.floor(dto.pageCount / 4);
    const extra = dto.pageCount - base * 4;
    const results: PuzzleReservation[][] = [];

    for (let i = 0; i < PROGRESSIVE_ORDER.length; i++) {
      const count  = i === PROGRESSIVE_ORDER.length - 1 ? base + extra : base;
      const result = await this.puzzles.reservePuzzles(
        PROGRESSIVE_ORDER[i]!,
        count,
        dto.uniquenessLevel ?? UniquenessLevel.GLOBAL,
        userId,
      );
      results.push(result);
    }

    // Return in difficulty order so puzzles appear easy → expert in the book.
    return results.flat();
  }

  // ── LemonSqueezy checkout ──────────────────────────────────────────────────

  private async createCheckout(bookId: string, userId: string): Promise<string> {
    const apiKey    = this.config.getOrThrow<string>('LEMONSQUEEZY_API_KEY');
    const storeId   = this.config.getOrThrow<string>('LEMONSQUEEZY_STORE_ID');
    const variantId = this.config.getOrThrow<string>('LEMONSQUEEZY_VARIANT_ID');
    const clientUrl = this.config.get<string>('CLIENT_URL') ?? 'http://localhost:3000';

    const body = {
      data: {
        type: 'checkouts',
        attributes: {
          product_options: {
            // After payment, redirect the buyer back to the dashboard.
            redirect_url: `${clientUrl}/dashboard?payment_success=1&book_id=${bookId}`,
          },
          checkout_data: {
            custom: { bookId, userId },
          },
        },
        relationships: {
          store:   { data: { type: 'stores',   id: storeId } },
          variant: { data: { type: 'variants', id: variantId } },
        },
      },
    };

    const res = await fetch('https://api.lemonsqueezy.com/v1/checkouts', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/vnd.api+json',
        Accept: 'application/vnd.api+json',
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`LemonSqueezy checkout failed (${res.status}): ${text}`);
    }

    const json = (await res.json()) as CheckoutResponse;
    return json.data.attributes.url;
  }

  // ── Checkout recovery ─────────────────────────────────────────────────────

  /** Return a (new) checkout URL for a draft book. */
  async getCheckoutUrl(bookId: string, userId: string): Promise<string> {
    const book = await this.findOneForUser(bookId, userId);

    const skipCheckout = this.config.get<string>('SKIP_CHECKOUT') === 'true';
    if (skipCheckout) {
      await this.puzzles.confirmPuzzles(book.id);
      await this.prisma.db.book.update({
        where: { id: book.id },
        data: { status: BookStatus.PENDING },
      });
      await this.queues.enqueuePdfGeneration(book.id);
      const clientUrl = this.config.get<string>('CLIENT_URL') ?? 'http://localhost:3000';
      return `${clientUrl}/dashboard?payment_success=1&book_id=${book.id}`;
    }

    return this.createCheckout(bookId, userId);
  }

  // ── Delete ─────────────────────────────────────────────────────────────────

  async deleteBook(bookId: string, userId: string): Promise<void> {
    await this.findOneForUser(bookId, userId); // ownership check

    // Release any puzzle slots back to available.
    await this.prisma.db.$executeRawUnsafe(
      `UPDATE puzzle_registry
          SET status = 'available', user_id = NULL, book_id = NULL, reserved_at = NULL
        WHERE book_id = $1`,
      bookId,
    );

    await this.prisma.db.book.delete({ where: { id: bookId } });
  }

  // ── Query ──────────────────────────────────────────────────────────────────

  async findAllForUser(userId: string): Promise<Book[]> {
    return this.prisma.db.book.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOneForUser(bookId: string, userId: string): Promise<Book> {
    const book = await this.prisma.db.book.findUnique({ where: { id: bookId } });
    if (!book) throw new NotFoundException('Book not found');
    if (book.userId !== userId) throw new ForbiddenException();
    return book;
  }
}
