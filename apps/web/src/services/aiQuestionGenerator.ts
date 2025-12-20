/**
 * AI Question Generator Service
 *
 * Generates practice questions based on:
 * - User's learning patterns
 * - Knowledge gaps
 * - Spaced repetition schedule
 * - Bloom's taxonomy levels
 */

import { LearningPattern, KnowledgeGap } from '@/stores/aiLearningStore';

export interface GeneratedQuestion {
  id: string;
  type: 'multiple_choice' | 'true_false' | 'fill_blank' | 'matching';
  bloomLevel: number;
  difficulty: 'easy' | 'medium' | 'hard';
  questionText: string;
  options?: { id: string; text: string; isCorrect: boolean }[];
  correctAnswer?: string;
  explanation: string;
  relatedChapterId: string;
  tags: string[];
}

export interface QuestionGenerationConfig {
  chapterId: string;
  count: number;
  targetDifficulty?: 'easy' | 'medium' | 'hard' | 'adaptive';
  bloomLevels?: number[];
  focusOnWeakAreas?: boolean;
  includeReviewCards?: boolean;
}

// Question templates for different Bloom levels
const QUESTION_TEMPLATES = {
  // Level 1: Knowledge/Remember
  1: [
    'Vad är definitionen av {concept}?',
    'Vilken av följande beskriver {concept} korrekt?',
    'Vad kallas {description}?',
    'Vilket påstående om {concept} är sant?',
  ],
  // Level 2: Comprehension/Understand
  2: [
    'Förklara varför {concept} är viktigt.',
    'Vad är skillnaden mellan {conceptA} och {conceptB}?',
    'Hur kan du sammanfatta {concept}?',
    'Vilket exempel illustrerar {concept} bäst?',
  ],
  // Level 3: Application/Apply
  3: [
    'I detta scenario, hur skulle du tillämpa {concept}?',
    'Givet {scenario}, vad är nästa steg?',
    'Hur skulle du använda {concept} för att lösa {problem}?',
    'Vilket tillvägagångssätt passar bäst för {scenario}?',
  ],
  // Level 4: Analysis/Analyze
  4: [
    'Analysera sambandet mellan {conceptA} och {conceptB}.',
    'Vilka faktorer påverkar {concept}?',
    'Identifiera problemet i följande scenario: {scenario}',
    'Vad orsakar {effect} i detta fall?',
  ],
  // Level 5: Synthesis/Evaluate
  5: [
    'Utvärdera effektiviteten av {approach}.',
    'Jämför och bedöm {optionA} mot {optionB}.',
    'Vilken slutsats kan dras från {evidence}?',
    'Bedöm rimligheten i påståendet: {claim}',
  ],
  // Level 6: Evaluation/Create
  6: [
    'Designa en lösning för {problem}.',
    'Hur skulle du förbättra {process}?',
    'Skapa en strategi för att hantera {challenge}.',
    'Föreslå ett nytt tillvägagångssätt för {situation}.',
  ],
};

// Difficulty modifiers
const DIFFICULTY_CONFIG = {
  easy: {
    bloomLevels: [1, 2],
    distractorSimilarity: 'low',
    timeAllowed: 60,
  },
  medium: {
    bloomLevels: [2, 3, 4],
    distractorSimilarity: 'medium',
    timeAllowed: 90,
  },
  hard: {
    bloomLevels: [4, 5, 6],
    distractorSimilarity: 'high',
    timeAllowed: 120,
  },
};

export class AIQuestionGenerator {
  private learningPatterns: LearningPattern[];
  private knowledgeGaps: KnowledgeGap[];

  constructor(learningPatterns: LearningPattern[], knowledgeGaps: KnowledgeGap[]) {
    this.learningPatterns = learningPatterns;
    this.knowledgeGaps = knowledgeGaps;
  }

