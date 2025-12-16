// ===========================================
// B-ORTIM Shared Types
// ===========================================

// User & Authentication
export enum UserRole {
  PARTICIPANT = 'PARTICIPANT',
  INSTRUCTOR = 'INSTRUCTOR',
  ADMIN = 'ADMIN',
}

export interface User {
  id: string;
  personnummer: string;
  firstName: string;
  lastName: string;
  email?: string | null;
  phone?: string | null;
  role: UserRole;
  workplace?: string | null;
  speciality?: string | null;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date | null;
}

export interface AuthUser extends Pick<User, 'id' | 'personnummer' | 'firstName' | 'lastName' | 'role'> {}

export interface JwtPayload {
  sub: string; // userId
  personnummer: string;
  role: UserRole;
  iat: number;
  exp: number;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

// BankID
export type BankIDState = 'pending' | 'complete' | 'failed' | 'cancelled';

export interface BankIDInitResponse {
  sessionId: string;
  qrData: string;
  autoStartToken?: string;
}

export interface BankIDPollResponse {
  state: BankIDState;
  token?: string;
  user?: AuthUser;
}

// Course Structure
export interface Course {
  id: string;
  code: string;
  name: string;
  fullName: string;
  version: string;
  lipusNumber?: string | null;
  lipusValidUntil?: Date | null;
  description?: string | null;
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
  description?: string | null;
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

export interface ChapterSummary extends Omit<Chapter, 'content'> {
  learningObjectivesCount: number;
  questionsCount: number;
}

export interface ChapterWithProgress extends ChapterSummary {
  progress?: ChapterProgress | null;
}

export interface LearningObjective {
  id: string;
  chapterId: string;
  code: string;
  type: 'knowledge' | 'skill' | 'competence';
  description: string;
  sortOrder: number;
}

export interface Algorithm {
  id: string;
  chapterId?: string | null;
  code: string;
  title: string;
  description?: string | null;
  svgContent: string;
  version: number;
  isActive: boolean;
}

// Quiz & Examination
export enum BloomLevel {
  KNOWLEDGE = 'KNOWLEDGE',
  COMPREHENSION = 'COMPREHENSION',
  APPLICATION = 'APPLICATION',
  ANALYSIS = 'ANALYSIS',
  SYNTHESIS = 'SYNTHESIS',
}

export interface QuizQuestion {
  id: string;
  chapterId?: string | null;
  questionCode: string;
  bloomLevel: BloomLevel;
  questionText: string;
  explanation: string;
  reference?: string | null;
  isActive: boolean;
  isExamQuestion: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface QuizOption {
  id: string;
  questionId: string;
  optionLabel: string;
  optionText: string;
  isCorrect: boolean;
  sortOrder: number;
}

export interface QuizQuestionWithOptions extends QuizQuestion {
  options: QuizOption[];
}

// For client-side display (hide correct answer)
export interface QuizQuestionClient extends Omit<QuizQuestion, 'explanation'> {
  options: Omit<QuizOption, 'isCorrect'>[];
}

export type QuizType = 'practice' | 'chapter' | 'exam';

export interface QuizAttempt {
  id: string;
  userId: string;
  type: QuizType;
  chapterId?: string | null;
  cohortId?: string | null;
  totalQuestions: number;
  correctAnswers: number;
  score: number;
  passed?: boolean | null;
  startedAt: Date;
  completedAt?: Date | null;
  timeSpentSeconds?: number | null;
  syncedAt?: Date | null;
}

export interface QuizAttemptAnswer {
  id: string;
  attemptId: string;
  questionId: string;
  selectedOption?: string | null;
  isCorrect: boolean;
  timeSpentSeconds?: number | null;
}

export interface QuizStartRequest {
  type: QuizType;
  chapterId?: string;
  count?: number;
}

export interface QuizStartResponse {
  attemptId: string;
  questions: QuizQuestionClient[];
  timeLimit?: number; // seconds, for exam
}

export interface QuizAnswerRequest {
  questionId: string;
  selectedOption: string;
}

export interface QuizAnswerResponse {
  isCorrect: boolean;
  explanation?: string; // Only for practice mode
  correctOption?: string; // Only for practice mode
}

export interface QuizCompleteResponse {
  score: number;
  passed: boolean;
  correctAnswers: number;
  totalQuestions: number;
  timeSpentSeconds: number;
  certificateId?: string; // If exam passed
}

// Spaced Repetition (SM-2)
export interface SpacedRepetitionCard {
  id: string;
  userId: string;
  questionId: string;
  easeFactor: number;
  interval: number;
  repetitions: number;
  nextReviewAt: Date;
  lastReviewedAt?: Date | null;
}

export interface ReviewGradeRequest {
  quality: 0 | 1 | 2 | 3 | 4 | 5;
}

export interface SM2Result {
  easeFactor: number;
  interval: number;
  repetitions: number;
  nextReviewAt: Date;
}

// Progression
export interface ChapterProgress {
  id: string;
  userId: string;
  chapterId: string;
  startedAt: Date;
  completedAt?: Date | null;
  lastAccessedAt: Date;
  readProgress: number; // 0-100
  quizPassed: boolean;
  bestQuizScore?: number | null;
}

export interface UserProgress {
  totalChapters: number;
  completedChapters: number;
  overallProgress: number; // percentage
  examPassed: boolean;
  examScore?: number | null;
  certificateId?: string | null;
}

// Cohorts & Enrollment
export interface Cohort {
  id: string;
  courseId: string;
  instructorId: string;
  name: string;
  description?: string | null;
  startDate: Date;
  endDate?: Date | null;
  maxParticipants?: number | null;
  isActive: boolean;
  createdAt: Date;
}

export interface CohortWithStats extends Cohort {
  participantCount: number;
  completedCount: number;
  averageScore?: number | null;
}

export type EnrollmentStatus = 'active' | 'completed' | 'withdrawn';

export interface Enrollment {
  id: string;
  userId: string;
  cohortId: string;
  enrolledAt: Date;
  status: EnrollmentStatus;
  completedAt?: Date | null;
}

export interface EnrollmentWithUser extends Enrollment {
  user: Pick<User, 'id' | 'firstName' | 'lastName' | 'email' | 'workplace'>;
}

export interface EnrollmentWithProgress extends EnrollmentWithUser {
  progress: UserProgress;
  osceAssessments: OSCEAssessment[];
}

// OSCE Assessment
export interface OSCEAssessment {
  id: string;
  enrollmentId: string;
  assessorId: string;
  stationNumber: number;
  stationName: string;
  passed: boolean;
  score?: number | null;
  comments?: string | null;
  assessedAt: Date;
}

export interface OSCEAssessmentRequest {
  enrollmentId: string;
  stationNumber: number;
  stationName: string;
  passed: boolean;
  score?: number;
  comments?: string;
}

// Certificate
export interface Certificate {
  id: string;
  certificateNumber: string;
  userId: string;
  cohortId?: string | null;
  courseCode: string;
  courseName: string;
  issuedAt: Date;
  validUntil: Date;
  examScore: number;
  examPassed: boolean;
  oscePassed?: boolean | null;
  lipusNumber?: string | null;
  verificationUrl: string;
  pdfUrl?: string | null;
}

export interface CertificateVerification {
  isValid: boolean;
  certificate?: Pick<
    Certificate,
    'certificateNumber' | 'courseName' | 'issuedAt' | 'validUntil' | 'examPassed'
  > & {
    holderName: string;
  };
}

// LIPUS Evaluation
export interface LipusEvaluation {
  id: string;
  userId: string;
  cohortId?: string | null;
  overallRating: number; // 1-5
  wouldRecommend?: boolean | null;
  responses: Record<string, number | string>;
  freeTextFeedback?: string | null;
  submittedAt: Date;
}

export interface LipusEvaluationRequest {
  overallRating: number;
  wouldRecommend: boolean;
  responses: Record<string, number | string>;
  freeTextFeedback?: string;
}

// Content Sync (Offline)
export interface ContentManifest {
  version: string;
  lastUpdated: Date;
  chapters: Array<{
    id: string;
    slug: string;
    version: number;
    updatedAt: Date;
  }>;
  algorithms: Array<{
    id: string;
    code: string;
    version: number;
    updatedAt: Date;
  }>;
  questionsVersion: number;
  questionsUpdatedAt: Date;
}

export interface ContentUpdates {
  chapters: Chapter[];
  algorithms: Algorithm[];
  questions: QuizQuestionWithOptions[];
}

// API Response wrappers
export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface ApiError {
  statusCode: number;
  message: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// Instructor Statistics
export interface CohortStats {
  totalParticipants: number;
  activeParticipants: number;
  completedParticipants: number;
  averageProgress: number;
  averageExamScore?: number | null;
  passRate?: number | null;
  chapterStats: Array<{
    chapterId: string;
    chapterTitle: string;
    completedCount: number;
    averageQuizScore?: number | null;
  }>;
}

// Admin Statistics
export interface SystemStats {
  totalUsers: number;
  totalCohorts: number;
  totalCertificates: number;
  activeParticipants: number;
  averagePassRate: number;
  recentActivity: Array<{
    type: string;
    userId: string;
    userName: string;
    timestamp: Date;
    details: string;
  }>;
}
