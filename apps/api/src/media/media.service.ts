import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { AuditService } from '../common/audit/audit.service';
import { R2Service } from './r2.service';
import { MediaType } from '../types/prisma-types';
import * as sharp from 'sharp';

// Allowed MIME types
const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
];
const ALLOWED_PDF_TYPE = 'application/pdf';
const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_PDF_SIZE = 50 * 1024 * 1024; // 50MB

interface UploadedFile {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
  size: number;
}

@Injectable()
export class MediaService {
  private readonly logger = new Logger(MediaService.name);

  constructor(
    private prisma: PrismaService,
    private r2Service: R2Service,
    private auditService: AuditService,
  ) {}

  // ============================================
  // MEDIA UPLOAD
  // ============================================

  async uploadMedia(file: UploadedFile, userId: string, metadata?: {
    alt?: string;
    caption?: string;
    tags?: string[];
  }) {
    // Validate file type
    const isImage = ALLOWED_IMAGE_TYPES.includes(file.mimetype);
    const isPdf = file.mimetype === ALLOWED_PDF_TYPE;

    if (!isImage && !isPdf) {
      throw new BadRequestException(
        `Otillåten filtyp. Tillåtna typer: ${[...ALLOWED_IMAGE_TYPES, ALLOWED_PDF_TYPE].join(', ')}`,
      );
    }

    // Validate file size
    if (isImage && file.size > MAX_IMAGE_SIZE) {
      throw new BadRequestException('Bilden får inte vara större än 10 MB');
    }
    if (isPdf && file.size > MAX_PDF_SIZE) {
      throw new BadRequestException('PDF:en får inte vara större än 50 MB');
    }

    // Get image dimensions if applicable
    let width: number | undefined;
    let height: number | undefined;
    let thumbnailUrl: string | undefined;

    if (isImage) {
      try {
        const imageMetadata = await sharp(file.buffer).metadata();
        width = imageMetadata.width;
        height = imageMetadata.height;

        // Generate thumbnail (300px wide)
        const thumbnailBuffer = await sharp(file.buffer)
          .resize(300, null, { withoutEnlargement: true })
          .jpeg({ quality: 80 })
          .toBuffer();

        const thumbnailResult = await this.r2Service.uploadFile(
          thumbnailBuffer,
          `thumb_${file.originalname.replace(/\.[^.]+$/, '.jpg')}`,
          'image/jpeg',
          'thumbnails',
        );
        thumbnailUrl = thumbnailResult.url;
      } catch (error) {
        this.logger.warn(`Could not process image metadata: ${error.message}`);
      }
    }

    // Upload to R2
    const folder = isImage ? 'images' : 'documents';
    const uploadResult = await this.r2Service.uploadFile(
      file.buffer,
      file.originalname,
      file.mimetype,
      folder,
    );

    // Sanitize filename
    const sanitizedFilename = this.sanitizeFilename(file.originalname);

    // Create database record
    const mediaAsset = await this.prisma.mediaAsset.create({
      data: {
        filename: sanitizedFilename,
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        type: isImage ? 'IMAGE' : 'PDF',
        r2Key: uploadResult.key,
        r2Bucket: uploadResult.bucket,
        url: uploadResult.url,
        thumbnailUrl,
        width,
        height,
        alt: metadata?.alt,
        caption: metadata?.caption,
        tags: metadata?.tags || [],
        uploadedById: userId,
      },
    });

    await this.auditService.log({
      userId,
      action: 'CREATE',
      entityType: 'MediaAsset',
      entityId: mediaAsset.id,
      details: { filename: sanitizedFilename, type: mediaAsset.type },
    });

    return mediaAsset;
  }

  // ============================================
  // EMBEDDED VIDEO
  // ============================================

  async createEmbeddedVideo(
    data: {
      url: string;
      alt?: string;
      caption?: string;
      tags?: string[];
    },
    userId: string,
  ) {
    const parsed = this.parseVideoUrl(data.url);
    if (!parsed) {
      throw new BadRequestException(
        'Ogiltig video-URL. Endast YouTube och Vimeo stöds.',
      );
    }

    // Generate thumbnail URL based on provider
    let thumbnailUrl: string | undefined;
    if (parsed.provider === 'youtube') {
      thumbnailUrl = `https://img.youtube.com/vi/${parsed.videoId}/hqdefault.jpg`;
    } else if (parsed.provider === 'vimeo') {
      // Vimeo requires API call for thumbnail, skip for now
      thumbnailUrl = undefined;
    }

    const mediaAsset = await this.prisma.mediaAsset.create({
      data: {
        filename: `${parsed.provider}-${parsed.videoId}`,
        originalName: data.url,
        mimeType: 'video/embed',
        size: 0,
        type: 'VIDEO',
        r2Key: `embed/${parsed.provider}/${parsed.videoId}`,
        r2Bucket: 'external',
        url: data.url,
        thumbnailUrl,
        videoProvider: parsed.provider,
        videoId: parsed.videoId,
        alt: data.alt,
        caption: data.caption,
        tags: data.tags || [],
        uploadedById: userId,
      },
    });

    await this.auditService.log({
      userId,
      action: 'CREATE',
      entityType: 'MediaAsset',
      entityId: mediaAsset.id,
      details: { provider: parsed.provider, videoId: parsed.videoId },
    });

    return mediaAsset;
  }

