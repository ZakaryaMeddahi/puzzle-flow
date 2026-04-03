import { Module } from '@nestjs/common';
import { WebhooksController } from './webhooks.controller';
import { PuzzlesModule } from '../puzzles/puzzles.module';
import { QueuesModule } from '../queues/queues.module';
import { PrismaModule } from '../prisma/prisma.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [PuzzlesModule, QueuesModule, PrismaModule, UsersModule],
  controllers: [WebhooksController],
})
export class WebhooksModule {}
