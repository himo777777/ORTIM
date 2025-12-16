import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  UseGuards,
  UnauthorizedException,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { BankIdService } from './bankid.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '@prisma/client';

class RefreshTokenDto {
  refreshToken: string;
}

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private bankIdService: BankIdService
  ) {}

  @Post('bankid/initiate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Initiate BankID authentication' })
  @ApiResponse({ status: 200, description: 'BankID session initiated' })
  async initiateBankId() {
    const result = await this.bankIdService.initiateAuth();
    return result;
  }

  @Get('bankid/poll/:sessionId')
  @ApiOperation({ summary: 'Poll BankID authentication status' })
  @ApiResponse({ status: 200, description: 'Current authentication status' })
  async pollBankId(@Param('sessionId') sessionId: string) {
    const status = await this.bankIdService.pollStatus(sessionId);

    if (status.state === 'complete' && status.personnummer) {
      // Find or create user
      const user = await this.authService.findOrCreateUser(
        status.personnummer,
        status.firstName || 'Okänd',
        status.lastName || 'Användare'
      );

      // Generate tokens
      const tokens = await this.authService.generateTokens(user);

      return {
        state: 'complete',
        token: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        user: {
          id: user.id,
          personnummer: user.personnummer,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
        },
      };
    }

    return { state: status.state };
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiResponse({ status: 200, description: 'New tokens generated' })
  async refresh(@Body() body: RefreshTokenDto) {
    if (!body.refreshToken) {
      throw new UnauthorizedException('Refresh token krävs');
    }

    const tokens = await this.authService.refreshTokens(body.refreshToken);
    return tokens;
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Logout user' })
  @ApiResponse({ status: 200, description: 'Successfully logged out' })
  async logout() {
    // In a production app, you might want to blacklist the token
    return { message: 'Utloggad' };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user' })
  @ApiResponse({ status: 200, description: 'Current user data' })
  async me(@CurrentUser() user: User) {
    return {
      id: user.id,
      personnummer: user.personnummer,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      workplace: user.workplace,
      speciality: user.speciality,
    };
  }
}
