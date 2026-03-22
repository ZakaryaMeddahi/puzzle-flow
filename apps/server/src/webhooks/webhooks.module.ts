import { Module } from '@nestjs/common';
import { WebhooksController } from './webhooks.controller';
import { PuzzlesModule } from '../puzzles/puzzles.module';
import { QueuesModule } from '../queues/queues.module';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PuzzlesModule, QueuesModule, PrismaModule],
  controllers: [WebhooksController],
})
export class WebhooksModule {}
