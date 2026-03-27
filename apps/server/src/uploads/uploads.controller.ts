import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadsService } from './uploads.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/decorators/current-user.decorator';

const ALLOWED_TYPES = ['image/png', 'image/jpeg'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

@Controller('uploads')
export class UploadsController {
  constructor(private readonly uploads: UploadsService) {}

  /**
   * POST /uploads
   * Accepts a `file` field in multipart/form-data.
   * Saves the image to local disk and returns its key.
   * The key is stored in frontMatter.pageType.values[elementId] in the DB.
   */
  @Post()
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: MAX_FILE_SIZE } }))
  async upload(
    @CurrentUser() user: AuthenticatedUser,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<{ key: string }> {
    if (!file) throw new BadRequestException('No file provided');
    if (!ALLOWED_TYPES.includes(file.mimetype)) {
      throw new BadRequestException('Only PNG and JPEG images are accepted');
    }
    return this.uploads.save(user.userId, file.buffer, file.mimetype);
  }
}
