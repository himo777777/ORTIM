import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Anthropic from '@anthropic-ai/sdk';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatContext {
  context?: string;
  userProgress?: {
    completedChapters: string[];
    weakTopics: string[];
    currentLevel: number;
  } | null;
}

export interface SummarizeOptions {
  format: 'brief' | 'detailed' | 'bullet_points';
  context?: {
    title: string;
    objectives: string[];
  };
}

export interface ExplainQuestionOptions {
  questionText: string;
  options: { label: string; text: string; isCorrect: boolean }[];
  existingExplanation: string;
  includeRelatedConcepts: boolean;
  chapterContext?: string;
}

@Injectable()
export class ClaudeService implements OnModuleInit {
  private client: Anthropic;
  private readonly logger = new Logger(ClaudeService.name);
  private readonly model: string;
  private readonly maxTokens: number;

  // System prompt for the study assistant
  private readonly systemPrompt = `Du är en medicinsk studieassistent för ORTAC-kursen om ortopedisk traumavård.

REGLER:
1. Svara ENDAST baserat på kursinnehållet som ges som kontext
2. Om frågan är utanför kursen, säg det tydligt: "Denna fråga ligger utanför kursinnehållet"
3. Använd korrekt medicinsk terminologi på svenska
4. Referera till specifika kapitel när möjligt (t.ex. "Som beskrivs i Kapitel 5...")
5. Föreslå följdfrågor för djupare förståelse
6. Var pedagogisk och förklara komplexa koncept steg för steg
7. Om du är osäker, var ärlig med det

TONALITET:
- Professionell men vänlig
- Uppmuntrande vid inlärning
- Tydlig och koncis

FORMAT:
- Använd punktlistor för stegvisa processer
- Fetmarkera viktiga termer
- Bryt ner komplexa svar i sektioner med rubriker`;

  constructor(private config: ConfigService) {
    this.model = this.config.get('AI_MODEL', 'claude-sonnet-4-20250514');
    this.maxTokens = parseInt(this.config.get('AI_MAX_TOKENS', '2048'), 10);
  }

  onModuleInit() {
    const apiKey = this.config.get('ANTHROPIC_API_KEY');
    if (!apiKey) {
      this.logger.warn('ANTHROPIC_API_KEY not set - AI features will be disabled');
      return;
    }

    this.client = new Anthropic({
      apiKey,
    });
    this.logger.log(`Claude service initialized with model: ${this.model}`);
  }

  /**
   * Check if the service is available
   */
  isAvailable(): boolean {
    return !!this.client;
  }

  /**
   * Send a chat message and get a response
   */
  async chat(
    messages: ChatMessage[],
    context: ChatContext,
  ): Promise<{ content: string; tokensUsed: number }> {
    if (!this.client) {
      throw new Error('Claude service not initialized - ANTHROPIC_API_KEY not set');
    }

    const systemPrompt = this.buildSystemPrompt(context);

    try {
      const response = await this.client.messages.create({
        model: this.model,
        max_tokens: this.maxTokens,
        system: systemPrompt,
        messages: messages.map((m) => ({
          role: m.role,
          content: m.content,
        })),
      });

      const contentBlock = response.content[0];
      const content = contentBlock.type === 'text' ? contentBlock.text : '';
      const tokensUsed = response.usage.input_tokens + response.usage.output_tokens;

      return { content, tokensUsed };
    } catch (error) {
      this.logger.error('Claude API error:', error);
      throw new Error(`AI service error: ${error.message}`);
    }
  }

  /**
   * Stream a chat response
   */
  async *streamChat(
    messages: ChatMessage[],
    context: ChatContext,
  ): AsyncGenerator<{ type: 'content' | 'usage'; data?: string; tokensUsed?: number }> {
    if (!this.client) {
      throw new Error('Claude service not initialized - ANTHROPIC_API_KEY not set');
    }

    const systemPrompt = this.buildSystemPrompt(context);

    try {
      const stream = await this.client.messages.stream({
        model: this.model,
        max_tokens: this.maxTokens,
        system: systemPrompt,
        messages: messages.map((m) => ({
          role: m.role,
          content: m.content,
        })),
      });

      for await (const event of stream) {
        if (
          event.type === 'content_block_delta' &&
          event.delta.type === 'text_delta'
        ) {
          yield { type: 'content', data: event.delta.text };
        }
      }

      // Get final message for usage stats
      const finalMessage = await stream.finalMessage();
      yield {
        type: 'usage',
        tokensUsed: finalMessage.usage.input_tokens + finalMessage.usage.output_tokens,
      };
    } catch (error) {
      this.logger.error('Claude streaming error:', error);
      throw new Error(`AI service error: ${error.message}`);
    }
  }

