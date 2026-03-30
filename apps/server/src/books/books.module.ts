import { Module } from '@nestjs/common';
import { BooksService } from './books.service';
import { BooksController } from './books.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { PuzzlesModule } from '../puzzles/puzzles.module';
import { QueuesModule } from '../queues/queues.module';

@Module({
  imports: [PrismaModule, PuzzlesModule, QueuesModule],
  controllers: [BooksController],
  providers: [BooksService],
  exports: [BooksService],
})
export class BooksModule {}
