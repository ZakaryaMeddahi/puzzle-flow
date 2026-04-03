import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { PuzzlesModule } from './puzzles/puzzles.module';
import { BooksModule } from './books/books.module';
import { WebhooksModule } from './webhooks/webhooks.module';
import { QueuesModule } from './queues/queues.module';
import { UploadsModule } from './uploads/uploads.module';
import { PreviewModule } from './preview/preview.module';
import { SupportModule } from './support/support.module';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    UsersModule,
    AuthModule,
    PuzzlesModule,
    BooksModule,
    WebhooksModule,
    QueuesModule,
    UploadsModule,
    PreviewModule,
    SupportModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_GUARD, useClass: JwtAuthGuard },
  ],
})
export class AppModule {}
