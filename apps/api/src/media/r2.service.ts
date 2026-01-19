import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';

export interface UploadResult {
  key: string;
  url: string;
  bucket: string;
}

@Injectable()
export class R2Service {
  private readonly logger = new Logger(R2Service.name);
  private readonly s3Client: S3Client;
  private readonly bucketName: string;
  private readonly publicUrl: string;

  constructor(private configService: ConfigService) {
    const accountId = this.configService.get<string>('R2_ACCOUNT_ID');
    const accessKeyId = this.configService.get<string>('R2_ACCESS_KEY_ID');
    const secretAccessKey = this.configService.get<string>('R2_SECRET_ACCESS_KEY');
    this.bucketName = this.configService.get<string>('R2_BUCKET_NAME', 'ortim-media');
    this.publicUrl = this.configService.get<string>('R2_PUBLIC_URL', '');

    this.s3Client = new S3Client({
      region: 'auto',
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: accessKeyId || '',
        secretAccessKey: secretAccessKey || '',
      },
    });
  }

  /**
   * Upload a file to Cloudflare R2
   */
  async uploadFile(
    file: Buffer,
    originalName: string,
    mimeType: string,
    folder?: string,
  ): Promise<UploadResult> {
    const ext = originalName.split('.').pop() || '';
    const uniqueId = uuidv4();
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');

    // Key structure: folder/year/month/uuid.ext
    const key = folder
      ? `${folder}/${year}/${month}/${uniqueId}.${ext}`
      : `${year}/${month}/${uniqueId}.${ext}`;

    try {
      await this.s3Client.send(
        new PutObjectCommand({
          Bucket: this.bucketName,
          Key: key,
          Body: file,
          ContentType: mimeType,
          CacheControl: 'max-age=31536000', // 1 year cache
        }),
      );

      // Generate URL
      const url = this.publicUrl
        ? `${this.publicUrl}/${key}`
        : await this.getSignedUrl(key);

      this.logger.log(`Uploaded file: ${key}`);

      return {
        key,
        url,
        bucket: this.bucketName,
      };
    } catch (error) {
      this.logger.error(`Failed to upload file: ${error.message}`);
      throw error;
    }
  }

  /**
   * Delete a file from R2
   */
  async deleteFile(key: string): Promise<void> {
    try {
      await this.s3Client.send(
        new DeleteObjectCommand({
          Bucket: this.bucketName,
          Key: key,
        }),
      );
      this.logger.log(`Deleted file: ${key}`);
    } catch (error) {
      this.logger.error(`Failed to delete file: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get a signed URL for private access (15 min expiry)
   */
  async getSignedUrl(key: string, expiresIn = 900): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    });

    return getSignedUrl(this.s3Client, command, { expiresIn });
  }

  /**
   * Generate a presigned URL for direct upload from browser
   */
  async getPresignedUploadUrl(
    filename: string,
    mimeType: string,
    folder?: string,
  ): Promise<{ uploadUrl: string; key: string }> {
    const ext = filename.split('.').pop() || '';
    const uniqueId = uuidv4();
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');

    const key = folder
      ? `${folder}/${year}/${month}/${uniqueId}.${ext}`
      : `${year}/${month}/${uniqueId}.${ext}`;

    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      ContentType: mimeType,
    });

    const uploadUrl = await getSignedUrl(this.s3Client, command, {
      expiresIn: 300, // 5 minutes
    });

    return { uploadUrl, key };
  }

  /**
   * Get the public URL for a key
   */
  getPublicUrl(key: string): string {
    return this.publicUrl ? `${this.publicUrl}/${key}` : '';
  }
}
