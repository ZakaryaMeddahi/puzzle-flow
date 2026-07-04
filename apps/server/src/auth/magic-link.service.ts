import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomBytes } from 'crypto';
import Redis from 'ioredis';
import { Resend } from 'resend';

const TTL_SECONDS = 15 * 60; // 15 minutes
const KEY_PREFIX = 'magic_link:';

@Injectable()
export class MagicLinkService implements OnModuleDestroy {
  private readonly logger = new Logger(MagicLinkService.name);
  private readonly redis: Redis;
  private readonly resend: Resend;
  private readonly apiUrl: string;
  private readonly clientUrl: string;
  private readonly fromEmail: string;

  constructor(private readonly config: ConfigService) {
    const redisUrl =
      this.config.get<string>('REDIS_URL') ?? 'redis://localhost:6379';
    const url = new URL(redisUrl);

    this.redis = new Redis({
      host: url.hostname,
      port: url.port ? parseInt(url.port, 10) : 6379,
      ...(url.password ? { password: url.password } : {}),
      lazyConnect: true,
    });

    this.resend = new Resend(this.config.getOrThrow<string>('RESEND_API_KEY'));
    this.apiUrl = this.config.get<string>('API_URL') ?? 'http://localhost:5000';
    this.clientUrl =
      this.config.get<string>('CLIENT_URL') ?? 'http://localhost:3000';
    this.fromEmail =
      this.config.get<string>('EMAIL_FROM') ?? 'noreply@puzzleflow.app';
  }

  /** Generate a token, store it in Redis, and email the magic link. */
  async sendMagicLink(email: string): Promise<void> {
    const token = randomBytes(32).toString('hex');
    await this.redis.set(`${KEY_PREFIX}${token}`, email, 'EX', TTL_SECONDS);

    const verifyUrl = `${this.apiUrl}/auth/magic-link/verify?token=${token}`;

    try {
      await this.resend.emails.send({
        from: this.fromEmail,
        to: email,
        subject: 'Your PuzzleFlow login link',
        html: `
          <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px">
            <h2 style="margin:0 0 8px;font-size:20px;color:#111">Sign in to PuzzleFlow</h2>
            <p style="margin:0 0 24px;color:#555;font-size:14px">
              Click the button below to sign in. This link expires in 15 minutes and can only be used once.
            </p>
            <a href="${verifyUrl}"
               style="display:inline-block;padding:12px 24px;background:#18181b;color:#fff;text-decoration:none;border-radius:8px;font-size:14px;font-weight:600">
              Sign in
            </a>
            <p style="margin:24px 0 0;color:#aaa;font-size:12px">
              If you didn't request this, you can safely ignore this email.
            </p>
          </div>
        `,
      });
    } catch (err) {
      this.logger.error('Failed to send magic link email', err);
      // Don't throw - caller always responds 200 to avoid user enumeration.
    }
  }

  /** Verify a token. Returns the email if valid, null if expired/not found. */
  async verifyToken(token: string): Promise<string | null> {
    const key = `${KEY_PREFIX}${token}`;
    const email = await this.redis.get(key);
    if (!email) return null;

    // Consume the token (one-time use).
    await this.redis.del(key);
    return email;
  }

  get clientBaseUrl(): string {
    return this.clientUrl;
  }

  async onModuleDestroy(): Promise<void> {
    await this.redis.quit();
  }
}