  /**
   * Determine optimal difficulty based on user's performance
   */
  getAdaptiveDifficulty(chapterId: string): 'easy' | 'medium' | 'hard' {
    const patterns = this.learningPatterns.filter(p => p.chapterId === chapterId);

    if (patterns.length < 3) {
      return 'medium'; // Default for new users
    }

    const recentPatterns = patterns
      .sort((a, b) => new Date(b.lastAttempted).getTime() - new Date(a.lastAttempted).getTime())
      .slice(0, 5);

    const avgSuccessRate = recentPatterns.reduce((sum, p) =>
      sum + (p.correctAttempts / p.attempts), 0) / recentPatterns.length;

    if (avgSuccessRate > 0.85) return 'hard';
    if (avgSuccessRate < 0.5) return 'easy';
    return 'medium';
  }

  /**
   * Get recommended Bloom levels based on mastery
   */
  getRecommendedBloomLevels(chapterId: string): number[] {
    const gap = this.knowledgeGaps.find(g => g.chapterId === chapterId);

    if (!gap) {
      return [1, 2, 3]; // Default progression
    }

    if (gap.masteryLevel < 40) {
      return [1, 2]; // Focus on basics
    } else if (gap.masteryLevel < 70) {
      return [2, 3, 4]; // Build application skills
    } else {
      return [4, 5, 6]; // Advanced analysis and synthesis
    }
  }

  /**
   * Generate a set of practice questions
   */
  generateQuestions(config: QuestionGenerationConfig): GeneratedQuestion[] {
    const questions: GeneratedQuestion[] = [];

    const difficulty = config.targetDifficulty === 'adaptive'
      ? this.getAdaptiveDifficulty(config.chapterId)
      : config.targetDifficulty || 'medium';

    const bloomLevels = config.bloomLevels ||
      DIFFICULTY_CONFIG[difficulty].bloomLevels;

    for (let i = 0; i < config.count; i++) {
      // Rotate through Bloom levels
      const bloomLevel = bloomLevels[i % bloomLevels.length];

      const question = this.generateSingleQuestion({
        chapterId: config.chapterId,
        bloomLevel,
        difficulty,
        index: i,
      });

      questions.push(question);
    }

    // If focusing on weak areas, reorder
    if (config.focusOnWeakAreas) {
      return this.prioritizeWeakAreas(questions, config.chapterId);
    }

    return questions;
  }

  /**
   * Generate a single question
   */
  private generateSingleQuestion(params: {
    chapterId: string;
    bloomLevel: number;
    difficulty: 'easy' | 'medium' | 'hard';
    index: number;
  }): GeneratedQuestion {
    const { chapterId, bloomLevel, difficulty, index } = params;

    const templates = QUESTION_TEMPLATES[bloomLevel as keyof typeof QUESTION_TEMPLATES] || QUESTION_TEMPLATES[1];
    const template = templates[index % templates.length];

    // Generate unique ID
    const id = `gen_${Date.now()}_${index}_${Math.random().toString(36).substr(2, 9)}`;

    // Create question with placeholder (would be filled by actual content)
    const question: GeneratedQuestion = {
      id,
      type: 'multiple_choice',
      bloomLevel,
      difficulty,
      questionText: template
        .replace('{concept}', '[koncept]')
        .replace('{conceptA}', '[koncept A]')
        .replace('{conceptB}', '[koncept B]')
        .replace('{scenario}', '[scenario]')
        .replace('{problem}', '[problem]')
        .replace('{description}', '[beskrivning]')
        .replace('{effect}', '[effekt]')
        .replace('{approach}', '[tillvägagångssätt]')
        .replace('{optionA}', '[alternativ A]')
        .replace('{optionB}', '[alternativ B]')
        .replace('{evidence}', '[bevis]')
        .replace('{claim}', '[påstående]')
        .replace('{process}', '[process]')
        .replace('{challenge}', '[utmaning]')
        .replace('{situation}', '[situation]'),
      options: this.generateOptions(difficulty),
      explanation: this.generateExplanation(bloomLevel),
      relatedChapterId: chapterId,
      tags: this.generateTags(bloomLevel, difficulty),
    };

    return question;
  }

