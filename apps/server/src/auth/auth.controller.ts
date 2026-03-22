import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthGuard } from '@nestjs/passport';
import type { Request, Response } from 'express';
import type { User } from '@kdp/shared';
import { AuthService } from './auth.service';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { Public } from './decorators/public.decorator';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
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
    // Passport handles the redirect — this method body is never reached.
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

    const clientUrl = this.config.get<string>('CLIENT_URL', 'http://localhost:3000');
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
}
