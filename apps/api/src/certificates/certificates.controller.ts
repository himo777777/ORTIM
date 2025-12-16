import { Controller, Get, Param, UseGuards, NotFoundException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CertificatesService } from './certificates.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '@prisma/client';

@ApiTags('Certificates')
@Controller()
export class CertificatesController {
  constructor(private certificatesService: CertificatesService) {}

  @Get('certificates')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user certificates' })
  async findByUser(@CurrentUser() user: User) {
    return this.certificatesService.findByUser(user.id);
  }

  @Get('certificates/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get certificate by ID' })
  async findById(@Param('id') id: string) {
    const certificate = await this.certificatesService.findById(id);
    if (!certificate) {
      throw new NotFoundException('Certifikatet hittades inte');
    }
    return certificate;
  }

  @Get('verify/:code')
  @ApiOperation({ summary: 'Verify certificate (public)' })
  async verify(@Param('code') code: string) {
    return this.certificatesService.verify(code);
  }
}
