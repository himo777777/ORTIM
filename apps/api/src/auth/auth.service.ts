import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../common/prisma/prisma.service';
import { User } from '@prisma/client';

export interface JwtPayload {
  sub: string;
  personnummer: string;
  role: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService
  ) {}

  async validateUser(personnummer: string): Promise<User> {
    const user = await this.prisma.user.findUnique({
      where: { personnummer },
    });

    if (!user) {
      throw new UnauthorizedException('Användare finns inte');
    }

    return user;
  }

  async findOrCreateUser(
    personnummer: string,
    firstName: string,
    lastName: string
  ): Promise<User> {
    let user = await this.prisma.user.findUnique({
      where: { personnummer },
    });

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          personnummer,
          firstName,
          lastName,
          role: 'PARTICIPANT',
        },
      });
    }

    // Update last login
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    return user;
  }

  async generateTokens(user: User): Promise<AuthTokens> {
    const payload: JwtPayload = {
      sub: user.id,
      personnummer: user.personnummer,
      role: user.role,
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload),
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
        expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRY') || '7d',
      }),
    ]);

    return { accessToken, refreshToken };
  }

  async refreshTokens(refreshToken: string): Promise<AuthTokens> {
    try {
      const payload = await this.jwtService.verifyAsync<JwtPayload>(refreshToken, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      });

      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
      });

      if (!user) {
        throw new UnauthorizedException('Användare finns inte');
      }

      return this.generateTokens(user);
    } catch {
      throw new UnauthorizedException('Ogiltig refresh token');
    }
  }

  async getUser(userId: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { id: userId },
    });
  }
}
