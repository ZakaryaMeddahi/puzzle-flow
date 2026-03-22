import { Module } from '@nestjs/common';
import { PuzzlesService } from './puzzles.service';
import { PuzzlesController } from './puzzles.controller';

@Module({
  providers: [PuzzlesService],
  controllers: [PuzzlesController],
  exports: [PuzzlesService], // BooksModule will use PuzzlesService
})
export class PuzzlesModule {}
