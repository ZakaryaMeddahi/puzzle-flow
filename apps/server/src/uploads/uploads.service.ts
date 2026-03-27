import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { writeFile, mkdir, readFile } from 'fs/promises';
import { join } from 'path';
import { randomUUID } from 'crypto';

@Injectable()
export class UploadsService {
  readonly uploadDir: string;

  constructor(private readonly config: ConfigService) {
    this.uploadDir =
      config.get<string>('UPLOAD_DIR') ?? join(process.cwd(), 'uploads');
  }

  /**
   * Save an image buffer to disk under `uploadDir/{userId}/{uuid}.{ext}`.
   * Returns the relative key so it can be stored in the book's frontMatter JSON.
   */
  async save(
    userId: string,
    buffer: Buffer,
    contentType: string,
  ): Promise<{ key: string }> {
    const ext = contentType === 'image/png' ? 'png' : 'jpg';
    const filename = `${randomUUID()}.${ext}`;
    const dir = join(this.uploadDir, userId);
    await mkdir(dir, { recursive: true });
    const key = `${userId}/${filename}`;
    await writeFile(join(this.uploadDir, key), buffer);
    return { key };
  }

  /** Read an uploaded image by its key. Used by the PDF worker at generation time. */
  async read(key: string): Promise<Buffer> {
    return readFile(join(this.uploadDir, key));
  }
}
