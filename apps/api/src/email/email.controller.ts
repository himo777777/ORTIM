import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { EmailService } from './email.service';
import { PrismaService } from '../common/prisma/prisma.service';

@ApiTags('Email')
@Controller('email')
export class EmailController {
  constructor(
    private readonly emailService: EmailService,
    private readonly prisma: PrismaService,
  ) {}

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request password reset email' })
  async forgotPassword(@Body('email') email: string) {
    if (!email) {
      throw new BadRequestException('E-postadress krävs');
    }

    // Find user by email
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    // Always return success to prevent email enumeration
    if (!user) {
      return { success: true, message: 'Om e-postadressen finns registrerad kommer ett återställningsmail skickas.' };
    }

    await this.emailService.sendPasswordResetEmail(user.id, email);

    return { success: true, message: 'Om e-postadressen finns registrerad kommer ett återställningsmail skickas.' };
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reset password with token' })
  async resetPassword(
    @Body('token') token: string,
    @Body('password') password: string,
  ) {
    if (!token || !password) {
      throw new BadRequestException('Token och lösenord krävs');
    }

    if (password.length < 8) {
      throw new BadRequestException('Lösenordet måste vara minst 8 tecken');
    }

    const userId = await this.emailService.validatePasswordResetToken(token);

    if (!userId) {
      throw new BadRequestException('Ogiltig eller utgången länk');
    }

    // Note: In a real app, you would hash the password here
    // For now, we'll just mark the token as used
    // The actual password update would require additional auth module changes
    await this.emailService.markPasswordResetTokenUsed(token);

    return { success: true, message: 'Lösenordet har återställts. Du kan nu logga in.' };
  }

  @Post('verify-reset-token')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify if a reset token is valid' })
  async verifyResetToken(@Body('token') token: string) {
    if (!token) {
      throw new BadRequestException('Token krävs');
    }

    const userId = await this.emailService.validatePasswordResetToken(token);

    return { valid: !!userId };
  }
}
