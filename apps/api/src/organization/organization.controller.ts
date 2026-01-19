import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  Res,
  Header,
} from '@nestjs/common';
import { Response } from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { OrganizationService } from './organization.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import {
  UserRole,
  ReportFrequency,
  OrganizationMemberRole,
} from '../types/prisma-types';

// ============================================
// ADMIN ENDPOINTS - Organization Management
// ============================================

@ApiTags('Admin - Organizations')
@Controller('admin/organizations')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@ApiBearerAuth()
export class OrganizationController {
  constructor(private organizationService: OrganizationService) {}

  @Get()
  @ApiOperation({ summary: 'Get all organizations' })
  @ApiQuery({ name: 'skip', required: false })
  @ApiQuery({ name: 'take', required: false })
  @ApiQuery({ name: 'search', required: false })
  async findAll(
    @Query('skip') skip?: string,
    @Query('take') take?: string,
    @Query('search') search?: string,
  ) {
    return this.organizationService.findAll({
      skip: skip ? parseInt(skip, 10) : undefined,
      take: take ? parseInt(take, 10) : undefined,
      search,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get organization by ID' })
  async findOne(@Param('id') id: string) {
    return this.organizationService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create new organization' })
  async create(
    @Body()
    body: {
      name: string;
      organizationNumber?: string;
      contactEmail: string;
      contactPhone?: string;
      address?: string;
      reportFrequency?: ReportFrequency;
      logoUrl?: string;
    },
    @CurrentUser() user: { id: string },
  ) {
    return this.organizationService.create(body, user.id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update organization' })
  async update(
    @Param('id') id: string,
    @Body()
    body: {
      name?: string;
      organizationNumber?: string;
      contactEmail?: string;
      contactPhone?: string;
      address?: string;
      reportFrequency?: ReportFrequency;
      reportEnabled?: boolean;
      logoUrl?: string;
      isActive?: boolean;
    },
    @CurrentUser() user: { id: string },
  ) {
    return this.organizationService.update(id, body, user.id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete organization' })
  async delete(
    @Param('id') id: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.organizationService.delete(id, user.id);
  }

  // ============================================
  // MEMBER MANAGEMENT
  // ============================================

  @Post(':id/members')
  @ApiOperation({ summary: 'Add member to organization' })
  async addMember(
    @Param('id') id: string,
    @Body()
    body: {
      userId: string;
      role?: OrganizationMemberRole;
      department?: string;
    },
    @CurrentUser() user: { id: string },
  ) {
    return this.organizationService.addMember(id, body, user.id);
  }

  @Put(':id/members/:userId')
  @ApiOperation({ summary: 'Update organization member' })
  async updateMember(
    @Param('id') id: string,
    @Param('userId') userId: string,
    @Body()
    body: {
      role?: OrganizationMemberRole;
      department?: string;
    },
    @CurrentUser() user: { id: string },
  ) {
    return this.organizationService.updateMember(id, userId, body, user.id);
  }

  @Delete(':id/members/:userId')
  @ApiOperation({ summary: 'Remove member from organization' })
  async removeMember(
    @Param('id') id: string,
    @Param('userId') userId: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.organizationService.removeMember(id, userId, user.id);
  }

  // ============================================
  // REPORT RECIPIENTS
  // ============================================

  @Post(':id/recipients')
  @ApiOperation({ summary: 'Add report recipient' })
  async addRecipient(
    @Param('id') id: string,
    @Body() body: { email: string; name?: string },
    @CurrentUser() user: { id: string },
  ) {
    return this.organizationService.addReportRecipient(id, body, user.id);
  }

  @Delete('recipients/:recipientId')
  @ApiOperation({ summary: 'Remove report recipient' })
  async removeRecipient(
    @Param('recipientId') recipientId: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.organizationService.removeReportRecipient(recipientId, user.id);
  }
}

// ============================================
// PORTAL ENDPOINTS - For Organization Managers
// ============================================

@ApiTags('Organization Portal')
@Controller('organization-portal')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class OrganizationPortalController {
  constructor(private organizationService: OrganizationService) {}

  @Get()
  @ApiOperation({ summary: 'Get organization portal dashboard' })
  async getDashboard(@CurrentUser() user: { id: string }) {
    return this.organizationService.getPortalDashboard(user.id);
  }

  @Get('employees')
  @ApiOperation({ summary: 'Get organization employees' })
  @ApiQuery({ name: 'skip', required: false })
  @ApiQuery({ name: 'take', required: false })
  @ApiQuery({ name: 'search', required: false })
  async getEmployees(
    @CurrentUser() user: { id: string },
    @Query('skip') skip?: string,
    @Query('take') take?: string,
    @Query('search') search?: string,
  ) {
    return this.organizationService.getPortalEmployees(user.id, {
      skip: skip ? parseInt(skip, 10) : undefined,
      take: take ? parseInt(take, 10) : undefined,
      search,
    });
  }

  @Get('employees/:id')
  @ApiOperation({ summary: 'Get employee detail' })
  async getEmployeeDetail(
    @CurrentUser() user: { id: string },
    @Param('id') employeeId: string,
  ) {
    return this.organizationService.getPortalEmployeeDetail(user.id, employeeId);
  }

  @Get('export')
  @ApiOperation({ summary: 'Export organization data as CSV' })
  @Header('Content-Type', 'text/csv')
  async exportData(
    @CurrentUser() user: { id: string },
    @Res() res: Response,
  ) {
    const csv = await this.organizationService.exportPortalData(user.id);
    res.set(
      'Content-Disposition',
      `attachment; filename="organization-employees-${new Date().toISOString().split('T')[0]}.csv"`,
    );
    res.send(csv);
  }
}
