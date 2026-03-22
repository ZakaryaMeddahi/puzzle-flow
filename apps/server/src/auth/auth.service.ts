import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import type { User } from '@kdp/shared';
import { UsersService } from '../users/users.service';

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponse extends TokenPair {
  user: { id: string; email: string; name: string | null };
}

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  /** find or create a user from their Google profile. */
  async validateGoogleUser(email: string, name?: string): Promise<User> {
    return this.usersService.findOrCreate(email, name);
  }

  /** sign access (15 min) and refresh (7 d) tokens for a user. */
  generateTokens(userId: string, email: string): TokenPair {
    const accessToken = this.jwtService.sign(
      { sub: userId, email },
      { expiresIn: '15m' },
    );

    const refreshToken = this.jwtService.sign(
      { sub: userId },
      {
        secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
        expiresIn: '7d',
      },
    );

    return { accessToken, refreshToken };
  }

  /** build a full auth response with tokens + public user fields. */
  buildAuthResponse(user: User): AuthResponse {
    const tokens = this.generateTokens(user.id, user.email);
    return {
      ...tokens,
      user: { id: user.id, email: user.email, name: user.name ?? null },
    };
  }

  /** validate a refresh token and issue a new access token. */
  async refreshTokens(refreshToken: string): Promise<AuthResponse> {
    let userId: string;

    try {
      const payload = this.jwtService.verify<{ sub: string }>(refreshToken, {
        secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
      });
      userId = payload.sub;
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return this.buildAuthResponse(user);
  }
}
