import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Translation resources
const resources = {
  sv: {
    translation: {
      // Common
      common: {
        loading: 'Laddar...',
        error: 'Ett fel uppstod',
        save: 'Spara',
        cancel: 'Avbryt',
        delete: 'Ta bort',
        edit: 'Redigera',
        create: 'Skapa',
        search: 'Sök',
        filter: 'Filtrera',
        all: 'Alla',
        back: 'Tillbaka',
        next: 'Nästa',
        previous: 'Föregående',
        submit: 'Skicka',
        close: 'Stäng',
        yes: 'Ja',
        no: 'Nej',
        or: 'eller',
        and: 'och',
      },

      // Navigation
      nav: {
        home: 'Hem',
        dashboard: 'Dashboard',
        chapters: 'Kapitel',
        algorithms: 'Algoritmer',
        quiz: 'Quiz',
        review: 'Repetition',
        profile: 'Profil',
        settings: 'Inställningar',
        logout: 'Logga ut',
        admin: 'Admin',
        instructor: 'Instruktör',
      },

      // Auth
      auth: {
        login: 'Logga in',
        register: 'Registrera',
        email: 'E-post',
        password: 'Lösenord',
        forgotPassword: 'Glömt lösenord?',
        rememberMe: 'Kom ihåg mig',
        noAccount: 'Har du inget konto?',
        hasAccount: 'Har du redan ett konto?',
      },

      // Dashboard
      dashboard: {
        welcome: 'Välkommen tillbaka',
        progress: 'Din framgång',
        streak: 'Streak',
        days: 'dagar',
        xp: 'XP',
        level: 'Nivå',
        todayGoal: 'Dagens mål',
        weeklyProgress: 'Veckans framsteg',
        recentActivity: 'Senaste aktivitet',
        recommendations: 'Rekommendationer',
        continueStudying: 'Fortsätt studera',
        startQuiz: 'Starta quiz',
      },

      // Study
      study: {
        chapter: 'Kapitel',
        chapters: 'Kapitel',
        algorithm: 'Algoritm',
        algorithms: 'Algoritmer',
        completed: 'Avslutad',
        inProgress: 'Pågående',
        notStarted: 'Ej påbörjad',
        readTime: 'Lästid',
        minutes: 'minuter',
        bookmarks: 'Bokmärken',
        notes: 'Anteckningar',
        addNote: 'Lägg till anteckning',
        addBookmark: 'Lägg till bokmärke',
      },

      // Quiz
      quiz: {
        practice: 'Övning',
        exam: 'Tentamen',
        question: 'Fråga',
        of: 'av',
        correct: 'Rätt',
        incorrect: 'Fel',
        score: 'Resultat',
        timeSpent: 'Tid',
        review: 'Granska svar',
        tryAgain: 'Försök igen',
        nextQuestion: 'Nästa fråga',
        submit: 'Skicka in',
        explanation: 'Förklaring',
      },

      // Gamification
      gamification: {
        achievements: 'Prestationer',
        leaderboard: 'Topplista',
        rank: 'Rankning',
        points: 'Poäng',
        unlocked: 'Upplåst',
        locked: 'Låst',
        progress: 'Framsteg',
        newAchievement: 'Ny prestation!',
        levelUp: 'Nivå upp!',
      },

      // AI Tutor
      aiTutor: {
        title: 'AI-tutor',
        subtitle: 'Din studieassistent',
        placeholder: 'Ställ en fråga...',
        thinking: 'Tänker...',
        history: 'Historik',
        newChat: 'Ny konversation',
        suggestions: 'Förslag',
      },

      // Social
      social: {
        studyGroups: 'Studiegrupper',
        discussions: 'Diskussioner',
        sharedNotes: 'Delade anteckningar',
        members: 'medlemmar',
        online: 'online',
        join: 'Gå med',
        leave: 'Lämna',
        createGroup: 'Skapa grupp',
        privateGroup: 'Privat grupp',
        publicGroup: 'Publik grupp',
        inviteCode: 'Inbjudningskod',
        reply: 'Svara',
        like: 'Gilla',
        share: 'Dela',
        bookmark: 'Spara',
      },

      // Analytics
      analytics: {
        title: 'Analysöversikt',
        studyTime: 'Studietid',
        questionsAnswered: 'Besvarade frågor',
        accuracy: 'Träffsäkerhet',
        improvement: 'Förbättring',
        weakAreas: 'Svaga områden',
        strongAreas: 'Starka områden',
        trends: 'Trender',
        daily: 'Daglig',
        weekly: 'Veckovis',
        monthly: 'Månadsvis',
      },

      // Settings
      settings: {
        title: 'Inställningar',
        language: 'Språk',
        theme: 'Tema',
        dark: 'Mörkt',
        light: 'Ljust',
        system: 'System',
        notifications: 'Notifikationer',
        sound: 'Ljud',
        dailyReminder: 'Daglig påminnelse',
        studyGoal: 'Studiemål',
      },

      // Time
      time: {
        now: 'Nu',
        today: 'Idag',
        yesterday: 'Igår',
        daysAgo: '{{count}} dagar sedan',
        hoursAgo: '{{count}} timmar sedan',
        minutesAgo: '{{count}} minuter sedan',
      },
    },
  },

  en: {
    translation: {
      // Common
      common: {
        loading: 'Loading...',
        error: 'An error occurred',
        save: 'Save',
        cancel: 'Cancel',
        delete: 'Delete',
        edit: 'Edit',
        create: 'Create',
        search: 'Search',
        filter: 'Filter',
        all: 'All',
        back: 'Back',
        next: 'Next',
        previous: 'Previous',
        submit: 'Submit',
        close: 'Close',
        yes: 'Yes',
        no: 'No',
        or: 'or',
        and: 'and',
      },

      // Navigation
      nav: {
        home: 'Home',
        dashboard: 'Dashboard',
        chapters: 'Chapters',
        algorithms: 'Algorithms',
        quiz: 'Quiz',
        review: 'Review',
        profile: 'Profile',
        settings: 'Settings',
        logout: 'Log out',
        admin: 'Admin',
        instructor: 'Instructor',
      },

      // Auth
      auth: {
        login: 'Log in',
        register: 'Register',
        email: 'Email',
        password: 'Password',
        forgotPassword: 'Forgot password?',
        rememberMe: 'Remember me',
        noAccount: "Don't have an account?",
        hasAccount: 'Already have an account?',
      },

      // Dashboard
      dashboard: {
        welcome: 'Welcome back',
        progress: 'Your progress',
        streak: 'Streak',
        days: 'days',
        xp: 'XP',
        level: 'Level',
        todayGoal: "Today's goal",
        weeklyProgress: 'Weekly progress',
        recentActivity: 'Recent activity',
        recommendations: 'Recommendations',
        continueStudying: 'Continue studying',
        startQuiz: 'Start quiz',
      },

      // Study
      study: {
        chapter: 'Chapter',
        chapters: 'Chapters',
        algorithm: 'Algorithm',
        algorithms: 'Algorithms',
        completed: 'Completed',
        inProgress: 'In Progress',
        notStarted: 'Not Started',
        readTime: 'Read time',
        minutes: 'minutes',
        bookmarks: 'Bookmarks',
        notes: 'Notes',
        addNote: 'Add note',
        addBookmark: 'Add bookmark',
      },

      // Quiz
      quiz: {
        practice: 'Practice',
        exam: 'Exam',
        question: 'Question',
        of: 'of',
        correct: 'Correct',
        incorrect: 'Incorrect',
        score: 'Score',
        timeSpent: 'Time',
        review: 'Review answers',
        tryAgain: 'Try again',
        nextQuestion: 'Next question',
        submit: 'Submit',
        explanation: 'Explanation',
      },

      // Gamification
      gamification: {
        achievements: 'Achievements',
        leaderboard: 'Leaderboard',
        rank: 'Rank',
        points: 'Points',
        unlocked: 'Unlocked',
        locked: 'Locked',
        progress: 'Progress',
        newAchievement: 'New achievement!',
        levelUp: 'Level up!',
      },

      // AI Tutor
      aiTutor: {
        title: 'AI Tutor',
        subtitle: 'Your study assistant',
        placeholder: 'Ask a question...',
        thinking: 'Thinking...',
        history: 'History',
        newChat: 'New conversation',
        suggestions: 'Suggestions',
      },

      // Social
      social: {
        studyGroups: 'Study Groups',
        discussions: 'Discussions',
        sharedNotes: 'Shared Notes',
        members: 'members',
        online: 'online',
        join: 'Join',
        leave: 'Leave',
        createGroup: 'Create group',
        privateGroup: 'Private group',
        publicGroup: 'Public group',
        inviteCode: 'Invite code',
        reply: 'Reply',
        like: 'Like',
        share: 'Share',
        bookmark: 'Bookmark',
      },

      // Analytics
      analytics: {
        title: 'Analytics Overview',
        studyTime: 'Study Time',
        questionsAnswered: 'Questions Answered',
        accuracy: 'Accuracy',
        improvement: 'Improvement',
        weakAreas: 'Weak Areas',
        strongAreas: 'Strong Areas',
        trends: 'Trends',
        daily: 'Daily',
        weekly: 'Weekly',
        monthly: 'Monthly',
      },

      // Settings
      settings: {
        title: 'Settings',
        language: 'Language',
        theme: 'Theme',
        dark: 'Dark',
        light: 'Light',
        system: 'System',
        notifications: 'Notifications',
        sound: 'Sound',
        dailyReminder: 'Daily reminder',
        studyGoal: 'Study goal',
      },

      // Time
      time: {
        now: 'Now',
        today: 'Today',
        yesterday: 'Yesterday',
        daysAgo: '{{count}} days ago',
        hoursAgo: '{{count}} hours ago',
        minutesAgo: '{{count}} minutes ago',
      },
    },
  },

  no: {
    translation: {
      // Common
      common: {
        loading: 'Laster...',
        error: 'En feil oppstod',
        save: 'Lagre',
        cancel: 'Avbryt',
        delete: 'Slett',
        edit: 'Rediger',
        create: 'Opprett',
        search: 'Søk',
        filter: 'Filtrer',
        all: 'Alle',
        back: 'Tilbake',
        next: 'Neste',
        previous: 'Forrige',
        submit: 'Send',
        close: 'Lukk',
        yes: 'Ja',
        no: 'Nei',
        or: 'eller',
        and: 'og',
      },

      // Navigation
      nav: {
        home: 'Hjem',
        dashboard: 'Dashbord',
        chapters: 'Kapitler',
        algorithms: 'Algoritmer',
        quiz: 'Quiz',
        review: 'Repetisjon',
        profile: 'Profil',
        settings: 'Innstillinger',
        logout: 'Logg ut',
        admin: 'Admin',
        instructor: 'Instruktør',
      },

      // Auth
      auth: {
        login: 'Logg inn',
        register: 'Registrer',
        email: 'E-post',
        password: 'Passord',
        forgotPassword: 'Glemt passord?',
        rememberMe: 'Husk meg',
        noAccount: 'Har du ingen konto?',
        hasAccount: 'Har du allerede en konto?',
      },

      // Dashboard
      dashboard: {
        welcome: 'Velkommen tilbake',
        progress: 'Din fremgang',
        streak: 'Streak',
        days: 'dager',
        xp: 'XP',
        level: 'Nivå',
        todayGoal: 'Dagens mål',
        weeklyProgress: 'Ukens fremgang',
        recentActivity: 'Nylig aktivitet',
        recommendations: 'Anbefalinger',
        continueStudying: 'Fortsett å studere',
        startQuiz: 'Start quiz',
      },

      // Study
      study: {
        chapter: 'Kapittel',
        chapters: 'Kapitler',
        algorithm: 'Algoritme',
        algorithms: 'Algoritmer',
        completed: 'Fullført',
        inProgress: 'Pågående',
        notStarted: 'Ikke startet',
        readTime: 'Lesetid',
        minutes: 'minutter',
        bookmarks: 'Bokmerker',
        notes: 'Notater',
        addNote: 'Legg til notat',
        addBookmark: 'Legg til bokmerke',
      },

      // Quiz
      quiz: {
        practice: 'Øving',
        exam: 'Eksamen',
        question: 'Spørsmål',
        of: 'av',
        correct: 'Riktig',
        incorrect: 'Feil',
        score: 'Resultat',
        timeSpent: 'Tid',
        review: 'Gjennomgå svar',
        tryAgain: 'Prøv igjen',
        nextQuestion: 'Neste spørsmål',
        submit: 'Send inn',
        explanation: 'Forklaring',
      },

      // Gamification
      gamification: {
        achievements: 'Prestasjoner',
        leaderboard: 'Toppliste',
        rank: 'Rangering',
        points: 'Poeng',
        unlocked: 'Låst opp',
        locked: 'Låst',
        progress: 'Fremgang',
        newAchievement: 'Ny prestasjon!',
        levelUp: 'Nivå opp!',
      },

      // AI Tutor
      aiTutor: {
        title: 'AI-tutor',
        subtitle: 'Din studieassistent',
        placeholder: 'Still et spørsmål...',
        thinking: 'Tenker...',
        history: 'Historikk',
        newChat: 'Ny samtale',
        suggestions: 'Forslag',
      },

      // Social
      social: {
        studyGroups: 'Studiegrupper',
        discussions: 'Diskusjoner',
        sharedNotes: 'Delte notater',
        members: 'medlemmer',
        online: 'online',
        join: 'Bli med',
        leave: 'Forlat',
        createGroup: 'Opprett gruppe',
        privateGroup: 'Privat gruppe',
        publicGroup: 'Offentlig gruppe',
        inviteCode: 'Invitasjonskode',
        reply: 'Svar',
        like: 'Lik',
        share: 'Del',
        bookmark: 'Lagre',
      },

      // Analytics
      analytics: {
        title: 'Analyseoversikt',
        studyTime: 'Studietid',
        questionsAnswered: 'Besvarte spørsmål',
        accuracy: 'Treffsikkerhet',
        improvement: 'Forbedring',
        weakAreas: 'Svake områder',
        strongAreas: 'Sterke områder',
        trends: 'Trender',
        daily: 'Daglig',
        weekly: 'Ukentlig',
        monthly: 'Månedlig',
      },

      // Settings
      settings: {
        title: 'Innstillinger',
        language: 'Språk',
        theme: 'Tema',
        dark: 'Mørk',
        light: 'Lys',
        system: 'System',
        notifications: 'Varsler',
        sound: 'Lyd',
        dailyReminder: 'Daglig påminnelse',
        studyGoal: 'Studiemål',
      },

      // Time
      time: {
        now: 'Nå',
        today: 'I dag',
        yesterday: 'I går',
        daysAgo: '{{count}} dager siden',
        hoursAgo: '{{count}} timer siden',
        minutesAgo: '{{count}} minutter siden',
      },
    },
  },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'sv',
    defaultNS: 'translation',
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
      lookupLocalStorage: 'ortac-language',
    },
  });

export default i18n;

// Helper types for type-safe translations
export type TranslationKeys = keyof typeof resources.sv.translation;
export type SupportedLanguage = 'sv' | 'en' | 'no';

export const SUPPORTED_LANGUAGES: { code: SupportedLanguage; name: string; flag: string }[] = [
  { code: 'sv', name: 'Svenska', flag: '🇸🇪' },
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'no', name: 'Norsk', flag: '🇳🇴' },
];
