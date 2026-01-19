import { Module } from '@nestjs/common';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { ClaudeService } from './claude.service';
import { RagService } from './rag.service';
import { EmbeddingsService } from './embeddings.service';
import { RecommendationsService } from './recommendations.service';
import { AiRateLimitGuard } from './ai-rate-limit.guard';

@Module({
  controllers: [AiController],
  providers: [
    AiService,
    ClaudeService,
    RagService,
    EmbeddingsService,
    RecommendationsService,
    AiRateLimitGuard,
  ],
  exports: [AiService, ClaudeService, RecommendationsService],
})
export class AiModule {}
