import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Spaced Repetition (SM-2 Algorithm) types
export interface ReviewCard {
  id: string;
  questionId: string;
  chapterId: string;
  easeFactor: number; // Starting at 2.5
  interval: number; // Days until next review
  repetitions: number;
  nextReviewDate: string;
  lastReviewDate: string | null;
  lastQuality: number | null; // 0-5 rating
}

// Learning pattern tracking
export interface LearningPattern {
  questionId: string;
  chapterId: string;
  attempts: number;
  correctAttempts: number;
  avgResponseTime: number; // milliseconds
  lastAttempted: string;
  difficulty: 'easy' | 'medium' | 'hard';
  bloomLevel: number;
}

// Study session data
export interface StudySession {
  id: string;
  date: string;
  duration: number; // minutes
  questionsAttempted: number;
  correctAnswers: number;
  chaptersStudied: string[];
  focusScore: number; // 0-100 based on consistency
}

// Personalized recommendation
export interface StudyRecommendation {
  type: 'review' | 'new_content' | 'weakness' | 'strength';
  priority: 'high' | 'medium' | 'low';
  chapterId?: string;
  chapterTitle?: string;
  questionIds?: string[];
  reason: string;
  estimatedTime: number; // minutes
}

// Daily study plan
export interface DailyStudyPlan {
  date: string;
  totalEstimatedTime: number;
  recommendations: StudyRecommendation[];
  reviewCards: ReviewCard[];
  weakAreas: string[];
  strongAreas: string[];
}

// Knowledge gap analysis
export interface KnowledgeGap {
  chapterId: string;
  chapterTitle: string;
  masteryLevel: number; // 0-100
  weakTopics: string[];
  recommendedActions: string[];
}

export interface AILearningState {
  // Review cards (Spaced Repetition)
  reviewCards: ReviewCard[];

  // Learning patterns
  learningPatterns: LearningPattern[];

  // Study sessions history
  studySessions: StudySession[];

  // Current recommendations
  currentPlan: DailyStudyPlan | null;

  // Knowledge gaps
  knowledgeGaps: KnowledgeGap[];

  // Difficulty preference (adaptive)
  preferredDifficulty: 'easy' | 'medium' | 'hard' | 'adaptive';

  // Learning goals
  dailyGoalMinutes: number;
  weeklyGoalQuestions: number;

  // Actions
  addReviewCard: (card: Omit<ReviewCard, 'id' | 'easeFactor' | 'interval' | 'repetitions' | 'nextReviewDate' | 'lastReviewDate' | 'lastQuality'>) => void;
  updateReviewCard: (cardId: string, quality: number) => void;
  getDueReviewCards: () => ReviewCard[];

  recordQuestionAttempt: (data: {
    questionId: string;
    chapterId: string;
    correct: boolean;
    responseTime: number;
    bloomLevel: number;
  }) => void;

  startStudySession: () => string;
  endStudySession: (sessionId: string, data: {
    questionsAttempted: number;
    correctAnswers: number;
    chaptersStudied: string[];
  }) => void;

  generateDailyPlan: (chapters: { id: string; title: string }[]) => DailyStudyPlan;
  analyzeKnowledgeGaps: (chapters: { id: string; title: string }[]) => KnowledgeGap[];

  getAdaptiveDifficulty: (chapterId: string) => 'easy' | 'medium' | 'hard';
  getOptimalQuestionOrder: (questionIds: string[]) => string[];

  setDailyGoal: (minutes: number) => void;
  setWeeklyGoal: (questions: number) => void;
}

