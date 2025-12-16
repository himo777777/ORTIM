// ===========================================
// B-ORTIM Shared Constants
// ===========================================

// Application Info
export const APP_NAME = 'B-ORTIM';
export const APP_FULL_NAME = 'Basic Orthopaedic Resuscitation and Trauma Initial Management';
export const APP_VERSION = '1.0.0';

// Course Configuration
export const COURSE_CODE = 'B-ORTIM-2025';
export const PASSING_SCORE = 70; // percentage
export const CERTIFICATE_VALIDITY_YEARS = 4;
export const ESTIMATED_COURSE_HOURS = 16;

// Quiz Configuration
export const EXAM_QUESTION_COUNT = 60;
export const EXAM_TIME_LIMIT_MINUTES = 60;
export const PRACTICE_DEFAULT_QUESTION_COUNT = 10;
export const CHAPTER_QUIZ_QUESTION_COUNT = 10;

// Spaced Repetition (SM-2) Configuration
export const SM2_INITIAL_EASE_FACTOR = 2.5;
export const SM2_MIN_EASE_FACTOR = 1.3;
export const SM2_INITIAL_INTERVAL = 1; // days

// BankID Configuration
export const BANKID_POLL_INTERVAL_MS = 2000;
export const BANKID_TIMEOUT_MS = 120000; // 2 minutes

// JWT Configuration
export const JWT_ACCESS_EXPIRY = '15m';
export const JWT_REFRESH_EXPIRY = '7d';

// Cache Configuration
export const CACHE_TTL_CHAPTERS = 7 * 24 * 60 * 60 * 1000; // 7 days
export const CACHE_TTL_ALGORITHMS = 30 * 24 * 60 * 60 * 1000; // 30 days
export const CACHE_TTL_API = 24 * 60 * 60 * 1000; // 24 hours

// OSCE Stations
export const OSCE_STATIONS = [
  { number: 1, name: 'Tourniquet-applikation', description: 'Korrekt applicering av turniquet vid massiv blödning' },
  { number: 2, name: 'ABI-mätning', description: 'Mätning av ankel-brachialindex för kärlbedömning' },
  { number: 3, name: 'Bäckenbälte-applicering', description: 'Korrekt placering av bäckenstabiliserande bälte' },
  { number: 4, name: 'Passiv töjningstest', description: 'Bedömning av kompartmentsyndrom genom passiv töjning' },
  { number: 5, name: 'LIMB-bedömning', description: 'Systematisk bedömning enligt LIMB-protokollet' },
  { number: 6, name: 'SBAR-kommunikation', description: 'Strukturerad överrapportering med SBAR' },
] as const;

// Chapter Structure (17 chapters in 3 parts)
export const COURSE_STRUCTURE = {
  parts: [
    {
      number: 1,
      title: 'Del I – Principer och systematik',
      chapters: [
        { number: 1, title: 'Introduktion – Varför B-ORTIM?', slug: 'introduktion' },
        { number: 2, title: 'Den ortopediska primärundersökningen', slug: 'primarundersokning' },
        { number: 3, title: 'Extremitetsskador och prioritering', slug: 'prioritering' },
      ],
    },
    {
      number: 2,
      title: 'Del II – Specifika tillstånd',
      chapters: [
        { number: 4, title: 'Massiv blödning från extremitet', slug: 'massiv-blodning' },
        { number: 5, title: 'Arteriella kärlskador', slug: 'karlskador' },
        { number: 6, title: 'Kompartmentsyndrom', slug: 'kompartmentsyndrom' },
        { number: 7, title: 'Öppna frakturer', slug: 'oppna-frakturer' },
        { number: 8, title: 'Bäckenringskador', slug: 'backenringskador' },
        { number: 9, title: 'Amputationsskador', slug: 'amputationer' },
        { number: 10, title: 'Extremitetstrauma hos barn', slug: 'barn' },
        { number: 11, title: 'Crush syndrome', slug: 'crush-syndrome' },
        { number: 12, title: 'Speciella populationer', slug: 'speciella-populationer' },
      ],
    },
    {
      number: 3,
      title: 'Del III – Praktisk tillämpning',
      chapters: [
        { number: 13, title: 'Damage Control Orthopaedics', slug: 'damage-control' },
        { number: 14, title: 'Transport och överflyttning', slug: 'transport' },
        { number: 15, title: 'Dokumentation och juridik', slug: 'dokumentation' },
        { number: 16, title: 'Teamarbete och kommunikation', slug: 'teamarbete' },
        { number: 17, title: 'Fallbaserad examination', slug: 'examination' },
      ],
    },
  ],
} as const;

