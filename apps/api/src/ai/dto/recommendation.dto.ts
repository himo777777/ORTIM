import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RecommendationDto {
  @ApiProperty({ example: 'chapter_review' })
  type: 'chapter_review' | 'quiz_practice' | 'spaced_repetition' | 'new_content' | 'weakness_focus';

  @ApiProperty({ example: 'Repetera Kapitel 5: Höftfrakturer' })
  title: string;

  @ApiProperty({ example: 'Du hade svårt med frågorna om höftfrakturer. Läs igenom kapitlet igen.' })
  description: string;

  @ApiProperty({ example: 'chapter_5' })
  contentId: string;

  @ApiProperty({ example: 'chapter' })
  contentType: 'chapter' | 'quiz' | 'question';

  @ApiProperty({ example: 0.85 })
  priority: number; // 0-1, högre = viktigare

  @ApiPropertyOptional({ example: 15 })
  estimatedMinutes?: number;

  @ApiPropertyOptional()
  metadata?: {
    lastAttemptScore?: number;
    daysAgo?: number;
    reviewCount?: number;
  };
}

export class RecommendationsResponseDto {
  @ApiProperty({ type: [RecommendationDto] })
  recommendations: RecommendationDto[];

  @ApiProperty()
  generatedAt: Date;

  @ApiPropertyOptional()
  learningProfile?: {
    strongTopics: string[];
    weakTopics: string[];
    preferredStudyTime?: string;
    averageSessionMinutes?: number;
    learningStyle?: string;
  };
}

export class LearningProfileDto {
  @ApiProperty()
  userId: string;

  @ApiProperty({ type: [String] })
  weakTopics: string[];

  @ApiProperty({ type: [String] })
  strongTopics: string[];

  @ApiPropertyOptional()
  preferredTimes?: string[];

  @ApiPropertyOptional()
  averageSession?: number;

  @ApiPropertyOptional({ example: 'visual', enum: ['visual', 'reading', 'practice'] })
  learningStyle?: 'visual' | 'reading' | 'practice';

  @ApiProperty()
  updatedAt: Date;
}
