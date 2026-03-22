import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BookStatus, UniquenessLevel } from '@kdp/shared';
import type { Book } from '@kdp/shared';
import { PrismaService } from '../prisma/prisma.service';
import { PuzzlesService } from '../puzzles/puzzles.service';
import type { CreateBookDto } from './dto/create-book.dto';

interface CheckoutResponse {
  data: { attributes: { url: string } };
}

@Injectable()
export class BooksService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly puzzles: PuzzlesService,
    private readonly config: ConfigService,
  ) {}

  // ── Create ─────────────────────────────────────────────────────────────────

  /**
   * 1. Reserve puzzles from the pool.
   * 2. Persist a draft book record.
   * 3. Create a LemonSqueezy checkout and return its URL.
   */
  async createBook(
    userId: string,
    dto: CreateBookDto,
  ): Promise<{ book: Book; checkoutUrl: string }> {
    // Reserve puzzles (throws ServiceUnavailableException if pool too small)
    const reserved = await this.puzzles.reservePuzzles(
      dto.difficulty,
      dto.pageCount,
      dto.uniquenessLevel ?? UniquenessLevel.GLOBAL,
      userId,
    );

    // Persist draft book
    const book = await this.prisma.db.book.create({
      data: {
        userId,
        title: dto.title ?? null,
        trimSize: dto.trimSize,
        difficulty: dto.difficulty,
        pageCount: dto.pageCount,
        status: BookStatus.DRAFT,
      },
    });

    // Link reserved puzzles to this book
    const puzzleIds = reserved.map((r) => r.id);
    await this.prisma.db.$executeRawUnsafe(
      `UPDATE puzzle_registry SET book_id = $1 WHERE id = ANY($2::uuid[])`,
      book.id,
      puzzleIds,
    );

    const checkoutUrl = await this.createCheckout(book.id, userId);

    return { book, checkoutUrl };
  }

  // ── LemonSqueezy checkout ──────────────────────────────────────────────────

  private async createCheckout(bookId: string, userId: string): Promise<string> {
    const apiKey    = this.config.getOrThrow<string>('LEMONSQUEEZY_API_KEY');
    const storeId   = this.config.getOrThrow<string>('LEMONSQUEEZY_STORE_ID');
    const variantId = this.config.getOrThrow<string>('LEMONSQUEEZY_VARIANT_ID');

    const body = {
      data: {
        type: 'checkouts',
        attributes: {
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
