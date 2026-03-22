import { Module } from '@nestjs/common';
import { QueuesService } from './queues.service';

@Module({
  providers: [QueuesService],
  exports: [QueuesService],
})
export class QueuesModule {}
