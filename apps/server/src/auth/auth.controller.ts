import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthGuard } from '@nestjs/passport';
import type { Request, Response } from 'express';
import type { User } from '@kdp/shared';
import { AuthService } from './auth.service';
import { MagicLinkService } from './magic-link.service';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { MagicLinkDto } from './dto/magic-link.dto';
import { Public } from './decorators/public.decorator';
import { UsersService } from '../users/users.service';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly magicLink: MagicLinkService,
    private readonly users: UsersService,
    private readonly config: ConfigService,
  ) {}

  /**
   * GET /auth/google
   * Redirects the browser to Google's OAuth consent screen.
   */
  @Get('google')
  @Public()
  @UseGuards(AuthGuard('google'))
  googleAuth(): void {
    // Passport handles the redirect - this method body is never reached.
  }

  /**
   * GET /auth/google/callback
   * Google redirects here after the user consents.
   * Passport validates the profile and attaches the user to req.user.
   * Redirects to the client callback page with tokens in query params.
   */
  @Get('google/callback')
  @Public()
  @UseGuards(AuthGuard('google'))
  googleCallback(@Req() req: Request, @Res() res: Response): void {
    const user = req.user as User;
    const { accessToken, refreshToken } = this.authService.generateTokens(
      user.id,
      user.email,
    );

    const clientUrl = this.config.get<string>(
      'CLIENT_URL',
      'http://localhost:3000',
    );
    const params = new URLSearchParams({ accessToken, refreshToken });
    res.redirect(`${clientUrl}/auth/callback?${params.toString()}`);
  }

  /**
   * POST /auth/refresh
   * Exchange a valid refresh token for a new access + refresh token pair.
   */
  @Post('refresh')
  @Public()
  @HttpCode(HttpStatus.OK)
  refresh(@Body() dto: RefreshTokenDto) {
    return this.authService.refreshTokens(dto.refreshToken);
  }

  /**
   * POST /auth/magic-link
   * Send a one-time login link to the provided email address.
   * Always returns 200 (even for unknown emails) to prevent user enumeration.
   */
  @Post('magic-link')
  @Public()
  @HttpCode(HttpStatus.OK)
  async sendMagicLink(@Body() dto: MagicLinkDto): Promise<{ sent: boolean }> {
    await this.magicLink.sendMagicLink(dto.email);
    return { sent: true };
  }

  /**
   * GET /auth/magic-link/verify?token=...
   * Verify the magic link token and redirect to the client callback page with tokens.
   */
  @Get('magic-link/verify')
  @Public()
  async verifyMagicLink(
    @Query('token') token: string | undefined,
    @Res() res: Response,
  ): Promise<void> {
    const clientUrl = this.magicLink.clientBaseUrl;

    if (!token) {
      res.redirect(`${clientUrl}/login?error=invalid_link`);
      return;
    }

    const email = await this.magicLink.verifyToken(token);
    if (!email) {
      res.redirect(`${clientUrl}/login?error=invalid_link`);
      return;
    }

    const user = await this.users.findOrCreate(email);
    const { accessToken, refreshToken } = this.authService.generateTokens(
      user.id,
      user.email,
    );
    const params = new URLSearchParams({ accessToken, refreshToken });
    res.redirect(`${clientUrl}/auth/callback?${params.toString()}`);
  }
}
