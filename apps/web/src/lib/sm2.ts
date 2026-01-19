// ===========================================
// SM-2 Spaced Repetition Algorithm
// ===========================================
// Based on the SuperMemo SM-2 algorithm
// https://www.supermemo.com/en/archives1990-2015/english/ol/sm2

import { SM2_INITIAL_EASE_FACTOR, SM2_MIN_EASE_FACTOR, SM2_INITIAL_INTERVAL } from '@ortac/shared';

export interface SM2Card {
  easeFactor: number;
  interval: number; // days
  repetitions: number;
  nextReviewAt: Date;
  lastReviewedAt: Date | null;
}

export interface SM2Result {
  easeFactor: number;
  interval: number;
  repetitions: number;
  nextReviewAt: Date;
}

/**
 * Quality ratings:
 * 0 - Complete blackout, no memory at all
 * 1 - Incorrect, but upon seeing answer, remembered
 * 2 - Incorrect, but answer seemed easy to recall
 * 3 - Correct, but with significant difficulty
 * 4 - Correct, with some hesitation
 * 5 - Correct, perfect response
 */
export type Quality = 0 | 1 | 2 | 3 | 4 | 5;

/**
 * Calculate the next review parameters based on SM-2 algorithm
 */
export function calculateNextReview(
  card: Partial<SM2Card>,
  quality: Quality
): SM2Result {
  let { easeFactor = SM2_INITIAL_EASE_FACTOR, interval = SM2_INITIAL_INTERVAL, repetitions = 0 } =
    card;

  // If quality < 3, reset repetitions (failed recall)
  if (quality < 3) {
    repetitions = 0;
    interval = SM2_INITIAL_INTERVAL;
  } else {
    // Successful recall
    if (repetitions === 0) {
      interval = 1;
    } else if (repetitions === 1) {
      interval = 6;
    } else {
      interval = Math.round(interval * easeFactor);
    }
    repetitions += 1;
  }

  // Update ease factor
  // EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
  const newEaseFactor =
    easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));

  easeFactor = Math.max(SM2_MIN_EASE_FACTOR, newEaseFactor);

  // Calculate next review date
  const nextReviewAt = new Date();
  nextReviewAt.setDate(nextReviewAt.getDate() + interval);

  return {
    easeFactor,
    interval,
    repetitions,
    nextReviewAt,
  };
}

/**
 * Get a human-readable description of when the next review will be
 */
export function getNextReviewText(interval: number): string {
  if (interval === 0) {
    return 'Nu';
  } else if (interval === 1) {
    return 'Imorgon';
  } else if (interval < 7) {
    return `Om ${interval} dagar`;
  } else if (interval < 30) {
    const weeks = Math.round(interval / 7);
    return `Om ${weeks} ${weeks === 1 ? 'vecka' : 'veckor'}`;
  } else if (interval < 365) {
    const months = Math.round(interval / 30);
    return `Om ${months} ${months === 1 ? 'månad' : 'månader'}`;
  } else {
    const years = Math.round(interval / 365);
    return `Om ${years} ${years === 1 ? 'år' : 'år'}`;
  }
}

/**
 * Get quality description in Swedish
 */
export function getQualityDescription(quality: Quality): string {
  const descriptions: Record<Quality, string> = {
    0: 'Total blackout',
    1: 'Fel, men kände igen svaret',
    2: 'Fel, men svaret verkade bekant',
    3: 'Rätt, men svårt',
    4: 'Rätt, lite tveksam',
    5: 'Rätt, perfekt!',
  };
  return descriptions[quality];
}

/**
 * Get color for quality button
 */
export function getQualityColor(quality: Quality): string {
  const colors: Record<Quality, string> = {
    0: 'bg-red-600 hover:bg-red-700',
    1: 'bg-red-500 hover:bg-red-600',
    2: 'bg-orange-500 hover:bg-orange-600',
    3: 'bg-yellow-500 hover:bg-yellow-600',
    4: 'bg-green-500 hover:bg-green-600',
    5: 'bg-green-600 hover:bg-green-700',
  };
  return colors[quality];
}

/**
 * Check if a card is due for review
 */
export function isDue(card: SM2Card): boolean {
  return new Date(card.nextReviewAt) <= new Date();
}

/**
 * Sort cards by urgency (most overdue first)
 */
export function sortByUrgency(cards: SM2Card[]): SM2Card[] {
  const now = new Date().getTime();
  return [...cards].sort((a, b) => {
    const aOverdue = now - new Date(a.nextReviewAt).getTime();
    const bOverdue = now - new Date(b.nextReviewAt).getTime();
    return bOverdue - aOverdue; // Most overdue first
  });
}

/**
 * Create initial card state for a new question
 */
export function createInitialCard(): SM2Card {
  return {
    easeFactor: SM2_INITIAL_EASE_FACTOR,
    interval: SM2_INITIAL_INTERVAL,
    repetitions: 0,
    nextReviewAt: new Date(),
    lastReviewedAt: null,
  };
}

/**
 * Calculate retention rate based on card history
 */
export function calculateRetentionRate(
  totalReviews: number,
  successfulReviews: number
): number {
  if (totalReviews === 0) return 0;
  return Math.round((successfulReviews / totalReviews) * 100);
}

/**
 * Estimate time to review a set of cards (in minutes)
 */
export function estimateReviewTime(cardCount: number): number {
  // Assume ~30 seconds per card on average
  return Math.ceil((cardCount * 30) / 60);
}
