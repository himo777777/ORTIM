import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsEnum,
  MaxLength,
  MinLength,
  IsNotEmpty,
  Matches,
} from 'class-validator';
import { Transform } from 'class-transformer';

// Maximum message length to prevent abuse (approximately 2000 words)
const MAX_MESSAGE_LENGTH = 10000;
// Minimum message length to prevent empty queries
const MIN_MESSAGE_LENGTH = 1;
// ID pattern for validation
const ID_PATTERN = /^[a-zA-Z0-9_-]+$/;

export class ChatMessageDto {
  @ApiProperty({ example: 'user', enum: ['user', 'assistant'] })
  @IsEnum(['user', 'assistant'])
  role: 'user' | 'assistant';

  @ApiProperty({ example: 'Vad är de vanligaste komplikationerna vid höftfraktur?' })
  @IsString()
  @MaxLength(MAX_MESSAGE_LENGTH, { message: 'Meddelandet är för långt (max 10000 tecken)' })
  content: string;
}

export class SendChatMessageDto {
  @ApiProperty({
    example: 'Vad är de vanligaste komplikationerna vid höftfraktur?',
    description: 'The chat message content',
    maxLength: MAX_MESSAGE_LENGTH,
    minLength: MIN_MESSAGE_LENGTH,
  })
  @IsString()
  @IsNotEmpty({ message: 'Meddelandet kan inte vara tomt' })
  @MinLength(MIN_MESSAGE_LENGTH, { message: 'Meddelandet måste ha minst 1 tecken' })
  @MaxLength(MAX_MESSAGE_LENGTH, { message: 'Meddelandet är för långt (max 10000 tecken)' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  message: string;

  @ApiPropertyOptional({ example: 'conv_abc123' })
  @IsOptional()
  @IsString()
  @MaxLength(100, { message: 'Ogiltigt konversations-ID' })
  @Matches(ID_PATTERN, { message: 'Ogiltigt format på konversations-ID' })
  conversationId?: string;

  @ApiPropertyOptional({ example: 'chapter_xyz' })
  @IsOptional()
  @IsString()
  @MaxLength(100, { message: 'Ogiltigt kapitel-ID' })
  @Matches(ID_PATTERN, { message: 'Ogiltigt format på kapitel-ID' })
  contextChapterId?: string;
}

export class ChatResponseDto {
  @ApiProperty()
  conversationId: string;

  @ApiProperty()
  messageId: string;

  @ApiProperty()
  content: string;

  @ApiPropertyOptional()
  sourcesUsed?: {
    type: string;
    id: string;
    title: string;
    relevance: number;
  }[];

  @ApiPropertyOptional()
  tokensUsed?: number;
}

export class ConversationDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  title: string | null;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty({ type: [ChatMessageDto] })
  messages?: ChatMessageDto[];
}

export class SummarizeRequestDto {
  @ApiPropertyOptional({ example: 'brief', enum: ['brief', 'detailed', 'bullet_points'] })
  @IsOptional()
  @IsEnum(['brief', 'detailed', 'bullet_points'])
  format?: 'brief' | 'detailed' | 'bullet_points';
}

export class ExplainQuestionDto {
  @ApiPropertyOptional({ example: true })
  @IsOptional()
  includeRelatedConcepts?: boolean;
}
