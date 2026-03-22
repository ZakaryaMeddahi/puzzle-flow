import { Injectable } from '@nestjs/common';
import type { User } from '@kdp/shared';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  /** find a user by their primary key. */
  async findById(id: string): Promise<User | null> {
    return this.prisma.db.user.findUnique({ where: { id } });
  }

  /** find a user by email, or create one if they don't exist yet. */
  async findOrCreate(email: string, name?: string): Promise<User> {
    return this.prisma.db.user.upsert({
      where: { email },
      update: { name: name ?? undefined },
      create: { email, name },
    });
  }
}
