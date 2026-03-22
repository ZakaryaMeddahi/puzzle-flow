import { Controller, Get } from '@nestjs/common';
import { UsersService } from './users.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/decorators/current-user.decorator';

@Controller('users')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  /** GET /users/me — return the authenticated user's profile. */
  @Get('me')
  async me(@CurrentUser() user: AuthenticatedUser) {
    return this.users.findById(user.userId);
  }
}
