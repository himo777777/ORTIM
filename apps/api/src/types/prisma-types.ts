// Prisma type stubs for build compatibility
// These mirror the schema.prisma definitions

export enum UserRole {
  PARTICIPANT = 'PARTICIPANT',
  INSTRUCTOR = 'INSTRUCTOR',
  ADMIN = 'ADMIN',
}

export enum BloomLevel {
  KNOWLEDGE = 'KNOWLEDGE',
  COMPREHENSION = 'COMPREHENSION',
  APPLICATION = 'APPLICATION',
  ANALYSIS = 'ANALYSIS',
  SYNTHESIS = 'SYNTHESIS',
}

export interface User {
  id: string;
  personnummer: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  role: UserRole;
  workplace: string | null;
  speciality: string | null;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt: Date | null;
}

export interface Course {
  id: string;
  code: string;
  name: string;
  fullName: string;
  version: string;
  lipusNumber: string | null;
  lipusValidUntil: Date | null;
  description: string | null;
  estimatedHours: number;
  passingScore: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CoursePart {
  id: string;
  courseId: string;
  partNumber: number;
  title: string;
  description: string | null;
  sortOrder: number;
}

export interface Chapter {
  id: string;
  partId: string;
  chapterNumber: number;
  title: string;
  slug: string;
  content: string;
  contentVersion: number;
  estimatedMinutes: number;
  sortOrder: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface LearningObjective {
  id: string;
  chapterId: string;
  code: string;
  type: string;
  description: string;
  sortOrder: number;
}

export interface Algorithm {
  id: string;
  chapterId: string | null;
  code: string;
  title: string;
  description: string | null;
  svgContent: string;
  version: number;
  isActive: boolean;
}

export interface QuizQuestion {
  id: string;
  chapterId: string | null;
  questionCode: string;
  bloomLevel: BloomLevel;
  questionText: string;
  explanation: string;
  reference: string | null;
  isActive: boolean;
  isExamQuestion: boolean;
  createdAt: Date;
  updatedAt: Date;
  options?: QuizOption[];
}

export interface QuizOption {
  id: string;
  questionId: string;
  optionLabel: string;
  optionText: string;
  isCorrect: boolean;
  sortOrder: number;
}

export interface QuizAttempt {
  id: string;
  userId: string;
  type: string;
  chapterId: string | null;
  cohortId: string | null;
  totalQuestions: number;
  correctAnswers: number;
  score: number;
  passed: boolean | null;
  startedAt: Date;
  completedAt: Date | null;
  timeSpentSeconds: number | null;
  syncedAt: Date | null;
}

export interface QuizAttemptAnswer {
  id: string;
  attemptId: string;
  questionId: string;
  selectedOption: string | null;
  isCorrect: boolean;
  timeSpentSeconds: number | null;
}

export interface SpacedRepetitionCard {
  id: string;
  userId: string;
  questionId: string;
  easeFactor: number;
  interval: number;
  repetitions: number;
  nextReviewAt: Date;
  lastReviewedAt: Date | null;
}

export interface ChapterProgress {
  id: string;
  userId: string;
  chapterId: string;
  startedAt: Date;
  completedAt: Date | null;
  lastAccessedAt: Date;
  readProgress: number;
  quizPassed: boolean;
  bestQuizScore: number | null;
}

export interface Cohort {
  id: string;
  courseId: string;
  instructorId: string;
  name: string;
  description: string | null;
  startDate: Date;
  endDate: Date | null;
  maxParticipants: number | null;
  isActive: boolean;
  createdAt: Date;
}

export interface Enrollment {
  id: string;
  userId: string;
  cohortId: string;
  enrolledAt: Date;
  status: string;
  completedAt: Date | null;
}

export interface OSCEAssessment {
  id: string;
  enrollmentId: string;
  assessorId: string;
  stationNumber: number;
  stationName: string;
  passed: boolean;
  score: number | null;
  comments: string | null;
  assessedAt: Date;
}

export interface Certificate {
  id: string;
  certificateNumber: string;
  userId: string;
  cohortId: string | null;
  courseCode: string;
  courseName: string;
  issuedAt: Date;
  validUntil: Date;
  examScore: number;
  examPassed: boolean;
  oscePassed: boolean | null;
  lipusNumber: string | null;
  verificationUrl: string;
  pdfUrl: string | null;
}

export interface LipusEvaluation {
  id: string;
  userId: string;
  cohortId: string | null;
  overallRating: number;
  wouldRecommend: boolean | null;
  responses: Record<string, unknown>;
  freeTextFeedback: string | null;
  submittedAt: Date;
}
