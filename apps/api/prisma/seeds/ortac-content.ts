import { readFileSync } from 'fs';
import { join } from 'path';

// ===========================================
// ORTAC Content Parser
// Parses textbook and MCQ bank from markdown files
// ===========================================

interface Chapter {
  partNumber: number;
  chapterNumber: number;
  title: string;
  slug: string;
  content: string;
  estimatedMinutes: number;
}

interface LearningObjective {
  chapterNumber: number;
  code: string;
  type: 'KNOWLEDGE' | 'SKILL' | 'COMPETENCE';
  description: string;
  sortOrder: number;
}

interface QuizOption {
  label: string;
  text: string;
  isCorrect: boolean;
}

interface QuizQuestion {
  chapterNumber: number;
  questionNumber: number;
  questionText: string;
  options: QuizOption[];
  correctAnswer: string;
  explanation: string;
  bloomLevel: 'REMEMBER' | 'UNDERSTAND' | 'APPLY' | 'ANALYZE';
}

// Chapter to Part mapping based on textbook structure
const chapterParts: Record<number, number> = {
  1: 1, 2: 1, 3: 1, 4: 1, 5: 1, 6: 1, // Part 1: Principer
  7: 2, 8: 2, 9: 2, 10: 2, 11: 2, 12: 2, 13: 2, 14: 2, 15: 2, // Part 2: Specifika tillstånd
  16: 3, 17: 3, // Part 3: Praktik
};

// Estimated reading time per chapter (in minutes)
const chapterMinutes: Record<number, number> = {
  1: 20, 2: 30, 3: 25, 4: 25, 5: 30, 6: 35,
  7: 35, 8: 40, 9: 35, 10: 35, 11: 30, 12: 30, 13: 30, 14: 25, 15: 35,
  16: 25, 17: 30,
};

// Chapter titles from ORTAC textbook
const chapterTitles: Record<number, string> = {
  1: 'Introduktion – Varför ORTAC?',
  2: 'LIMB-algoritmen',
  3: 'Primär survey – ATLS möter ortopedi',
  4: 'Sekundär survey – Systematisk extremitetsbedömning',
  5: 'Bilddiagnostik vid akut trauma',
  6: 'Damage Control Orthopedics',
  7: 'Öppen fraktur',
  8: 'Kompartmentsyndrom',
  9: 'Kärlskador vid extremitetstrauma',
  10: 'Bäckenringskador',
  11: 'Femurskaftfrakturer',
  12: 'Tibiafrakturer',
  13: 'Övre extremitetens akuta tillstånd',
  14: 'Pediatriskt ortopediskt trauma',
  15: 'Polytraumapatienten',
  16: 'Dokumentation och överlämning',
  17: 'Praktiska färdigheter',
};

// Chapter slugs
const chapterSlugs: Record<number, string> = {
  1: 'introduktion',
  2: 'limb-algoritmen',
  3: 'primar-survey',
  4: 'sekundar-survey',
  5: 'bilddiagnostik',
  6: 'damage-control',
  7: 'oppen-fraktur',
  8: 'kompartmentsyndrom',
  9: 'karlskador',
  10: 'backenringskador',
  11: 'femurskaft',
  12: 'tibiafrakturer',
  13: 'ovre-extremitet',
  14: 'pediatrik',
  15: 'polytrauma',
  16: 'dokumentation',
  17: 'praktiska-fardigheter',
};

// Question number to chapter mapping
const questionChapterMap: Record<number, number> = {
  // Kap 1: 3 frågor
  1: 1, 2: 1, 3: 1,
  // Kap 2: 7 frågor
  4: 2, 5: 2, 6: 2, 7: 2, 8: 2, 9: 2, 10: 2,
  // Kap 3: 5 frågor
  11: 3, 12: 3, 13: 3, 14: 3, 15: 3,
  // Kap 4: 5 frågor
  16: 4, 17: 4, 18: 4, 19: 4, 20: 4,
  // Kap 5: 5 frågor
  21: 5, 22: 5, 23: 5, 24: 5, 25: 5,
  // Kap 6: 5 frågor
  26: 6, 27: 6, 28: 6, 29: 6, 30: 6,
  // Kap 7: 7 frågor
  31: 7, 32: 7, 33: 7, 34: 7, 35: 7, 36: 7, 37: 7,
  // Kap 8: 9 frågor
  38: 8, 39: 8, 40: 8, 41: 8, 42: 8, 43: 8, 44: 8, 45: 8, 46: 8,
  // Kap 9: 6 frågor
  47: 9, 48: 9, 49: 9, 50: 9, 51: 9, 52: 9,
  // Kap 10: 6 frågor
  53: 10, 54: 10, 55: 10, 56: 10, 57: 10, 58: 10,
  // Kap 11: 5 frågor
  59: 11, 60: 11, 61: 11, 62: 11, 63: 11,
  // Kap 12: 4 frågor
  64: 12, 65: 12, 66: 12, 67: 12,
  // Kap 13: 7 frågor
  68: 13, 69: 13, 70: 13, 71: 13, 72: 13, 73: 13, 74: 13,
  // Kap 14: 5 frågor
  75: 14, 76: 14, 77: 14, 78: 14, 79: 14,
  // Kap 15: 4 frågor
  80: 15, 81: 15, 82: 15, 83: 15,
  // Kap 16: 3 frågor
  84: 16, 85: 16, 86: 16,
  // Kap 17: 4 frågor
  87: 17, 88: 17, 89: 17, 90: 17,
};