  private parseVideoUrl(url: string): { provider: string; videoId: string } | null {
    // YouTube patterns
    const youtubePatterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    ];

    for (const pattern of youtubePatterns) {
      const match = url.match(pattern);
      if (match) {
        return { provider: 'youtube', videoId: match[1] };
      }
    }

    // Vimeo patterns
    const vimeoPatterns = [
      /vimeo\.com\/(\d+)/,
      /player\.vimeo\.com\/video\/(\d+)/,
    ];

    for (const pattern of vimeoPatterns) {
      const match = url.match(pattern);
      if (match) {
        return { provider: 'vimeo', videoId: match[1] };
      }
    }

    return null;
  }

  // ============================================
  // MEDIA CRUD
  // ============================================

  async findAll(params?: {
    skip?: number;
    take?: number;
    search?: string;
    type?: MediaType;
    uploadedById?: string;
  }) {
    const { skip = 0, take = 50, search, type, uploadedById } = params || {};

    const where: any = {};
    if (type) {
      where.type = type;
    }
    if (uploadedById) {
      where.uploadedById = uploadedById;
    }
    if (search) {
      where.OR = [
        { filename: { contains: search, mode: 'insensitive' } },
        { originalName: { contains: search, mode: 'insensitive' } },
        { alt: { contains: search, mode: 'insensitive' } },
        { caption: { contains: search, mode: 'insensitive' } },
        { tags: { hasSome: [search] } },
      ];
    }

    const [assets, total] = await Promise.all([
      this.prisma.mediaAsset.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          uploadedBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      }),
      this.prisma.mediaAsset.count({ where }),
    ]);

    return { assets, total, skip, take };
  }

  async findOne(id: string) {
    const asset = await this.prisma.mediaAsset.findUnique({
      where: { id },
      include: {
        uploadedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!asset) {
      throw new NotFoundException('Media-filen hittades inte');
    }

    return asset;
  }

  async update(
    id: string,
    data: {
      alt?: string;
      caption?: string;
      tags?: string[];
    },
    userId: string,
  ) {
    const asset = await this.prisma.mediaAsset.findUnique({ where: { id } });
    if (!asset) {
      throw new NotFoundException('Media-filen hittades inte');
    }

    const updated = await this.prisma.mediaAsset.update({
      where: { id },
      data,
    });

    await this.auditService.log({
      userId,
      action: 'UPDATE',
      entityType: 'MediaAsset',
      entityId: id,
      details: data,
    });

    return updated;
  }

  async delete(id: string, userId: string) {
    const asset = await this.prisma.mediaAsset.findUnique({ where: { id } });
    if (!asset) {
      throw new NotFoundException('Media-filen hittades inte');
    }

    // Delete from R2 (only if not an embed)
    if (asset.type !== 'VIDEO' || !asset.videoProvider) {
      await this.r2Service.deleteFile(asset.r2Key);

      // Delete thumbnail if exists
      if (asset.thumbnailUrl && asset.thumbnailUrl.includes('thumbnails/')) {
        const thumbnailKey = asset.thumbnailUrl.split('/').slice(-4).join('/');
        try {
          await this.r2Service.deleteFile(thumbnailKey);
        } catch (error) {
          this.logger.warn(`Could not delete thumbnail: ${error.message}`);
        }
      }
    }

    await this.prisma.mediaAsset.delete({ where: { id } });

    await this.auditService.log({
      userId,
      action: 'DELETE',
      entityType: 'MediaAsset',
      entityId: id,
      details: { filename: asset.filename },
    });

    return { success: true };
  }

  // ============================================
  // USAGE TRACKING
  // ============================================

  async incrementUsageCount(id: string) {
    await this.prisma.mediaAsset.update({
      where: { id },
      data: { usageCount: { increment: 1 } },
    });
  }

  async decrementUsageCount(id: string) {
    const asset = await this.prisma.mediaAsset.findUnique({ where: { id } });
    if (asset && asset.usageCount > 0) {
      await this.prisma.mediaAsset.update({
        where: { id },
        data: { usageCount: { decrement: 1 } },
      });
    }
  }

  // ============================================
  // HELPERS
  // ============================================

  private sanitizeFilename(filename: string): string {
    return filename
      .replace(/[^a-zA-Z0-9._-]/g, '_')
      .replace(/_{2,}/g, '_')
      .toLowerCase();
  }
}
