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
  UseInterceptors,
  UploadedFile,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { MediaService } from './media.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UserRole, MediaType } from '../types/prisma-types';

@ApiTags('Media')
@Controller('media')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.INSTRUCTOR, UserRole.ADMIN)
@ApiBearerAuth()
export class MediaController {
  constructor(private mediaService: MediaService) {}

  // ============================================
  // FILE UPLOAD
  // ============================================

  @Post('upload')
  @ApiOperation({ summary: 'Upload a media file (image or PDF)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
        alt: { type: 'string' },
        caption: { type: 'string' },
        tags: { type: 'string', description: 'Comma-separated tags' },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 50 * 1024 * 1024 }), // 50MB max
          new FileTypeValidator({
            fileType: /(image\/(jpeg|png|gif|webp)|application\/pdf)/,
          }),
        ],
      }),
    )
    file: Express.Multer.File,
    @CurrentUser() user: { id: string },
    @Body('alt') alt?: string,
    @Body('caption') caption?: string,
    @Body('tags') tagsString?: string,
  ) {
    const tags = tagsString
      ? tagsString.split(',').map((t) => t.trim()).filter(Boolean)
      : undefined;

    return this.mediaService.uploadMedia(
      {
        buffer: file.buffer,
        originalname: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
      },
      user.id,
      { alt, caption, tags },
    );
  }

  // ============================================
  // EMBEDDED VIDEO
  // ============================================

  @Post('embed')
  @ApiOperation({ summary: 'Create embedded video (YouTube/Vimeo)' })
  async createEmbed(
    @Body()
    body: {
      url: string;
      alt?: string;
      caption?: string;
      tags?: string[];
    },
    @CurrentUser() user: { id: string },
  ) {
    return this.mediaService.createEmbeddedVideo(body, user.id);
  }

  // ============================================
  // LIST & SEARCH
  // ============================================

  @Get()
  @ApiOperation({ summary: 'List all media assets' })
  @ApiQuery({ name: 'skip', required: false })
  @ApiQuery({ name: 'take', required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'type', required: false, enum: MediaType })
  async findAll(
    @Query('skip') skip?: string,
    @Query('take') take?: string,
    @Query('search') search?: string,
    @Query('type') type?: MediaType,
  ) {
    return this.mediaService.findAll({
      skip: skip ? parseInt(skip, 10) : undefined,
      take: take ? parseInt(take, 10) : undefined,
      search,
      type,
    });
  }

  @Get('search')
  @ApiOperation({ summary: 'Search media assets' })
  @ApiQuery({ name: 'q', required: true })
  @ApiQuery({ name: 'type', required: false, enum: MediaType })
  async search(
    @Query('q') query: string,
    @Query('type') type?: MediaType,
  ) {
    return this.mediaService.findAll({
      search: query,
      type,
      take: 20,
    });
  }

  // ============================================
  // SINGLE ASSET
  // ============================================

  @Get(':id')
  @ApiOperation({ summary: 'Get media asset by ID' })
  async findOne(@Param('id') id: string) {
    return this.mediaService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update media asset metadata' })
  async update(
    @Param('id') id: string,
    @Body()
    body: {
      alt?: string;
      caption?: string;
      tags?: string[];
    },
    @CurrentUser() user: { id: string },
  ) {
    return this.mediaService.update(id, body, user.id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete media asset' })
  async delete(
    @Param('id') id: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.mediaService.delete(id, user.id);
  }
}