/**
 * Parse the ORTAC textbook markdown and extract chapters
 */
export function parseTextbook(): Chapter[] {
  const contentPath = join(__dirname, 'content', 'ORTAC_Textbook.md');
  const content = readFileSync(contentPath, 'utf-8');

  const chapters: Chapter[] = [];

  // Split by chapter headers (# Kapitel X:)
  const chapterRegex = /^# Kapitel (\d+):\s*(.+)$/gm;
  const parts = content.split(/^# Kapitel \d+:/m);

  // Skip the first part (intro before chapters)
  let match;
  let chapterIndex = 0;

  while ((match = chapterRegex.exec(content)) !== null) {
    chapterIndex++;
    const chapterNum = parseInt(match[1], 10);
    const title = match[2].trim();

    // Get chapter content from split parts
    if (parts[chapterIndex]) {
      // Get everything after the title line until next chapter or end
      const chapterContent = parts[chapterIndex]
        .split('\n')
        .slice(1) // Skip the title part that was in the match
        .join('\n')
        .trim();

      chapters.push({
        partNumber: chapterParts[chapterNum] || 1,
        chapterNumber: chapterNum,
        title: chapterTitles[chapterNum] || title,
        slug: chapterSlugs[chapterNum] || `kapitel-${chapterNum}`,
        content: chapterContent,
        estimatedMinutes: chapterMinutes[chapterNum] || 25,
      });
    }
  }

  return chapters;
}

/**
 * Parse the ORTAC MCQ bank markdown and extract questions
 */
export function parseMCQBank(): QuizQuestion[] {
  const contentPath = join(__dirname, 'content', 'ORTAC_MCQ_Bank.md');
  const content = readFileSync(contentPath, 'utf-8');

  const questions: QuizQuestion[] = [];

  // Split by question headers (## Fråga X)
  const questionRegex = /## Fråga (\d+)\n([\s\S]*?)(?=## Fråga \d+|$)/g;

  let match;
  while ((match = questionRegex.exec(content)) !== null) {
    const questionNum = parseInt(match[1], 10);
    const questionBlock = match[2].trim();

    // Parse the question block
    const lines = questionBlock.split('\n');

    // First line(s) before options is the question text
    let questionText = '';
    let optionStartIndex = 0;

    for (let i = 0; i < lines.length; i++) {
      if (lines[i].match(/^[A-D]\)/)) {
        optionStartIndex = i;
        break;
      }
      if (lines[i].trim()) {
        questionText += (questionText ? ' ' : '') + lines[i].trim();
      }
    }

    // Parse options
    const options: QuizOption[] = [];
    let correctAnswer = '';
    let explanation = '';

    for (let i = optionStartIndex; i < lines.length; i++) {
      const line = lines[i].trim();

      // Option line (A) - D))
      const optionMatch = line.match(/^([A-D])\)\s*(.+)$/);
      if (optionMatch) {
        options.push({
          label: optionMatch[1],
          text: optionMatch[2],
          isCorrect: false,
        });
        continue;
      }

      // Correct answer line
      const answerMatch = line.match(/^\*\*Rätt svar:\s*([A-D])\*\*$/);
      if (answerMatch) {
        correctAnswer = answerMatch[1];
        // Mark the correct option
        const correctOption = options.find(o => o.label === correctAnswer);
        if (correctOption) {
          correctOption.isCorrect = true;
        }
        continue;
      }

      // Explanation line
      const explMatch = line.match(/^\*Förklaring:\s*(.+)\*$/);
      if (explMatch) {
        explanation = explMatch[1];
        continue;
      }
    }

    // Determine bloom level based on question type
    const bloomLevel = determineBloomLevel(questionText);

    if (questionText && options.length === 4) {
      questions.push({
        chapterNumber: questionChapterMap[questionNum] || 1,
        questionNumber: questionNum,
        questionText,
        options,
        correctAnswer,
        explanation,
        bloomLevel,
      });
    }
  }

  return questions;
}