  /**
   * Summarize chapter content
   */
  async summarize(
    content: string,
    options: SummarizeOptions,
  ): Promise<{ summary: string; keyPoints: string[] }> {
    if (!this.client) {
      throw new Error('Claude service not initialized');
    }

    const formatInstructions = {
      brief: 'Ge en kort sammanfattning på max 3 meningar.',
      detailed: 'Ge en detaljerad sammanfattning med alla viktiga koncept förklarade.',
      bullet_points: 'Sammanfatta i punktform med max 10 punkter.',
    };

    const prompt = `Sammanfatta följande kapitelinnehåll från ORTAC-kursen.

${options.context ? `Kapitel: ${options.context.title}` : ''}
${options.context?.objectives?.length ? `Lärandemål:\n${options.context.objectives.map((o, i) => `${i + 1}. ${o}`).join('\n')}` : ''}

${formatInstructions[options.format]}

INNEHÅLL:
${content.slice(0, 15000)}

Svara i följande JSON-format:
{
  "summary": "Din sammanfattning här",
  "keyPoints": ["Nyckelbegrepp 1", "Nyckelbegrepp 2", ...]
}`;

    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: this.maxTokens,
      messages: [{ role: 'user', content: prompt }],
    });

    const contentBlock = response.content[0];
    const text = contentBlock.type === 'text' ? contentBlock.text : '';

    try {
      // Try to parse JSON response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch {
      // Fallback to raw text
    }

    return {
      summary: text,
      keyPoints: [],
    };
  }

  /**
   * Explain a quiz question in detail
   */
  async explainQuestion(
    options: ExplainQuestionOptions,
  ): Promise<{
    explanation: string;
    correctAnswer: string;
    whyOthersWrong: { option: string; reason: string }[];
    relatedConcepts?: string[];
  }> {
    if (!this.client) {
      throw new Error('Claude service not initialized');
    }

    const optionsText = options.options
      .map((o) => `${o.label}. ${o.text}${o.isCorrect ? ' (RÄTT SVAR)' : ''}`)
      .join('\n');

    const prompt = `Förklara denna quizfråga från ORTAC-kursen om ortopedisk traumavård.

FRÅGA: ${options.questionText}

SVARSALTERNATIV:
${optionsText}

${options.chapterContext ? `KAPITELKONTEXT: ${options.chapterContext}` : ''}

BEFINTLIG FÖRKLARING: ${options.existingExplanation}

Ge en pedagogisk förklaring som hjälper studenten förstå:
1. Varför det rätta svaret är korrekt
2. Varför de andra alternativen är fel
${options.includeRelatedConcepts ? '3. Relaterade koncept att studera vidare' : ''}

Svara i JSON-format:
{
  "explanation": "Detaljerad förklaring av konceptet",
  "correctAnswer": "Det rätta svarsalternativet",
  "whyOthersWrong": [
    {"option": "A", "reason": "Varför detta är fel"}
  ],
  "relatedConcepts": ["Koncept 1", "Koncept 2"]
}`;

    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: this.maxTokens,
      messages: [{ role: 'user', content: prompt }],
    });

    const contentBlock = response.content[0];
    const text = contentBlock.type === 'text' ? contentBlock.text : '';

    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch {
      // Fallback
    }

    return {
      explanation: text,
      correctAnswer: options.options.find((o) => o.isCorrect)?.label || '',
      whyOthersWrong: [],
    };
  }

  /**
   * Build the system prompt with context
   */
  private buildSystemPrompt(context: ChatContext): string {
    let prompt = this.systemPrompt;

    if (context.context) {
      prompt += `\n\nKONTEXT FRÅN KURSMATERIAL:\n${context.context}`;
    }

    if (context.userProgress) {
      prompt += `\n\nANVÄNDARINFORMATION:
- Nuvarande nivå: ${context.userProgress.currentLevel}
- Avklarade kapitel: ${context.userProgress.completedChapters.length} st
- Områden att fokusera på: ${context.userProgress.weakTopics.join(', ') || 'Inga identifierade'}`;
    }

    return prompt;
  }
}
