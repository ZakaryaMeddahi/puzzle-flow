import {
  Controller,
  Get,
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

  /** POST /books — create a new book and return LemonSqueezy checkout URL. */
  @Post()
  async create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateBookDto,
  ) {
    const { book, checkoutUrl } = await this.books.createBook(user.userId, dto);
    return { book, checkoutUrl };
  }

  /** GET /books — list all books belonging to the authenticated user. */
  @Get()
  async findAll(@CurrentUser() user: AuthenticatedUser) {
    return this.books.findAllForUser(user.userId);
  }

  /** GET /books/:id — get a single book (must belong to the user). */
  @Get(':id')
  async findOne(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    return this.books.findOneForUser(id, user.userId);
  }

  /** GET /books/:id/download — stream the generated PDF. */
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
