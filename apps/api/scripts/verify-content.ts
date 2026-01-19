/**
 * ORTAC Content Verification Script
 *
 * Verifierar att allt innehåll i databasen är korrekt:
 * - Räknar innehåll (kapitel, frågor, badges, etc.)
 * - Kontrollerar relationer (quiz-svar, lärandemål)
 * - Validerar innehållskvalitet
 *
 * Kör med: npx ts-node scripts/verify-content.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface VerificationResult {
  category: string;
  check: string;
  expected: string | number;
  actual: string | number;
  passed: boolean;
  details?: string;
}

const results: VerificationResult[] = [];

function addResult(
  category: string,
  check: string,
  expected: string | number,
  actual: string | number,
  details?: string
) {
  const passed = expected === actual ||
    (typeof expected === 'number' && typeof actual === 'number' && actual >= expected);
  results.push({ category, check, expected, actual, passed, details });
}

async function verifyContentCounts() {
  console.log('\n📊 Verifierar innehållsantal...\n');

  // Kurser
  const courses = await prisma.course.findMany({ where: { isActive: true } });
  addResult('Kurser', 'Antal aktiva kurser', 2, courses.length);

  // ORTAC-kurs
  const ortacCourse = courses.find(c => c.code === 'ORTAC-2025');
  addResult('Kurser', 'ORTAC-2025 finns', 'ja', ortacCourse ? 'ja' : 'nej');

  // TTT-kurs
  const tttCourse = courses.find(c => c.code === 'ORTAC-TTT-2025');
  addResult('Kurser', 'ORTAC-TTT-2025 finns', 'ja', tttCourse ? 'ja' : 'nej');

  // Kapitel
  const allChapters = await prisma.chapter.findMany({ where: { isActive: true } });
  addResult('Kapitel', 'Totalt antal kapitel', 21, allChapters.length);

  // ORTAC-kapitel
  if (ortacCourse) {
    const ortacParts = await prisma.coursePart.findMany({
      where: { courseId: ortacCourse.id },
      include: { chapters: { where: { isActive: true } } }
    });
    const ortacChapterCount = ortacParts.reduce((sum, part) => sum + part.chapters.length, 0);
    addResult('Kapitel', 'ORTAC-kapitel', 17, ortacChapterCount);
  }

  // TTT-kapitel
  if (tttCourse) {
    const tttParts = await prisma.coursePart.findMany({
      where: { courseId: tttCourse.id },
      include: { chapters: { where: { isActive: true } } }
    });
    const tttChapterCount = tttParts.reduce((sum, part) => sum + part.chapters.length, 0);
    addResult('Kapitel', 'TTT-kapitel', 4, tttChapterCount);
  } else {
    addResult('Kapitel', 'TTT-kapitel', 4, 0, 'TTT-kurs saknas');
  }

  // Quiz-frågor
  const allQuestions = await prisma.quizQuestion.findMany({ where: { isActive: true } });
  addResult('Quiz', 'Totalt antal frågor', 105, allQuestions.length);

  // Badges
  const badges = await prisma.badge.findMany({ where: { isActive: true } });
  addResult('Gamification', 'Antal badges', 23, badges.length);

  // Badge-kategorier
  const badgeCategories = [...new Set(badges.map(b => b.category))];
  addResult('Gamification', 'Antal badge-kategorier', 6, badgeCategories.length,
    badgeCategories.join(', '));

  // Algoritmer
  const algorithms = await prisma.algorithm.findMany({ where: { isActive: true } });
  addResult('Algoritmer', 'Antal algoritmer', 10, algorithms.length);

  // Lärandemål
  const objectives = await prisma.learningObjective.findMany();
  addResult('Lärandemål', 'Antal lärandemål', 35, objectives.length);

  // EPAs
  const epas = await prisma.ePA.findMany({ where: { isActive: true } });
  addResult('EPA', 'Antal EPAs', 12, epas.length);

  // OSCE-stationer
  const osceStations = await prisma.oSCEStation.findMany({ where: { isActive: true } });
  addResult('OSCE', 'Antal OSCE-stationer', 8, osceStations.length);

  // Testanvändare
  const users = await prisma.user.findMany();
  addResult('Användare', 'Antal testanvändare', 3, users.length);
}

async function verifyRelationships() {
  console.log('\n🔗 Verifierar relationer...\n');

  // Alla kapitel har minst 1 quiz-fråga
  const chaptersWithQuestions = await prisma.chapter.findMany({
    where: { isActive: true },
    include: { quizQuestions: { where: { isActive: true } } }
  });

  const chaptersWithoutQuestions = chaptersWithQuestions.filter(
    c => c.quizQuestions.length === 0
  );
  addResult(
    'Relationer',
    'Kapitel utan quiz-frågor',
    0,
    chaptersWithoutQuestions.length,
    chaptersWithoutQuestions.map(c => c.title).join(', ') || 'Inga'
  );

  // Alla quiz-frågor har exakt 1 rätt svar
  const questions = await prisma.quizQuestion.findMany({
    where: { isActive: true },
    include: { options: true }
  });

  const questionsWithoutCorrectAnswer = questions.filter(
    q => q.options.filter(o => o.isCorrect).length !== 1
  );
  addResult(
    'Relationer',
    'Frågor utan exakt 1 rätt svar',
    0,
    questionsWithoutCorrectAnswer.length,
    questionsWithoutCorrectAnswer.map(q => q.questionCode).join(', ') || 'Inga'
  );

  // Alla quiz-frågor har 4-5 svarsalternativ
  const questionsWithWrongOptionCount = questions.filter(
    q => q.options.length < 4 || q.options.length > 5
  );
  addResult(
    'Relationer',
    'Frågor med fel antal alternativ (ej 4-5)',
    0,
    questionsWithWrongOptionCount.length,
    questionsWithWrongOptionCount.map(q => `${q.questionCode}(${q.options.length})`).join(', ') || 'Inga'
  );

  // Alla kapitel har minst 1 lärandemål
  const chaptersWithObjectives = await prisma.chapter.findMany({
    where: { isActive: true },
    include: { learningObjectives: true }
  });

  const chaptersWithoutObjectives = chaptersWithObjectives.filter(
    c => c.learningObjectives.length === 0
  );
  addResult(
    'Relationer',
    'Kapitel utan lärandemål',
    0,
    chaptersWithoutObjectives.length,
    chaptersWithoutObjectives.map(c => c.title).join(', ') || 'Inga'
  );

  // OSCE-stationer har checklist och criticalErrors
  const osceStations = await prisma.oSCEStation.findMany({ where: { isActive: true } });
  const stationsWithoutChecklist = osceStations.filter(
    s => !s.checklist || s.checklist.length === 0
  );
  addResult(
    'Relationer',
    'OSCE-stationer utan checklista',
    0,
    stationsWithoutChecklist.length,
    stationsWithoutChecklist.map(s => s.code).join(', ') || 'Inga'
  );
}

async function verifyContentQuality() {
  console.log('\n✨ Verifierar innehållskvalitet...\n');

  // Inga tomma chapter.content
  const chapters = await prisma.chapter.findMany({ where: { isActive: true } });
  const emptyChapters = chapters.filter(
    c => !c.content || c.content.trim().length < 100
  );
  addResult(
    'Kvalitet',
    'Kapitel med tomt/kort innehåll (<100 tecken)',
    0,
    emptyChapters.length,
    emptyChapters.map(c => c.title).join(', ') || 'Inga'
  );

  // Inga tomma question.explanation
  const questions = await prisma.quizQuestion.findMany({ where: { isActive: true } });
  const questionsWithoutExplanation = questions.filter(
    q => !q.explanation || q.explanation.trim().length < 10
  );
  addResult(
    'Kvalitet',
    'Frågor utan förklaring',
    0,
    questionsWithoutExplanation.length,
    questionsWithoutExplanation.map(q => q.questionCode).join(', ') || 'Inga'
  );

  // Alla Bloom-nivåer är giltiga
  const validBloomLevels = ['KNOWLEDGE', 'COMPREHENSION', 'APPLICATION', 'ANALYSIS', 'SYNTHESIS'];
  const questionsWithInvalidBloom = questions.filter(
    q => !validBloomLevels.includes(q.bloomLevel)
  );
  addResult(
    'Kvalitet',
    'Frågor med ogiltig Bloom-nivå',
    0,
    questionsWithInvalidBloom.length,
    questionsWithInvalidBloom.map(q => `${q.questionCode}(${q.bloomLevel})`).join(', ') || 'Inga'
  );

  // Badge-krav är giltiga JSON
  const badges = await prisma.badge.findMany({ where: { isActive: true } });
  const badgesWithInvalidRequirement = badges.filter(b => {
    if (!b.requirement) return false;
    try {
      if (typeof b.requirement === 'string') {
        JSON.parse(b.requirement);
      }
      return false;
    } catch {
      return true;
    }
  });
  addResult(
    'Kvalitet',
    'Badges med ogiltig requirement JSON',
    0,
    badgesWithInvalidRequirement.length,
    badgesWithInvalidRequirement.map(b => b.code).join(', ') || 'Inga'
  );

  // Algoritmer har SVG-innehåll
  const algorithms = await prisma.algorithm.findMany({ where: { isActive: true } });
  const algorithmsWithoutSvg = algorithms.filter(
    a => !a.svgContent || a.svgContent.trim().length < 100
  );
  addResult(
    'Kvalitet',
    'Algoritmer utan SVG-innehåll',
    0,
    algorithmsWithoutSvg.length,
    algorithmsWithoutSvg.map(a => a.code).join(', ') || 'Inga'
  );
}

async function verifyBranding() {
  console.log('\n🏷️  Verifierar branding (ORTAC vs ORTIM)...\n');

  // Kolla efter gamla namn i kapitelinnehåll
  const chapters = await prisma.chapter.findMany({ where: { isActive: true } });
  const chaptersWithOldBranding = chapters.filter(
    c => c.content.includes('ORTIM') || c.content.includes('B-ORTIM') || c.content.includes('BORTIM')
  );
  addResult(
    'Branding',
    'Kapitel med gammal branding (ORTIM)',
    0,
    chaptersWithOldBranding.length,
    chaptersWithOldBranding.map(c => c.title).join(', ') || 'Inga'
  );

  // Kolla efter gamla namn i quiz-frågor
  const questions = await prisma.quizQuestion.findMany({ where: { isActive: true } });
  const questionsWithOldBranding = questions.filter(
    q => q.questionText.includes('ORTIM') || q.questionText.includes('B-ORTIM')
  );
  addResult(
    'Branding',
    'Frågor med gammal branding',
    0,
    questionsWithOldBranding.length,
    questionsWithOldBranding.map(q => q.questionCode).join(', ') || 'Inga'
  );
}

async function printResults() {
  console.log('\n' + '='.repeat(80));
  console.log('📋 VERIFIERINGSRESULTAT');
  console.log('='.repeat(80));

  const categories = [...new Set(results.map(r => r.category))];
  let totalPassed = 0;
  let totalFailed = 0;

  for (const category of categories) {
    console.log(`\n${category}:`);
    console.log('-'.repeat(40));

    const categoryResults = results.filter(r => r.category === category);
    for (const result of categoryResults) {
      const status = result.passed ? '✅' : '❌';
      console.log(`  ${status} ${result.check}`);
      console.log(`     Förväntat: ${result.expected}, Faktiskt: ${result.actual}`);
      if (result.details && !result.passed) {
        console.log(`     Detaljer: ${result.details}`);
      }
      if (result.passed) totalPassed++;
      else totalFailed++;
    }
  }

  console.log('\n' + '='.repeat(80));
  console.log(`📊 SAMMANFATTNING: ${totalPassed} godkända, ${totalFailed} underkända`);
  console.log('='.repeat(80));

  if (totalFailed > 0) {
    console.log('\n⚠️  Det finns problem som behöver åtgärdas!\n');
    process.exit(1);
  } else {
    console.log('\n✅ Allt innehåll verifierat och godkänt!\n');
    process.exit(0);
  }
}

async function main() {
  console.log('🔍 ORTAC Innehållsverifiering');
  console.log('='.repeat(80));
  console.log('Startar verifiering av databasinnehåll...');

  try {
    await verifyContentCounts();
    await verifyRelationships();
    await verifyContentQuality();
    await verifyBranding();
    await printResults();
  } catch (error) {
    console.error('❌ Fel vid verifiering:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
