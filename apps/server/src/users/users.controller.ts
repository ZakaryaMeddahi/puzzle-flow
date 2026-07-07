import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { SubscribeDto } from './dto/subscribe.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/decorators/current-user.decorator';

@Controller('users')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  /** GET /users/me */
  @Get('me')
  async me(@CurrentUser() user: AuthenticatedUser) {
    return this.users.findById(user.userId);
  }

  /** GET /users/me/usage - returns plan, books used this period, and limit */
  // @Get('me/usage')
  // async usage(@CurrentUser() user: AuthenticatedUser) {
  //   return this.users.getUsage(user.userId);
  // }

  /** POST /users/me/subscription - create a subscription checkout URL */
  // @Post('me/subscription')
  // async subscribe(
  //   @CurrentUser() user: AuthenticatedUser,
  //   @Body() dto: SubscribeDto,
  // ) {
  //   const checkoutUrl = await this.users.createSubscriptionCheckout(
  //     user.userId,
  //     dto.plan,
  //   );
  //   return { checkoutUrl };
  // }

  /** DELETE /users/me/subscription - cancel active subscription */
  // @Delete('me/subscription')
  // @HttpCode(HttpStatus.NO_CONTENT)
  // async cancel(@CurrentUser() user: AuthenticatedUser): Promise<void> {
  //   await this.users.cancelSubscription(user.userId);
  // }

  /** GET /users/me/billing-portal - LemonSqueezy customer portal URL */
  // @Get('me/billing-portal')
  // async billingPortal(@CurrentUser() user: AuthenticatedUser) {
  //   const url = await this.users.getBillingPortalUrl(user.userId);
  //   return { url };
  // }
}
