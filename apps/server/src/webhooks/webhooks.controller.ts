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
import { UsersService } from '../users/users.service';
import { BookStatus, PlanType, SubscriptionStatus } from '@kdp/shared';
import { Public } from '../auth/decorators/public.decorator';

interface LemonSqueezyOrderEvent {
  meta: {
    event_name: string;
    custom_data?: {
      bookId?: string;
      userId?: string;
      plan?: string;
    };
  };
  data: {
    id: string;
    attributes: {
      status: string;
      renews_at?: string;
      ends_at?: string | null;
      customer_id?: number;
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
    private readonly users: UsersService,
  ) {}

  @Post('lemonsqueezy')
  async handleLemonSqueezy(
    @Req() req: RawBodyRequest<Request>,
    @Headers('x-signature') signature: string | undefined,
  ): Promise<{ received: boolean }> {
    // 1- Verify HMAC-SHA256 signature
    const secret = this.config.getOrThrow<string>(
      'LEMONSQUEEZY_WEBHOOK_SECRET',
    );
    const rawBody = req.rawBody;

    if (!rawBody || !signature) {
      throw new BadRequestException('Missing body or signature');
    }

    const expected = createHmac('sha256', secret).update(rawBody).digest('hex');
    const expectedBuf = Buffer.from(expected, 'hex');
    const receivedBuf = Buffer.from(signature.replace(/^sha256=/, ''), 'hex');

    if (
      expectedBuf.length !== receivedBuf.length ||
      !timingSafeEqual(expectedBuf, receivedBuf)
    ) {
      throw new BadRequestException('Invalid webhook signature');
    }

    // 2- Parse and route event
    const event = JSON.parse(
      rawBody.toString('utf-8'),
    ) as LemonSqueezyOrderEvent;
    const { event_name, custom_data } = event.meta;

    this.logger.log(`Received LemonSqueezy event: ${event_name}`);

    // TODO: when subscribing I receive three events for some reason (order_created, subscription_created, subscription_payment_success), fix it
    if (event_name === 'order_created') {
      await this.handleOrderCreated(custom_data);
    } else if (event_name === 'subscription_created') {
      await this.handleSubscriptionCreated(event, custom_data);
    } else if (event_name === 'subscription_payment_success') {
      await this.handleSubscriptionRenewed(event);
    } else if (event_name === 'subscription_cancelled') {
      await this.handleSubscriptionCancelled(event);
    } else if (event_name === 'subscription_paused') {
      await this.handleSubscriptionPaused(event);
    } else if (event_name === 'subscription_resumed') {
      await this.handleSubscriptionResumed(event);
    }

    return { received: true };
  }

  private async handleOrderCreated(
    customData: LemonSqueezyOrderEvent['meta']['custom_data'],
  ): Promise<void> {
    const bookId = customData?.bookId;
    const userId = customData?.userId;

    if (!bookId || !userId) {
      this.logger.warn('order_created missing bookId or userId in custom_data');
      return;
    }

    await this.puzzles.confirmPuzzles(bookId);
    await this.prisma.db.book.update({
      where: { id: bookId },
      data: { status: BookStatus.PENDING },
    });
    await this.queues.enqueuePdfGeneration(bookId);

    this.logger.log(
      `order_created: confirmed puzzles and queued PDF for book ${bookId}`,
    );
  }

  private async handleSubscriptionCreated(
    event: LemonSqueezyOrderEvent,
    customData: LemonSqueezyOrderEvent['meta']['custom_data'],
  ): Promise<void> {
    const userId = customData?.userId;
    const plan = (customData?.plan ?? PlanType.STARTER) as PlanType;

    if (!userId) {
      this.logger.warn('subscription_created missing userId in custom_data');
      return;
    }

    const attrs = event.data.attributes;
    await this.users.updateSubscription(userId, {
      plan,
      subscriptionId: event.data.id,
      lemonSqueezyCustomerId: attrs.customer_id
        ? String(attrs.customer_id)
        : undefined,
      currentPeriodEnd: attrs.renews_at ? new Date(attrs.renews_at) : null,
      subscriptionStatus: SubscriptionStatus.ACTIVE,
      planPeriodStart: new Date(),
    });

    this.logger.log(`subscription_created: user ${userId} upgraded to ${plan}`);
  }

  private async handleSubscriptionRenewed(
    event: LemonSqueezyOrderEvent,
  ): Promise<void> {
    const user = await this.users.findBySubscriptionId(event.data.id);
    if (!user) {
      this.logger.warn(
        `subscription_payment_success: no user found for subscription ${event.data.id}`,
      );
      return;
    }

    const attrs = event.data.attributes;
    await this.users.updateSubscription(user.id, {
      currentPeriodEnd: attrs.renews_at ? new Date(attrs.renews_at) : null,
      subscriptionStatus: SubscriptionStatus.ACTIVE,
      planPeriodStart: new Date(),
    });

    this.logger.log(
      `subscription_payment_success: renewed subscription for user ${user.id}`,
    );
  }

  private async handleSubscriptionCancelled(
    event: LemonSqueezyOrderEvent,
  ): Promise<void> {
    const user = await this.users.findBySubscriptionId(event.data.id);
    if (!user) {
      this.logger.warn(
        `subscription_cancelled: no user found for subscription ${event.data.id}`,
      );
      return;
    }

    await this.users.updateSubscription(user.id, {
      subscriptionStatus: SubscriptionStatus.CANCELED,
    });

    this.logger.log(
      `subscription_cancelled: marked canceled for user ${user.id} (access until ${user.currentPeriodEnd?.toISOString()})`,
    );
  }

  private async handleSubscriptionPaused(
    event: LemonSqueezyOrderEvent,
  ): Promise<void> {
    const user = await this.users.findBySubscriptionId(event.data.id);
    if (!user) return;

    await this.users.updateSubscription(user.id, {
      subscriptionStatus: SubscriptionStatus.PAUSED,
    });

    this.logger.log(
      `subscription_paused: paused subscription for user ${user.id}`,
    );
  }

  private async handleSubscriptionResumed(
    event: LemonSqueezyOrderEvent,
  ): Promise<void> {
    const user = await this.users.findBySubscriptionId(event.data.id);
    if (!user) return;

    await this.users.updateSubscription(user.id, {
      subscriptionStatus: SubscriptionStatus.ACTIVE,
    });

    this.logger.log(
      `subscription_resumed: resumed subscription for user ${user.id}`,
    );
  }
}
