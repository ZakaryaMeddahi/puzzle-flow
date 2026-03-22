import { Injectable } from '@nestjs/common';
import { prisma } from '@kdp/shared';

/**
 * thin NestJS wrapper around the shared Prisma singleton.
 * injected anywhere database access is needed.
 */
@Injectable()
export class PrismaService {
  readonly db = prisma;
}
