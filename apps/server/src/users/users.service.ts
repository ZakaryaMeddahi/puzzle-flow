import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  PlanType,
  SubscriptionStatus,
  BookStatus,
  CONSTANTS,
} from '@kdp/shared';
import type { User } from '@kdp/shared';
import { PrismaService } from '../prisma/prisma.service';

export interface UsageInfo {
  plan: string;
  booksThisMonth: number;
  limit: number | null;
  currentPeriodEnd: Date | null;
}

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  // Basic queries

  async findById(id: string): Promise<User | null> {
    return this.prisma.db.user.findUnique({ where: { id } });
  }

  async findOrCreate(email: string, name?: string): Promise<User> {
    return this.prisma.db.user.upsert({
      where: { email },
      update: { name: name ?? undefined },
      create: { email, name },
    });
  }

  async findBySubscriptionId(subscriptionId: string): Promise<User | null> {
    return this.prisma.db.user.findFirst({ where: { subscriptionId } });
  }

  // Subscription management

  async updateSubscription(
    userId: string,
    data: Partial<{
      plan: string;
      subscriptionId: string | null;
      lemonSqueezyCustomerId: string | null;
      currentPeriodEnd: Date | null;
      subscriptionStatus: string | null;
      planPeriodStart: Date | null;
    }>,
  ): Promise<User> {
    return this.prisma.db.user.update({ where: { id: userId }, data });
  }

  async createSubscriptionCheckout(
    userId: string,
    plan: PlanType.STARTER | PlanType.PRO,
  ): Promise<string> {
    const apiKey = this.config.getOrThrow<string>('LEMONSQUEEZY_API_KEY');
    const storeId = this.config.getOrThrow<string>('LEMONSQUEEZY_STORE_ID');
    const clientUrl =
      this.config.get<string>('CLIENT_URL') ?? 'http://localhost:3000';

    const variantId =
      plan === PlanType.STARTER
        ? this.config.getOrThrow<string>('LEMONSQUEEZY_STARTER_VARIANT_ID')
        : this.config.getOrThrow<string>('LEMONSQUEEZY_PRO_VARIANT_ID');

    const body = {
      data: {
        type: 'checkouts',
        attributes: {
          product_options: {
            redirect_url: `${clientUrl}/dashboard/settings?subscription_success=1`,
          },
          checkout_data: {
            custom: { userId, plan },
          },
        },
        relationships: {
          store: { data: { type: 'stores', id: storeId } },
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

    const json = (await res.json()) as {
      data: { attributes: { url: string } };
    };
    return json.data.attributes.url;
  }

  async cancelSubscription(userId: string): Promise<void> {
    const user = await this.prisma.db.user.findUniqueOrThrow({
      where: { id: userId },
    });

    if (!user.subscriptionId) {
      throw new BadRequestException('No active subscription found');
    }
    if (user.subscriptionStatus === SubscriptionStatus.CANCELED) {
      throw new BadRequestException('Subscription is already canceled');
    }

    const apiKey = this.config.getOrThrow<string>('LEMONSQUEEZY_API_KEY');

    const res = await fetch(
      `https://api.lemonsqueezy.com/v1/subscriptions/${user.subscriptionId}`,
      {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          Accept: 'application/vnd.api+json',
        },
      },
    );

    if (!res.ok && res.status !== 404) {
      const text = await res.text();
      throw new Error(`LemonSqueezy cancel failed (${res.status}): ${text}`);
    }

    await this.updateSubscription(userId, {
      subscriptionStatus: SubscriptionStatus.CANCELED,
    });
  }

  // Usage

  async getUsage(userId: string): Promise<UsageInfo> {
    const user = await this.prisma.db.user.findUniqueOrThrow({
      where: { id: userId },
    });

    const plan = user.plan as PlanType;
    let limit: number | null = null;
    let booksThisMonth = 0;

    if (plan === PlanType.STARTER) {
      limit = CONSTANTS.STARTER_MONTHLY_LIMIT;
      const periodStart = user.planPeriodStart ?? user.createdAt;
      booksThisMonth = await this.prisma.db.book.count({
        where: {
          userId,
          createdAt: { gte: periodStart },
          NOT: { status: BookStatus.DRAFT },
        },
      });
    }

    return {
      plan,
      booksThisMonth,
      limit,
      currentPeriodEnd: user.currentPeriodEnd,
    };
  }

  // Billing portal

  // TODO: fix subscription management to use LemonSqueezy's new API for billing portal, as the current endpoint is deprecated
  async getBillingPortalUrl(userId: string): Promise<string> {
    const user = await this.prisma.db.user.findUniqueOrThrow({
      where: { id: userId },
    });

    if (!user.lemonSqueezyCustomerId) {
      throw new NotFoundException('No billing account found');
    }

    const apiKey = this.config.getOrThrow<string>('LEMONSQUEEZY_API_KEY');

    // TODO: add lemonsqueezy base url to .env
    const res = await fetch(
      `https://api.lemonsqueezy.com/v1/customers/${user.lemonSqueezyCustomerId}/portal`,
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          Accept: 'application/vnd.api+json',
        },
      },
    );

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`LemonSqueezy portal failed (${res.status}): ${text}`);
    }

    const json = (await res.json()) as {
      data: { attributes: { url: string } };
    };
    return json.data.attributes.url;
  }
}
