import { Module } from '@nestjs/common';
import { WebhooksController } from './webhooks.controller';
import { PuzzlesModule } from '../puzzles/puzzles.module';
import { QueuesModule } from '../queues/queues.module';

@Module({
  imports: [PuzzlesModule, QueuesModule],
  controllers: [WebhooksController],
})
export class WebhooksModule {}
