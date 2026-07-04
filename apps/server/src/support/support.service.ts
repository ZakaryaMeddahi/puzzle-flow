import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { ContactDto } from './dto/contact.dto';

@Injectable()
export class SupportService {
  constructor(private readonly config: ConfigService) {}

  async sendContactEmail(dto: ContactDto): Promise<void> {
    const apiKey = this.config.getOrThrow<string>('RESEND_API_KEY');
    const supportEmail =
      this.config.get<string>('SUPPORT_EMAIL') ?? 'support@puzzleflow.app';
    const from =
      this.config.get<string>('EMAIL_FROM') ?? 'onboarding@resend.dev';

    const body = {
      from,
      to: [supportEmail],
      reply_to: dto.email,
      subject: `[PuzzleFlow Support] Message from ${dto.name}`,
      text: `Name: ${dto.name}\nEmail: ${dto.email}\n\n${dto.message}`,
    };

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Resend failed (${res.status}): ${text}`);
    }
  }
}