// Bloom's Taxonomy Levels
export const BLOOM_LEVELS = {
  KNOWLEDGE: { label: 'Kunskap', shortLabel: 'K', color: 'blue' },
  COMPREHENSION: { label: 'Förståelse', shortLabel: 'C', color: 'green' },
  APPLICATION: { label: 'Tillämpning', shortLabel: 'Ap', color: 'yellow' },
  ANALYSIS: { label: 'Analys', shortLabel: 'An', color: 'orange' },
  SYNTHESIS: { label: 'Syntes', shortLabel: 'S', color: 'red' },
} as const;

// Certificate Number Format
export const CERTIFICATE_NUMBER_PREFIX = 'B-ORTIM';

// API Routes
export const API_ROUTES = {
  // Auth
  AUTH_BANKID_INITIATE: '/auth/bankid/initiate',
  AUTH_BANKID_POLL: '/auth/bankid/poll',
  AUTH_REFRESH: '/auth/refresh',
  AUTH_LOGOUT: '/auth/logout',
  AUTH_ME: '/auth/me',

  // Courses
  COURSES: '/courses',
  CHAPTERS: '/chapters',
  ALGORITHMS: '/algorithms',

  // Quiz
  QUIZ_START: '/quiz/start',
  QUIZ_ANSWER: '/quiz/:attemptId/answer',
  QUIZ_COMPLETE: '/quiz/:attemptId/complete',
  QUIZ_HISTORY: '/quiz/history',

  // Exam
  EXAM_START: '/exam/start',
  EXAM_SUBMIT: '/exam/:attemptId/submit',
  EXAM_RESULTS: '/exam/results/:attemptId',

  // Review (Spaced Repetition)
  REVIEW_DUE: '/review/due',
  REVIEW_GRADE: '/review/:cardId/grade',

  // Progress
  PROGRESS: '/progress',
  PROGRESS_SYNC: '/progress/sync',

  // Certificates
  CERTIFICATES: '/certificates',
  VERIFY_CERTIFICATE: '/verify/:code',

  // Content (Offline Sync)
  CONTENT_MANIFEST: '/content/manifest',
  CONTENT_UPDATES: '/content/updates',

  // Instructor
  INSTRUCTOR_COHORTS: '/instructor/cohorts',
  INSTRUCTOR_STATS: '/instructor/cohorts/:id/stats',
  INSTRUCTOR_EXPORT: '/instructor/cohorts/:id/export',
  INSTRUCTOR_OSCE: '/instructor/osce',

  // Admin
  ADMIN_USERS: '/admin/users',
  ADMIN_STATS: '/admin/stats',
} as const;

// Error Codes
export const ERROR_CODES = {
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  BANKID_ERROR: 'BANKID_ERROR',
  BANKID_TIMEOUT: 'BANKID_TIMEOUT',
  EXAM_ALREADY_TAKEN: 'EXAM_ALREADY_TAKEN',
  EXAM_TIME_EXPIRED: 'EXAM_TIME_EXPIRED',
  SYNC_CONFLICT: 'SYNC_CONFLICT',
} as const;

// PWA Configuration
export const PWA_CONFIG = {
  name: APP_NAME,
  shortName: APP_NAME,
  description: APP_FULL_NAME,
  themeColor: '#1a5276',
  backgroundColor: '#ffffff',
  display: 'standalone' as const,
  startUrl: '/',
};

// Local Storage Keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'bortim_auth_token',
  REFRESH_TOKEN: 'bortim_refresh_token',
  USER: 'bortim_user',
  THEME: 'bortim_theme',
  LAST_SYNC: 'bortim_last_sync',
};

// IndexedDB Configuration
export const IDB_CONFIG = {
  name: 'bortim',
  version: 1,
  stores: {
    chapters: 'id, slug, version',
    questions: 'id, questionCode, chapterId, bloomLevel',
    progress: 'id, chapterId, syncStatus',
    quizAttempts: 'id, type, chapterId, syncStatus, completedAt',
    reviewCards: 'id, questionId, nextReviewAt, syncStatus',
    syncQueue: 'id, type, createdAt',
  },
};
