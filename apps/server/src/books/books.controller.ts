import {
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Param,
  Body,
  StreamableFile,
  NotFoundException,
} from '@nestjs/common';
import { createReadStream } from 'fs';
import { access } from 'fs/promises';
import { BooksService } from './books.service';
import { CreateBookDto } from './dto/create-book.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/decorators/current-user.decorator';

@Controller('books')
export class BooksController {
  constructor(private readonly books: BooksService) {}

  /** POST /books - create a new book and return LemonSqueezy checkout URL. */
  @Post()
  async create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateBookDto,
  ): Promise<{ book: Record<string, unknown>; checkoutUrl: string }> {
    const { book, checkoutUrl } = await this.books.createBook(user.userId, dto);
    return { book: book as unknown as Record<string, unknown>, checkoutUrl };
  }

  /** GET /books - list all books belonging to the authenticated user. */
  @Get()
  async findAll(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<Record<string, unknown>[]> {
    const books = await this.books.findAllForUser(user.userId);
    return books as unknown as Record<string, unknown>[];
  }

  /** GET /books/:id - get a single book (must belong to the user). */
  @Get(':id')
  async findOne(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ): Promise<Record<string, unknown>> {
    const book = await this.books.findOneForUser(id, user.userId);
    return book as unknown as Record<string, unknown>;
  }

  /** POST /books/:id/checkout - (re)generate a LemonSqueezy checkout URL for a draft book. */
  @Post(':id/checkout')
  async checkout(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ): Promise<{ checkoutUrl: string }> {
    const checkoutUrl = await this.books.getCheckoutUrl(id, user.userId);
    return { checkoutUrl };
  }

  /** DELETE /books/:id - permanently delete a book and release its puzzle slots. */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ): Promise<void> {
    await this.books.deleteBook(id, user.userId);
  }

  /** GET /books/:id/download - stream the generated PDF. */
  @Get(':id/download')
  async download(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ): Promise<StreamableFile> {
    const book = await this.books.findOneForUser(id, user.userId);

    if (!book.pdfPath) {
      throw new NotFoundException('PDF not ready yet');
    }

    try {
      await access(book.pdfPath);
    } catch {
      throw new NotFoundException('PDF file not found on disk');
    }

    const stream = createReadStream(book.pdfPath);
    return new StreamableFile(stream, {
      type: 'application/pdf',
      disposition: `attachment; filename="${id}.pdf"`,
    });
  }
}
