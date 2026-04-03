import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SupportController } from './support.controller';
import { SupportService } from './support.service';

@Module({
  imports: [ConfigModule],
  controllers: [SupportController],
  providers: [SupportService],
})
export class SupportModule {}
