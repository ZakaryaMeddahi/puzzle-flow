import { Controller, Get } from '@nestjs/common';
import {
  CurrentUser,
  type AuthenticatedUser,
} from '../auth/decorators/current-user.decorator';
import { PuzzlesService } from './puzzles.service';

@Controller('puzzles')
export class PuzzlesController {
  constructor(private readonly puzzlesService: PuzzlesService) {}

  /**
   * GET /puzzles/history
   * returns all confirmed/pending puzzle hashes for the authenticated user.
   * the response is used by the frontend to show a user's puzzle history and
   * by the uniqueness engine to exclude already-used puzzles.
   */
  @Get('history')
  getHistory(@CurrentUser() user: AuthenticatedUser) {
    return this.puzzlesService.getHistory(user.userId);
  }
}