// SM-2 Algorithm implementation
function calculateSM2(
  quality: number, // 0-5 (0-2 = fail, 3-5 = pass)
  repetitions: number,
  easeFactor: number,
  interval: number
): { newInterval: number; newEaseFactor: number; newRepetitions: number } {
  let newEaseFactor = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  newEaseFactor = Math.max(1.3, newEaseFactor); // Minimum ease factor

  let newInterval: number;
  let newRepetitions: number;

  if (quality < 3) {
    // Failed - reset
    newRepetitions = 0;
    newInterval = 1;
  } else {
    // Passed
    newRepetitions = repetitions + 1;

    if (repetitions === 0) {
      newInterval = 1;
    } else if (repetitions === 1) {
      newInterval = 6;
    } else {
      newInterval = Math.round(interval * newEaseFactor);
    }
  }

  return { newInterval, newEaseFactor, newRepetitions };
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

export const useAILearningStore = create<AILearningState>()(
  persist(
    (set, get) => ({
      reviewCards: [],
      learningPatterns: [],
      studySessions: [],
      currentPlan: null,
      knowledgeGaps: [],
      preferredDifficulty: 'adaptive',
      dailyGoalMinutes: 30,
      weeklyGoalQuestions: 50,

      addReviewCard: (card) => {
        const id = `review_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const now = new Date();

        set((state) => ({
          reviewCards: [
            ...state.reviewCards.filter(c => c.questionId !== card.questionId),
            {
              ...card,
              id,
              easeFactor: 2.5,
              interval: 0,
              repetitions: 0,
              nextReviewDate: now.toISOString(),
              lastReviewDate: null,
              lastQuality: null,
            }
          ]
        }));
      },

      updateReviewCard: (cardId, quality) => {
        set((state) => {
          const card = state.reviewCards.find(c => c.id === cardId);
          if (!card) return state;

          const { newInterval, newEaseFactor, newRepetitions } = calculateSM2(
            quality,
            card.repetitions,
            card.easeFactor,
            card.interval
          );

          const now = new Date();
          const nextReview = addDays(now, newInterval);

          return {
            reviewCards: state.reviewCards.map(c =>
              c.id === cardId
                ? {
                    ...c,
                    interval: newInterval,
                    easeFactor: newEaseFactor,
                    repetitions: newRepetitions,
                    nextReviewDate: nextReview.toISOString(),
                    lastReviewDate: now.toISOString(),
                    lastQuality: quality,
                  }
                : c
            )
          };
        });
      },

      getDueReviewCards: () => {
        const now = new Date();
        return get().reviewCards.filter(
          card => new Date(card.nextReviewDate) <= now
        ).sort((a, b) =>
          new Date(a.nextReviewDate).getTime() - new Date(b.nextReviewDate).getTime()
        );
      },

      recordQuestionAttempt: (data) => {
        set((state) => {
          const existingPattern = state.learningPatterns.find(
            p => p.questionId === data.questionId
          );

          if (existingPattern) {
            const newAttempts = existingPattern.attempts + 1;
            const newCorrect = existingPattern.correctAttempts + (data.correct ? 1 : 0);
            const successRate = newCorrect / newAttempts;

            // Determine difficulty based on success rate and response time
            let difficulty: 'easy' | 'medium' | 'hard';
            if (successRate > 0.8 && data.responseTime < 30000) {
              difficulty = 'easy';
            } else if (successRate < 0.5 || data.responseTime > 120000) {
              difficulty = 'hard';
            } else {
              difficulty = 'medium';
            }

            return {
              learningPatterns: state.learningPatterns.map(p =>
                p.questionId === data.questionId
                  ? {
                      ...p,
                      attempts: newAttempts,
                      correctAttempts: newCorrect,
                      avgResponseTime: (p.avgResponseTime * p.attempts + data.responseTime) / newAttempts,
                      lastAttempted: new Date().toISOString(),
                      difficulty,
                    }
                  : p
              )
            };
          }

          // New pattern
          return {
            learningPatterns: [
              ...state.learningPatterns,
              {
                questionId: data.questionId,
                chapterId: data.chapterId,
                attempts: 1,
                correctAttempts: data.correct ? 1 : 0,
                avgResponseTime: data.responseTime,
                lastAttempted: new Date().toISOString(),
                difficulty: data.correct ? 'medium' : 'hard',
                bloomLevel: data.bloomLevel,
              }
            ]
          };
        });
      },

      startStudySession: () => {
        const sessionId = `session_${Date.now()}`;
        // Session tracking is handled in endStudySession
        return sessionId;
      },

      endStudySession: (sessionId, data) => {
        set((state) => {
          const now = new Date();
          // Calculate duration based on session ID timestamp
          const startTime = parseInt(sessionId.split('_')[1]);
          const duration = Math.round((now.getTime() - startTime) / 60000);

          // Calculate focus score based on consistency
          const focusScore = data.questionsAttempted > 0
            ? Math.min(100, Math.round((data.correctAnswers / data.questionsAttempted) * 100 * (duration > 5 ? 1 : 0.5)))
            : 0;

          return {
            studySessions: [
              ...state.studySessions,
              {
                id: sessionId,
                date: now.toISOString(),
                duration,
                questionsAttempted: data.questionsAttempted,
                correctAnswers: data.correctAnswers,
                chaptersStudied: data.chaptersStudied,
                focusScore,
              }
            ].slice(-100) // Keep last 100 sessions
          };
        });
      },

      generateDailyPlan: (chapters) => {
        const state = get();
        const now = new Date();
        const recommendations: StudyRecommendation[] = [];

        // 1. Add due review cards
        const dueCards = state.getDueReviewCards();
        if (dueCards.length > 0) {
          recommendations.push({
            type: 'review',
            priority: 'high',
            questionIds: dueCards.slice(0, 10).map(c => c.questionId),
            reason: `Du har ${dueCards.length} kort som behöver repeteras`,
            estimatedTime: Math.ceil(dueCards.slice(0, 10).length * 1.5),
          });
        }

        // 2. Analyze weaknesses
        const chapterPerformance = new Map<string, { correct: number; total: number }>();
        state.learningPatterns.forEach(p => {
          const current = chapterPerformance.get(p.chapterId) || { correct: 0, total: 0 };
          chapterPerformance.set(p.chapterId, {
            correct: current.correct + p.correctAttempts,
            total: current.total + p.attempts,
          });
        });

        // Find weak chapters (< 60% success rate)
        const weakChapters: string[] = [];
        const strongChapters: string[] = [];

        chapterPerformance.forEach((perf, chapterId) => {
          const rate = perf.total > 0 ? perf.correct / perf.total : 0;
          if (rate < 0.6 && perf.total >= 3) {
            weakChapters.push(chapterId);
            const chapter = chapters.find(c => c.id === chapterId);
            if (chapter) {
              recommendations.push({
                type: 'weakness',
                priority: 'high',
                chapterId,
                chapterTitle: chapter.title,
                reason: `Din träffsäkerhet är ${Math.round(rate * 100)}% - behöver förbättring`,
                estimatedTime: 15,
              });
            }
          } else if (rate >= 0.8 && perf.total >= 5) {
            strongChapters.push(chapterId);
          }
        });

        // 3. Suggest new content (chapters not yet studied)
        const studiedChapterIds = new Set(state.learningPatterns.map(p => p.chapterId));
        const newChapters = chapters.filter(c => !studiedChapterIds.has(c.id));

        if (newChapters.length > 0) {
          const nextChapter = newChapters[0];
          recommendations.push({
            type: 'new_content',
            priority: 'medium',
            chapterId: nextChapter.id,
            chapterTitle: nextChapter.title,
            reason: 'Nytt kapitel att utforska',
            estimatedTime: 20,
          });
        }

        // 4. Reinforce strengths occasionally
        if (strongChapters.length > 0 && recommendations.length < 4) {
          const strongChapter = chapters.find(c => strongChapters.includes(c.id));
          if (strongChapter) {
            recommendations.push({
              type: 'strength',
              priority: 'low',
              chapterId: strongChapter.id,
              chapterTitle: strongChapter.title,
              reason: 'Håll dina starka områden aktiva',
              estimatedTime: 10,
            });
          }
        }

        const plan: DailyStudyPlan = {
          date: now.toISOString(),
          totalEstimatedTime: recommendations.reduce((sum, r) => sum + r.estimatedTime, 0),
          recommendations: recommendations.sort((a, b) => {
            const priorityOrder = { high: 0, medium: 1, low: 2 };
            return priorityOrder[a.priority] - priorityOrder[b.priority];
          }),
          reviewCards: dueCards,
          weakAreas: weakChapters,
          strongAreas: strongChapters,
        };

        set({ currentPlan: plan });
        return plan;
      },

      analyzeKnowledgeGaps: (chapters) => {
        const state = get();
        const gaps: KnowledgeGap[] = [];

        chapters.forEach(chapter => {
          const patterns = state.learningPatterns.filter(p => p.chapterId === chapter.id);

          if (patterns.length === 0) {
            gaps.push({
              chapterId: chapter.id,
              chapterTitle: chapter.title,
              masteryLevel: 0,
              weakTopics: ['Inte påbörjad'],
              recommendedActions: ['Börja med grunderna i detta kapitel'],
            });
            return;
          }

          const totalAttempts = patterns.reduce((sum, p) => sum + p.attempts, 0);
          const totalCorrect = patterns.reduce((sum, p) => sum + p.correctAttempts, 0);
          const masteryLevel = Math.round((totalCorrect / totalAttempts) * 100);

          const weakTopics: string[] = [];
          const recommendedActions: string[] = [];

          // Analyze by Bloom level
          const bloomPerformance = new Map<number, { correct: number; total: number }>();
          patterns.forEach(p => {
            const current = bloomPerformance.get(p.bloomLevel) || { correct: 0, total: 0 };
            bloomPerformance.set(p.bloomLevel, {
              correct: current.correct + p.correctAttempts,
              total: current.total + p.attempts,
            });
          });

          bloomPerformance.forEach((perf, level) => {
            const rate = perf.correct / perf.total;
            if (rate < 0.6) {
              const levelName = ['', 'Kunskap', 'Förståelse', 'Tillämpning', 'Analys', 'Syntes', 'Utvärdering'][level] || `Nivå ${level}`;
              weakTopics.push(`${levelName} (${Math.round(rate * 100)}%)`);
              recommendedActions.push(`Öva mer på ${levelName.toLowerCase()}-frågor`);
            }
          });

          // Check for slow response times
          const slowPatterns = patterns.filter(p => p.avgResponseTime > 90000);
          if (slowPatterns.length > patterns.length * 0.3) {
            recommendedActions.push('Öva på att svara snabbare');
          }

          if (masteryLevel < 80) {
            gaps.push({
              chapterId: chapter.id,
              chapterTitle: chapter.title,
              masteryLevel,
              weakTopics: weakTopics.length > 0 ? weakTopics : ['Generell förbättring behövs'],
              recommendedActions: recommendedActions.length > 0 ? recommendedActions : ['Fortsätt öva regelbundet'],
            });
          }
        });

        set({ knowledgeGaps: gaps });
        return gaps.sort((a, b) => a.masteryLevel - b.masteryLevel);
      },

      getAdaptiveDifficulty: (chapterId) => {
        const state = get();

        if (state.preferredDifficulty !== 'adaptive') {
          return state.preferredDifficulty;
        }

        const patterns = state.learningPatterns.filter(p => p.chapterId === chapterId);

        if (patterns.length < 3) {
          return 'medium'; // Not enough data
        }

        const recentPatterns = patterns
          .sort((a, b) => new Date(b.lastAttempted).getTime() - new Date(a.lastAttempted).getTime())
          .slice(0, 5);

        const avgSuccess = recentPatterns.reduce((sum, p) =>
          sum + (p.correctAttempts / p.attempts), 0) / recentPatterns.length;

        if (avgSuccess > 0.85) {
          return 'hard'; // Increase difficulty
        } else if (avgSuccess < 0.5) {
          return 'easy'; // Decrease difficulty
        }
        return 'medium';
      },

      getOptimalQuestionOrder: (questionIds) => {
        const state = get();

        // Sort questions by:
        // 1. Due review cards first
        // 2. Difficult questions (to tackle while fresh)
        // 3. New questions
        // 4. Easy questions last

        const dueCardIds = new Set(state.getDueReviewCards().map(c => c.questionId));

        return [...questionIds].sort((a, b) => {
          const patternA = state.learningPatterns.find(p => p.questionId === a);
          const patternB = state.learningPatterns.find(p => p.questionId === b);

          // Due review cards first
          if (dueCardIds.has(a) && !dueCardIds.has(b)) return -1;
          if (!dueCardIds.has(a) && dueCardIds.has(b)) return 1;

          // Then by difficulty (hard first)
          const difficultyOrder = { hard: 0, medium: 1, easy: 2 };
          const diffA = patternA?.difficulty || 'medium';
          const diffB = patternB?.difficulty || 'medium';

          if (diffA !== diffB) {
            return difficultyOrder[diffA] - difficultyOrder[diffB];
          }

          // New questions before mastered ones
          if (!patternA && patternB) return -1;
          if (patternA && !patternB) return 1;

          return 0;
        });
      },

      setDailyGoal: (minutes) => set({ dailyGoalMinutes: minutes }),
      setWeeklyGoal: (questions) => set({ weeklyGoalQuestions: questions }),
    }),
    {
      name: 'ortac-ai-learning',
    }
  )
);