/**
 * Determine Bloom's taxonomy level based on question text
 */
function determineBloomLevel(questionText: string): QuizQuestion['bloomLevel'] {
  const text = questionText.toLowerCase();

  // APPLY - practical application, what to do
  if (text.includes('vad är första åtgärd') ||
      text.includes('vad bör du göra') ||
      text.includes('hur ska du') ||
      text.includes('vilken behandling')) {
    return 'APPLY';
  }

  // ANALYZE - case scenarios requiring analysis
  if (text.includes('inkommer') ||
      text.includes('år gammal') ||
      text.includes('presenterar sig') ||
      text.includes('misstänker du')) {
    return 'ANALYZE';
  }

  // UNDERSTAND - explaining concepts
  if (text.includes('varför') ||
      text.includes('menas med') ||
      text.includes('innebär') ||
      text.includes('förklara')) {
    return 'UNDERSTAND';
  }

  // REMEMBER - basic recall
  return 'REMEMBER';
}

/**
 * Generate learning objectives from textbook content
 */
export function generateLearningObjectives(): LearningObjective[] {
  const objectives: LearningObjective[] = [
    // Chapter 1: Introduktion
    { chapterNumber: 1, code: 'K1-1', type: 'KNOWLEDGE', description: 'Beskriva ORTAC-kursens syfte och målgrupp', sortOrder: 1 },
    { chapterNumber: 1, code: 'K1-2', type: 'KNOWLEDGE', description: 'Förklara kursfilosofin "The right care at the right time by the right person"', sortOrder: 2 },

    // Chapter 2: LIMB-algoritmen
    { chapterNumber: 2, code: 'K2-1', type: 'KNOWLEDGE', description: 'Beskriva LIMB-algoritmens fyra steg och deras tidskritikalitet', sortOrder: 1 },
    { chapterNumber: 2, code: 'K2-2', type: 'KNOWLEDGE', description: 'Ange kritiska tidsgränser för antibiotika, revaskularisering och fasciotomi', sortOrder: 2 },
    { chapterNumber: 2, code: 'F2-1', type: 'SKILL', description: 'Genomföra strukturerad LIMB-bedömning', sortOrder: 3 },

    // Chapter 3: Primär survey
    { chapterNumber: 3, code: 'K3-1', type: 'KNOWLEDGE', description: 'Förklara hur ortopediska skador integreras i ATLS-systematiken', sortOrder: 1 },
    { chapterNumber: 3, code: 'F3-1', type: 'SKILL', description: 'Applicera tourniquet korrekt (<30 sekunder)', sortOrder: 2 },
    { chapterNumber: 3, code: 'F3-2', type: 'SKILL', description: 'Applicera bäckenbälte vid korrekt anatomisk nivå', sortOrder: 3 },

    // Chapter 4: Sekundär survey
    { chapterNumber: 4, code: 'K4-1', type: 'KNOWLEDGE', description: 'Beskriva systematisk extremitetsbedömning', sortOrder: 1 },
    { chapterNumber: 4, code: 'F4-1', type: 'SKILL', description: 'Mäta och tolka ABI (ankle-brachial index)', sortOrder: 2 },

    // Chapter 5: Bilddiagnostik
    { chapterNumber: 5, code: 'K5-1', type: 'KNOWLEDGE', description: 'Beskriva indikationer för akut bilddiagnostik vid extremitetstrauma', sortOrder: 1 },
    { chapterNumber: 5, code: 'K5-2', type: 'KNOWLEDGE', description: 'Förklara val mellan röntgen, CT och angiografi', sortOrder: 2 },

    // Chapter 6: DCO
    { chapterNumber: 6, code: 'K6-1', type: 'KNOWLEDGE', description: 'Beskriva indikationer för DCO vs ETC', sortOrder: 1 },
    { chapterNumber: 6, code: 'Ko6-1', type: 'COMPETENCE', description: 'Prioritera åtgärder vid polytrauma med extremitetsskador', sortOrder: 2 },

    // Chapter 7: Öppen fraktur
    { chapterNumber: 7, code: 'K7-1', type: 'KNOWLEDGE', description: 'Klassificera öppna frakturer enligt Gustilo-Anderson', sortOrder: 1 },
    { chapterNumber: 7, code: 'F7-1', type: 'SKILL', description: 'Applicera sterilt förband och temporär stabilisering', sortOrder: 2 },

    // Chapter 8: Kompartmentsyndrom
    { chapterNumber: 8, code: 'K8-1', type: 'KNOWLEDGE', description: 'Beskriva kliniska tecken på kompartmentsyndrom', sortOrder: 1 },
    { chapterNumber: 8, code: 'F8-1', type: 'SKILL', description: 'Utföra passiv töjningstest för alla fyra underbenkompartment', sortOrder: 2 },
    { chapterNumber: 8, code: 'Ko8-1', type: 'COMPETENCE', description: 'Besluta om eskalering till ortoped/kärlkirurg', sortOrder: 3 },

    // Chapter 9: Kärlskador
    { chapterNumber: 9, code: 'K9-1', type: 'KNOWLEDGE', description: 'Identifiera hårda och mjuka tecken på kärlskada', sortOrder: 1 },
    { chapterNumber: 9, code: 'Ko9-1', type: 'COMPETENCE', description: 'Besluta om akut kärlkirurgisk konsultation', sortOrder: 2 },

    // Chapter 10: Bäckenringskador
    { chapterNumber: 10, code: 'K10-1', type: 'KNOWLEDGE', description: 'Klassificera bäckenringskador', sortOrder: 1 },
    { chapterNumber: 10, code: 'F10-1', type: 'SKILL', description: 'Applicera bäckenbälte korrekt', sortOrder: 2 },

    // Chapter 11-15: Specifika tillstånd
    { chapterNumber: 11, code: 'K11-1', type: 'KNOWLEDGE', description: 'Beskriva initial handläggning av femurskaftfrakturer', sortOrder: 1 },
    { chapterNumber: 12, code: 'K12-1', type: 'KNOWLEDGE', description: 'Beskriva initial handläggning av tibiafrakturer', sortOrder: 1 },
    { chapterNumber: 13, code: 'K13-1', type: 'KNOWLEDGE', description: 'Identifiera akuta tillstånd i övre extremiteten', sortOrder: 1 },
    { chapterNumber: 14, code: 'K14-1', type: 'KNOWLEDGE', description: 'Beskriva särskilda överväganden vid pediatriskt trauma', sortOrder: 1 },
    { chapterNumber: 15, code: 'Ko15-1', type: 'COMPETENCE', description: 'Prioritera åtgärder vid multipla extremitetsskador', sortOrder: 1 },

    // Chapter 16-17: Praktik
    { chapterNumber: 16, code: 'Ko16-1', type: 'COMPETENCE', description: 'Dokumentera initial bedömning och åtgärder', sortOrder: 1 },
    { chapterNumber: 16, code: 'Ko16-2', type: 'COMPETENCE', description: 'Kommunicera effektivt enligt SBAR', sortOrder: 2 },
    { chapterNumber: 17, code: 'F17-1', type: 'SKILL', description: 'Applicera temporär stabilisering (gipsskena)', sortOrder: 1 },
  ];

  return objectives;
}

/**
 * Get the course structure (Parts)
 */
export function getCoursePartsData() {
  return [
    {
      partNumber: 1,
      title: 'Principer',
      description: 'Grundläggande principer för ortopedisk traumahandläggning',
    },
    {
      partNumber: 2,
      title: 'Specifika tillstånd',
      description: 'Detaljerad genomgång av specifika ortopediska akuttillstånd',
    },
    {
      partNumber: 3,
      title: 'Praktik',
      description: 'Praktisk tillämpning och dokumentation',
    },
  ];
}

/**
 * Get static chapter data if files can't be parsed
 */
export function getStaticChapters(): Chapter[] {
  return Object.entries(chapterTitles).map(([num, title]) => {
    const chapterNum = parseInt(num, 10);
    return {
      partNumber: chapterParts[chapterNum] || 1,
      chapterNumber: chapterNum,
      title,
      slug: chapterSlugs[chapterNum] || `kapitel-${chapterNum}`,
      content: `# ${title}\n\nInnehåll för kapitel ${chapterNum} kommer att läggas till.`,
      estimatedMinutes: chapterMinutes[chapterNum] || 25,
    };
  });
}
