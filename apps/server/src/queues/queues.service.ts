import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Queue } from 'bullmq';

interface PdfGenerationJobData {
  bookId: string;
}

const QUEUE_PDF_GENERATION = 'pdf-generation';

@Injectable()
export class QueuesService implements OnModuleDestroy {
  private readonly pdfQueue: Queue<PdfGenerationJobData>;

  constructor(private readonly config: ConfigService) {
    const redisUrl = this.config.get<string>('REDIS_URL') ?? 'redis://localhost:6379';
    const url = new URL(redisUrl);

    const connection = {
      host: url.hostname,
      port: url.port ? parseInt(url.port, 10) : 6379,
      ...(url.password ? { password: url.password } : {}),
      maxRetriesPerRequest: null as null,
    };

    this.pdfQueue = new Queue<PdfGenerationJobData>(QUEUE_PDF_GENERATION, {
      connection,
    });
  }

  async enqueuePdfGeneration(bookId: string): Promise<void> {
    await this.pdfQueue.add(
      'generate-pdf',
      { bookId },
      {
        attempts: 3,
        backoff: { type: 'exponential', delay: 5_000 },
      },
    );
  }

  async onModuleDestroy(): Promise<void> {
    await this.pdfQueue.close();
  }
}