  /**
   * Generate answer options based on difficulty
   */
  private generateOptions(difficulty: 'easy' | 'medium' | 'hard'): GeneratedQuestion['options'] {
    const optionCount = difficulty === 'easy' ? 3 : 4;
    const options = [];

    for (let i = 0; i < optionCount; i++) {
      options.push({
        id: `opt_${i}`,
        text: `Alternativ ${String.fromCharCode(65 + i)}`,
        isCorrect: i === 0, // First option is correct (shuffled in practice)
      });
    }

    return options;
  }

  /**
   * Generate explanation based on Bloom level
   */
  private generateExplanation(bloomLevel: number): string {
    const explanations: Record<number, string> = {
      1: 'Detta testar din förmåga att komma ihåg grundläggande fakta och definitioner.',
      2: 'Detta testar din förståelse och förmåga att förklara koncept.',
      3: 'Detta testar din förmåga att tillämpa kunskap i praktiska situationer.',
      4: 'Detta testar din analytiska förmåga och förståelse av samband.',
      5: 'Detta testar din förmåga att utvärdera och bedöma information.',
      6: 'Detta testar din förmåga att skapa nya lösningar och synteser.',
    };

    return explanations[bloomLevel] || explanations[1];
  }

  /**
   * Generate tags for the question
   */
  private generateTags(bloomLevel: number, difficulty: 'easy' | 'medium' | 'hard'): string[] {
    const bloomNames: Record<number, string> = {
      1: 'kunskap',
      2: 'förståelse',
      3: 'tillämpning',
      4: 'analys',
      5: 'syntes',
      6: 'utvärdering',
    };

    return [
      bloomNames[bloomLevel] || 'allmän',
      difficulty,
      'genererad',
    ];
  }

  /**
   * Reorder questions to prioritize weak areas
   */
  private prioritizeWeakAreas(
    questions: GeneratedQuestion[],
    chapterId: string
  ): GeneratedQuestion[] {
    const weakPatterns = this.learningPatterns
      .filter(p => p.chapterId === chapterId && p.correctAttempts / p.attempts < 0.6);

    const weakBloomLevels = new Set(weakPatterns.map(p => p.bloomLevel));

    return questions.sort((a, b) => {
      const aIsWeak = weakBloomLevels.has(a.bloomLevel);
      const bIsWeak = weakBloomLevels.has(b.bloomLevel);

      if (aIsWeak && !bIsWeak) return -1;
      if (!aIsWeak && bIsWeak) return 1;
      return 0;
    });
  }

  /**
   * Get question mix recommendation
   */
  getRecommendedMix(chapterId: string): {
    easy: number;
    medium: number;
    hard: number;
    focusAreas: string[];
  } {
    const gap = this.knowledgeGaps.find(g => g.chapterId === chapterId);

    if (!gap || gap.masteryLevel < 40) {
      return {
        easy: 50,
        medium: 40,
        hard: 10,
        focusAreas: ['Grundläggande begrepp', 'Definitioner'],
      };
    } else if (gap.masteryLevel < 70) {
      return {
        easy: 20,
        medium: 50,
        hard: 30,
        focusAreas: ['Tillämpning', 'Problemlösning'],
      };
    } else {
      return {
        easy: 10,
        medium: 30,
        hard: 60,
        focusAreas: ['Analys', 'Kritiskt tänkande'],
      };
    }
  }
}

/**
 * Factory function to create question generator
 */
export function createQuestionGenerator(
  learningPatterns: LearningPattern[],
  knowledgeGaps: KnowledgeGap[]
): AIQuestionGenerator {
  return new AIQuestionGenerator(learningPatterns, knowledgeGaps);
}
